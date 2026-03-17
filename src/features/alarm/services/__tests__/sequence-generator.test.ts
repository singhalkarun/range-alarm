// src/features/alarm/services/__tests__/sequence-generator.test.ts
import type { Alarm } from '../../types';
import { countScheduledNotifications, generateSequence } from '../sequence-generator';

function makeAlarm(overrides: Partial<Alarm> = {}): Alarm {
  return {
    id: 'test-1',
    startHour: 7,
    startMinute: 0,
    durationMinutes: 30,
    intervalMinutes: 10,
    snoozeDurationMinutes: 5,
    maxSnoozeCount: 3,
    days: [1, 2, 3, 4, 5],
    enabled: true,
    ...overrides,
  };
}

describe('generateSequence', () => {
  it('generates correct number of alarms', () => {
    expect(generateSequence(makeAlarm())).toHaveLength(4);
  });
  it('generates correct times', () => {
    const seq = generateSequence(makeAlarm());
    expect(seq[0].hour24).toBe(7);
    expect(seq[0].minute).toBe(0);
    expect(seq[1].hour24).toBe(7);
    expect(seq[1].minute).toBe(10);
    expect(seq[2].hour24).toBe(7);
    expect(seq[2].minute).toBe(20);
    expect(seq[3].hour24).toBe(7);
    expect(seq[3].minute).toBe(30);
  });
  it('sets sequence indices', () => {
    expect(generateSequence(makeAlarm()).map(s => s.sequenceIndex)).toEqual([0, 1, 2, 3]);
  });
  it('handles midnight boundary wrap', () => {
    const seq = generateSequence(makeAlarm({ startHour: 23, startMinute: 50, durationMinutes: 30, intervalMinutes: 10 }));
    expect(seq).toHaveLength(4);
    expect(seq[0].hour24).toBe(23);
    expect(seq[0].crossesMidnight).toBe(false);
    expect(seq[1].hour24).toBe(0);
    expect(seq[1].crossesMidnight).toBe(true);
  });
  it('caps sequence at 64 entries', () => {
    expect(generateSequence(makeAlarm({ durationMinutes: 120, intervalMinutes: 1 }))).toHaveLength(64);
  });
  it('assigns intensity tiers progressively', () => {
    const seq = generateSequence(makeAlarm());
    expect(seq[0].intensityTier).toBe('gentle');
    expect(seq[1].intensityTier).toBe('moderate');
    expect(seq[2].intensityTier).toBe('strong');
    expect(seq[3].intensityTier).toBe('aggressive');
  });
  it('formats display strings correctly', () => {
    const seq = generateSequence(makeAlarm());
    expect(seq[0].display).toBe('7:00');
    expect(seq[0].ampm).toBe('AM');
  });
  it('handles minimum duration/interval ratio', () => {
    expect(generateSequence(makeAlarm({ durationMinutes: 5, intervalMinutes: 5 }))).toHaveLength(2);
  });
});

describe('countScheduledNotifications', () => {
  it('counts notifications for multiple enabled alarms', () => {
    expect(countScheduledNotifications([
      makeAlarm({ id: '1', days: [1, 2, 3] }),
      makeAlarm({ id: '2', days: [4, 5] }),
    ])).toBe(20);
  });
  it('excludes disabled alarms', () => {
    expect(countScheduledNotifications([
      makeAlarm({ id: '1', days: [1], enabled: true }),
      makeAlarm({ id: '2', days: [2], enabled: false }),
    ])).toBe(4);
  });
  it('counts one-time alarms as 1 day', () => {
    expect(countScheduledNotifications([makeAlarm({ id: '1', days: [] })])).toBe(4);
  });
});
