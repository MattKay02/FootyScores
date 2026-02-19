import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colours } from '../constants/colours';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colours.background },
        }}
      />
    </>
  );
}
