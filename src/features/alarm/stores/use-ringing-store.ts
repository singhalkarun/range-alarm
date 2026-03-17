import type { IntensityTier } from '../types';
import { create } from 'zustand';
import { DEFAULT_MAX_SNOOZE_COUNT } from '../constants';

type RingingState = {
  activeAlarmId: string | null;
  dayIndex: number;
  currentSequenceIndex: number;
  totalInSequence: number;
  intensityTier: IntensityTier;
  snoozeDurationMinutes: number;
  snoozeCount: number;
  maxSnoozeCount: number;
  setRinging: (params: { alarmId: string; dayIndex: number; sequenceIndex: number; total: number; tier: IntensityTier; snoozeDuration: number; snoozeCount: number; maxSnoozeCount: number }) => void;
  clear: () => void;
};

export const useRingingStore = create<RingingState>(set => ({
  activeAlarmId: null,
  dayIndex: 0,
  currentSequenceIndex: 0,
  totalInSequence: 0,
  intensityTier: 'gentle',
  snoozeDurationMinutes: 5,
  snoozeCount: 0,
  maxSnoozeCount: DEFAULT_MAX_SNOOZE_COUNT,
  setRinging: ({ alarmId, dayIndex, sequenceIndex, total, tier, snoozeDuration, snoozeCount, maxSnoozeCount }) => { set({ activeAlarmId: alarmId, dayIndex, currentSequenceIndex: sequenceIndex, totalInSequence: total, intensityTier: tier, snoozeDurationMinutes: snoozeDuration, snoozeCount, maxSnoozeCount }); },
  clear: () => { set({ activeAlarmId: null, dayIndex: 0, currentSequenceIndex: 0, totalInSequence: 0, intensityTier: 'gentle', snoozeDurationMinutes: 5, snoozeCount: 0, maxSnoozeCount: DEFAULT_MAX_SNOOZE_COUNT }); },
}));
