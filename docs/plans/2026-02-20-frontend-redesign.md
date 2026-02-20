# Frontend Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a bottom-tab navigation shell with a polished Matchweek screen and a new League Table (Standings) screen, backed by a new `/standings/premier-league` backend endpoint.

**Architecture:** Expo Router's `(tabs)` group provides the tab bar. A new standalone standings cache module mirrors the existing fixtures cache pattern. The standings screen fetches from a new Express route that calls the API-Football standings endpoint.

**Tech Stack:** Node.js + Express (backend), React Native + Expo SDK 54 + Expo Router (frontend), `@expo/vector-icons` Ionicons (tab icons), no new packages.

---

## Task 1: Add `fetchStandings` to the API service

**Files:**
- Modify: `backend/services/apiFootball.js`

**Step 1: Add the transform function and export**

Append below the existing `fetchCurrentFixtures` function and update `module.exports`:

```js
const transformStandingEntry = (entry) => ({
  rank: entry.rank,
  team: {
    id: entry.team.id,
    name: entry.team.name,
    crest: entry.team.logo,
  },
  played: entry.all.played,
  win: entry.all.win,
  draw: entry.all.draw,
  lose: entry.all.lose,
  goalsDiff: entry.goalsDiff,
  points: entry.points,
});

const fetchStandings = async () => {
  const { premierLeague } = LEAGUES;
  const response = await apiClient.get("/standings", {
    params: {
      league: premierLeague.id,
      season: premierLeague.season,
    },
  });

  const raw = response.data.response[0].league.standings[0];
  return {
    league: premierLeague.name,
    leagueId: premierLeague.id,
    season: premierLeague.season,
    standings: raw.map(transformStandingEntry),
  };
};

module.exports = { fetchCurrentFixtures, fetchStandings };
```

**Step 2: Commit**

```bash
git add backend/services/apiFootball.js
git commit -m "feat(backend): add fetchStandings to API service"
```

---

## Task 2: Create the standings cache store

**Files:**
- Create: `backend/cache/standingsStore.js`

**Step 1: Create the file**

```js
const DEFAULT_TTL = 3600000;

const cache = {
  data: null,
  cachedAt: null,
  ttl: DEFAULT_TTL,
};

const isStale = () => {
  if (!cache.data || !cache.cachedAt) return true;
  return cache.cachedAt + cache.ttl < Date.now();
};

const set = (data) => {
  cache.data = data;
  cache.cachedAt = Date.now();
  cache.ttl = DEFAULT_TTL;
};

const get = () => ({
  data: cache.data,
  cachedAt: cache.cachedAt,
});

module.exports = { isStale, set, get };
```

**Step 2: Commit**

```bash
git add backend/cache/standingsStore.js
git commit -m "feat(backend): add standings cache store"
```

---

## Task 3: Create the standings route

**Files:**
- Create: `backend/routes/standings.js`

**Step 1: Create the file**

```js
const express = require("express");
const { fetchStandings } = require("../services/apiFootball");
const { isStale, set, get } = require("../cache/standingsStore");

const router = express.Router();

router.get("/premier-league", async (req, res) => {
  const { data, cachedAt } = get();

  if (!isStale()) {
    return res.json({ ...data, cachedAt: new Date(cachedAt).toISOString() });
  }

  try {
    const freshData = await fetchStandings();
    set(freshData);
    const { data: cached, cachedAt: newCachedAt } = get();
    return res.json({ ...cached, cachedAt: new Date(newCachedAt).toISOString() });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] STANDINGS FETCH ERROR — ${err.message}`);

    if (data) {
      return res.json({
        ...data,
        cachedAt: new Date(cachedAt).toISOString(),
        stale: true,
      });
    }

    return res.status(503).json({ error: "Standings temporarily unavailable" });
  }
});

