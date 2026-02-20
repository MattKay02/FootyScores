# Frontend Redesign — Design Document

**Date:** 2026-02-20
**Status:** Approved

---

## Overview

Redesign the FootyScores frontend to add two-tab navigation: a polished Matchweek Fixtures screen and a new League Table (Standings) screen. Elevate the existing dark visual style without changing the design language.

---

## App Structure

Restructure `app/` into an Expo Router tab group:

```
app/
  _layout.jsx          ← root layout (unchanged)
  (tabs)/
    _layout.jsx        ← tab bar definition
    index.jsx          ← matchweek screen (existing logic moved here)
    standings.jsx      ← new league table screen
```

Navigation pattern: bottom tab bar. No new packages required — Expo Router ships `<Tabs>` built-in.

---

## Backend Changes

New endpoint added to the backend:

```
GET /standings/premier-league
```

Response shape:

```json
{
  "league": "Premier League",
  "leagueId": 39,
  "season": 2024,
  "cachedAt": "2025-02-19T15:30:00.000Z",
  "standings": [
    {
      "rank": 1,
      "team": {
        "id": 50,
        "name": "Manchester City",
        "crest": "https://media.api-sports.io/football/teams/50.png"
      },
      "played": 28,
      "win": 18,
      "draw": 6,
      "lose": 4,
      "goalsDiff": 31,
      "points": 60
    }
  ]
}
```

Same in-memory caching and refresh schedule pattern as the fixtures endpoint. API-Football free plan includes standings for season 2024.

New files:
- `backend/routes/standings.js`
- `backend/services/standingsService.js`

---

## Frontend Changes

### Tab Bar

- Dark background (`#0D0D0D`), thin top border (`#2A2A2A`)
- Two tabs: `⚽ Matchweek` and `📊 Table` with icon + label
- Active colour: `#FFFFFF`. Inactive: `#555555`
- Styled via `tabBarStyle` and `tabBarActiveTintColor` in `<Tabs>` screenOptions

### Matchweek Screen (polished)

- Header: small muted "PREMIER LEAGUE" label in caps above "Matchweek 27"
- Fixture cards: `paddingVertical` increased, score text 18px (up from 16px), crests 28px (up from 24px)
- Same flat dark aesthetic, improved visual weight

### Standings Screen (new)

- Sticky column header row: `Pos | Team | P | W | D | L | GD | Pts`
- Each row: rank number, team crest (24px), team name (truncated), stats columns
- GD prefixed with `+` for positive values
- Pull-to-refresh via `RefreshControl`
- `FlatList` for performance

New components:
- `components/StandingsRow.jsx` — single team row
- `components/StandingsTable.jsx` — list with sticky header

New service call in `services/api.js`:
- `fetchStandings()` — `GET /standings/premier-league`

---

## Colour Additions

No new colours needed. Existing palette covers all UI requirements.

---

## Out of Scope

- Zone indicators (Champions League / relegation colouring) — not requested
- Form column — not requested
- Multiple leagues — per CLAUDE.md, out of scope
