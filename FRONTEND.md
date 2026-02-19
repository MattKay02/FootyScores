# FootyScores — Frontend Specification

> Read CLAUDE.md before reading this file.
> This file covers the frontend only. Do not touch the backend directory.

---

## What This Frontend Does

An iOS app built with React Native and Expo that displays the current Premier League matchweek. It fetches data from the FootyScores backend (not directly from any external API) and renders a clean list of fixtures showing teams, scores, and match status.

---

## Tech Stack

- **Framework:** React Native + Expo SDK (latest stable)
- **Routing:** Expo Router (file-based)
- **Language:** JavaScript
- **Styling:** StyleSheet (React Native built-in, no third-party styling library)
- **HTTP:** fetch (built-in, no axios)
- **Icons:** @expo/vector-icons
- **Platform:** iOS only

---

## Project Structure

```
frontend/
├── app/
│   ├── _layout.jsx             ← root layout, navigation shell
│   └── index.jsx               ← home screen (Premier League matchweek)
├── components/
│   ├── FixtureCard.jsx         ← single match row component
│   ├── FixtureList.jsx         ← scrollable list of FixtureCards
│   ├── MatchweekHeader.jsx     ← shows "Matchweek 27" at top
│   ├── LiveIndicator.jsx       ← pulsing dot for live matches
│   └── LoadingState.jsx        ← shown while fetching
├── services/
│   └── api.js                  ← all backend calls live here
├── constants/
│   ├── colours.js              ← all colours defined here
│   └── config.js               ← API URL and other config
├── assets/
│   └── (app icons, splash)
├── app.json                    ← Expo config
└── package.json
```

---

## Screens

### Home Screen (app/index.jsx)

This is the only screen. The entire app is one screen.

**What it shows:**
- Matchweek header at the top ("Matchweek 27")
- Scrollable list of all fixtures in that matchweek
- Loading state while data is being fetched
- Error state if the backend is unreachable

**Behaviour:**
- Fetches data from backend on mount
- Refreshes when app comes back to foreground (AppState listener)
- Pull-to-refresh supported
- No auto-polling — fetch on mount and on foreground resume only

**Data flow:**
```
app/index.jsx mounts
→ calls services/api.js fetchFixtures()
→ api.js calls GET /fixtures/premier-league on backend
→ response stored in local state
→ passed to FixtureList component
```

---

## Components

### FixtureCard.jsx

Single match row. Receives one fixture object as a prop.

**Layout:**
```
[Home Crest] [Home Name]  [Score or Time]  [Away Name] [Away Crest]
```

**Rules:**
- If statusShort is NS → show kickoff time (e.g. "15:00")
- If statusShort is 1H or 2H → show current score + LiveIndicator
- If statusShort is HT → show current score + "HT" label
- If statusShort is FT → show final score, no indicator
- If statusShort is PST → show "PST" in place of score
- If statusShort is CANC → show "CANC" in place of score
- Team crests loaded from URL using Expo Image
- If crest fails to load → show a plain circle with team initials
- Home team always on the left, away team always on the right
- Score displayed in centre, bold

### FixtureList.jsx

Wraps fixtures in a FlatList. Receives full fixtures array as prop.

- Uses FlatList (not ScrollView) for performance
- keyExtractor uses fixtureId
- No section headers — flat list in chronological order
- Pull-to-refresh via RefreshControl

### MatchweekHeader.jsx

Displays the current matchweek label at the top of the screen.

- Receives matchweek string as prop (e.g. "Regular Season - 27")
- Parses and displays as "Matchweek 27"
- If matchweek string format changes, parsing lives here

### LiveIndicator.jsx

A small pulsing coloured dot shown next to live fixture scores.

- Animated pulsing using Animated API (built-in React Native)
- Colour: accent green (see colours.js)
- Only rendered when fixture is live (1H, HT, 2H, ET)

### LoadingState.jsx

Shown while the initial fetch is in progress.

- Simple centred ActivityIndicator
- No skeleton screens at this stage

---

## services/api.js

All backend communication lives in this one file.

