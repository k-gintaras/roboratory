# Culture Radar

RSS-only prototype for a small daily cultural digest. It is meant to avoid endless feeds while still catching new meme/culture signals.

## Sources

- Google Trends RSS for broad search spikes.
- Google News RSS keyword searches for meme/culture terms.
- Reddit RSS subreddit feeds for meme-native signals.
- Optional read-only 4chan catalog JSON for early/noisy meme signals.

No API keys are required for the first version.

## Setup

```bash
npm install
copy .env.example .env
copy filters.example.json filters.json
```

Edit `.env` if you want different regions, keywords, or subreddits. Edit `filters.json` to block boring categories and add exceptions.

## Commands

General digest:

```bash
npm run digest
```

Research/tech digest from primary sources and papers:

```bash
npm run research
```

Meme-focused digest:

```bash
npm run memes
```

Check the current signal around the benchmark meme `67`:

```bash
npm run benchmark
```

Check optional 4chan catalog signals:

```bash
npm run chan
```

## Notes

Google Trends is a strong signal for "people are suddenly searching this", but it is not a truth source. Reddit is faster for meme discovery, but noisier. 4chan can be earlier and more original, but it is also much more toxic and should be treated as an early-warning source, not a digest source. The useful answer is overlap: fresh meme-native chatter plus rising search/news interest.

`npm run research` deliberately avoids popular tech sites by default. It pulls from NASA, CERN, and arXiv categories rather than ad-heavy tech blogs. Treat arXiv as preprint evidence, not peer review.

## Filtering

`filters.json` supports:

- `blockedCategories`: categories like `sports` and `celebrity`.
- `blockedTerms`: terms that should be ignored.
- `allowTerms`: exceptions that override blocks, for example `olympics`, `strongman`, or `world record`.
- `blockedSources`: whole sources to hide.
