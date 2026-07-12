import fs from "node:fs";
import path from "node:path";
import { containsAny } from "./classify.js";

const DEFAULT_FILTERS = {
  blockedCategories: ["sports", "celebrity"],
  blockedTerms: [
    "score",
    "scores",
    "near me",
    "today just now",
    "vs",
    "fc",
    "nba",
    "nfl",
    "mlb",
    "nhl",
    "f1",
    "formula 1",
    "tennis",
    "soccer",
    "football",
    "baseball",
    "basketball",
    "celebrity",
    "kardashian",
    "dating",
    "breakup",
    "tour setlist",
    "fag",
    "fags",
    "faggot",
    "nigger",
    "retard",
    "kike",
    "chink",
    "tranny",
    "rape joke",
    "lame and gay",
    "super lame and gay"
  ],
  allowTerms: [
    "olympics",
    "world record",
    "strongman",
    "world's strongest",
    "new sport",
    "robotics competition",
    "chess",
    "speedrun",
    "esports",
    "sumo",
    "marathon world record"
  ],
  blockedSources: []
};

function asList(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim()) : [];
}

export function loadFilters(filterFile = "./filters.json") {
  const resolved = path.isAbsolute(filterFile) ? filterFile : path.resolve(process.cwd(), filterFile);

  if (!fs.existsSync(resolved)) {
    return DEFAULT_FILTERS;
  }

  const parsed = JSON.parse(fs.readFileSync(resolved, "utf8"));

  return {
    blockedCategories: asList(parsed.blockedCategories),
    blockedTerms: asList(parsed.blockedTerms),
    allowTerms: asList(parsed.allowTerms),
    blockedSources: asList(parsed.blockedSources)
  };
}

export function isAllowedByFilters(item, filters) {
  if (containsAny(item, filters.allowTerms)) {
    return true;
  }

  if (filters.blockedSources.includes(item.source)) {
    return false;
  }

  if (filters.blockedCategories.includes(item.category)) {
    return false;
  }

  return !containsAny(item, filters.blockedTerms);
}
