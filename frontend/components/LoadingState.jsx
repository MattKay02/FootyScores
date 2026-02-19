import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colours } from '../constants/colours';

export default function LoadingState() {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colours.textSecondary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colours.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
