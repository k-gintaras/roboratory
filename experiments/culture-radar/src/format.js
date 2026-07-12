function shortDate(date) {
  if (!date) {
    return "unknown time";
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function sourceLabel(item) {
  if (item.source === "reddit") {
    return `reddit/r/${item.subreddit}`;
  }

  if (item.source === "google-news") {
    return `google-news:${item.query}`;
  }

  if (item.source === "4chan") {
    return `4chan/${item.board}`;
  }

  if (item.researchSource) {
    return item.researchSource;
  }

  return item.source;
}

function truncate(value, maxLength = 220) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

export function printDigest(items, title, maxItems) {
  console.log(title);
  console.log("=".repeat(title.length));

  if (items.length === 0) {
    console.log("No fresh items found.");
    return;
  }

  for (const [index, item] of items.slice(0, maxItems).entries()) {
    console.log(`\n${index + 1}. ${truncate(item.title)}`);
    console.log(`   category: ${item.category} | source: ${sourceLabel(item)} | time: ${shortDate(item.date)} | score: ${Math.round(item.score)}`);

    if (item.approxTraffic) {
      console.log(`   searches: ${item.approxTraffic}`);
    }

    if (item.link) {
      console.log(`   link: ${item.link}`);
    }

    if (item.imageUrl) {
      console.log(`   image: ${item.imageUrl}`);
    } else if (item.thumbnailUrl) {
      console.log(`   thumbnail: ${item.thumbnailUrl}`);
    }

    if (item.source === "arxiv") {
      console.log("   evidence: preprint, not peer reviewed");
    }

    if (item.category === "meme" || item.category === "pop-culture") {
      console.log(`   meme angle: ${memeAngle(item)}`);
    }
  }
}

export function memeAngle(item) {
  const title = item.title.replace(/\s+/g, " ").trim();

  if (/\b67\b|six seven/i.test(title)) {
    return "Benchmark meme: still visible, but treat as stale unless it appears in very recent Reddit/Trends spikes.";
  }

  if (/brainrot|slang|gen z/i.test(title)) {
    return "Language mutation: joke is probably that adults are discovering the term after the internet already moved on.";
  }

  if (/tiktok|viral|trend/i.test(title)) {
    return "Viral format: find the repeatable template, not just the original clip.";
  }

  return "Look for the simple social contradiction people are laughing at, then compress it into one caption.";
}
