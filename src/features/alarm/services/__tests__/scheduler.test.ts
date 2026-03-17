import type { Alarm } from '../../types';

import { cancelAlarmNotifications, dismissAllRemaining, scheduleAlarmSequence } from '../scheduler';

const mockScheduleAlarm = jest.fn().mockReturnValue(true);
const mockCancelAlarm = jest.fn();
const mockCancelAllAlarms = jest.fn();
const mockStopRinging = jest.fn();

jest.mock('modules/alarm-fullscreen', () => ({
  scheduleAlarm: (...args: unknown[]) => mockScheduleAlarm(...args),
  cancelAlarm: (...args: unknown[]) => mockCancelAlarm(...args),
  cancelAllAlarms: (...args: unknown[]) => mockCancelAllAlarms(...args),
  stopRinging: (...args: unknown[]) => mockStopRinging(...args),
  snoozeRinging: jest.fn().mockReturnValue(true),
}));

function makeAlarm(overrides: Partial<Alarm> = {}): Alarm {
  return {
    id: 'test-alarm',
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

beforeEach(() => {
  jest.clearAllMocks();
});

describe('scheduleAlarmSequence', () => {
  it('cancels existing before scheduling new', async () => {
    await scheduleAlarmSequence(makeAlarm());
    expect(mockCancelAlarm).toHaveBeenCalled();
    // 4 sequence items x 5 days = 20 schedules
    expect(mockScheduleAlarm).toHaveBeenCalledTimes(20);
  });

  it('does not schedule if disabled', async () => {
    await scheduleAlarmSequence(makeAlarm({ enabled: false }));
    expect(mockScheduleAlarm).not.toHaveBeenCalled();
  });

  it('uses deterministic IDs', async () => {
    await scheduleAlarmSequence(makeAlarm({ days: [1] }));
    const ids = mockScheduleAlarm.mock.calls.map(
      (c: unknown[]) => (c[0] as { id: string }).id,
    );
    expect(ids).toContain('test-alarm_1_0');
    expect(ids).toContain('test-alarm_1_3');
  });

  it('uses sentinel day 7 for one-time', async () => {
    await scheduleAlarmSequence(makeAlarm({ days: [] }));
    const ids = mockScheduleAlarm.mock.calls.map(
      (c: unknown[]) => (c[0] as { id: string }).id,
    );
    expect(ids[0]).toBe('test-alarm_7_0');
  });

  it('passes correct params to native module', async () => {
    await scheduleAlarmSequence(makeAlarm({ days: [1], label: 'Wake up' }));
    const firstCall = mockScheduleAlarm.mock.calls[0][0] as Record<string, unknown>;
    expect(firstCall.alarmId).toBe('test-alarm');
    expect(firstCall.label).toBe('Wake up');
    expect(firstCall.intensityTier).toBe('gentle');
    expect(firstCall.dayIndex).toBe(1);
    expect(firstCall.sequenceIndex).toBe(0);
    expect(firstCall.totalInSequence).toBe(4);
    expect(firstCall.isRecurring).toBe(true);
    expect(firstCall.snoozeDurationMinutes).toBe(5);
    expect(firstCall.maxSnoozeCount).toBe(3);
    expect(firstCall.snoozeCount).toBe(0);
    expect(typeof firstCall.triggerTimestamp).toBe('number');
  });
});

describe('cancelAlarmNotifications', () => {
  it('cancels all IDs including snooze', async () => {
    await cancelAlarmNotifications(makeAlarm({ days: [1] }));
    const ids = mockCancelAlarm.mock.calls.map((c: unknown[]) => c[0]);
    expect(ids).toContain('test-alarm_1_0');
    expect(ids).toContain('test-alarm_1_3');
    expect(ids).toContain('test-alarm_snooze');
  });
});

describe('dismissAllRemaining', () => {
  it('stops ringing and cancels after current index for the given day only', async () => {
    await dismissAllRemaining(makeAlarm({ days: [1, 3, 5] }), 1, 3);
    expect(mockStopRinging).toHaveBeenCalledTimes(1);
    const ids = mockCancelAlarm.mock.calls.map((c: unknown[]) => c[0]);
    expect(ids).toContain('test-alarm_3_2');
    expect(ids).toContain('test-alarm_3_3');
    expect(ids).toContain('test-alarm_snooze');
    // Should not cancel other days
    expect(ids).not.toContain('test-alarm_1_2');
    expect(ids).not.toContain('test-alarm_5_2');
  });
});