module.exports = router;
```

**Step 2: Commit**

```bash
git add backend/routes/standings.js
git commit -m "feat(backend): add standings route"
```

---

## Task 4: Register the standings route in server.js

**Files:**
- Modify: `backend/server.js`

**Step 1: Add the require and mount**

After the `fixturesRouter` require line, add:
```js
const standingsRouter = require("./routes/standings");
```

After `app.use("/fixtures", limiter, fixturesRouter);`, add:
```js
app.use("/standings", limiter, standingsRouter);
```

**Step 2: Verify with curl**

Start the backend: `node backend/server.js` from repo root.

```bash
curl http://localhost:3000/standings/premier-league
```

Expected: JSON with `standings` array of 20 teams, each with `rank`, `team`, `played`, `win`, `draw`, `lose`, `goalsDiff`, `points`.

**Step 3: Commit**

```bash
git add backend/server.js
git commit -m "feat(backend): register standings route"
```

---

## Task 5: Restructure frontend routing for tabs

**Files:**
- Create: `frontend/app/(tabs)/` directory
- Create: `frontend/app/(tabs)/_layout.jsx`
- Move + update imports: `frontend/app/index.jsx` → `frontend/app/(tabs)/index.jsx`

**Step 1: Create the tabs layout**

Create `frontend/app/(tabs)/_layout.jsx`:

```jsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colours } from '../../constants/colours';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colours.background,
          borderTopColor: colours.border,
          borderTopWidth: 1,
          height: 56,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colours.textPrimary,
        tabBarInactiveTintColor: colours.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Matchweek',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="football-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="standings"
        options={{
          title: 'Table',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

**Step 2: Move and update index.jsx**

Create `frontend/app/(tabs)/index.jsx` — copy the contents of `frontend/app/index.jsx` and update all import paths from `../` to `../../`:

```jsx
import { useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colours } from '../../constants/colours';
import { fetchFixtures } from '../../services/api';
import FixtureList from '../../components/FixtureList';
import LoadingState from '../../components/LoadingState';
import MatchweekHeader from '../../components/MatchweekHeader';

export default function HomeScreen() {
  const [fixtures, setFixtures] = useState([]);
  const [matchweek, setMatchweek] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const appState = useRef(AppState.currentState);

  async function loadFixtures() {
    try {
      const data = await fetchFixtures();
      setFixtures(data.fixtures);
      setMatchweek(data.matchweek);
      setError(null);
    } catch (err) {
      setError(err);
    }
  }

  async function handleInitialLoad() {
    setIsLoading(true);
    await loadFixtures();
    setIsLoading(false);
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadFixtures();
    setIsRefreshing(false);
  }

  useEffect(() => {
    handleInitialLoad();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        loadFixtures();
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <View style={styles.centred}>
        <Text style={styles.errorTitle}>Couldn't load fixtures</Text>
        <Text style={styles.errorSubtitle}>Check your connection</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleInitialLoad}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <MatchweekHeader matchweek={matchweek} />
      <FixtureList
        fixtures={fixtures}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colours.background,
  },
  centred: {
    flex: 1,
    backgroundColor: colours.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorTitle: {
    color: colours.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorSubtitle: {
    color: colours.textSecondary,
    fontSize: 14,
    marginBottom: 24,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colours.border,
  },
  retryText: {
    color: colours.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
});
```

**Step 3: Delete the old index.jsx**

```bash
rm frontend/app/index.jsx
```

**Step 4: Verify**

Run `npx expo start` from `frontend/`. App should open to the matchweek screen with a tab bar at the bottom. The Matchweek tab should be active.

**Step 5: Commit**

```bash
git add frontend/app/
git commit -m "feat(frontend): restructure routing to Expo Router tabs"
```

---

## Task 6: Add `fetchStandings` to the frontend API service

**Files:**
- Modify: `frontend/services/api.js`

**Step 1: Add the function**

```js
import { API_URL } from '../constants/config';

export async function fetchFixtures() {
  const response = await fetch(`${API_URL}/fixtures/premier-league`);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

export async function fetchStandings() {
  const response = await fetch(`${API_URL}/standings/premier-league`);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}
```

**Step 2: Commit**

```bash
git add frontend/services/api.js
git commit -m "feat(frontend): add fetchStandings to API service"
```

---

## Task 7: Create StandingsRow component

**Files:**
- Create: `frontend/components/StandingsRow.jsx`

**Step 1: Create the file**

```jsx
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { colours } from '../constants/colours';

export default function StandingsRow({ entry }) {
  const { rank, team, played, win, draw, lose, goalsDiff, points } = entry;
  const gdLabel = goalsDiff > 0 ? `+${goalsDiff}` : `${goalsDiff}`;

  return (
    <View style={styles.row}>
      <Text style={styles.rank}>{rank}</Text>
      <Image
        source={{ uri: team.crest }}
        style={styles.crest}
        contentFit="contain"
      />
      <Text style={styles.teamName} numberOfLines={1} ellipsizeMode="tail">
        {team.name}
      </Text>
      <Text style={styles.stat}>{played}</Text>
      <Text style={styles.stat}>{win}</Text>
      <Text style={styles.stat}>{draw}</Text>
      <Text style={styles.stat}>{lose}</Text>
      <Text style={styles.stat}>{gdLabel}</Text>
      <Text style={[styles.stat, styles.points]}>{points}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
  },
  rank: {
    width: 24,
    fontSize: 13,
    color: colours.textSecondary,
    textAlign: 'center',
    marginRight: 8,
  },
  crest: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  teamName: {
    flex: 1,
    fontSize: 14,
    color: colours.textPrimary,
    marginRight: 8,
  },
  stat: {
    width: 28,
    fontSize: 13,
    color: colours.textSecondary,
    textAlign: 'center',
  },
  points: {
    color: colours.textPrimary,
    fontWeight: '700',
  },
});
```

**Step 2: Commit**

```bash
git add frontend/components/StandingsRow.jsx
git commit -m "feat(frontend): add StandingsRow component"
```

---

## Task 8: Create StandingsTable component

**Files:**
- Create: `frontend/components/StandingsTable.jsx`

**Step 1: Create the file**

```jsx
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { colours } from '../constants/colours';
import StandingsRow from './StandingsRow';

function TableHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.headerRank}>#</Text>
      <View style={styles.headerCrestGap} />
      <Text style={styles.headerTeam}>Team</Text>
      <Text style={styles.headerStat}>P</Text>
      <Text style={styles.headerStat}>W</Text>
      <Text style={styles.headerStat}>D</Text>
      <Text style={styles.headerStat}>L</Text>
      <Text style={styles.headerStat}>GD</Text>
      <Text style={styles.headerStat}>Pts</Text>
    </View>
  );
}

export default function StandingsTable({ standings, isRefreshing, onRefresh }) {
  return (
    <FlatList
      data={standings}
      keyExtractor={item => item.team.id.toString()}
      renderItem={({ item }) => <StandingsRow entry={item} />}
      ListHeaderComponent={<TableHeader />}
      stickyHeaderIndices={[0]}
      style={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={colours.textSecondary}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: colours.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colours.surface,
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
  },
  headerRank: {
    width: 24,
    fontSize: 11,
    color: colours.textMuted,
    textAlign: 'center',
    marginRight: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  headerCrestGap: {
    width: 28,
    marginRight: 8,
  },
  headerTeam: {
    flex: 1,
    fontSize: 11,
    color: colours.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginRight: 8,
  },
  headerStat: {
    width: 28,
    fontSize: 11,
    color: colours.textMuted,
    textAlign: 'center',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
```

**Step 2: Commit**

```bash
git add frontend/components/StandingsTable.jsx
git commit -m "feat(frontend): add StandingsTable component"
```

---

## Task 9: Create the standings screen

**Files:**
- Create: `frontend/app/(tabs)/standings.jsx`

**Step 1: Create the file**

```jsx
import { useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colours } from '../../constants/colours';
import { fetchStandings } from '../../services/api';
import StandingsTable from '../../components/StandingsTable';
import LoadingState from '../../components/LoadingState';

export default function StandingsScreen() {
  const [standings, setStandings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const appState = useRef(AppState.currentState);

  async function loadStandings() {
    try {
      const data = await fetchStandings();
      setStandings(data.standings);
      setError(null);
    } catch (err) {
      setError(err);
    }
  }

  async function handleInitialLoad() {
    setIsLoading(true);
    await loadStandings();
    setIsLoading(false);
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadStandings();
    setIsRefreshing(false);
  }

  useEffect(() => {
    handleInitialLoad();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        loadStandings();
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <View style={styles.centred}>
        <Text style={styles.errorTitle}>Couldn't load standings</Text>
        <Text style={styles.errorSubtitle}>Check your connection</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleInitialLoad}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.screenHeader}>
        <Text style={styles.leagueLabel}>PREMIER LEAGUE</Text>
        <Text style={styles.screenTitle}>Standings</Text>
      </View>
      <StandingsTable
        standings={standings}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colours.background,
  },
  screenHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  leagueLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colours.textMuted,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colours.textPrimary,
  },
  centred: {
    flex: 1,
    backgroundColor: colours.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorTitle: {
    color: colours.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorSubtitle: {
    color: colours.textSecondary,
    fontSize: 14,
    marginBottom: 24,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colours.border,
  },
  retryText: {
    color: colours.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
});
```

**Step 2: Verify**

Open the app in Expo — tap the "Table" tab. It should show a loading spinner then the full 20-team standings table with a sticky header row. Pull-to-refresh should work.

**Step 3: Commit**

```bash
git add frontend/app/(tabs)/standings.jsx
git commit -m "feat(frontend): add standings screen"
```

---

## Task 10: Polish MatchweekHeader

**Files:**
- Modify: `frontend/components/MatchweekHeader.jsx`

**Step 1: Replace the component**

```jsx
import { StyleSheet, Text, View } from 'react-native';
import { colours } from '../constants/colours';

function parseMatchweekLabel(matchweek) {
  if (!matchweek) return '';
  const separatorIndex = matchweek.indexOf(' - ');
  if (separatorIndex === -1) return matchweek;
  const number = matchweek.slice(separatorIndex + 3);
  return `Matchweek ${number}`;
}

export default function MatchweekHeader({ matchweek }) {
  return (
    <View style={styles.container}>
      <Text style={styles.leagueLabel}>PREMIER LEAGUE</Text>
      <Text style={styles.label}>{parseMatchweekLabel(matchweek)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colours.background,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  leagueLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colours.textMuted,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  label: {
    color: colours.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
});
```

**Step 2: Commit**

```bash
git add frontend/components/MatchweekHeader.jsx
git commit -m "feat(frontend): polish matchweek header with league label"
```

---

## Task 11: Polish FixtureCard

**Files:**
- Modify: `frontend/components/FixtureCard.jsx`

**Step 1: Update three values in the styles**

In `StyleSheet.create`, change:
- `card.paddingVertical`: `12` → `14`
- `scoreText.fontSize`: `16` → `18`
- `crest.width` and `crest.height`: `24` → `28`
- `crestFallback.width`, `crestFallback.height`: `24` → `28`
- `crestFallback.borderRadius`: `12` → `14`

The updated style block for those four entries:

```js
card: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colours.surface,
  borderWidth: 1,
  borderColor: colours.border,
  borderRadius: 8,
  paddingVertical: 14,
  paddingHorizontal: 16,
  marginBottom: 8,
},
scoreText: {
  fontSize: 18,
  fontWeight: '700',
  color: colours.scoreText,
},
crest: {
  width: 28,
  height: 28,
},
crestFallback: {
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: colours.surface,
  alignItems: 'center',
  justifyContent: 'center',
},
```

**Step 2: Commit**

```bash
git add frontend/components/FixtureCard.jsx
git commit -m "feat(frontend): polish fixture card sizing and score prominence"
```

---

## Final Verification

1. Backend: `curl http://localhost:3000/standings/premier-league` returns 20 teams
2. Frontend: Matchweek tab shows header with "PREMIER LEAGUE" label + polished fixture cards
3. Frontend: Table tab shows sticky-header standings table with all 20 teams
4. Pull-to-refresh works on both tabs
5. App returns to correct tab data when brought back to foreground
