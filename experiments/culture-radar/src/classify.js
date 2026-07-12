const CATEGORY_RULES = [
  {
    category: "meme",
    terms: [
      "meme",
      "memes",
      "tiktok",
      "brainrot",
      "slang",
      "viral",
      "trend",
      "trending",
      "gen z",
      "twitter",
      "x users",
      "reddit",
      "67",
      "six seven",
      "skibidi",
      "rizz",
      "npc",
      "sigma"
    ]
  },
  {
    category: "sports",
    terms: [
      "score",
      "scores",
      "vs",
      "fc",
      "nba",
      "nfl",
      "mlb",
      "nhl",
      "f1",
      "formula 1",
      "grand prix",
      "tennis",
      "soccer",
      "football",
      "baseball",
      "basketball",
      "golf",
      "ufc",
      "wwe",
      "race",
      "driver"
    ]
  },
  {
    category: "celebrity",
    terms: [
      "celebrity",
      "actor",
      "actress",
      "singer",
      "rapper",
      "tour",
      "setlist",
      "dating",
      "breakup",
      "kardashian",
      "taylor swift",
      "ariana grande"
    ]
  },
  {
    category: "medicine",
    terms: ["medicine", "health", "doctor", "disease", "virus", "vaccine", "covid", "fda", "cdc", "nhs", "study", "hospital"]
  },
  {
    category: "space-science",
    terms: ["webb", "jwst", "james webb", "nasa", "esa", "space", "astronomy", "galaxy", "exoplanet", "telescope", "cosmic", "universe", "moon", "mars"]
  },
  {
    category: "particle-physics",
    terms: ["cern", "lhc", "particle", "collider", "detector", "atlas", "cms", "neutrino", "muon", "higgs", "accelerator"]
  },
  {
    category: "chips-nano",
    terms: ["semiconductor", "microchip", "chip", "nanotech", "nano", "transistor", "wafer", "lithography", "materials", "quantum dot"]
  },
  {
    category: "biotech",
    terms: ["biotech", "genomics", "crispr", "protein", "cell", "immunology", "synthetic biology", "molecular", "rna", "dna"]
  },
  {
    category: "tech-science",
    terms: ["ai", "openai", "google", "apple", "microsoft", "nasa", "space", "quantum", "chip", "robot", "astronomy", "science", "tesla"]
  },
  {
    category: "world-politics",
    terms: ["election", "president", "minister", "war", "ukraine", "russia", "china", "israel", "gaza", "nato", "tariff", "congress"]
  },
  {
    category: "pop-culture",
    terms: ["movie", "netflix", "music", "album", "trailer", "game", "show", "anime", "cartoon", "comic"]
  }
];

function haystack(item) {
  return `${item.title} ${item.contentSnippet} ${item.query ?? ""} ${item.subreddit ?? ""}`.toLowerCase();
}

export function classify(item) {
  const text = haystack(item);
  const matches = CATEGORY_RULES
    .map((rule) => ({
      category: rule.category,
      hits: rule.terms.filter((term) => text.includes(term))
    }))
    .filter((match) => match.hits.length > 0)
    .sort((a, b) => b.hits.length - a.hits.length);

  return matches[0]?.category ?? "general";
}

export function containsAny(item, terms) {
  const text = haystack(item);
  return terms.some((term) => text.includes(term.toLowerCase()));
}
