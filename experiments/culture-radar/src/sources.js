import Parser from "rss-parser";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "culture-radar/0.1 RSS reader"
  },
  customFields: {
    item: [
      ["ht:approx_traffic", "approxTraffic"],
      ["ht:picture", "picture"],
      ["ht:picture_source", "pictureSource"],
      ["content:encoded", "contentEncoded"]
    ]
  }
});

function decodeHtmlEntities(value = "") {
  return String(value)
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function encodeNewsQuery(query) {
  return encodeURIComponent(`${query} when:7d`);
}

function googleNewsRss(query, config) {
  return `https://news.google.com/rss/search?q=${encodeNewsQuery(query)}&hl=${config.lang}&gl=${config.geo}&ceid=${config.geo}:en`;
}

function redditRss(subreddit) {
  return `https://old.reddit.com/r/${encodeURIComponent(subreddit)}/hot/.rss?limit=25`;
}

function stripHtml(value = "") {
  return decodeHtmlEntities(value)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractFirstMatch(value, pattern) {
  const match = String(value ?? "").match(pattern);
  return match?.[1] ? decodeHtmlEntities(match[1]) : undefined;
}

function extractImageUrl(source, item) {
  if (item.picture && /^https?:\/\//i.test(item.picture)) {
    return item.picture;
  }

  const content = item.content ?? item.summary ?? "";
  const encodedContent = item.contentEncoded ?? "";

  if (source === "reddit") {
    return extractFirstMatch(content, /href="(https:\/\/i\.redd\.it\/[^"]+)"/i)
      ?? extractFirstMatch(content, /src="(https:\/\/preview\.redd\.it\/[^"]+)"/i)
      ?? extractFirstMatch(content, /href="(https:\/\/[^"]+\.(?:jpg|jpeg|png|gif|webp))"/i);
  }

  const imageUrl = extractFirstMatch(encodedContent, /<img[^>]+src="([^"]+)"/i)
    ?? extractFirstMatch(content, /<img[^>]+src="([^"]+)"/i);

  return imageUrl && /^https?:\/\//i.test(imageUrl) ? imageUrl : undefined;
}

function normalizeItem(source, item, extra = {}) {
  const date = item.isoDate ? new Date(item.isoDate) : item.pubDate ? new Date(item.pubDate) : undefined;

  return {
    source,
    title: (item.title ?? "").trim(),
    link: item.link,
    date: date && !Number.isNaN(date.valueOf()) ? date : undefined,
    approxTraffic: item.approxTraffic,
    picture: item.picture,
    pictureSource: item.pictureSource,
    imageUrl: extractImageUrl(source, item),
    contentSnippet: item.contentSnippet ?? item.summary ?? item.contentEncoded ?? item.content ?? "",
    ...extra
  };
}

async function safeParse(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 culture-radar/0.1 personal RSS reader",
        "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8"
      }
    });

    if (!response.ok) {
      throw new Error(`Status code ${response.status}`);
    }

    return await parser.parseString(await response.text());
  } catch (error) {
    return {
      title: url,
      items: [],
      error: error.message
    };
  }
}

export async function fetchAll(config) {
  const feeds = [
    {
      source: "google-trends",
      url: config.googleTrendsRss,
      extra: {}
    },
    ...config.memeSearches.map((query) => ({
      source: "google-news",
      url: googleNewsRss(query, config),
      extra: { query }
    })),
    ...config.subreddits.map((subreddit) => ({
      source: "reddit",
      url: redditRss(subreddit),
      extra: { subreddit }
    }))
  ];

  const parsedFeeds = await Promise.all(feeds.map(async (feed) => ({
    feed,
    parsed: await safeParse(feed.url)
  })));

  const warnings = parsedFeeds
    .filter(({ parsed }) => parsed.error)
    .map(({ feed, parsed }) => `${feed.source} ${feed.url}: ${parsed.error}`);

  const items = parsedFeeds.flatMap(({ feed, parsed }) => (
    parsed.items.map((item) => normalizeItem(feed.source, item, feed.extra))
  ));

  return { items, warnings };
}

