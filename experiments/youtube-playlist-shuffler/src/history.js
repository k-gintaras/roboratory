import fs from "node:fs";

export function loadHistory(historyFile) {
  if (!fs.existsSync(historyFile)) {
    return {
      baselineItemIds: [],
      shuffles: []
    };
  }

  const raw = fs.readFileSync(historyFile, "utf8");
  const parsed = JSON.parse(raw);

  return {
    baselineItemIds: Array.isArray(parsed.baselineItemIds)
      ? parsed.baselineItemIds
      : Array.isArray(parsed.baselineVideoIds)
        ? parsed.baselineVideoIds
        : [],
    shuffles: Array.isArray(parsed.shuffles)
      ? parsed.shuffles.map((shuffle) => ({
        ...shuffle,
        itemIds: Array.isArray(shuffle.itemIds) ? shuffle.itemIds : shuffle.videoIds
      }))
      : []
  };
}

export function saveHistory(historyFile, history) {
  fs.writeFileSync(historyFile, `${JSON.stringify(history, null, 2)}\n`, "utf8");
}

export function ensureBaseline(history, currentItemIds) {
  if (history.baselineItemIds.length === currentItemIds.length) {
    return false;
  }

  history.baselineItemIds = [...currentItemIds];
  return true;
}

export function rememberShuffle(history, itemIds, historySize) {
  history.shuffles.unshift({
    at: new Date().toISOString(),
    itemIds
  });
  history.shuffles = history.shuffles.slice(0, historySize);
}
