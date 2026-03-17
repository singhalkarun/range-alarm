// src/app/(alarm)/_layout.tsx

import { Stack, SplashScreen } from 'expo-router';
import { useEffect } from 'react';

export default function AlarmLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0D1B2A' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="create"
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
