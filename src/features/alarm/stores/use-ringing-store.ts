import type { IntensityTier } from '../types';
import { create } from 'zustand';

type RingingState = {
  activeAlarmId: string | null;
  currentSequenceIndex: number;
  totalInSequence: number;
  intensityTier: IntensityTier;
  snoozeDurationMinutes: number;
  setRinging: (params: { alarmId: string; sequenceIndex: number; total: number; tier: IntensityTier; snoozeDuration: number; }) => void;
  advanceToNext: (tier: IntensityTier) => void;
  clear: () => void;
};

export const useRingingStore = create<RingingState>((set, get) => ({
  activeAlarmId: null, currentSequenceIndex: 0, totalInSequence: 0, intensityTier: 'gentle', snoozeDurationMinutes: 5,
  setRinging: ({ alarmId, sequenceIndex, total, tier, snoozeDuration }) => { set({ activeAlarmId: alarmId, currentSequenceIndex: sequenceIndex, totalInSequence: total, intensityTier: tier, snoozeDurationMinutes: snoozeDuration }); },
  advanceToNext: (tier) => { set({ currentSequenceIndex: get().currentSequenceIndex + 1, intensityTier: tier }); },
  clear: () => { set({ activeAlarmId: null, currentSequenceIndex: 0, totalInSequence: 0, intensityTier: 'gentle', snoozeDurationMinutes: 5 }); },
}));
