# FootyScores — Backend Specification

> This document is the single source of truth for the FootyScores backend agent.
> Read this entire file before writing a single line of code.

---

## What This Backend Does

A lightweight caching proxy server. It sits between the FootyScores mobile app and the API-Football data source. Its only job is to:

1. Fetch Premier League fixture data from API-Football on a smart schedule
2. Cache the response in memory
3. Serve that cached data to the app on request
4. Log every cache refresh with a timestamp

The app never calls API-Football directly. The app only ever talks to this backend.

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Language:** JavaScript (CommonJS)
- **Hosting:** Railway (free tier)
- **Cache:** In-memory (no database required at this stage)
- **HTTP client:** node-fetch or axios

---

## Project Structure

```
footyscores-backend/
├── server.js                  ← entry point, starts Express server
├── routes/
│   └── fixtures.js            ← GET /fixtures/premier-league endpoint
├── services/
│   └── apiFootball.js         ← all API-Football calls live here
├── cache/
│   └── store.js               ← in-memory cache logic with TTL
├── scheduler/
│   └── refreshScheduler.js    ← smart refresh logic based on PL kickoff windows
├── constants/
│   └── leagues.js             ← league IDs and metadata
├── utils/
│   └── logger.js              ← timestamp logging for cache refreshes
├── .env                       ← API key stored here, never committed
├── .env.example               ← committed version showing required env vars
├── .gitignore                 ← must include .env and node_modules
└── package.json
```

---

## Environment Variables

```
# .env.example
API_FOOTBALL_KEY=your_api_key_here
PORT=3000
```

The API key is obtained free from: https://dashboard.api-football.com
No credit card required. Free plan includes 100 requests/day.

---

## The One Endpoint

```
GET /fixtures/premier-league
```

**Response shape the app expects:**

```json
{
  "league": "Premier League",
  "leagueId": 39,
  "season": 2024,
  "matchweek": "Regular Season - 27",
  "cachedAt": "2025-02-19T15:30:00.000Z",
  "fixtures": [
    {
      "fixtureId": 1035082,
      "date": "2025-02-15",
      "time": "15:00",
      "status": "FT",
      "statusShort": "FT",
      "minute": null,
      "homeTeam": {
        "id": 33,
        "name": "Manchester United",
        "crest": "https://media.api-sports.io/football/teams/33.png"
      },
      "awayTeam": {
        "id": 40,
        "name": "Liverpool",
        "crest": "https://media.api-sports.io/football/teams/40.png"
      },
      "score": {
        "home": 1,
        "away": 2
      }
    }
  ]
}
```

**Status values the app should expect:**

| statusShort | Meaning |
|---|---|
| `NS` | Not Started |
| `1H` | First Half (live) |
| `HT` | Half Time |
| `2H` | Second Half (live) |
| `ET` | Extra Time |
| `FT` | Full Time |
| `PST` | Postponed |
| `CANC` | Cancelled |

---

## API-Football Integration

**Base URL:** `https://v3.football.api-sports.io`

**Auth header:**
```
x-apisports-key: {API_FOOTBALL_KEY}
```

**Endpoint used:**
```
GET /fixtures?league=39&season=2024&round=current
```

**League constant:**
```javascript
// constants/leagues.js
const LEAGUES = {
  premierLeague: {
    id: 39,
    name: "Premier League",
    slug: "premier-league",
    season: 2024
  }
}
```

---

## Caching Logic

Cache is stored in memory as a simple object:

```javascript
// cache/store.js structure
{
  data: null,         // the transformed fixture response
  cachedAt: null,     // Date object of when it was last fetched
  ttl: 3600000        // 1 hour in milliseconds (default)
}
```

**Cache TTL rules:**

| Condition | TTL |
|---|---|
| No live matches (all NS or FT) | 60 minutes |
| Any fixture has live status (1H, HT, 2H, ET) | 60 seconds |
| Outside active kickoff windows | 60 minutes |

The cache logic checks `cachedAt + ttl > Date.now()` before deciding whether to serve cached data or fetch fresh.

---

## Smart Refresh Scheduler

The scheduler runs on a cron-like loop. It only triggers a cache refresh during active Premier League kickoff windows. Outside these windows, no API calls are made.

**Premier League kickoff windows (all times UTC):**

