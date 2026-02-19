# FootyScores — Master Agent Orchestrator

> This is the root context file for all agents working on FootyScores.
> Every agent reads this file first, then reads their specific spec file.
> Never deviate from the decisions made in this file or the spec files.

---

## What FootyScores Is

A clean, focused Premier League scores app for iOS. Built with React Native + Expo.
The entire product philosophy: show the user exactly what they came for, nothing else.
No news. No AI insights. No engagement bait. Scores and fixtures only.

Current scope is intentionally minimal. Do not add features not listed here.

---

## Current Scope (Do Not Expand Beyond This)

- Premier League fixtures for the current matchweek
- Each fixture shows: home team, away team, score or kickoff time, match status
- No lineups, no scorers, no stats at this stage
- iOS only
- No user accounts, no database, no authentication

---

## System Architecture

```
[Expo iOS App]  →  [Node.js Backend]  →  [API-Football]
  Frontend           Backend               Data Source
  Port: N/A          Port: 3000            External API
```

The app never calls API-Football directly.
The app only calls the backend.
The backend handles all caching and scheduling.

---

## Agent Delegation Rules

When given a task, identify which domain it belongs to and load the correct spec:

| Task type | Agent | Spec file to read |
|---|---|---|
| Server, caching, API calls, scheduler, logging, Railway deployment | **Backend Agent** | `BACKEND.md` |
| UI components, screens, navigation, styling, Expo config, App Store | **Frontend Agent** | `FRONTEND.md` |
| Both domains affected | **Both agents** | Both spec files |

### How to identify the domain

**Backend tasks sound like:**
- "Fix the cache", "update the refresh schedule", "change the API endpoint"
- "The server is returning wrong data", "deployment is broken"
- Anything involving server.js, routes/, services/, cache/, scheduler/

**Frontend tasks sound like:**
- "Fix the match card", "update the colours", "the screen isn't loading"
- "Navigation is broken", "the league switcher isn't working"
- Anything involving screens/, components/, app/, assets/

**Both tasks sound like:**
- "The data isn't showing correctly" (could be either)
- "Add a new field to the fixture display" (backend shapes it, frontend displays it)
- When unsure — check the backend response first, then the frontend rendering

---

## The Contract Between Frontend and Backend

This is the agreed data shape. Both agents must respect it.
Frontend expects exactly this. Backend must return exactly this.
Neither agent changes this shape without updating both spec files.

### Endpoint

```
GET /fixtures/premier-league
```

### Response

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

### Status values

| statusShort | Display |
|---|---|
| `NS` | Show kickoff time |
| `1H` | Show score + LIVE indicator |
| `HT` | Show score + HT |
| `2H` | Show score + LIVE indicator |
| `ET` | Show score + ET |
| `FT` | Show final score |
| `PST` | Show POSTPONED |
| `CANC` | Show CANCELLED |

---

## Tech Stack (Locked — Do Not Change)

| Layer | Technology |
|---|---|
| Mobile app | React Native + Expo SDK |
| Routing | Expo Router |
| Backend | Node.js + Express |
| Hosting | Railway (free tier) |
| Data source | API-Football (api-sports.io) free plan |
| Cache | In-memory (no database) |

---

## Project Structure

```
FootyScores/                    ← root repo
├── CLAUDE.md                   ← this file
├── BACKEND.md                  ← backend agent spec
├── FRONTEND.md                 ← frontend agent spec
├── backend/                    ← Node.js backend
│   ├── server.js
│   ├── routes/
│   ├── services/
│   ├── cache/
│   ├── scheduler/
│   ├── constants/
│   ├── utils/
│   ├── .env                    ← gitignored
│   └── .env.example
└── frontend/                   ← Expo app
    ├── app/
    ├── components/
    ├── services/
    ├── constants/
    └── assets/
```

---

## Rules All Agents Must Follow

1. Read your spec file completely before writing any code
2. Do not build features listed under "Future Scope" in any spec file
3. Do not change the API contract shape without flagging it
4. Do not install packages not relevant to your assigned task
5. Do not add comments explaining what code does — write self-documenting code instead
6. Every file you create must have a clear single responsibility
7. If something is unclear, check CLAUDE.md first, then your spec file, then ask
8. Backend agent: never expose the API key to the frontend
9. Frontend agent: never hardcode the backend URL — use environment config
10. Both agents: keep it simple. This is an MVP.

---

## Environment Config

### Backend (.env)
```
API_FOOTBALL_KEY=your_key_here
PORT=3000
```

### Frontend (.env or app.config.js)
```
EXPO_PUBLIC_API_URL=http://localhost:3000        ← development
EXPO_PUBLIC_API_URL=https://your-app.railway.app ← production
```

---

## What Is Explicitly Out of Scope Right Now

Do not build any of the following regardless of how logical they seem:

- Other leagues (La Liga, Bundesliga, Serie A, Ligue 1)
- Cup competitions of any kind
- Match detail screens (lineups, scorers, stats)
- User accounts or favourites
- Push notifications
- WebSockets or real-time streaming
- Android support
- Tablet layouts
- Dark/light mode toggle
- Any form of analytics or tracking

---

## Definition of Done for the Full MVP

- [ ] Backend deployed on Railway and returning correct fixture JSON
- [ ] Frontend connects to backend and displays current matchweek
- [ ] Each fixture card shows teams, score or kickoff time, and status
- [ ] Live matches show a live indicator
- [ ] App handles loading state gracefully
- [ ] App handles error state gracefully (backend down)
- [ ] App runs on iOS simulator without errors
- [ ] No API key visible anywhere in the frontend codebase
