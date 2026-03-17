import { Platform } from 'react-native';

let AlarmFullscreen: Record<string, (...args: unknown[]) => unknown> | null = null;

if (Platform.OS === 'android') {
  try {
    const { requireNativeModule } = require('expo-modules-core');
    AlarmFullscreen = requireNativeModule('AlarmFullscreen');
  }
  catch {
    // Native module not available (e.g. Expo Go)
  }
}

// --- Permission functions (existing) ---

export function canUseFullScreenIntent(): boolean {
  return (AlarmFullscreen?.canUseFullScreenIntent() as boolean) ?? true;
}

export function isBatteryOptimizationEnabled(): boolean {
  return (AlarmFullscreen?.isBatteryOptimizationEnabled() as boolean) ?? false;
}

export function requestDisableBatteryOptimization(): void {
  AlarmFullscreen?.requestDisableBatteryOptimization();
}

export function openFullScreenIntentSettings(): void {
  AlarmFullscreen?.openFullScreenIntentSettings();
}

export function hasNotificationPermission(): boolean {
  return (AlarmFullscreen?.hasNotificationPermission() as boolean) ?? true;
}

export function requestNotificationPermission(): void {
  AlarmFullscreen?.requestNotificationPermission();
}

// --- Alarm engine functions (new) ---

export type ScheduleAlarmParams = {
  id: string;
  triggerTimestamp: number;
  intensityTier: string;
  label: string;
  alarmId: string;
  sequenceIndex: number;
  totalInSequence: number;
  dayIndex: number;
  snoozeDurationMinutes: number;
  maxSnoozeCount: number;
  snoozeCount?: number;
  isRecurring: boolean;
};

export function scheduleAlarm(params: ScheduleAlarmParams): boolean {
  return (AlarmFullscreen?.scheduleAlarm(params) as boolean) ?? false;
}

export function cancelAlarm(id: string): void {
  AlarmFullscreen?.cancelAlarm(id);
}

export function cancelAllAlarms(): void {
  AlarmFullscreen?.cancelAllAlarms();
}

export function stopRinging(): void {
  AlarmFullscreen?.stopRinging();
}

export function snoozeRinging(snoozeDurationMinutes: number): boolean {
  return (AlarmFullscreen?.snoozeRinging(snoozeDurationMinutes) as boolean) ?? false;
}

export function isRinging(): boolean {
  return (AlarmFullscreen?.isRinging() as boolean) ?? false;
}

export function getLaunchAlarmData(): AlarmEventPayload | null {
  return (AlarmFullscreen?.getLaunchAlarmData() as AlarmEventPayload | null) ?? null;
}

// --- Event listener (new) ---

export type AlarmEventPayload = {
  alarmId: string;
  dayIndex?: number;
  sequenceIndex?: number;
  totalInSequence?: number;
  intensityTier?: string;
  snoozeDurationMinutes?: number;
  snoozeCount?: number;
  maxSnoozeCount?: number;
};

type EventSubscription = { remove: () => void };

export function addAlarmListener(
  eventName: 'onAlarmFired' | 'onAlarmStopped' | 'onAlarmSnoozed',
  listener: (payload: AlarmEventPayload) => void,
): EventSubscription {
  if (!AlarmFullscreen) return { remove: () => {} };
  try {
    const { EventEmitter } = require('expo-modules-core');
    const emitter = new EventEmitter(AlarmFullscreen);
    return emitter.addListener(eventName, listener);
  } catch {
    return { remove: () => {} };
  }
}
