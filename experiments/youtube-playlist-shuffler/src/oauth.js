import fs from "node:fs";
import http from "node:http";
import { URL } from "node:url";
import open from "open";
import { google } from "googleapis";
import { assertReadableFile } from "./config.js";

const SCOPES = ["https://www.googleapis.com/auth/youtube"];

function readClientSecret(clientSecretFile) {
  assertReadableFile(clientSecretFile, "Google OAuth client secret file");

  const credentials = JSON.parse(fs.readFileSync(clientSecretFile, "utf8"));
  const client = credentials.installed ?? credentials.web;

  if (!client?.client_id || !client?.client_secret) {
    throw new Error("OAuth JSON must contain installed.client_id and installed.client_secret.");
  }

  return client;
}

function createOAuthClient(clientSecretFile) {
  const client = readClientSecret(clientSecretFile);
  return new google.auth.OAuth2(
    client.client_id,
    client.client_secret,
    "http://127.0.0.1:53682/oauth2callback"
  );
}

async function waitForCode(authUrl) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      try {
        const requestUrl = new URL(request.url, "http://127.0.0.1:53682");

        if (requestUrl.pathname !== "/oauth2callback") {
          response.writeHead(404);
          response.end("Not found");
          return;
        }

        const error = requestUrl.searchParams.get("error");
        if (error) {
          throw new Error(`OAuth failed: ${error}`);
        }

        const code = requestUrl.searchParams.get("code");
        if (!code) {
          throw new Error("OAuth callback did not include a code.");
        }

        response.writeHead(200, { "Content-Type": "text/plain" });
        response.end("Authorization complete. You can close this tab.");
        server.close();
        resolve(code);
      } catch (error) {
        response.writeHead(500, { "Content-Type": "text/plain" });
        response.end(error.message);
        server.close();
        reject(error);
      }
    });

    server.listen(53682, "127.0.0.1", async () => {
      console.log("Opening Google OAuth consent page...");
      console.log(authUrl);
      await open(authUrl);
    });

    server.on("error", reject);
  });
}

export async function authorize(config, forceConsent = false) {
  const oauth2Client = createOAuthClient(config.clientSecretFile);

  if (!forceConsent && fs.existsSync(config.tokenFile)) {
    oauth2Client.setCredentials(JSON.parse(fs.readFileSync(config.tokenFile, "utf8")));
    return oauth2Client;
  }

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES
  });

  const code = await waitForCode(authUrl);
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  fs.writeFileSync(config.tokenFile, `${JSON.stringify(tokens, null, 2)}\n`, "utf8");
  console.log(`Saved OAuth token to ${config.tokenFile}`);
  return oauth2Client;
}

export async function getYouTubeClient(config) {
  const auth = await authorize(config, false);
  return google.youtube({ version: "v3", auth });
}
