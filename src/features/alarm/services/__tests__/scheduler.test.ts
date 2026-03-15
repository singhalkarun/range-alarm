import type { Alarm } from '../../types';

import { cancelAlarmNotifications, dismissAllRemaining, scheduleAlarmSequence, scheduleSnooze } from '../scheduler';

const mockSchedule = jest.fn().mockResolvedValue('');
const mockCancel = jest.fn().mockResolvedValue(undefined);
const mockSetChannel = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: (...args: unknown[]) => mockSchedule(...args),
  cancelScheduledNotificationAsync: (...args: unknown[]) => mockCancel(...args),
  setNotificationChannelAsync: (...args: unknown[]) => mockSetChannel(...args),
  AndroidImportance: { DEFAULT: 3, HIGH: 4, MAX: 5 },
  AndroidNotificationVisibility: { PUBLIC: 1 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

function makeAlarm(overrides: Partial<Alarm> = {}): Alarm {
  return {
    id: 'test-alarm',
    startHour: 7,
    startMinute: 0,
    durationMinutes: 30,
    intervalMinutes: 10,
    snoozeDurationMinutes: 5,
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
    expect(mockCancel).toHaveBeenCalled();
    expect(mockSchedule).toHaveBeenCalledTimes(20);
  });
  it('does not schedule if disabled', async () => {
    await scheduleAlarmSequence(makeAlarm({ enabled: false }));
    expect(mockSchedule).not.toHaveBeenCalled();
  });
  it('uses deterministic IDs', async () => {
    await scheduleAlarmSequence(makeAlarm({ days: [1] }));
    const ids = mockSchedule.mock.calls.map((c: unknown[]) => (c[0] as { identifier: string }).identifier);
    expect(ids).toContain('test-alarm_1_0');
    expect(ids).toContain('test-alarm_1_3');
  });
  it('uses sentinel day 7 for one-time', async () => {
    await scheduleAlarmSequence(makeAlarm({ days: [] }));
    const ids = mockSchedule.mock.calls.map((c: unknown[]) => (c[0] as { identifier: string }).identifier);
    expect(ids[0]).toBe('test-alarm_7_0');
  });
});

describe('cancelAlarmNotifications', () => {
  it('cancels all IDs', async () => {
    await cancelAlarmNotifications(makeAlarm({ days: [1] }));
    expect(mockCancel).toHaveBeenCalledTimes(4);
    expect(mockCancel).toHaveBeenCalledWith('test-alarm_1_0');
    expect(mockCancel).toHaveBeenCalledWith('test-alarm_1_3');
  });
});

describe('scheduleSnooze', () => {
  it('schedules with fixed ID', async () => {
    await scheduleSnooze({ alarmId: 'test-alarm', snoozeDurationMinutes: 5, intensityTier: 'moderate', sequenceIndex: 1, totalInSequence: 4 });
    expect(mockCancel).toHaveBeenCalledWith('test-alarm_snooze');
    expect(mockSchedule).toHaveBeenCalledTimes(1);
    expect((mockSchedule.mock.calls[0][0] as { identifier: string }).identifier).toBe('test-alarm_snooze');
  });
});

describe('dismissAllRemaining', () => {
  it('cancels after current index', async () => {
    await dismissAllRemaining(makeAlarm({ days: [1] }), 1);
    const ids = mockCancel.mock.calls.map((c: unknown[]) => c[0]);
    expect(ids).toContain('test-alarm_1_2');
    expect(ids).toContain('test-alarm_1_3');
    expect(ids).toContain('test-alarm_snooze');
    expect(ids).not.toContain('test-alarm_1_0');
    expect(ids).not.toContain('test-alarm_1_1');
  });
});
