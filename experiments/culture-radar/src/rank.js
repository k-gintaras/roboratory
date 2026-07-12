import { classify } from "./classify.js";
import { isAllowedByFilters } from "./filters.js";

function hoursOld(item, now = new Date()) {
  if (!item.date) {
    return 999;
  }

  return Math.max(0, (now.valueOf() - item.date.valueOf()) / 36e5);
}

function trafficScore(approxTraffic) {
  if (!approxTraffic) {
    return 0;
  }

  const cleaned = String(approxTraffic).replace(/[,+]/g, "").toLowerCase();
  const multiplier = cleaned.includes("m") ? 1000000 : cleaned.includes("k") ? 1000 : 1;
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? Math.log10(value * multiplier + 1) * 8 : 0;
}

function sourceScore(item) {
  if (item.source === "4chan") {
    return 8 + Math.min(12, Math.log10((item.replies ?? 0) + 1) * 6);
  }

  if (item.source === "reddit") {
    return 16;
  }

  if (item.source === "google-trends") {
    return 14 + trafficScore(item.approxTraffic);
  }

  if (item.source === "google-news") {
    return 10;
  }

  return 0;
}

function categoryScore(category, mode) {
  if (mode === "research") {
    return {
      "space-science": 28,
      "earth-science": 24,
      "particle-physics": 26,
      "chips-nano": 26,
      biotech: 24,
      "tech-science": 22,
      medicine: 12,
      general: 4,
      sports: -30,
      celebrity: -30
    }[category] ?? 0;
  }

  if (mode === "memes") {
    return category === "meme" ? 30 : category === "pop-culture" ? 12 : 0;
  }

  return {
    meme: 20,
    "tech-science": 14,
    medicine: 14,
    "world-politics": 12,
    "pop-culture": 12,
    sports: -12,
    celebrity: -12,
    general: 2
  }[category] ?? 0;
}

function freshnessScore(item) {
  const age = hoursOld(item);
  if (age <= 6) {
    return 20;
  }
  if (age <= 24) {
    return 14;
  }
  if (age <= 72) {
    return 6;
  }
  return -20;
}

function dedupeKey(item) {
  return item.title
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);
}

export function rankItems(items, { mode = "digest", freshHours = 72, filters } = {}) {
  const seen = new Set();

  return items
    .filter((item) => item.title && hoursOld(item) <= freshHours)
    .map((item) => {
      const category = mode === "research" && item.researchCategory ? item.researchCategory : classify(item);
      return {
        ...item,
        category,
        score: sourceScore(item) + categoryScore(category, mode) + freshnessScore(item)
      };
    })
    .filter((item) => !filters || isAllowedByFilters(item, filters))
    .sort((a, b) => b.score - a.score)
    .filter((item) => {
      const key = dedupeKey(item);
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}
