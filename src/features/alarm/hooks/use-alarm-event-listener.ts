import type { IntensityTier } from '../types';

import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { DEFAULT_MAX_SNOOZE_COUNT } from '../constants';
import { addAlarmListener } from 'modules/alarm-fullscreen';
import { useRingingStore } from '../stores/use-ringing-store';

export function useAlarmEventListener() {
  const router = useRouter();
  const firedSub = useRef<{ remove: () => void } | null>(null);
  const stoppedSub = useRef<{ remove: () => void } | null>(null);
  const snoozedSub = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    firedSub.current = addAlarmListener('onAlarmFired', (payload) => {
      if (!payload.alarmId) return;
      useRingingStore.getState().setRinging({
        alarmId: payload.alarmId,
        dayIndex: payload.dayIndex ?? 0,
        sequenceIndex: payload.sequenceIndex ?? 0,
        total: payload.totalInSequence ?? 1,
        tier: (payload.intensityTier as IntensityTier) ?? 'gentle',
        snoozeDuration: payload.snoozeDurationMinutes ?? 5,
        snoozeCount: payload.snoozeCount ?? 0,
        maxSnoozeCount: payload.maxSnoozeCount ?? DEFAULT_MAX_SNOOZE_COUNT,
      });
      // Use navigate (not push) to avoid stacking multiple ringing screens
      // when snooze alarms fire repeatedly
      router.navigate('/ringing');
    });

    stoppedSub.current = addAlarmListener('onAlarmStopped', () => {
      // Only clear if we're not already navigating away (goBack handles its own clear)
      const { activeAlarmId } = useRingingStore.getState();
      if (activeAlarmId) {
        useRingingStore.getState().clear();
      }
    });

    snoozedSub.current = addAlarmListener('onAlarmSnoozed', () => {
      // Don't clear on snooze — the ringing screen's goBack() handles clearing.
      // Clearing here would race with the next snooze alarm's onAlarmFired.
    });

    return () => {
      firedSub.current?.remove();
      stoppedSub.current?.remove();
      snoozedSub.current?.remove();
    };
  }, [router]);
}
