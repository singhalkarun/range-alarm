import type { Alarm } from '../types';
import { create } from 'zustand';
import { getItem, setItem } from '@/lib/storage';

const STORAGE_KEY = 'alarm-store';
type AlarmState = {
  alarms: Alarm[];
  addAlarm: (alarm: Alarm) => void;
  updateAlarm: (id: string, partial: Partial<Alarm>) => void;
  deleteAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;
  reset: () => void;
  hydrate: () => void;
};

// MMKV's set() is synchronous under the hood, so fire-and-forget is safe here.
function persist(alarms: Alarm[]) {
  void setItem(STORAGE_KEY, alarms);
}

export const useAlarmStore = create<AlarmState>((set, get) => ({
  alarms: [],
  addAlarm: (alarm) => {
    const alarms = [...get().alarms, alarm];
    persist(alarms);
    set({ alarms });
  },
  updateAlarm: (id, partial) => {
    const alarms = get().alarms.map(a => a.id === id ? { ...a, ...partial } : a);
    persist(alarms);
    set({ alarms });
  },
  deleteAlarm: (id) => {
    const alarms = get().alarms.filter(a => a.id !== id);
    persist(alarms);
    set({ alarms });
  },
  toggleAlarm: (id) => {
    const alarms = get().alarms.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a);
    persist(alarms);
    set({ alarms });
  },
  reset: () => {
    persist([]);
    set({ alarms: [] });
  },
  hydrate: () => {
    const stored = getItem<Alarm[]>(STORAGE_KEY);
    if (stored) {
      set({ alarms: stored });
    }
  },
}));
