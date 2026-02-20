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
