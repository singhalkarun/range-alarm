import { act, renderHook } from '@testing-library/react-native';
import { useAlarmStore } from '../use-alarm-store';

beforeEach(() => {
  act(() => {
    useAlarmStore.getState().reset();
  });
});

describe('useAlarmStore', () => {
  it('starts with empty alarms', () => {
    const { result } = renderHook(() => useAlarmStore());
    expect(result.current.alarms).toEqual([]);
  });
  it('adds an alarm', () => {
    const { result } = renderHook(() => useAlarmStore());
    act(() => {
      result.current.addAlarm({ id: 'test-1', startHour: 7, startMinute: 0, durationMinutes: 30, intervalMinutes: 10, snoozeDurationMinutes: 5, days: [1, 2, 3, 4, 5], enabled: true });
    });
    expect(result.current.alarms).toHaveLength(1);
    expect(result.current.alarms[0].id).toBe('test-1');
  });
  it('updates an alarm', () => {
    const { result } = renderHook(() => useAlarmStore());
    act(() => {
      result.current.addAlarm({ id: 'test-1', startHour: 7, startMinute: 0, durationMinutes: 30, intervalMinutes: 10, snoozeDurationMinutes: 5, days: [1, 2, 3, 4, 5], enabled: true });
    });
    act(() => {
      result.current.updateAlarm('test-1', { startHour: 8 });
    });
    expect(result.current.alarms[0].startHour).toBe(8);
  });
  it('deletes an alarm', () => {
    const { result } = renderHook(() => useAlarmStore());
    act(() => {
      result.current.addAlarm({ id: 'test-1', startHour: 7, startMinute: 0, durationMinutes: 30, intervalMinutes: 10, snoozeDurationMinutes: 5, days: [1, 2, 3, 4, 5], enabled: true });
    });
    act(() => {
      result.current.deleteAlarm('test-1');
    });
    expect(result.current.alarms).toHaveLength(0);
  });
  it('toggles alarm enabled state', () => {
    const { result } = renderHook(() => useAlarmStore());
    act(() => {
      result.current.addAlarm({ id: 'test-1', startHour: 7, startMinute: 0, durationMinutes: 30, intervalMinutes: 10, snoozeDurationMinutes: 5, days: [1, 2, 3, 4, 5], enabled: true });
    });
    act(() => {
      result.current.toggleAlarm('test-1');
    });
    expect(result.current.alarms[0].enabled).toBe(false);
    act(() => {
      result.current.toggleAlarm('test-1');
    });
    expect(result.current.alarms[0].enabled).toBe(true);
  });
});
