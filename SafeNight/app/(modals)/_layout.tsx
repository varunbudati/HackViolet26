import { Stack } from 'expo-router';
import { Colors } from '../../src/components/ui/theme';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
        contentStyle: {
          backgroundColor: Colors.background,
        },
      }}
    >
      <Stack.Screen name="drink" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="direct-chat" />
    </Stack>
  );
}
