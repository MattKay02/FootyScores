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
