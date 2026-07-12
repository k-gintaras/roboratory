import dotenv from "dotenv";

dotenv.config();

function list(value, fallback = []) {
  if (!value) {
    return fallback;
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function integer(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function boolean(value, fallback = false) {
  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "y", "on"].includes(String(value).toLowerCase());
}

export function getConfig() {
  const geo = process.env.GEO ?? "US";
  const lang = process.env.LANG ?? "en-US";

  return {
    geo,
    lang,
    maxItems: integer(process.env.MAX_ITEMS, 12),
    researchMaxItems: integer(process.env.RESEARCH_MAX_ITEMS, 12),
    filterFile: process.env.FILTER_FILE ?? "./filters.json",
    freshHours: integer(process.env.FRESH_HOURS, 72),
    researchFreshHours: integer(process.env.RESEARCH_FRESH_HOURS, 168),
    googleTrendsRss: process.env.GOOGLE_TRENDS_RSS ?? `https://trends.google.com/trending/rss?geo=${geo}`,
    researchTerms: list(process.env.RESEARCH_TERMS, ["webb", "james webb", "jwst", "cern", "lhc", "particle", "detector", "alice", "atlas", "cms", "semiconductor", "microchip", "chip", "nano", "nanotech", "biotech", "genomics", "crispr", "robotics", "astronomy", "exoplanet", "quantum", "earthquake", "volcano", "climate", "spacewalk", "moon", "mars"]),
    memeSearches: list(process.env.MEME_SEARCHES, ["meme", "internet meme", "tiktok meme", "gen z slang", "brainrot", "67 meme"]),
    subreddits: list(process.env.SUBREDDITS, ["memes", "dankmemes", "OutOfTheLoop", "NonPoliticalTwitter", "BrandNewSentence", "196"]),
    benchmarkTerms: list(process.env.BENCHMARK_TERMS, ["67", "67 meme", "six seven"]),
    enableChan: boolean(process.env.ENABLE_CHAN, false),
    chanBoards: list(process.env.CHAN_BOARDS, ["wsg", "gif", "co", "tv", "v"]),
    chanTerms: list(process.env.CHAN_TERMS, ["meme", "memes", "brainrot", "tiktok", "viral", "67", "six seven", "slang", "webm", "edit", "reaction"])
  };
}
