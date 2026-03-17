import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { AppState, StyleSheet } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useThemeConfig } from '@/components/ui/use-theme-config';
import { APIProvider } from '@/lib/api';
import { useAlarmEventListener } from '@/features/alarm/hooks/use-alarm-event-listener';
import { registerBackgroundTask } from '@/features/alarm/services/background-task';
import { getLaunchAlarmData } from 'modules/alarm-fullscreen';
import { rescheduleAllAlarms } from '@/features/alarm/services/scheduler';
import { useRingingStore } from '@/features/alarm/stores/use-ringing-store';
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

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

export default function RootLayout() {
  const router = useRouter();
  useAlarmEventListener();

  React.useEffect(() => {
    async function setup() {
      await registerBackgroundTask();

      // Cold-start: check if app was launched by alarm full-screen intent
      const launchData = getLaunchAlarmData();
      if (launchData?.alarmId) {
        useRingingStore.getState().setRinging({
          alarmId: launchData.alarmId,
          dayIndex: launchData.dayIndex ?? 0,
          sequenceIndex: launchData.sequenceIndex ?? 0,
          total: launchData.totalInSequence ?? 1,
          tier: (launchData.intensityTier ?? 'gentle') as any,
          snoozeDuration: launchData.snoozeDurationMinutes ?? 5,
          snoozeCount: launchData.snoozeCount ?? 0,
          maxSnoozeCount: launchData.maxSnoozeCount ?? 3,
        });
        router.push('/ringing');
      }
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
    <SafeAreaProvider>
      <GestureHandlerRootView
        style={styles.container}
        // eslint-disable-next-line better-tailwindcss/no-unknown-classes
        className={theme.dark ? `dark` : undefined}
      >
        <KeyboardProvider>
          <ThemeProvider value={theme}>
            <APIProvider>
              <BottomSheetModalProvider>
                {children}
                <FlashMessage position="top" />
              </BottomSheetModalProvider>
            </APIProvider>
          </ThemeProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
