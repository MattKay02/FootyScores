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
