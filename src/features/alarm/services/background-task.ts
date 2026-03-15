import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

import { useAlarmStore } from '../stores/use-alarm-store';
import { rescheduleAllAlarms } from './scheduler';

const BACKGROUND_TASK_NAME = 'ALARM_RESCHEDULE_TASK';

TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  try {
    const alarms = useAlarmStore.getState().alarms;
    await rescheduleAllAlarms(alarms);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundTask(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_TASK_NAME,
  );
  if (isRegistered) return;

  await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
    minimumInterval: 60 * 60, // 1 hour minimum
    stopOnTerminate: false,
    startOnBoot: true,
  });
}
