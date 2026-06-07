#!/usr/bin/env node
import { getConfig, requirePlaylistId } from "./config.js";
import { authorize, getYouTubeClient } from "./oauth.js";
import { ensureBaseline, loadHistory, rememberShuffle, saveHistory } from "./history.js";
import { applyTargetOrder, fetchPlaylistItems } from "./youtube-playlist.js";
import { createSmartShuffle, summarizeShuffle } from "./smart-shuffle.js";

const command = process.argv[2] ?? "preview";
const flags = new Set(process.argv.slice(3));

function printPreview(items, targetVideoIds, score) {
  console.log(`Playlist items: ${items.length}`);
  console.log(`Shuffle score: ${Math.round(score)}`);
  console.table(summarizeShuffle(items, targetVideoIds));
}

async function loadPlaylist(config) {
  requirePlaylistId(config);
  const youtube = await getYouTubeClient(config);
  const items = await fetchPlaylistItems(youtube, config.playlistId);

  if (items.length < 2) {
    throw new Error("Playlist needs at least 2 playable videos to shuffle.");
  }

  return { youtube, items };
}

async function run() {
  const config = getConfig();

  if (command === "auth") {
    await authorize(config, true);
    return;
  }

  if (command === "baseline") {
    const { items } = await loadPlaylist(config);
    const history = loadHistory(config.historyFile);
    history.baselineItemIds = items.map((item) => item.playlistItemId);
    saveHistory(config.historyFile, history);
    console.log(`Saved current playlist order as baseline in ${config.historyFile}`);
    return;
  }

  if (!["preview", "shuffle"].includes(command)) {
    throw new Error(`Unknown command "${command}". Use auth, preview, shuffle, or baseline.`);
  }

  const dryRun = command === "preview" || flags.has("--dry-run") || config.dryRun;
  const { youtube, items } = await loadPlaylist(config);
  const currentItemIds = items.map((item) => item.playlistItemId);
  const history = loadHistory(config.historyFile);
  const baselineChanged = ensureBaseline(history, currentItemIds);
  const target = createSmartShuffle(currentItemIds, history, config.candidates);

  if (baselineChanged) {
    console.log("Initialized baseline from the current playlist order.");
  }

  printPreview(items, target.itemIds, target.score);

  if (dryRun) {
    if (baselineChanged) {
      saveHistory(config.historyFile, history);
    }

    console.log("Dry run only. No YouTube changes were made.");
    return;
  }

  console.log("Applying playlist order to YouTube...");
  const updates = await applyTargetOrder(youtube, items, target.itemIds);
  rememberShuffle(history, target.itemIds, config.historySize);
  saveHistory(config.historyFile, history);
  console.log(`Done. Moved ${updates.length} playlist items.`);
}

function printError(error) {
  console.error(error.message);

  const apiErrors = error.response?.data?.error?.errors;
  if (Array.isArray(apiErrors) && apiErrors.length > 0) {
    console.error("Google API details:");
    for (const apiError of apiErrors) {
      console.error(`- reason=${apiError.reason} domain=${apiError.domain} message=${apiError.message}`);
    }
  } else if (error.response?.data?.error) {
    console.error(JSON.stringify(error.response.data.error, null, 2));
  }
}

run().catch((error) => {
  printError(error);
  process.exitCode = 1;
});
