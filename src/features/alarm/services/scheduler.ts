// src/features/alarm/services/scheduler.ts

import type { Alarm } from '../types';

import { DEFAULT_MAX_SNOOZE_COUNT } from '../constants';
import {
  cancelAlarm,
  cancelAllAlarms,
  scheduleAlarm,
  stopRinging,
} from 'modules/alarm-fullscreen';
import { generateSequence } from './sequence-generator';

/**
 * Build a deterministic alarm entry ID.
 */
function buildAlarmEntryId(
  alarmId: string,
  dayIndex: number,
  sequenceIndex: number,
): string {
  return `${alarmId}_${dayIndex}_${sequenceIndex}`;
}

/**
 * Get the day indices used for scheduling. For recurring alarms, these are
 * the selected days. For one-time alarms, we use a sentinel value (7).
 */
function getScheduleDays(alarm: Alarm): number[] {
  return alarm.days.length > 0 ? alarm.days : [7];
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
 * Cancel all scheduled alarms for a given alarm.
 */
export async function cancelAlarmNotifications(alarm: Alarm): Promise<void> {
  const sequence = generateSequence(alarm);
  const days = getScheduleDays(alarm);

  for (const day of days) {
    for (const item of sequence) {
      cancelAlarm(buildAlarmEntryId(alarm.id, day, item.sequenceIndex));
    }
  }
  // Also cancel any snooze
  cancelAlarm(`${alarm.id}_snooze`);
}

/**
 * Schedule all alarms for an alarm's sequence.
 */
export async function scheduleAlarmSequence(alarm: Alarm): Promise<void> {
  await cancelAlarmNotifications(alarm);

  if (!alarm.enabled) return;

  const sequence = generateSequence(alarm);
  const days = getScheduleDays(alarm);
  const isRecurring = alarm.days.length > 0;

  for (const day of days) {
    for (const item of sequence) {
      const triggerDate = getNextOccurrence(day, item.hour24, item.minute);

      scheduleAlarm({
        id: buildAlarmEntryId(alarm.id, day, item.sequenceIndex),
        triggerTimestamp: triggerDate.getTime(),
        intensityTier: item.intensityTier,
        label: alarm.label || '',
        alarmId: alarm.id,
        sequenceIndex: item.sequenceIndex,
        totalInSequence: sequence.length,
        dayIndex: day,
        snoozeDurationMinutes: alarm.snoozeDurationMinutes,
        maxSnoozeCount: alarm.maxSnoozeCount ?? DEFAULT_MAX_SNOOZE_COUNT,
        snoozeCount: 0,
        soundUri: alarm.soundUri,
        isRecurring,
      });
    }
  }
}

/**
 * Dismiss all remaining notifications in the current day's sequence.
 */
export async function dismissAllRemaining(
  alarm: Alarm,
  currentSequenceIndex: number,
  dayIndex: number,
): Promise<void> {
  stopRinging();

  const sequence = generateSequence(alarm);
  for (const item of sequence) {
    if (item.sequenceIndex > currentSequenceIndex) {
      cancelAlarm(buildAlarmEntryId(alarm.id, dayIndex, item.sequenceIndex));
    }
  }
  cancelAlarm(`${alarm.id}_snooze`);
}

/**
 * Re-schedule all enabled alarms.
 */
export async function rescheduleAllAlarms(alarms: Alarm[]): Promise<void> {
  cancelAllAlarms();
  for (const alarm of alarms) {
    if (alarm.enabled) {
      await scheduleAlarmSequence(alarm);
    }
  }
}
