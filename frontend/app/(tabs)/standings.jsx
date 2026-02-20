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
