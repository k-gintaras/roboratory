#!/usr/bin/env node
import { getConfig } from "./config.js";
import { fetchAll, fetchChanCatalog, fetchResearch } from "./sources.js";
import { containsAny } from "./classify.js";
import { rankItems } from "./rank.js";
import { printDigest } from "./format.js";
import { loadFilters } from "./filters.js";

const command = process.argv[2] ?? "digest";

async function run() {
  const config = getConfig();
  const filters = loadFilters(config.filterFile);
  const rssResult = await fetchAll(config);
  let items = rssResult.items;
  let warnings = rssResult.warnings;

  if (command === "chan" || config.enableChan) {
    const chanResult = await fetchChanCatalog(config);
    items = [...items, ...chanResult.items];
    warnings = [...warnings, ...chanResult.warnings];
  }

  for (const warning of warnings) {
    console.error(`warning: ${warning}`);
  }

  if (command === "digest") {
    const ranked = rankItems(items, { mode: "digest", freshHours: config.freshHours, filters });
    printDigest(ranked, "Culture Radar Digest", config.maxItems);
    return;
  }

  if (command === "research") {
    const researchResult = await fetchResearch(config);
    for (const warning of researchResult.warnings) {
      console.error(`warning: ${warning}`);
    }

    const sourceSpecificResearchTerms = config.researchTerms.filter((term) => !["nasa", "cern"].includes(term.toLowerCase()));
    const researchItems = [
      ...researchResult.items.filter((item) => (
        item.source === "arxiv"
        || containsAny(item, sourceSpecificResearchTerms)
      )),
      ...rssResult.items
        .filter((item) => item.source === "google-trends")
        .filter((item) => containsAny(item, config.researchTerms))
        .map((item) => ({
          ...item,
          researchSource: "Google Trends",
          researchCategory: /earthquake|volcano|climate/i.test(item.title) ? "earth-science" : "tech-science"
        }))
    ];

    const ranked = rankItems(researchItems, {
      mode: "research",
      freshHours: config.researchFreshHours,
      filters
    })
      .filter((item) => containsAny(item, config.researchTerms) || item.source === "arxiv");

    printDigest(ranked, "Research Radar", config.researchMaxItems);
    return;
  }

  if (command === "memes") {
    const ranked = rankItems(items, { mode: "memes", freshHours: config.freshHours, filters })
      .filter((item) => ["meme", "pop-culture"].includes(item.category) || item.source === "reddit");
    printDigest(ranked, "Meme Radar", Math.min(config.maxItems, 10));
    return;
  }

  if (command === "benchmark") {
    const benchmarkItems = rankItems(items, { mode: "memes", freshHours: 24 * 30, filters })
      .filter((item) => containsAny(item, config.benchmarkTerms));
    printDigest(benchmarkItems, `Benchmark: ${config.benchmarkTerms.join(", ")}`, config.maxItems);
    return;
  }

  if (command === "chan") {
    const rankedChanItems = rankItems(items, { mode: "memes", freshHours: config.freshHours, filters })
      .filter((item) => item.source === "4chan");
    const chanItems = rankedChanItems
      .filter((item) => containsAny(item, config.chanTerms));
    printDigest(chanItems, `4chan Early Signals: ${config.chanBoards.map((board) => `/${board}/`).join(", ")}`, config.maxItems);

    if (chanItems.length === 0 && rankedChanItems.length > 0) {
      printDigest(rankedChanItems, "4chan Catalog Sample, No Keyword Match", Math.min(config.maxItems, 8));
    }
    return;
  }

  throw new Error(`Unknown command "${command}". Use digest, memes, or benchmark.`);
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
