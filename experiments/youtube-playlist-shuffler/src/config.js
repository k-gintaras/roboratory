import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

const rootDir = process.cwd();

function resolveLocal(filePath) {
  if (!filePath) {
    return undefined;
  }

  return path.isAbsolute(filePath) ? filePath : path.resolve(rootDir, filePath);
}

function readBoolean(value, fallback = false) {
  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "y", "on"].includes(String(value).toLowerCase());
}

function readInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getConfig() {
  const playlistId = process.env.YOUTUBE_PLAYLIST_ID;
  const clientSecretFile = resolveLocal(process.env.GOOGLE_CLIENT_SECRET_FILE ?? "./client_secret.json");
  const tokenFile = resolveLocal(process.env.TOKEN_FILE ?? "./token.json");
  const historyFile = resolveLocal(process.env.HISTORY_FILE ?? "./shuffle-history.json");

  return {
    rootDir,
    playlistId,
    clientSecretFile,
    tokenFile,
    historyFile,
    candidates: readInteger(process.env.SHUFFLE_CANDIDATES, 800),
    historySize: readInteger(process.env.SHUFFLE_HISTORY_SIZE, 5),
    dryRun: readBoolean(process.env.DRY_RUN, false)
  };
}

export function requirePlaylistId(config) {
  if (!config.playlistId) {
    throw new Error("Set YOUTUBE_PLAYLIST_ID in .env first.");
  }
}

export function assertReadableFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found: ${filePath}`);
  }
}
