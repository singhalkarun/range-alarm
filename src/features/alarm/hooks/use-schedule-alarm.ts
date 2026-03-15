import type { Alarm } from '../types';
import { useCallback } from 'react';
import { cancelAlarmNotifications, scheduleAlarmSequence } from '../services/scheduler';
import { useAlarmStore } from '../stores/use-alarm-store';

export function useScheduleAlarm() {
  const addAlarm = useAlarmStore(s => s.addAlarm);
  const updateAlarm = useAlarmStore(s => s.updateAlarm);
  const deleteAlarm = useAlarmStore(s => s.deleteAlarm);
  const toggleAlarm = useAlarmStore(s => s.toggleAlarm);

  const saveAlarm = useCallback(async (alarm: Alarm) => {
    const existing = useAlarmStore.getState().alarms.find(a => a.id === alarm.id);
    if (existing) {
      updateAlarm(alarm.id, alarm);
    }
    else {
      addAlarm(alarm);
    }
    await scheduleAlarmSequence(alarm);
  }, [addAlarm, updateAlarm]);

  const removeAlarm = useCallback(async (alarm: Alarm) => {
    await cancelAlarmNotifications(alarm);
    deleteAlarm(alarm.id);
  }, [deleteAlarm]);

  const toggleAndSchedule = useCallback(async (alarm: Alarm) => {
    const toggled = { ...alarm, enabled: !alarm.enabled };
    toggleAlarm(alarm.id);
    if (toggled.enabled) {
      await scheduleAlarmSequence(toggled);
    }
    else {
      await cancelAlarmNotifications(toggled);
    }
  }, [toggleAlarm]);

  return { saveAlarm, removeAlarm, toggleAndSchedule };
}
