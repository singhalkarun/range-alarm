// src/features/alarm/services/sequence-generator.ts
import type { Alarm, AlarmSequenceItem, IntensityTier } from '../types';
import { MAX_SEQUENCE_LENGTH } from '../constants';
import { minutesOfDay, to12Hour } from '../utils/time';

export function getIntensityTier(sequenceIndex: number, totalCount: number): IntensityTier {
  if (totalCount <= 1)
    return 'gentle';
  const ratio = sequenceIndex / (totalCount - 1);
  if (ratio < 0.25)
    return 'gentle';
  if (ratio < 0.5)
    return 'moderate';
  if (ratio < 0.75)
    return 'strong';
  return 'aggressive';
}

export function generateSequence(alarm: Alarm): AlarmSequenceItem[] {
  const startTotalMin = minutesOfDay(alarm.startHour, alarm.startMinute);
  const count = Math.min(
    Math.floor(alarm.durationMinutes / alarm.intervalMinutes) + 1,
    MAX_SEQUENCE_LENGTH,
  );
  const items: AlarmSequenceItem[] = [];
  for (let i = 0; i < count; i++) {
    let totalMin = startTotalMin + i * alarm.intervalMinutes;
    const crossesMidnight = totalMin >= 1440;
    if (totalMin >= 1440)
      totalMin -= 1440;
    const hour24 = Math.floor(totalMin / 60);
    const minute = totalMin % 60;
    const { hour, ampm } = to12Hour(hour24);
    items.push({
      hour24,
      minute,
      display: `${hour}:${String(minute).padStart(2, '0')}`,
      ampm,
      intensityTier: getIntensityTier(i, count),
      sequenceIndex: i,
      crossesMidnight,
    });
  }
  return items;
}

export function countScheduledNotifications(alarms: Alarm[]): number {
  return alarms
    .filter(a => a.enabled)
    .reduce((total, alarm) => {
      const seqLen = generateSequence(alarm).length;
      const daysCount = alarm.days.length || 1;
      return total + seqLen * daysCount;
    }, 0);
}
