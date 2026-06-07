# YouTube Playlist Shuffler

Smart-shuffles one manually ordered YouTube playlist so the first songs and nearby song pairs do not keep repeating.

## Why OAuth is needed

Changing playlist item positions uses the YouTube Data API `playlistItems.update` method, which requires OAuth access to your own YouTube account. Do not share your Google password or account session. Create a local OAuth client and keep the downloaded `client_secret.json` file private.

Official API notes:

- `playlistItems.list` returns playlist entries with `snippet.position` and `snippet.resourceId`.
- `playlistItems.update` can change `snippet.position`.
- The playlist must use manual ordering, otherwise YouTube returns `manualSortRequired`.
- Each item update costs 50 quota units, so a 100-song playlist can cost roughly 5,000 quota units if nearly every item moves.

## Setup

1. In Google Cloud Console, create or select a project.
2. Enable **YouTube Data API v3**.
3. Configure the OAuth consent screen for personal/testing use.
4. Create an OAuth Client ID with app type **Desktop app**.
5. Download the JSON credentials and save them here as `client_secret.json`.
6. Copy `.env.example` to `.env` and set `YOUTUBE_PLAYLIST_ID`.
7. Install dependencies:

   ```bash
   npm install
   ```

8. Authorize once:

   ```bash
   npm run auth
   ```

## Usage

Preview without changing YouTube:

```bash
npm run preview
```

Apply a shuffle:

```bash
npm run shuffle
```

Force a dry run:

```bash
npm run shuffle:dry
```

Reset the remembered "usual" order to the playlist's current order:

```bash
npm run baseline
```

## How the shuffle is smart

The script generates many random candidate orders and scores them. It prefers orders where:

- the first track is different from the current, baseline, and recent first tracks;
- videos are far from their usual positions;
- videos are far from their positions in recent shuffles;
- neighboring pairs from the usual/current/recent orders are broken up.

The chosen order is saved to `shuffle-history.json`, so the next shuffle tries to be different again.