```javascript
// scheduler/refreshScheduler.js
const PL_WINDOWS = [
  // Saturday
  { day: 6, start: "12:25", end: "14:30" },
  { day: 6, start: "14:55", end: "17:05" },
  { day: 6, start: "17:25", end: "19:40" },
  { day: 6, start: "19:55", end: "22:10" },
  // Sunday
  { day: 0, start: "13:55", end: "16:05" },
  { day: 0, start: "16:25", end: "18:40" },
  { day: 0, start: "19:55", end: "22:10" },
  // Tuesday
  { day: 2, start: "19:40", end: "22:10" },
  // Wednesday
  { day: 3, start: "19:40", end: "22:10" },
  // Thursday (rare midweek)
  { day: 4, start: "19:40", end: "22:10" },
  // Monday (occasional)
  { day: 1, start: "19:55", end: "22:10" },
  // Friday (occasional)
  { day: 5, start: "19:55", end: "22:10" }
];
```

**Day values follow JavaScript's `getDay()` convention:**
0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday

**Scheduler behaviour:**
- Runs a check every 60 seconds
- If current time falls inside any window AND cache is stale → fetch and refresh
- If current time is outside all windows → do nothing, return cached data as-is
- If a live match is detected in cached data → override TTL to 60 seconds regardless of window

---

## Logging

Every cache refresh must log to console with this format:

```
[2025-02-19T15:30:00.000Z] CACHE REFRESH — Premier League | Matchweek: Regular Season - 27 | Fixtures: 10 | Duration: 342ms
[2025-02-19T15:30:00.000Z] CACHE HIT — Premier League | Age: 4m 32s | Serving cached data
[2025-02-19T15:30:00.000Z] CACHE MISS — Premier League | Outside active window | No fetch triggered
[2025-02-19T15:30:00.000Z] LIVE DETECTED — 2 live fixtures | TTL reduced to 60s
```

Logger is a simple utility in `utils/logger.js`. Use `console.log` with ISO timestamps. No external logging library needed.

---

## Error Handling

- If API-Football returns an error → return last cached data if available, log the error
- If API-Football is unreachable → same as above
- If no cached data exists and API fails → return 503 with message `{ error: "Data temporarily unavailable" }`
- If request limit is hit (429) → log warning, serve cache, do not retry immediately

```javascript
// Response on error when cache exists
// Still return 200 with stale data rather than crashing the app
{
  "league": "Premier League",
  "cachedAt": "2025-02-19T14:30:00.000Z",
  "stale": true,
  "fixtures": [ ... ]
}
```

---

## Request Budget

```
Free plan limit:        100 requests/day
Active window calls:    1 request per refresh cycle
Scheduler interval:     60 seconds
Worst case (Sat):       4 windows × ~120mins each = ~480 checks
                        but only 1 API call per window when stale
Realistic daily max:    ~40-60 requests on a heavy matchday
Buffer:                 40-60 requests remaining for safety
```

---

## CORS

The backend must allow requests from the Expo app during development.

```javascript
// In server.js
const cors = require('cors');
app.use(cors()); // open during development, restrict in production
```

---

## Health Check Endpoint

```
GET /health
```

Returns:
```json
{
  "status": "ok",
  "uptime": 3600,
  "cacheAge": "4m 32s",
  "lastRefresh": "2025-02-19T15:30:00.000Z"
}
```

---

## What This Backend Must NOT Do

- No user authentication
- No database
- No match detail endpoints (lineups, scorers) — parked for future
- No other leagues — Premier League only at this stage
- No WebSockets — polling from the app is sufficient for now
- No third-party analytics or tracking

---

## Deployment (Railway)

1. Push repo to GitHub
2. Connect GitHub repo to Railway
3. Set environment variables in Railway dashboard (API_FOOTBALL_KEY, PORT)
4. Railway auto-deploys on every push to main
5. Free tier is sufficient — this backend is extremely lightweight

---

## Future Scope (Do Not Build Now)

These are parked intentionally. Do not implement:

- Additional leagues (La Liga, Bundesliga, Serie A, Ligue 1)
- Cup competitions (Champions League, Europa League, domestic cups)
- Match detail endpoint (lineups, scorers, stats)
- User favourites / personalisation
- Push notification triggers
- WebSocket live updates
- Paid API tier integration

---

## Definition of Done

Backend is complete when:

- [ ] `GET /fixtures/premier-league` returns correctly shaped JSON
- [ ] Cache serves stale data between refreshes correctly
- [ ] Scheduler only fires during active PL windows
- [ ] Live match detection reduces TTL to 60 seconds
- [ ] Every cache refresh is logged with timestamp
- [ ] `GET /health` returns uptime and cache age
- [ ] Error handling returns stale cache or 503 gracefully
- [ ] `.env` is gitignored, `.env.example` is committed
- [ ] Deployed and reachable on Railway