function arxivUrl(query, maxResults = 10) {
  const encodedQuery = encodeURIComponent(query).replace(/%20/g, "+");
  return `https://export.arxiv.org/api/query?search_query=${encodedQuery}&sortBy=submittedDate&sortOrder=descending&max_results=${maxResults}`;
}

export async function fetchResearch(config) {
  const feeds = [
    {
      source: "nasa",
      url: "https://www.nasa.gov/feed/",
      extra: { researchSource: "NASA", researchCategory: "space-science" }
    },
    {
      source: "cern",
      url: "https://home.cern/news/feed",
      extra: { researchSource: "CERN", researchCategory: "particle-physics" }
    },
    {
      source: "arxiv",
      url: arxivUrl("cat:cs.AI OR cat:cs.RO", 12),
      extra: { researchSource: "arXiv AI/robotics", researchCategory: "tech-science" }
    },
    {
      source: "arxiv",
      url: arxivUrl("cat:astro-ph.GA OR cat:astro-ph.EP OR cat:astro-ph.CO", 12),
      extra: { researchSource: "arXiv astronomy", researchCategory: "space-science" }
    },
    {
      source: "arxiv",
      url: arxivUrl("cat:hep-ex OR cat:physics.ins-det", 12),
      extra: { researchSource: "arXiv particle/instrumentation", researchCategory: "particle-physics" }
    },
    {
      source: "arxiv",
      url: arxivUrl("cat:cond-mat.mtrl-sci OR cat:cond-mat.mes-hall OR cat:physics.app-ph", 12),
      extra: { researchSource: "arXiv chips/nano/materials", researchCategory: "chips-nano" }
    },
    {
      source: "arxiv",
      url: arxivUrl("cat:q-bio.BM OR cat:q-bio.GN OR cat:q-bio.QM", 12),
      extra: { researchSource: "arXiv biotech/q-bio", researchCategory: "biotech" }
    }
  ];

  const parsedFeeds = await Promise.all(feeds.map(async (feed) => ({
    feed,
    parsed: await safeParse(feed.url)
  })));

  const warnings = parsedFeeds
    .filter(({ parsed }) => parsed.error)
    .map(({ feed, parsed }) => `${feed.source} ${feed.url}: ${parsed.error}`);

  const items = parsedFeeds.flatMap(({ feed, parsed }) => (
    parsed.items.map((item) => normalizeItem(feed.source, item, feed.extra))
  ));

  return { items, warnings };
}

export async function fetchChanCatalog(config) {
  const warnings = [];
  const items = [];

  for (const board of config.chanBoards) {
    const url = `https://a.4cdn.org/${encodeURIComponent(board)}/catalog.json`;

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "culture-radar/0.1 personal trend reader"
        }
      });

      if (!response.ok) {
        warnings.push(`4chan /${board}/ ${response.status} ${response.statusText}`);
        continue;
      }

      const pages = await response.json();
      const threads = pages.flatMap((page) => page.threads ?? []);

      for (const thread of threads) {
        const title = stripHtml(thread.sub || thread.com || `/${board}/ thread ${thread.no}`);
        const text = stripHtml(thread.com || "");
        const date = thread.time ? new Date(thread.time * 1000) : undefined;

        items.push({
          source: "4chan",
          title,
          link: `https://boards.4chan.org/${board}/thread/${thread.no}`,
          date,
          contentSnippet: text,
          board,
          replies: thread.replies ?? 0,
          images: thread.images ?? 0,
          imageUrl: thread.tim && thread.ext ? `https://i.4cdn.org/${board}/${thread.tim}${thread.ext}` : undefined,
          thumbnailUrl: thread.tim ? `https://i.4cdn.org/${board}/${thread.tim}s.jpg` : undefined
        });
      }
    } catch (error) {
      warnings.push(`4chan /${board}/: ${error.message}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 1100));
  }

  return { items, warnings };
}
