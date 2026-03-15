import type { IntensityTier } from '../types';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useRingingStore } from '../stores/use-ringing-store';

export function useNotificationListener() {
  const router = useRouter();
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const foregroundListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    function handleAlarmData(data: Record<string, unknown>) {
      if (!data?.alarmId)
        return;
      useRingingStore.getState().setRinging({
        alarmId: data.alarmId as string,
        sequenceIndex: data.sequenceIndex as number,
        total: data.totalInSequence as number,
        tier: data.intensityTier as IntensityTier,
        snoozeDuration: data.snoozeDurationMinutes as number,
      });
      router.push('/ringing');
    }

    foregroundListener.current = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as Record<string, unknown>;
      handleAlarmData(data);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      handleAlarmData(data);
    });

    return () => {
      foregroundListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [router]);
}