```javascript
// The only function exported from this file at this stage
export async function fetchFixtures() {
  // calls GET {API_URL}/fixtures/premier-league
  // returns the parsed JSON response
  // throws on network error or non-200 response
}
```

The base URL comes from constants/config.js, never hardcoded.

---

## constants/config.js

```javascript
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
```

During development this points to localhost.
In production this points to the Railway backend URL.
Never hardcode either URL anywhere else in the codebase.

---

## constants/colours.js

All colours defined in one place. No colour values anywhere else in the codebase.

```javascript
export const colours = {
  background: '#0D0D0D',       // near black, main background
  surface: '#1A1A1A',          // slightly lighter, card background
  border: '#2A2A2A',           // subtle card border
  textPrimary: '#FFFFFF',      // main text
  textSecondary: '#8A8A8A',    // secondary text (kickoff times, labels)
  textMuted: '#555555',        // muted labels
  accentGreen: '#4AE54A',      // live indicator
  accentRed: '#E54A4A',        // (reserved, not used yet)
  scoreText: '#FFFFFF',        // score numbers
}
```

---

## Design Rules

1. Dark background throughout — `#0D0D0D`
2. No borders with high contrast — subtle `#2A2A2A` only
3. Typography is the UI — no decorative elements
4. Scores are the most visually prominent element on each card
5. Team names truncate with ellipsis if too long — never wrap to two lines
6. Crests are small (24×24px) — supporting element, not hero element
7. Consistent spacing — use multiples of 8px for all padding and margins
8. No shadows — flat design
9. No gradients
10. No animations except the LiveIndicator pulse

---

## Error States

### Backend unreachable
```
Centred on screen:
"Couldn't load fixtures"
"Check your connection"
[Retry button]
```

### Empty fixtures array
```
Centred on screen:
"No fixtures this week"
```

### Stale data (backend returns stale: true)
No special UI treatment. Show the data as normal. Do not show a warning banner.

---

## Loading State

Show ActivityIndicator centred on screen while `isLoading` is true on first load.
On pull-to-refresh, show RefreshControl spinner in the list header instead.

---

## App Config (app.json)

```json
{
  "expo": {
    "name": "FootyScores",
    "slug": "footyscores",
    "version": "1.0.0",
    "orientation": "portrait",
    "platforms": ["ios"],
    "ios": {
      "bundleIdentifier": "com.footyscores.app",
      "supportsTablet": false
    }
  }
}
```

Portrait only. No tablet support. iOS only.

---

## State Management

No Redux, no Zustand, no Context at this stage. Local component state with useState and useEffect is sufficient for one screen with one data source.

```javascript
const [fixtures, setFixtures] = useState([]);
const [matchweek, setMatchweek] = useState('');
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);
const [isRefreshing, setIsRefreshing] = useState(false);
```

---

## Packages to Install

```bash
npx create-expo-app@latest frontend
cd frontend
npx expo install expo-router
npx expo install expo-image
npx expo install @expo/vector-icons
```

No other packages. Do not install styling libraries, state management libraries, or animation libraries beyond what React Native provides built-in.

---

## What This Frontend Must NOT Do

- Never call API-Football directly
- Never store the API-Football key
- Never use the backend URL as a hardcoded string
- Never implement features listed in the out-of-scope section of CLAUDE.md
- Never use ScrollView for the fixture list — always FlatList
- Never add navigation beyond the single home screen
- Never add tab bars, drawer navigation, or modals at this stage

---

## Definition of Done

Frontend is complete when:

- [ ] App launches to Premier League matchweek screen
- [ ] All fixtures in the current matchweek are displayed
- [ ] Each card shows home team, away team, score or kickoff time
- [ ] Live matches show the LiveIndicator pulse
- [ ] Loading state shows on first fetch
- [ ] Error state shows with retry button when backend is unreachable
- [ ] Pull-to-refresh works
- [ ] App refreshes data when returning from background
- [ ] Team crests load from URL, fallback to initials on failure
- [ ] No hardcoded URLs or API keys anywhere in the codebase
- [ ] Runs on iOS simulator without warnings or errors
- [ ] Portrait orientation only, no landscape layout
