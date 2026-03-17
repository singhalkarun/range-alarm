import {
  canUseFullScreenIntent,
  isBatteryOptimizationEnabled,
  openFullScreenIntentSettings,
  requestDisableBatteryOptimization,
} from 'modules/alarm-fullscreen';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { getItem, setItem } from '@/lib/storage';

const BATTERY_OPT_DISMISSED_KEY = 'battery-opt-banner-dismissed';

export function useAlarmPermissions() {
  const [fsiDenied, setFsiDenied] = useState(false);
  const [batteryOptEnabled, setBatteryOptEnabled] = useState(false);
  const [batteryOptDismissed, setBatteryOptDismissed] = useState(
    () => getItem<boolean>(BATTERY_OPT_DISMISSED_KEY) ?? false,
  );

  const checkPermissions = useCallback(async () => {
    if (Platform.OS === 'android') {
      setFsiDenied(!canUseFullScreenIntent());
      setBatteryOptEnabled(isBatteryOptimizationEnabled());
    }
  }, []);

  useEffect(() => {
    checkPermissions();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active')
        checkPermissions();
    });
    return () => sub.remove();
  }, [checkPermissions]);

  // Opens system dialog; banner re-appears on next resume if still optimized
  const openBatteryOptSettings = useCallback(() => {
    requestDisableBatteryOptimization();
  }, []);

  // Permanently hides the banner (user chose "Not now")
  const dismissBatteryOptBanner = useCallback(() => {
    setBatteryOptDismissed(true);
    void setItem(BATTERY_OPT_DISMISSED_KEY, true);
  }, []);

  return {
    fsiDenied,
    batteryOptEnabled,
    batteryOptDismissed,
    openFsiSettings: openFullScreenIntentSettings,
    openBatteryOptSettings,
    dismissBatteryOptBanner,
  };
}
