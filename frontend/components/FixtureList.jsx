import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { colours } from '../constants/colours';
import FixtureCard from './FixtureCard';

function EmptyFixtures() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No fixtures this week</Text>
    </View>
  );
}

export default function FixtureList({ fixtures, isRefreshing, onRefresh }) {
  return (
    <FlatList
      data={fixtures}
      keyExtractor={item => item.fixtureId.toString()}
      renderItem={({ item }) => <FixtureCard fixture={item} />}
      contentContainerStyle={styles.listContent}
      style={styles.list}
      ListEmptyComponent={EmptyFixtures}
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
    backgroundColor: colours.background,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
  },
  emptyText: {
    color: colours.textSecondary,
    fontSize: 16,
  },
});
