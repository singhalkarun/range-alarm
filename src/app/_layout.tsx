import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { ThemeProvider } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { AppState, StyleSheet } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useThemeConfig } from '@/components/ui/use-theme-config';
import { useNotificationListener } from '@/features/alarm/hooks/use-notification-listener';
import { registerBackgroundTask } from '@/features/alarm/services/background-task';
import { rescheduleAllAlarms, setupNotificationChannels } from '@/features/alarm/services/scheduler';
import { useAlarmStore } from '@/features/alarm/stores/use-alarm-store';
import { hydrateAuth } from '@/features/auth/use-auth-store';

import { loadSelectedTheme } from '@/lib/hooks/use-selected-theme';
// Import  global CSS file
import '../global.css';

export { ErrorBoundary } from 'expo-router';

// eslint-disable-next-line react-refresh/only-export-components
export const unstable_settings = {
  initialRouteName: '(alarm)',
};

hydrateAuth();
loadSelectedTheme();
useAlarmStore.getState().hydrate();

// Configure foreground notification behavior — show alert and play sound
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

export default function RootLayout() {
  useNotificationListener();

  React.useEffect(() => {
    async function setup() {
      await Notifications.requestPermissionsAsync();
      await setupNotificationChannels();
      await registerBackgroundTask();
    }
    setup();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const alarms = useAlarmStore.getState().alarms;
        rescheduleAllAlarms(alarms);
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <Providers>
      <Stack>
        <Stack.Screen name="(alarm)" options={{ headerShown: false }} />
        <Stack.Screen
          name="ringing"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'fade',
          }}
        />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack>
    </Providers>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  const theme = useThemeConfig();
  return (
    <GestureHandlerRootView
      style={styles.container}
      // eslint-disable-next-line better-tailwindcss/no-unknown-classes
      className={theme.dark ? `dark` : undefined}
    >
      <KeyboardProvider>
        <ThemeProvider value={theme}>
          <BottomSheetModalProvider>
            {children}
            <FlashMessage position="top" />
          </BottomSheetModalProvider>
        </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
