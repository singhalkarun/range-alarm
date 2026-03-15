// src/features/alarm/services/scheduler.ts

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Alarm, IntensityTier } from '../types';
import { CHANNEL_CONFIG } from '../constants';
import { getChannelId, getSoundFile, getVibrationPattern } from './intensity';
import { generateSequence } from './sequence-generator';

/**
 * Build a deterministic notification ID for an alarm sequence item.
 */
function buildNotificationId(
  alarmId: string,
  dayIndex: number,
  sequenceIndex: number,
): string {
  return `${alarmId}_${dayIndex}_${sequenceIndex}`;
}

/**
 * Create Android notification channels for all intensity tiers.
 * Safe to call multiple times — channels are updated if they already exist.
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  for (const [tier, config] of Object.entries(CHANNEL_CONFIG)) {
    await Notifications.setNotificationChannelAsync(config.id, {
      name: config.name,
      importance: config.importance as Notifications.AndroidImportance,
      sound: getSoundFile(tier as IntensityTier),
      vibrationPattern: getVibrationPattern(tier as IntensityTier),
      lockscreenVisibility:
        Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}

/**
 * Get the day indices used for scheduling. For recurring alarms, these are
 * the selected days. For one-time alarms, we use a sentinel value (7) so
 * the notification ID is stable regardless of when cancel is called.
 */
function getScheduleDays(alarm: Alarm): number[] {
  return alarm.days.length > 0 ? alarm.days : [7]; // 7 = one-time sentinel
}

/**
 * Cancel all scheduled notifications for a given alarm.
 */
export async function cancelAlarmNotifications(alarm: Alarm): Promise<void> {
  const sequence = generateSequence(alarm);
  const days = getScheduleDays(alarm);

  const cancelPromises: Promise<void>[] = [];
  for (const day of days) {
    for (const item of sequence) {
      cancelPromises.push(
        Notifications.cancelScheduledNotificationAsync(
          buildNotificationId(alarm.id, day, item.sequenceIndex),
        ),
      );
    }
  }
  await Promise.all(cancelPromises);
}

/**
 * Get the next occurrence of a specific day-of-week and time from now.
 */
function getNextOccurrence(
  dayOfWeek: number,
  hour: number,
  minute: number,
): Date {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);

  const currentDay = now.getDay();
  let daysUntil = dayOfWeek - currentDay;
  if (daysUntil < 0) daysUntil += 7;
  if (daysUntil === 0 && target <= now) daysUntil = 7;

  target.setDate(target.getDate() + daysUntil);
  return target;
}

/**
 * Schedule all notifications for an alarm's sequence across 7 days.
 */
export async function scheduleAlarmSequence(alarm: Alarm): Promise<void> {
  // Cancel existing first
  await cancelAlarmNotifications(alarm);

  if (!alarm.enabled) return;

  const sequence = generateSequence(alarm);
  const days = getScheduleDays(alarm);

  for (const day of days) {
    for (const item of sequence) {
      const triggerDate = getNextOccurrence(day, item.hour24, item.minute);
      const notificationId = buildNotificationId(
        alarm.id,
        day,
        item.sequenceIndex,
      );

      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: {
          title: alarm.label || 'Adaptive Wake',
          body: `Alarm ${item.sequenceIndex + 1} of ${sequence.length}`,
          sound: getSoundFile(item.intensityTier),
          data: {
            alarmId: alarm.id,
            sequenceIndex: item.sequenceIndex,
            totalInSequence: sequence.length,
            intensityTier: item.intensityTier,
            snoozeDurationMinutes: alarm.snoozeDurationMinutes,
          },
          ...(Platform.OS === 'android' && {
            channelId: getChannelId(item.intensityTier),
          }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
    }
  }
}

/**
 * Schedule a snooze notification for the given alarm.
 */
export async function scheduleSnooze(
  alarmId: string,
  snoozeDurationMinutes: number,
  intensityTier: IntensityTier,
  sequenceIndex: number,
  totalInSequence: number,
): Promise<void> {
  const snoozeId = `${alarmId}_snooze`;

  // Cancel any existing snooze for this alarm
  await Notifications.cancelScheduledNotificationAsync(snoozeId).catch(
    () => {},
  );

  const triggerDate = new Date(
    Date.now() + snoozeDurationMinutes * 60 * 1000,
  );

  await Notifications.scheduleNotificationAsync({
    identifier: snoozeId,
    content: {
      title: 'Snooze — Adaptive Wake',
      body: `Alarm ${sequenceIndex + 1} of ${totalInSequence} (snoozed)`,
      sound: getSoundFile(intensityTier),
      data: {
        alarmId,
        sequenceIndex,
        totalInSequence,
        intensityTier,
        snoozeDurationMinutes,
        isSnooze: true,
      },
      ...(Platform.OS === 'android' && {
        channelId: getChannelId(intensityTier),
      }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}

/**
 * Cancel all remaining notifications in today's sequence for an alarm
 * after the given sequence index (for "Dismiss All").
 */
export async function dismissAllRemaining(
  alarm: Alarm,
  currentSequenceIndex: number,
): Promise<void> {
  const sequence = generateSequence(alarm);
  const days = getScheduleDays(alarm);
  const today = days.includes(new Date().getDay())
    ? new Date().getDay()
    : days[0];

  const cancelPromises: Promise<void>[] = [];
  for (const item of sequence) {
    if (item.sequenceIndex > currentSequenceIndex) {
      cancelPromises.push(
        Notifications.cancelScheduledNotificationAsync(
          buildNotificationId(alarm.id, today, item.sequenceIndex),
        ),
      );
    }
  }

  // Also cancel any active snooze
  cancelPromises.push(
    Notifications.cancelScheduledNotificationAsync(
      `${alarm.id}_snooze`,
    ).catch(() => {}),
  );

  await Promise.all(cancelPromises);
}

/**
 * Re-schedule all enabled alarms. Called on app foreground and by background task.
 */
export async function rescheduleAllAlarms(alarms: Alarm[]): Promise<void> {
  for (const alarm of alarms) {
    if (alarm.enabled) {
      await scheduleAlarmSequence(alarm);
    }
  }
}
