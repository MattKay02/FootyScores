import { StyleSheet, Text, View } from 'react-native';
import { colours } from '../constants/colours';

function parseMatchweekLabel(matchweek) {
  const separatorIndex = matchweek.indexOf(' - ');
  if (separatorIndex === -1) {
    return matchweek;
  }
  const number = matchweek.slice(separatorIndex + 3);
  return `Matchweek ${number}`;
}

export default function MatchweekHeader({ matchweek }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{parseMatchweekLabel(matchweek)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colours.background,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  label: {
    color: colours.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
});
