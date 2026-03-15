# Adaptive Wake Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a range alarm app where users set a start time, duration, and interval to generate a sequence of progressively intensifying alarms.

**Architecture:** Fully local Expo/React Native app. Alarms stored in MMKV via Zustand, scheduled as independent local notifications via `expo-notifications`. Progressive intensity through 4 sound/vibration tiers. Full-screen ringing UI triggered by notification response listener.

**Tech Stack:** Expo SDK 54, React Native 0.81.5, TypeScript, Expo Router 6, NativeWind/TailwindCSS (Uniwind), Zustand, MMKV, expo-notifications, expo-task-manager, Reanimated

---

## File Structure

### New Files

```
src/features/alarm/
├── types.ts                              # Alarm, AlarmSequenceItem, IntensityTier types
├── constants.ts                          # Sound files, intensity tiers, validation limits
├── utils/
│   └── time.ts                           # 12/24hr conversion, midnight boundary math
├── services/
│   ├── sequence-generator.ts             # Pure fn: alarm config → time list
│   ├── intensity.ts                      # Pure fn: sequenceIndex/total → tier
│   └── scheduler.ts                      # Schedule/cancel via expo-notifications
├── stores/
│   ├── use-alarm-store.ts                # Zustand + MMKV: alarm CRUD, persisted
│   └── use-ringing-store.ts              # Ephemeral ringing state
├── hooks/
│   ├── use-notification-listener.ts      # Notification response → navigate to ringing
│   └── use-schedule-alarm.ts             # Hook wrapping scheduler for save/toggle
├── components/
│   ├── alarm-card.tsx                    # Single alarm card for the list
│   ├── time-picker.tsx                   # Scrollable hour/minute/AM-PM selector
│   ├── duration-slider.tsx               # Range duration slider
│   ├── interval-selector.tsx             # Quick-select interval button group
│   ├── snooze-selector.tsx               # Snooze duration picker
│   ├── day-selector.tsx                  # Day-of-week chip selector
│   ├── sequence-preview.tsx              # Timeline visualization of alarm sequence
│   ├── intensity-indicator.tsx           # Opacity-graduated dots showing intensity
│   └── permission-banner.tsx             # Notification permission warning banner
├── screens/
│   ├── home-screen.tsx                   # Alarm list with FAB
│   ├── create-screen.tsx                 # 3-step wizard (shared for create + edit)
│   └── ringing-screen.tsx                # Full-screen alarm UI

src/app/
├── (alarm)/
│   ├── _layout.tsx                       # Stack navigator for alarm screens
│   ├── index.tsx                         # Route → home-screen
│   ├── create.tsx                        # Route → create-screen
│   └── edit/
│       └── [id].tsx                      # Route → create-screen with initialValues
├── ringing.tsx                           # Route → ringing-screen (root modal)

assets/sounds/
├── gentle.wav
├── moderate.wav
├── strong.wav
└── aggressive.wav

src/features/alarm/services/__tests__/
├── sequence-generator.test.ts
├── intensity.test.ts
└── scheduler.test.ts

src/features/alarm/utils/__tests__/
└── time.test.ts

src/features/alarm/stores/__tests__/
└── use-alarm-store.test.ts
```

### Modified Files

```
app.config.ts                             # Add expo-notifications plugin (expo-task-manager needs no plugin entry)
src/app/_layout.tsx                       # Change initialRouteName to (alarm), add notification setup, add ringing modal route
src/global.css                            # Add dark cyan theme colors (navy, cyan accent)
```

---

## Chunk 1: Foundation — Types, Utils, and Pure Services

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`
- Modify: `app.config.ts:67-118` (plugins array)

- [ ] **Step 1: Install expo-notifications and expo-task-manager**

```bash
cd /home/ubuntu/projects/alarm && pnpm add expo-notifications expo-task-manager
```

- [ ] **Step 2: Add plugins to app.config.ts**

In `app.config.ts`, add to the `plugins` array (after `'expo-router'`):

```typescript
'expo-notifications',
```

- [ ] **Step 3: Verify installation**

```bash
cd /home/ubuntu/projects/alarm && pnpm type-check
```

Expected: No new type errors from the added packages.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml app.config.ts
git commit -m "chore: add expo-notifications and expo-task-manager"
```

---

### Task 2: Types and Constants

**Files:**
- Create: `src/features/alarm/types.ts`
- Create: `src/features/alarm/constants.ts`

- [ ] **Step 1: Create types.ts**

```typescript
// src/features/alarm/types.ts

export type IntensityTier = 'gentle' | 'moderate' | 'strong' | 'aggressive';

export type Alarm = {
  id: string;
  startHour: number; // 0-23
  startMinute: number; // 0-59
  durationMinutes: number; // 2-120
  intervalMinutes: number; // 1 to durationMinutes
  snoozeDurationMinutes: number; // 2, 5, or 10
  days: number[]; // 0=Sun..6=Sat, empty = one-time
  enabled: boolean;
  label?: string;
};

export type AlarmSequenceItem = {
  hour24: number; // 0-23
  minute: number; // 0-59
  display: string; // e.g. "7:00"
  ampm: 'AM' | 'PM';
  intensityTier: IntensityTier;
  sequenceIndex: number;
  crossesMidnight: boolean;
};
```

- [ ] **Step 2: Create constants.ts**

```typescript
// src/features/alarm/constants.ts

import type { IntensityTier } from './types';

export const MAX_SEQUENCE_LENGTH = 64;
export const IOS_NOTIFICATION_LIMIT = 64;

export const DURATION_MIN = 2;
export const DURATION_MAX = 120;
export const INTERVAL_MIN = 1;

export const INTERVAL_OPTIONS = [2, 5, 10, 15, 20] as const;
export const SNOOZE_OPTIONS = [2, 5, 10] as const;

export const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

export const INTENSITY_TIERS: IntensityTier[] = [
  'gentle',
  'moderate',
  'strong',
  'aggressive',
];

export const SOUND_FILES: Record<IntensityTier, string> = {
  gentle: 'gentle.wav',
  moderate: 'moderate.wav',
  strong: 'strong.wav',
  aggressive: 'aggressive.wav',
};

export const VIBRATION_PATTERNS: Record<IntensityTier, number[]> = {
  gentle: [100],
  moderate: [100, 100],
  strong: [100, 200, 100, 200],
  aggressive: [200, 300, 200, 300, 200],
};

export const CHANNEL_CONFIG: Record<
  IntensityTier,
  { id: string; name: string; importance: number }
> = {
  gentle: { id: 'alarm-gentle', name: 'Gentle Alarm', importance: 4 },
  moderate: { id: 'alarm-moderate', name: 'Moderate Alarm', importance: 4 },
  strong: { id: 'alarm-strong', name: 'Strong Alarm', importance: 5 },
  aggressive: { id: 'alarm-aggressive', name: 'Urgent Alarm', importance: 5 },
};
```

- [ ] **Step 3: Verify types compile**

```bash
cd /home/ubuntu/projects/alarm && pnpm type-check
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/alarm/types.ts src/features/alarm/constants.ts
git commit -m "feat: add alarm types and constants"
```

---

### Task 3: Time Utilities

**Files:**
- Create: `src/features/alarm/utils/time.ts`
- Create: `src/features/alarm/utils/__tests__/time.test.ts`

- [ ] **Step 1: Write failing tests for time utilities**

```typescript
// src/features/alarm/utils/__tests__/time.test.ts

import { to24Hour, to12Hour, formatTime12, minutesOfDay } from '../time';

describe('to24Hour', () => {
  it('converts 12 AM to 0', () => {
    expect(to24Hour(12, 'AM')).toBe(0);
  });

  it('converts 12 PM to 12', () => {
    expect(to24Hour(12, 'PM')).toBe(12);
  });

  it('converts 7 AM to 7', () => {
    expect(to24Hour(7, 'AM')).toBe(7);
  });

  it('converts 7 PM to 19', () => {
    expect(to24Hour(7, 'PM')).toBe(19);
  });

  it('converts 11 PM to 23', () => {
    expect(to24Hour(11, 'PM')).toBe(23);
  });
});

describe('to12Hour', () => {
  it('converts 0 to 12 AM', () => {
    expect(to12Hour(0)).toEqual({ hour: 12, ampm: 'AM' });
  });

  it('converts 12 to 12 PM', () => {
    expect(to12Hour(12)).toEqual({ hour: 12, ampm: 'PM' });
  });

  it('converts 7 to 7 AM', () => {
    expect(to12Hour(7)).toEqual({ hour: 7, ampm: 'AM' });
  });

  it('converts 19 to 7 PM', () => {
    expect(to12Hour(19)).toEqual({ hour: 7, ampm: 'PM' });
  });

  it('converts 23 to 11 PM', () => {
    expect(to12Hour(23)).toEqual({ hour: 11, ampm: 'PM' });
  });
});

describe('formatTime12', () => {
  it('formats 7:00 AM', () => {
    expect(formatTime12(7, 0)).toBe('7:00 AM');
  });

  it('formats 0:05 as 12:05 AM', () => {
    expect(formatTime12(0, 5)).toBe('12:05 AM');
  });

  it('formats 13:30 as 1:30 PM', () => {
    expect(formatTime12(13, 30)).toBe('1:30 PM');
  });
});

describe('minutesOfDay', () => {
  it('converts 7:00 to 420', () => {
    expect(minutesOfDay(7, 0)).toBe(420);
  });

  it('converts 0:00 to 0', () => {
    expect(minutesOfDay(0, 0)).toBe(0);
  });

  it('converts 23:59 to 1439', () => {
    expect(minutesOfDay(23, 59)).toBe(1439);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/ubuntu/projects/alarm && pnpm test -- --testPathPattern="alarm/utils/__tests__/time" --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement time utilities**

```typescript
// src/features/alarm/utils/time.ts

type AmPm = 'AM' | 'PM';

/**
 * Convert 12-hour time to 24-hour hour value.
 */
export function to24Hour(hour12: number, ampm: AmPm): number {
  if (ampm === 'AM') {
    return hour12 === 12 ? 0 : hour12;
  }
  return hour12 === 12 ? 12 : hour12 + 12;
}

/**
 * Convert 24-hour value to 12-hour with AM/PM.
 */
export function to12Hour(hour24: number): { hour: number; ampm: AmPm } {
  if (hour24 === 0) return { hour: 12, ampm: 'AM' };
  if (hour24 === 12) return { hour: 12, ampm: 'PM' };
  if (hour24 < 12) return { hour: hour24, ampm: 'AM' };
  return { hour: hour24 - 12, ampm: 'PM' };
}

/**
 * Format 24-hour time as "H:MM AM/PM".
 */
export function formatTime12(hour24: number, minute: number): string {
  const { hour, ampm } = to12Hour(hour24);
  return `${hour}:${String(minute).padStart(2, '0')} ${ampm}`;
}

/**
 * Total minutes from midnight for a given hour and minute.
 */
export function minutesOfDay(hour24: number, minute: number): number {
  return hour24 * 60 + minute;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/ubuntu/projects/alarm && pnpm test -- --testPathPattern="alarm/utils/__tests__/time" --no-coverage
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/alarm/utils/time.ts src/features/alarm/utils/__tests__/time.test.ts
git commit -m "feat: add time conversion utilities with tests"
```

---

### Task 4: Sequence Generator Service

**Files:**
- Create: `src/features/alarm/services/sequence-generator.ts`
- Create: `src/features/alarm/services/__tests__/sequence-generator.test.ts`

- [ ] **Step 1: Write failing tests for sequence generator**

```typescript
// src/features/alarm/services/__tests__/sequence-generator.test.ts

import type { Alarm } from '../../types';
import { generateSequence, countScheduledNotifications } from '../sequence-generator';

const makeAlarm = (overrides: Partial<Alarm> = {}): Alarm => ({
  id: 'test-1',
  startHour: 7,
  startMinute: 0,
  durationMinutes: 30,
  intervalMinutes: 10,
  snoozeDurationMinutes: 5,
  days: [1, 2, 3, 4, 5],
  enabled: true,
  ...overrides,
});

describe('generateSequence', () => {
  it('generates correct number of alarms', () => {
    const seq = generateSequence(makeAlarm());
    // 30 / 10 + 1 = 4 alarms: 7:00, 7:10, 7:20, 7:30
    expect(seq).toHaveLength(4);
  });

  it('generates correct times', () => {
    const seq = generateSequence(makeAlarm());
    expect(seq[0].hour24).toBe(7);
    expect(seq[0].minute).toBe(0);
    expect(seq[1].hour24).toBe(7);
    expect(seq[1].minute).toBe(10);
    expect(seq[2].hour24).toBe(7);
    expect(seq[2].minute).toBe(20);
    expect(seq[3].hour24).toBe(7);
    expect(seq[3].minute).toBe(30);
  });

  it('sets sequence indices', () => {
    const seq = generateSequence(makeAlarm());
    expect(seq.map(s => s.sequenceIndex)).toEqual([0, 1, 2, 3]);
  });

  it('handles midnight boundary wrap', () => {
    const seq = generateSequence(
      makeAlarm({ startHour: 23, startMinute: 50, durationMinutes: 30, intervalMinutes: 10 })
    );
    // 23:50, 0:00, 0:10, 0:20
    expect(seq).toHaveLength(4);
    expect(seq[0].hour24).toBe(23);
    expect(seq[0].minute).toBe(50);
    expect(seq[0].crossesMidnight).toBe(false);
    expect(seq[1].hour24).toBe(0);
    expect(seq[1].minute).toBe(0);
    expect(seq[1].crossesMidnight).toBe(true);
  });

  it('caps sequence at 64 entries', () => {
    const seq = generateSequence(
      makeAlarm({ durationMinutes: 120, intervalMinutes: 1 })
    );
    // 120 / 1 + 1 = 121, capped to 64
    expect(seq).toHaveLength(64);
  });

  it('assigns intensity tiers progressively', () => {
    const seq = generateSequence(makeAlarm());
    // 4 alarms: index 0 = gentle (first 25%), 1 = moderate, 2 = strong, 3 = aggressive
    expect(seq[0].intensityTier).toBe('gentle');
    expect(seq[1].intensityTier).toBe('moderate');
    expect(seq[2].intensityTier).toBe('strong');
    expect(seq[3].intensityTier).toBe('aggressive');
  });

  it('formats display strings correctly', () => {
    const seq = generateSequence(makeAlarm());
    expect(seq[0].display).toBe('7:00');
    expect(seq[0].ampm).toBe('AM');
  });

  it('handles minimum duration/interval ratio', () => {
    const seq = generateSequence(
      makeAlarm({ durationMinutes: 5, intervalMinutes: 5 })
    );
    // 5 / 5 + 1 = 2
    expect(seq).toHaveLength(2);
  });
});

describe('countScheduledNotifications', () => {
  it('counts notifications for multiple enabled alarms', () => {
    const alarms = [
      makeAlarm({ id: '1', days: [1, 2, 3] }), // 4 seq * 3 days = 12
      makeAlarm({ id: '2', days: [4, 5] }),     // 4 seq * 2 days = 8
    ];
    expect(countScheduledNotifications(alarms)).toBe(20);
  });

  it('excludes disabled alarms', () => {
    const alarms = [
      makeAlarm({ id: '1', days: [1], enabled: true }),  // 4 * 1 = 4
      makeAlarm({ id: '2', days: [2], enabled: false }), // excluded
    ];
    expect(countScheduledNotifications(alarms)).toBe(4);
  });

  it('counts one-time alarms as 1 day', () => {
    const alarms = [
      makeAlarm({ id: '1', days: [] }), // 4 seq * 1 = 4
    ];
    expect(countScheduledNotifications(alarms)).toBe(4);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/ubuntu/projects/alarm && pnpm test -- --testPathPattern="alarm/services/__tests__/sequence-generator" --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement sequence generator**

```typescript
// src/features/alarm/services/sequence-generator.ts

import type { Alarm, AlarmSequenceItem, IntensityTier } from '../types';
import { MAX_SEQUENCE_LENGTH } from '../constants';
import { minutesOfDay, to12Hour } from '../utils/time';

export function getIntensityTier(
  sequenceIndex: number,
  totalCount: number,
): IntensityTier {
  if (totalCount <= 1) return 'gentle';
  const ratio = sequenceIndex / (totalCount - 1);
  if (ratio < 0.25) return 'gentle';
  if (ratio < 0.5) return 'moderate';
  if (ratio < 0.75) return 'strong';
  return 'aggressive';
}

export function generateSequence(alarm: Alarm): AlarmSequenceItem[] {
  const startTotalMin = minutesOfDay(alarm.startHour, alarm.startMinute);
  const count = Math.min(
    Math.floor(alarm.durationMinutes / alarm.intervalMinutes) + 1,
    MAX_SEQUENCE_LENGTH,
  );

  const items: AlarmSequenceItem[] = [];

  for (let i = 0; i < count; i++) {
    let totalMin = startTotalMin + i * alarm.intervalMinutes;
    const crossesMidnight = totalMin >= 1440;
    if (totalMin >= 1440) totalMin -= 1440;

    const hour24 = Math.floor(totalMin / 60);
    const minute = totalMin % 60;
    const { hour, ampm } = to12Hour(hour24);

    items.push({
      hour24,
      minute,
      display: `${hour}:${String(minute).padStart(2, '0')}`,
      ampm,
      intensityTier: getIntensityTier(i, count),
      sequenceIndex: i,
      crossesMidnight,
    });
  }

  return items;
}

/**
 * Count total notifications that would be scheduled for a set of alarms
 * across 7 days. Each alarm generates sequence.length * enabledDays.length
 * notifications per week.
 */
export function countScheduledNotifications(alarms: Alarm[]): number {
  return alarms
    .filter(a => a.enabled)
    .reduce((total, alarm) => {
      const seqLen = generateSequence(alarm).length;
      const daysCount = alarm.days.length || 1; // one-time = 1
      return total + seqLen * daysCount;
    }, 0);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/ubuntu/projects/alarm && pnpm test -- --testPathPattern="alarm/services/__tests__/sequence-generator" --no-coverage
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/alarm/services/sequence-generator.ts src/features/alarm/services/__tests__/sequence-generator.test.ts
git commit -m "feat: add sequence generator service with tests"
```

---

### Task 5: Intensity Service

**Files:**
- Create: `src/features/alarm/services/intensity.ts`
- Create: `src/features/alarm/services/__tests__/intensity.test.ts`

- [ ] **Step 1: Write failing tests for intensity service**

```typescript
// src/features/alarm/services/__tests__/intensity.test.ts

import {
  getChannelId,
  getSoundFile,
  getVibrationPattern,
} from '../intensity';

describe('getChannelId', () => {
  it('returns correct channel for gentle', () => {
    expect(getChannelId('gentle')).toBe('alarm-gentle');
  });

  it('returns correct channel for aggressive', () => {
    expect(getChannelId('aggressive')).toBe('alarm-aggressive');
  });
});

describe('getSoundFile', () => {
  it('returns correct sound for gentle', () => {
    expect(getSoundFile('gentle')).toBe('gentle.wav');
  });

  it('returns correct sound for strong', () => {
    expect(getSoundFile('strong')).toBe('strong.wav');
  });
});

describe('getVibrationPattern', () => {
  it('returns single pulse for gentle', () => {
    expect(getVibrationPattern('gentle')).toEqual([100]);
  });

  it('returns long pattern for aggressive', () => {
    expect(getVibrationPattern('aggressive')).toEqual([200, 300, 200, 300, 200]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/ubuntu/projects/alarm && pnpm test -- --testPathPattern="alarm/services/__tests__/intensity" --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement intensity service**

```typescript
// src/features/alarm/services/intensity.ts

import type { IntensityTier } from '../types';
import {
  CHANNEL_CONFIG,
  SOUND_FILES,
  VIBRATION_PATTERNS,
} from '../constants';

export function getChannelId(tier: IntensityTier): string {
  return CHANNEL_CONFIG[tier].id;
}

export function getSoundFile(tier: IntensityTier): string {
  return SOUND_FILES[tier];
}

export function getVibrationPattern(tier: IntensityTier): number[] {
  return VIBRATION_PATTERNS[tier];
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/ubuntu/projects/alarm && pnpm test -- --testPathPattern="alarm/services/__tests__/intensity" --no-coverage
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/alarm/services/intensity.ts src/features/alarm/services/__tests__/intensity.test.ts
git commit -m "feat: add intensity service with tests"
```

---

## Chunk 2: State Management and Notification Scheduling

### Task 6: Alarm Store (Zustand + MMKV)

**Files:**
- Create: `src/features/alarm/stores/use-alarm-store.ts`
- Create: `src/features/alarm/stores/__tests__/use-alarm-store.test.ts`

- [ ] **Step 1: Write failing tests for alarm store**

```typescript
// src/features/alarm/stores/__tests__/use-alarm-store.test.ts

import { act, renderHook } from '@testing-library/react-native';
import { useAlarmStore } from '../use-alarm-store';

// Reset store between tests
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
      result.current.addAlarm({
        id: 'test-1',
        startHour: 7,
        startMinute: 0,
        durationMinutes: 30,
        intervalMinutes: 10,
        snoozeDurationMinutes: 5,
        days: [1, 2, 3, 4, 5],
        enabled: true,
      });
    });
    expect(result.current.alarms).toHaveLength(1);
    expect(result.current.alarms[0].id).toBe('test-1');
  });

  it('updates an alarm', () => {
    const { result } = renderHook(() => useAlarmStore());
    act(() => {
      result.current.addAlarm({
        id: 'test-1',
        startHour: 7,
        startMinute: 0,
        durationMinutes: 30,
        intervalMinutes: 10,
        snoozeDurationMinutes: 5,
        days: [1, 2, 3, 4, 5],
        enabled: true,
      });
    });
    act(() => {
      result.current.updateAlarm('test-1', { startHour: 8 });
    });
    expect(result.current.alarms[0].startHour).toBe(8);
  });

  it('deletes an alarm', () => {
    const { result } = renderHook(() => useAlarmStore());
    act(() => {
      result.current.addAlarm({
        id: 'test-1',
        startHour: 7,
        startMinute: 0,
        durationMinutes: 30,
        intervalMinutes: 10,
        snoozeDurationMinutes: 5,
        days: [1, 2, 3, 4, 5],
        enabled: true,
      });
    });
    act(() => {
      result.current.deleteAlarm('test-1');
    });
    expect(result.current.alarms).toHaveLength(0);
  });

  it('toggles alarm enabled state', () => {
    const { result } = renderHook(() => useAlarmStore());
    act(() => {
      result.current.addAlarm({
        id: 'test-1',
        startHour: 7,
        startMinute: 0,
        durationMinutes: 30,
        intervalMinutes: 10,
        snoozeDurationMinutes: 5,
        days: [1, 2, 3, 4, 5],
        enabled: true,
      });
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/ubuntu/projects/alarm && pnpm test -- --testPathPattern="alarm/stores/__tests__/use-alarm-store" --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement alarm store**

```typescript
// src/features/alarm/stores/use-alarm-store.ts

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
    const alarms = get().alarms.map((a) =>
      a.id === id ? { ...a, ...partial } : a,
    );
    persist(alarms);
    set({ alarms });
  },

  deleteAlarm: (id) => {
    const alarms = get().alarms.filter((a) => a.id !== id);
    persist(alarms);
    set({ alarms });
  },

  toggleAlarm: (id) => {
    const alarms = get().alarms.map((a) =>
      a.id === id ? { ...a, enabled: !a.enabled } : a,
    );
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/ubuntu/projects/alarm && pnpm test -- --testPathPattern="alarm/stores/__tests__/use-alarm-store" --no-coverage
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/alarm/stores/use-alarm-store.ts src/features/alarm/stores/__tests__/use-alarm-store.test.ts
git commit -m "feat: add alarm store with MMKV persistence and tests"
```

---

### Task 7: Ringing Store

**Files:**
- Create: `src/features/alarm/stores/use-ringing-store.ts`

- [ ] **Step 1: Implement ringing store**

```typescript
// src/features/alarm/stores/use-ringing-store.ts

import type { IntensityTier } from '../types';
import { create } from 'zustand';

type RingingState = {
  activeAlarmId: string | null;
  currentSequenceIndex: number;
  totalInSequence: number;
  intensityTier: IntensityTier;
  snoozeDurationMinutes: number;
  setRinging: (params: {
    alarmId: string;
    sequenceIndex: number;
    total: number;
    tier: IntensityTier;
    snoozeDuration: number;
  }) => void;
  advanceToNext: (tier: IntensityTier) => void;
  clear: () => void;
};

export const useRingingStore = create<RingingState>((set, get) => ({
  activeAlarmId: null,
  currentSequenceIndex: 0,
  totalInSequence: 0,
  intensityTier: 'gentle',
  snoozeDurationMinutes: 5,

  setRinging: ({ alarmId, sequenceIndex, total, tier, snoozeDuration }) => {
    set({
      activeAlarmId: alarmId,
      currentSequenceIndex: sequenceIndex,
      totalInSequence: total,
      intensityTier: tier,
      snoozeDurationMinutes: snoozeDuration,
    });
  },

  advanceToNext: (tier) => {
    set({
      currentSequenceIndex: get().currentSequenceIndex + 1,
      intensityTier: tier,
    });
  },

  clear: () => {
    set({
      activeAlarmId: null,
      currentSequenceIndex: 0,
      totalInSequence: 0,
      intensityTier: 'gentle',
      snoozeDurationMinutes: 5,
    });
  },
}));
```

- [ ] **Step 2: Verify types compile**

```bash
cd /home/ubuntu/projects/alarm && pnpm type-check
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/alarm/stores/use-ringing-store.ts
git commit -m "feat: add ephemeral ringing store"
```

---

### Task 8: Notification Scheduler Service

**Files:**
- Create: `src/features/alarm/services/scheduler.ts`
- Create: `src/features/alarm/services/__tests__/scheduler.test.ts`

- [ ] **Step 1: Write failing tests for scheduler**

```typescript
// src/features/alarm/services/__tests__/scheduler.test.ts

import type { Alarm } from '../../types';

// Mock expo-notifications
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

import {
  cancelAlarmNotifications,
  scheduleAlarmSequence,
  scheduleSnooze,
  dismissAllRemaining,
} from '../scheduler';

const makeAlarm = (overrides: Partial<Alarm> = {}): Alarm => ({
  id: 'test-alarm',
  startHour: 7,
  startMinute: 0,
  durationMinutes: 30,
  intervalMinutes: 10,
  snoozeDurationMinutes: 5,
  days: [1, 2, 3, 4, 5],
  enabled: true,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('scheduleAlarmSequence', () => {
  it('cancels existing before scheduling new', async () => {
    const alarm = makeAlarm();
    await scheduleAlarmSequence(alarm);
    // Cancel is called first (for 5 days * 4 sequence items = 20 cancels)
    expect(mockCancel).toHaveBeenCalled();
    // Then schedule is called (5 days * 4 items = 20 schedules)
    expect(mockSchedule).toHaveBeenCalledTimes(20);
  });

  it('does not schedule if alarm is disabled', async () => {
    const alarm = makeAlarm({ enabled: false });
    await scheduleAlarmSequence(alarm);
    // Cancel is still called, but no new schedules
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('uses deterministic notification IDs', async () => {
    const alarm = makeAlarm({ days: [1] });
    await scheduleAlarmSequence(alarm);
    const ids = mockSchedule.mock.calls.map(
      (call: unknown[]) => (call[0] as { identifier: string }).identifier,
    );
    expect(ids).toContain('test-alarm_1_0');
    expect(ids).toContain('test-alarm_1_1');
    expect(ids).toContain('test-alarm_1_2');
    expect(ids).toContain('test-alarm_1_3');
  });

  it('uses sentinel day 7 for one-time alarms', async () => {
    const alarm = makeAlarm({ days: [] });
    await scheduleAlarmSequence(alarm);
    const ids = mockSchedule.mock.calls.map(
      (call: unknown[]) => (call[0] as { identifier: string }).identifier,
    );
    expect(ids[0]).toBe('test-alarm_7_0');
  });
});

describe('cancelAlarmNotifications', () => {
  it('cancels all notification IDs for the alarm', async () => {
    const alarm = makeAlarm({ days: [1] });
    await cancelAlarmNotifications(alarm);
    // 1 day * 4 sequence items = 4 cancels
    expect(mockCancel).toHaveBeenCalledTimes(4);
    expect(mockCancel).toHaveBeenCalledWith('test-alarm_1_0');
    expect(mockCancel).toHaveBeenCalledWith('test-alarm_1_3');
  });
});

describe('scheduleSnooze', () => {
  it('schedules a snooze notification with fixed ID', async () => {
    await scheduleSnooze('test-alarm', 5, 'moderate', 1, 4);
    // Cancels existing snooze first, then schedules
    expect(mockCancel).toHaveBeenCalledWith('test-alarm_snooze');
    expect(mockSchedule).toHaveBeenCalledTimes(1);
    const call = mockSchedule.mock.calls[0][0] as { identifier: string };
    expect(call.identifier).toBe('test-alarm_snooze');
  });
});

describe('dismissAllRemaining', () => {
  it('cancels remaining sequence items after current index', async () => {
    const alarm = makeAlarm({ days: [1] });
    await dismissAllRemaining(alarm, 1);
    // Should cancel indices 2 and 3 (after index 1), plus snooze
    const cancelledIds = mockCancel.mock.calls.map(
      (call: unknown[]) => call[0],
    );
    expect(cancelledIds).toContain('test-alarm_1_2');
    expect(cancelledIds).toContain('test-alarm_1_3');
    expect(cancelledIds).toContain('test-alarm_snooze');
    // Should NOT cancel index 0 or 1
    expect(cancelledIds).not.toContain('test-alarm_1_0');
    expect(cancelledIds).not.toContain('test-alarm_1_1');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/ubuntu/projects/alarm && pnpm test -- --testPathPattern="alarm/services/__tests__/scheduler" --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement scheduler service**

```typescript
// src/features/alarm/services/scheduler.ts

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Alarm, IntensityTier } from '../types';
import { CHANNEL_CONFIG } from '../constants';
import { getChannelId, getSoundFile, getVibrationPattern } from './intensity';
import { generateSequence } from './sequence-generator';

/**
 * Build a deterministic notification ID for an alarm sequence item.
 */
function buildNotificationId(
  alarmId: string,
  dayIndex: number,
  sequenceIndex: number,
): string {
  return `${alarmId}_${dayIndex}_${sequenceIndex}`;
}

/**
 * Create Android notification channels for all intensity tiers.
 * Safe to call multiple times — channels are updated if they already exist.
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  for (const [tier, config] of Object.entries(CHANNEL_CONFIG)) {
    await Notifications.setNotificationChannelAsync(config.id, {
      name: config.name,
      importance: config.importance as Notifications.AndroidImportance,
      sound: getSoundFile(tier as IntensityTier),
      vibrationPattern: getVibrationPattern(tier as IntensityTier),
      lockscreenVisibility:
        Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}

/**
 * Get the day indices used for scheduling. For recurring alarms, these are
 * the selected days. For one-time alarms, we use a sentinel value (7) so
 * the notification ID is stable regardless of when cancel is called.
 */
function getScheduleDays(alarm: Alarm): number[] {
  return alarm.days.length > 0 ? alarm.days : [7]; // 7 = one-time sentinel
}

/**
 * Cancel all scheduled notifications for a given alarm.
 */
export async function cancelAlarmNotifications(alarm: Alarm): Promise<void> {
  const sequence = generateSequence(alarm);
  const days = getScheduleDays(alarm);

  const cancelPromises: Promise<void>[] = [];
  for (const day of days) {
    for (const item of sequence) {
      cancelPromises.push(
        Notifications.cancelScheduledNotificationAsync(
          buildNotificationId(alarm.id, day, item.sequenceIndex),
        ),
      );
    }
  }
  await Promise.all(cancelPromises);
}

/**
 * Get the next occurrence of a specific day-of-week and time from now.
 */
function getNextOccurrence(
  dayOfWeek: number,
  hour: number,
  minute: number,
): Date {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);

  const currentDay = now.getDay();
  let daysUntil = dayOfWeek - currentDay;
  if (daysUntil < 0) daysUntil += 7;
  if (daysUntil === 0 && target <= now) daysUntil = 7;

  target.setDate(target.getDate() + daysUntil);
  return target;
}

/**
 * Schedule all notifications for an alarm's sequence across 7 days.
 */
export async function scheduleAlarmSequence(alarm: Alarm): Promise<void> {
  // Cancel existing first
  await cancelAlarmNotifications(alarm);

  if (!alarm.enabled) return;

  const sequence = generateSequence(alarm);
  const days = getScheduleDays(alarm);

  for (const day of days) {
    for (const item of sequence) {
      const triggerDate = getNextOccurrence(day, item.hour24, item.minute);
      const notificationId = buildNotificationId(
        alarm.id,
        day,
        item.sequenceIndex,
      );

      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: {
          title: alarm.label || 'Adaptive Wake',
          body: `Alarm ${item.sequenceIndex + 1} of ${sequence.length}`,
          sound: getSoundFile(item.intensityTier),
          data: {
            alarmId: alarm.id,
            sequenceIndex: item.sequenceIndex,
            totalInSequence: sequence.length,
            intensityTier: item.intensityTier,
            snoozeDurationMinutes: alarm.snoozeDurationMinutes,
          },
          ...(Platform.OS === 'android' && {
            channelId: getChannelId(item.intensityTier),
          }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
    }
  }
}

/**
 * Schedule a snooze notification for the given alarm.
 */
export async function scheduleSnooze(
  alarmId: string,
  snoozeDurationMinutes: number,
  intensityTier: IntensityTier,
  sequenceIndex: number,
  totalInSequence: number,
): Promise<void> {
  const snoozeId = `${alarmId}_snooze`;

  // Cancel any existing snooze for this alarm
  await Notifications.cancelScheduledNotificationAsync(snoozeId).catch(
    () => {},
  );

  const triggerDate = new Date(
    Date.now() + snoozeDurationMinutes * 60 * 1000,
  );

  await Notifications.scheduleNotificationAsync({
    identifier: snoozeId,
    content: {
      title: 'Snooze — Adaptive Wake',
      body: `Alarm ${sequenceIndex + 1} of ${totalInSequence} (snoozed)`,
      sound: getSoundFile(intensityTier),
      data: {
        alarmId,
        sequenceIndex,
        totalInSequence,
        intensityTier,
        snoozeDurationMinutes,
        isSnooze: true,
      },
      ...(Platform.OS === 'android' && {
        channelId: getChannelId(intensityTier),
      }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}

/**
 * Cancel all remaining notifications in today's sequence for an alarm
 * after the given sequence index (for "Dismiss All").
 */
export async function dismissAllRemaining(
  alarm: Alarm,
  currentSequenceIndex: number,
): Promise<void> {
  const sequence = generateSequence(alarm);
  const days = getScheduleDays(alarm);
  const today = days.includes(new Date().getDay())
    ? new Date().getDay()
    : days[0];

  const cancelPromises: Promise<void>[] = [];
  for (const item of sequence) {
    if (item.sequenceIndex > currentSequenceIndex) {
      cancelPromises.push(
        Notifications.cancelScheduledNotificationAsync(
          buildNotificationId(alarm.id, today, item.sequenceIndex),
        ),
      );
    }
  }

  // Also cancel any active snooze
  cancelPromises.push(
    Notifications.cancelScheduledNotificationAsync(
      `${alarm.id}_snooze`,
    ).catch(() => {}),
  );

  await Promise.all(cancelPromises);
}

/**
 * Re-schedule all enabled alarms. Called on app foreground and by background task.
 */
export async function rescheduleAllAlarms(alarms: Alarm[]): Promise<void> {
  for (const alarm of alarms) {
    if (alarm.enabled) {
      await scheduleAlarmSequence(alarm);
    }
  }
}
```

- [ ] **Step 4: Verify types compile**

```bash
cd /home/ubuntu/projects/alarm && pnpm type-check
```

Expected: PASS.

- [ ] **Step 5: Run scheduler tests to verify they pass**

```bash
cd /home/ubuntu/projects/alarm && pnpm test -- --testPathPattern="alarm/services/__tests__/scheduler" --no-coverage
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/alarm/services/scheduler.ts src/features/alarm/services/__tests__/scheduler.test.ts
git commit -m "feat: add notification scheduler service with tests"
```

---

### Task 9: Notification Listener Hook

**Files:**
- Create: `src/features/alarm/hooks/use-notification-listener.ts`

- [ ] **Step 1: Implement notification listener hook**

```typescript
// src/features/alarm/hooks/use-notification-listener.ts

import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import type { IntensityTier } from '../types';
import { useRingingStore } from '../stores/use-ringing-store';

/**
 * Listens for notification responses (user tapping a notification)
 * and navigates to the ringing screen with the appropriate alarm data.
 *
 * Must be mounted in the root layout.
 */
export function useNotificationListener() {
  const router = useRouter();
  const responseListener = useRef<Notifications.EventSubscription | null>(
    null,
  );
  const foregroundListener = useRef<Notifications.EventSubscription | null>(
    null,
  );

  useEffect(() => {
    function handleAlarmData(data: Record<string, unknown>) {
      if (!data?.alarmId) return;
      useRingingStore.getState().setRinging({
        alarmId: data.alarmId as string,
        sequenceIndex: data.sequenceIndex as number,
        total: data.totalInSequence as number,
        tier: data.intensityTier as IntensityTier,
        snoozeDuration: data.snoozeDurationMinutes as number,
      });
      router.push('/ringing');
    }

    // Handle notification arriving while app is foregrounded
    foregroundListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data as Record<string, unknown>;
        handleAlarmData(data);
      });

    // Handle notification tapped from shade or background
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content
          .data as Record<string, unknown>;
        handleAlarmData(data);
      });

    return () => {
      if (foregroundListener.current) {
        Notifications.removeNotificationSubscription(
          foregroundListener.current,
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(
          responseListener.current,
        );
      }
    };
  }, [router]);
}
```

- [ ] **Step 2: Verify types compile**

```bash
cd /home/ubuntu/projects/alarm && pnpm type-check
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/alarm/hooks/use-notification-listener.ts
git commit -m "feat: add notification listener hook"
```

---

### Task 10: Schedule Alarm Hook

**Files:**
- Create: `src/features/alarm/hooks/use-schedule-alarm.ts`

- [ ] **Step 1: Implement use-schedule-alarm hook**

```typescript
// src/features/alarm/hooks/use-schedule-alarm.ts

import { useCallback } from 'react';

import type { Alarm } from '../types';
import {
  cancelAlarmNotifications,
  scheduleAlarmSequence,
} from '../services/scheduler';
import { useAlarmStore } from '../stores/use-alarm-store';

/**
 * Provides save, toggle, and delete operations that keep
 * the store and notification schedule in sync.
 */
export function useScheduleAlarm() {
  const addAlarm = useAlarmStore((s) => s.addAlarm);
  const updateAlarm = useAlarmStore((s) => s.updateAlarm);
  const deleteAlarm = useAlarmStore((s) => s.deleteAlarm);
  const toggleAlarm = useAlarmStore((s) => s.toggleAlarm);

  const saveAlarm = useCallback(
    async (alarm: Alarm) => {
      // Use getState() to read current snapshot without reactive dependency
      const existing = useAlarmStore
        .getState()
        .alarms.find((a) => a.id === alarm.id);
      if (existing) {
        updateAlarm(alarm.id, alarm);
      } else {
        addAlarm(alarm);
      }
      await scheduleAlarmSequence(alarm);
    },
    [addAlarm, updateAlarm],
  );

  const removeAlarm = useCallback(
    async (alarm: Alarm) => {
      await cancelAlarmNotifications(alarm);
      deleteAlarm(alarm.id);
    },
    [deleteAlarm],
  );

  const toggleAndSchedule = useCallback(
    async (alarm: Alarm) => {
      const toggled = { ...alarm, enabled: !alarm.enabled };
      toggleAlarm(alarm.id);
      if (toggled.enabled) {
        await scheduleAlarmSequence(toggled);
      } else {
        await cancelAlarmNotifications(toggled);
      }
    },
    [toggleAlarm],
  );

  return { saveAlarm, removeAlarm, toggleAndSchedule };
}
```

- [ ] **Step 2: Verify types compile**

```bash
cd /home/ubuntu/projects/alarm && pnpm type-check
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/alarm/hooks/use-schedule-alarm.ts
git commit -m "feat: add use-schedule-alarm hook"
```

---

## Chunk 3: UI Components

### Task 11: Dark Cyan Theme

**Files:**
- Modify: `src/global.css`

- [ ] **Step 1: Add dark cyan color tokens to global.css**

Add the following inside the `@theme` block in `src/global.css`, after the existing color definitions:

```css
/* Alarm app - Dark Cyan palette */
--color-navy-900: #060b14;
--color-navy-800: #0a0e1a;
--color-navy-700: #0d1b2a;
--color-navy-600: #1a2940;

--color-cyan-400: #00D4FF;
--color-cyan-500: #00bfe6;
--color-cyan-600: #00a8cc;
```

Also update the dark mode semantic colors block to use the navy backgrounds:

In the `@media (prefers-color-scheme: dark)` block, update:
```css
--color-background: #0a0e1a;
--color-foreground: #f0f0f0;

--color-card: #0d1b2a;
--color-card-foreground: #f0f0f0;

--color-muted: #1a2940;
--color-muted-foreground: #8899aa;

--color-border: #1a2940;
--color-input: #1a2940;
```

- [ ] **Step 2: Verify no build errors**

```bash
cd /home/ubuntu/projects/alarm && pnpm type-check
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/global.css
git commit -m "feat: add dark cyan theme colors"
```

---

### Task 12: Day Selector Component

**Files:**
- Create: `src/features/alarm/components/day-selector.tsx`

- [ ] **Step 1: Implement day selector**

```tsx
// src/features/alarm/components/day-selector.tsx

import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { DAY_LABELS } from '../constants';

type Props = {
  selectedDays: number[];
  onToggleDay: (day: number) => void;
};

export function DaySelector({ selectedDays, onToggleDay }: Props) {
  return (
    <View className="flex-row gap-2">
      {DAY_LABELS.map((label, index) => {
        const isSelected = selectedDays.includes(index);
        return (
          <Pressable
            key={index}
            onPress={() => onToggleDay(index)}
            className={`h-8 w-8 items-center justify-center rounded-full ${
              isSelected ? 'bg-cyan-400' : 'bg-navy-600'
            }`}
            testID={`day-${index}`}
          >
            <Text
              className={`text-xs font-semibold ${
                isSelected ? 'text-black' : 'text-muted-foreground'
              }`}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 2: Verify types compile**

```bash
cd /home/ubuntu/projects/alarm && pnpm type-check
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/alarm/components/day-selector.tsx
git commit -m "feat: add day selector component"
```

---

### Task 13: Intensity Indicator Component

**Files:**
- Create: `src/features/alarm/components/intensity-indicator.tsx`

- [ ] **Step 1: Implement intensity indicator**

```tsx
// src/features/alarm/components/intensity-indicator.tsx

import { View } from 'react-native';

type Props = {
  total: number;
  /** Max dots to render (avoid visual clutter for long sequences) */
  maxDots?: number;
};

export function IntensityIndicator({ total, maxDots = 12 }: Props) {
  const dotCount = Math.min(total, maxDots);

  return (
    <View className="flex-row gap-1">
      {Array.from({ length: dotCount }, (_, i) => {
        const opacity = 0.3 + (0.7 * i) / (dotCount - 1 || 1);
        return (
          <View
            key={i}
            className="h-2 w-2 rounded-full bg-cyan-400"
            style={{ opacity }}
          />
        );
      })}
    </View>
  );
}
```

- [ ] **Step 2: Verify types compile**

```bash
cd /home/ubuntu/projects/alarm && pnpm type-check
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/alarm/components/intensity-indicator.tsx
git commit -m "feat: add intensity indicator component"
```

---

### Task 14: Time Picker Component

**Files:**
- Create: `src/features/alarm/components/time-picker.tsx`

- [ ] **Step 1: Implement time picker**

```tsx
// src/features/alarm/components/time-picker.tsx

import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';

type Props = {
  hour: number; // 1-12
  minute: number; // 0-59
  ampm: 'AM' | 'PM';
  onChangeHour: (hour: number) => void;
  onChangeMinute: (minute: number) => void;
  onChangeAmPm: (ampm: 'AM' | 'PM') => void;
};

function wrapHour(h: number): number {
  if (h > 12) return 1;
  if (h < 1) return 12;
  return h;
}

function wrapMinute(m: number): number {
  if (m >= 60) return 0;
  if (m < 0) return 59;
  return m;
}

function ArrowButton({
  direction,
  onPress,
  testID,
}: {
  direction: 'up' | 'down';
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="h-10 w-full items-center justify-center"
      testID={testID}
    >
      <Text className="text-2xl text-cyan-400">
        {direction === 'up' ? '\u25B2' : '\u25BC'}
      </Text>
    </Pressable>
  );
}

export function TimePicker({
  hour,
  minute,
  ampm,
  onChangeHour,
  onChangeMinute,
  onChangeAmPm,
}: Props) {
  return (
    <View className="flex-row items-center justify-center gap-4">
      {/* Hour column */}
      <View className="items-center">
        <ArrowButton
          direction="up"
          onPress={() => onChangeHour(wrapHour(hour + 1))}
          testID="hour-up"
        />
        <Text className="text-6xl font-bold text-white">
          {String(hour).padStart(2, '0')}
        </Text>
        <ArrowButton
          direction="down"
          onPress={() => onChangeHour(wrapHour(hour - 1))}
          testID="hour-down"
        />
      </View>

      <Text className="text-6xl font-light text-muted-foreground">:</Text>

      {/* Minute column */}
      <View className="items-center">
        <ArrowButton
          direction="up"
          onPress={() => onChangeMinute(wrapMinute(minute + 1))}
          testID="minute-up"
        />
        <Text className="text-6xl font-bold text-white">
          {String(minute).padStart(2, '0')}
        </Text>
        <ArrowButton
          direction="down"
          onPress={() => onChangeMinute(wrapMinute(minute - 1))}
          testID="minute-down"
        />
      </View>

      {/* AM/PM column */}
      <View className="ml-2 gap-2">
        <Pressable
          onPress={() => onChangeAmPm('AM')}
          className={`rounded-lg px-4 py-2 ${
            ampm === 'AM' ? 'bg-cyan-400' : 'bg-navy-600'
          }`}
          testID="am-btn"
        >
          <Text
            className={`font-semibold ${
              ampm === 'AM' ? 'text-black' : 'text-muted-foreground'
            }`}
          >
            AM
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onChangeAmPm('PM')}
          className={`rounded-lg px-4 py-2 ${
            ampm === 'PM' ? 'bg-cyan-400' : 'bg-navy-600'
          }`}
          testID="pm-btn"
        >
          <Text
            className={`font-semibold ${
              ampm === 'PM' ? 'text-black' : 'text-muted-foreground'
            }`}
          >
            PM
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Verify types compile**

```bash
cd /home/ubuntu/projects/alarm && pnpm type-check
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/alarm/components/time-picker.tsx
git commit -m "feat: add time picker component"
```

---

### Task 15: Duration Slider, Interval Selector, Snooze Selector

**Files:**
- Create: `src/features/alarm/components/duration-slider.tsx`
- Create: `src/features/alarm/components/interval-selector.tsx`
- Create: `src/features/alarm/components/snooze-selector.tsx`

- [ ] **Step 1: Install slider dependency**

```bash
cd /home/ubuntu/projects/alarm && pnpm add @react-native-community/slider
```

- [ ] **Step 2: Implement duration slider**

```tsx
// src/features/alarm/components/duration-slider.tsx

import Slider from '@react-native-community/slider';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { DURATION_MAX, DURATION_MIN } from '../constants';

type Props = {
  value: number;
  onChange: (value: number) => void;
};

export function DurationSlider({ value, onChange }: Props) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-muted-foreground">Duration</Text>
        <Text className="text-lg font-semibold text-cyan-400">
          {value} <Text className="text-sm text-muted-foreground">min</Text>
        </Text>
      </View>
      <Slider
        minimumValue={DURATION_MIN}
        maximumValue={DURATION_MAX}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor="#00D4FF"
        maximumTrackTintColor="#1a2940"
        thumbTintColor="#00D4FF"
        testID="duration-slider"
      />
    </View>
  );
}
```

- [ ] **Step 3: Implement interval selector**

```tsx
// src/features/alarm/components/interval-selector.tsx

import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { INTERVAL_OPTIONS } from '../constants';

type Props = {
  value: number;
  onChange: (value: number) => void;
  maxInterval?: number;
};

export function IntervalSelector({ value, onChange, maxInterval }: Props) {
  return (
    <View className="gap-2">
      <Text className="text-sm text-muted-foreground">Ring every</Text>
      <View className="flex-row gap-2">
        {INTERVAL_OPTIONS.map((opt) => {
          const disabled = maxInterval !== undefined && opt > maxInterval;
          const isActive = opt === value;
          return (
            <Pressable
              key={opt}
              onPress={() => !disabled && onChange(opt)}
              disabled={disabled}
              className={`rounded-lg px-4 py-2 ${
                isActive
                  ? 'bg-cyan-400'
                  : disabled
                    ? 'bg-navy-600 opacity-30'
                    : 'bg-navy-600'
              }`}
              testID={`interval-${opt}`}
            >
              <Text
                className={`text-sm font-semibold ${
                  isActive ? 'text-black' : 'text-muted-foreground'
                }`}
              >
                {opt}m
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
```

- [ ] **Step 4: Implement snooze selector**

```tsx
// src/features/alarm/components/snooze-selector.tsx

import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { SNOOZE_OPTIONS } from '../constants';

type Props = {
  value: number;
  onChange: (value: number) => void;
};

export function SnoozeSelector({ value, onChange }: Props) {
  return (
    <View className="gap-2">
      <Text className="text-sm text-muted-foreground">Snooze duration</Text>
      <View className="flex-row gap-2">
        {SNOOZE_OPTIONS.map((opt) => {
          const isActive = opt === value;
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              className={`rounded-lg px-4 py-2 ${
                isActive ? 'bg-cyan-400' : 'bg-navy-600'
              }`}
              testID={`snooze-${opt}`}
            >
              <Text
                className={`text-sm font-semibold ${
                  isActive ? 'text-black' : 'text-muted-foreground'
                }`}
              >
                {opt}m
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
```

- [ ] **Step 5: Verify types compile**

```bash
cd /home/ubuntu/projects/alarm && pnpm type-check
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/alarm/components/duration-slider.tsx src/features/alarm/components/interval-selector.tsx src/features/alarm/components/snooze-selector.tsx package.json pnpm-lock.yaml
git commit -m "feat: add duration slider, interval selector, snooze selector"
```

---

### Task 16: Sequence Preview Component

**Files:**
- Create: `src/features/alarm/components/sequence-preview.tsx`

- [ ] **Step 1: Implement sequence preview**

```tsx
// src/features/alarm/components/sequence-preview.tsx

import { View } from 'react-native';

import { Text } from '@/components/ui';
import type { AlarmSequenceItem } from '../types';

type Props = {
  sequence: AlarmSequenceItem[];
  durationMinutes: number;
  intervalMinutes: number;
};

const TIER_COLORS = {
  gentle: 'bg-cyan-400/40',
  moderate: 'bg-cyan-400/60',
  strong: 'bg-cyan-400/80',
  aggressive: 'bg-cyan-400',
} as const;

export function SequencePreview({
  sequence,
  durationMinutes,
  intervalMinutes,
}: Props) {
  return (
    <View className="gap-4">
      {/* Timeline */}
      <View className="gap-1">
        {sequence.map((item, i) => {
          const label =
            i === 0
              ? 'First alarm'
              : i === sequence.length - 1
                ? 'Last alarm'
                : `+${i * intervalMinutes} min`;

          return (
            <View key={i} className="flex-row items-center gap-3 py-1">
              <View
                className={`h-3 w-3 rounded-full ${TIER_COLORS[item.intensityTier]}`}
              />
              <Text className="w-20 text-sm font-semibold text-white">
                {item.display}{' '}
                <Text className="text-xs text-muted-foreground">
                  {item.ampm}
                </Text>
              </Text>
              <Text className="text-xs text-muted-foreground">{label}</Text>
            </View>
          );
        })}
      </View>

      {/* Summary */}
      <View className="rounded-xl bg-navy-700 p-4 gap-2">
        <SummaryRow label="Total alarms" value={String(sequence.length)} />
        <SummaryRow
          label="Range"
          value={`${sequence[0]?.display} ${sequence[0]?.ampm} — ${sequence[sequence.length - 1]?.display} ${sequence[sequence.length - 1]?.ampm}`}
        />
        <SummaryRow label="Duration" value={`${durationMinutes} min`} />
        <SummaryRow label="Interval" value={`Every ${intervalMinutes} min`} />
      </View>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="text-sm font-semibold text-white">{value}</Text>
    </View>
  );
}
```

- [ ] **Step 2: Verify types compile**

```bash
cd /home/ubuntu/projects/alarm && pnpm type-check
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/alarm/components/sequence-preview.tsx
git commit -m "feat: add sequence preview component"
```

---

### Task 17: Permission Banner and Alarm Card

**Files:**
- Create: `src/features/alarm/components/permission-banner.tsx`
- Create: `src/features/alarm/components/alarm-card.tsx`

- [ ] **Step 1: Implement permission banner**

```tsx
// src/features/alarm/components/permission-banner.tsx

import { Linking, Pressable, View } from 'react-native';

import { Text } from '@/components/ui';

type Props = {
  visible: boolean;
};

export function PermissionBanner({ visible }: Props) {
  if (!visible) return null;

  const openSettings = async () => {
    await Linking.openSettings();
  };

  return (
    <View className="mx-4 mb-4 rounded-xl bg-danger-600/20 p-4">
      <Text className="mb-2 text-sm font-semibold text-danger-400">
        Notifications Disabled
      </Text>
      <Text className="mb-3 text-xs text-danger-300">
        Alarms won't fire without notification permission. Tap below to enable.
      </Text>
      <Pressable
        onPress={openSettings}
        className="self-start rounded-lg bg-danger-600 px-4 py-2"
      >
        <Text className="text-sm font-semibold text-white">
          Grant Permission
        </Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 2: Implement alarm card**

```tsx
// src/features/alarm/components/alarm-card.tsx

import { Pressable, Switch, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { Text } from '@/components/ui';
import type { Alarm } from '../types';
import { DAY_LABELS } from '../constants';
import { generateSequence } from '../services/sequence-generator';
import { to12Hour } from '../utils/time';
import { IntensityIndicator } from './intensity-indicator';

type Props = {
  alarm: Alarm;
  onPress: () => void;
  onToggle: () => void;
  onDelete: () => void;
};

function DeleteAction() {
  return (
    <View className="mb-3 mr-4 items-center justify-center rounded-2xl bg-danger-600 px-6">
      <Text className="text-sm font-semibold text-white">Delete</Text>
    </View>
  );
}

export function AlarmCard({ alarm, onPress, onToggle, onDelete }: Props) {
  const { hour, ampm } = to12Hour(alarm.startHour);
  const sequence = generateSequence(alarm);
  const timeDisplay = `${hour}:${String(alarm.startMinute).padStart(2, '0')}`;

  return (
    <Swipeable
      renderRightActions={() => <DeleteAction />}
      onSwipeableOpen={onDelete}
    >
    <Pressable
      onPress={onPress}
      className={`mx-4 mb-3 rounded-2xl border p-4 ${
        alarm.enabled
          ? 'border-cyan-400/15 bg-card'
          : 'border-border/5 bg-card opacity-50'
      }`}
      testID={`alarm-card-${alarm.id}`}
    >
      {/* Top row: time + toggle */}
      <View className="flex-row items-center justify-between mb-2">
        <View>
          <View className="flex-row items-baseline">
            <Text className="text-3xl font-bold text-white">
              {timeDisplay}
            </Text>
            <Text className="ml-1 text-base text-muted-foreground">
              {ampm}
            </Text>
          </View>
          <Text className="text-xs text-cyan-400 mt-0.5">
            {alarm.durationMinutes} min range, every {alarm.intervalMinutes} min
          </Text>
          {alarm.label ? (
            <Text className="text-xs text-muted-foreground mt-0.5">
              {alarm.label}
            </Text>
          ) : null}
        </View>
        <Switch
          value={alarm.enabled}
          onValueChange={onToggle}
          trackColor={{ false: '#333', true: '#00D4FF' }}
          thumbColor="#fff"
          testID={`alarm-toggle-${alarm.id}`}
        />
      </View>

      {/* Intensity dots */}
      <View className="mb-2">
        <IntensityIndicator total={sequence.length} />
      </View>

      {/* Day chips */}
      <View className="flex-row gap-1">
        {DAY_LABELS.map((label, i) => {
          const isActive = alarm.days.includes(i);
          return (
            <View
              key={i}
              className={`rounded-md px-1.5 py-0.5 ${
                isActive ? 'bg-cyan-400' : 'bg-navy-800/50'
              }`}
            >
              <Text
                className={`text-[10px] font-semibold ${
                  isActive ? 'text-black' : 'text-muted-foreground'
                }`}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </Pressable>
    </Swipeable>
  );
}
```

- [ ] **Step 3: Verify types compile**

```bash
cd /home/ubuntu/projects/alarm && pnpm type-check
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/features/alarm/components/permission-banner.tsx src/features/alarm/components/alarm-card.tsx
git commit -m "feat: add permission banner and alarm card components"
```

---

## Chunk 4: Screens and Routing

### Task 18: Home Screen

**Files:**
- Create: `src/features/alarm/screens/home-screen.tsx`

- [ ] **Step 1: Implement home screen**

```tsx
// src/features/alarm/screens/home-screen.tsx

import { FlashList } from '@shopify/flash-list';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { Alert } from 'react-native';

import { AlarmCard } from '../components/alarm-card';
import { PermissionBanner } from '../components/permission-banner';
import { useScheduleAlarm } from '../hooks/use-schedule-alarm';
import { useAlarmStore } from '../stores/use-alarm-store';
import type { Alarm } from '../types';

export function HomeScreen() {
  const router = useRouter();
  const alarms = useAlarmStore((s) => s.alarms);
  const { toggleAndSchedule, removeAlarm } = useScheduleAlarm();
  const [permissionDenied, setPermissionDenied] = useState(false);

  const checkPermission = useCallback(async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionDenied(status !== 'granted');
  }, []);

  useEffect(() => {
    checkPermission();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkPermission();
    });
    return () => sub.remove();
  }, [checkPermission]);

  const handleDelete = useCallback(
    (alarm: Alarm) => {
      Alert.alert(
        'Delete Alarm',
        'Are you sure you want to delete this alarm?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => removeAlarm(alarm),
          },
        ],
      );
    },
    [removeAlarm],
  );

  const renderItem = useCallback(
    ({ item }: { item: Alarm }) => (
      <AlarmCard
        alarm={item}
        onPress={() => router.push(`/edit/${item.id}` as any)}
        onToggle={() => toggleAndSchedule(item)}
        onDelete={() => handleDelete(item)}
      />
    ),
    [router, toggleAndSchedule, handleDelete],
  );

  return (
    <View className="flex-1 bg-background">
      <PermissionBanner visible={permissionDenied} />

      {alarms.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-2 text-4xl">&#9200;</Text>
          <Text className="mb-1 text-lg font-semibold text-white">
            No alarms yet
          </Text>
          <Text className="text-center text-sm text-muted-foreground">
            Tap + to create your first range alarm. Set once, wake up right.
          </Text>
        </View>
      ) : (
        <FlashList
          data={alarms}
          renderItem={renderItem}
          estimatedItemSize={140}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/create' as any)}
        className="absolute bottom-8 right-6 h-14 w-14 items-center justify-center rounded-full bg-cyan-400"
        style={{
          shadowColor: '#00D4FF',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 8,
        }}
        testID="fab-create"
      >
        <Text className="text-2xl font-bold text-black">+</Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 2: Verify types compile**

```bash
cd /home/ubuntu/projects/alarm && pnpm type-check
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/alarm/screens/home-screen.tsx
git commit -m "feat: add home screen with alarm list and FAB"
```

---

### Task 19: Create Screen (3-Step Wizard)

**Files:**
- Create: `src/features/alarm/screens/create-screen.tsx`

- [ ] **Step 1: Implement create screen**

```tsx
// src/features/alarm/screens/create-screen.tsx

import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui';
import { DaySelector } from '../components/day-selector';
import { DurationSlider } from '../components/duration-slider';
import { IntervalSelector } from '../components/interval-selector';
import { SequencePreview } from '../components/sequence-preview';
import { SnoozeSelector } from '../components/snooze-selector';
import { TimePicker } from '../components/time-picker';
import { IOS_NOTIFICATION_LIMIT } from '../constants';
import { useScheduleAlarm } from '../hooks/use-schedule-alarm';
import {
  countScheduledNotifications,
  generateSequence,
} from '../services/sequence-generator';
import { useAlarmStore } from '../stores/use-alarm-store';
import type { Alarm } from '../types';
import { to12Hour, to24Hour } from '../utils/time';

type Props = {
  initialValues?: Alarm;
};

export function CreateScreen({ initialValues }: Props) {
  const router = useRouter();
  const { saveAlarm } = useScheduleAlarm();
  const alarms = useAlarmStore((s) => s.alarms);

  const initial12 = initialValues
    ? to12Hour(initialValues.startHour)
    : { hour: 7, ampm: 'AM' as const };

  const [step, setStep] = useState(1);
  const [hour, setHour] = useState(initial12.hour);
  const [minute, setMinute] = useState(initialValues?.startMinute ?? 0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(initial12.ampm);
  const [duration, setDuration] = useState(
    initialValues?.durationMinutes ?? 30,
  );
  const [interval, setInterval] = useState(
    initialValues?.intervalMinutes ?? 10,
  );
  const [snoozeDuration, setSnoozeDuration] = useState(
    initialValues?.snoozeDurationMinutes ?? 5,
  );
  const [days, setDays] = useState<number[]>(
    initialValues?.days ?? [1, 2, 3, 4, 5],
  );

  const previewAlarm = useMemo((): Alarm => {
    return {
      id: initialValues?.id ?? 'preview',
      startHour: to24Hour(hour, ampm),
      startMinute: minute,
      durationMinutes: duration,
      intervalMinutes: interval,
      snoozeDurationMinutes: snoozeDuration,
      days,
      enabled: true,
    };
  }, [hour, minute, ampm, duration, interval, snoozeDuration, days, initialValues?.id]);

  const sequence = useMemo(
    () => generateSequence(previewAlarm),
    [previewAlarm],
  );

  // Notification count check
  const otherAlarms = alarms.filter((a) => a.id !== initialValues?.id);
  const otherCount = countScheduledNotifications(otherAlarms);
  const thisCount = sequence.length * (days.length || 1);
  const totalCount = otherCount + thisCount;
  const overLimit = totalCount > IOS_NOTIFICATION_LIMIT;

  const toggleDay = useCallback((day: number) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (overLimit) return;
    const alarm: Alarm = {
      ...previewAlarm,
      id: initialValues?.id ?? Crypto.randomUUID(),
    };
    await saveAlarm(alarm);
    router.back();
  }, [previewAlarm, initialValues?.id, saveAlarm, router, overLimit]);

  return (
    <View className="flex-1 bg-background">
      {/* Step indicators */}
      <View className="flex-row items-center justify-center gap-2 py-4">
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            className={`h-2 w-2 rounded-full ${
              s === step
                ? 'bg-cyan-400'
                : s < step
                  ? 'bg-cyan-400/50'
                  : 'bg-navy-600'
            }`}
          />
        ))}
      </View>

      <ScrollView className="flex-1 px-6" keyboardShouldPersistTaps="handled">
        {/* Step 1: Time Picker */}
        {step === 1 && (
          <View className="gap-6 pt-8">
            <Text className="text-center text-lg text-muted-foreground">
              Set alarm start time
            </Text>
            <TimePicker
              hour={hour}
              minute={minute}
              ampm={ampm}
              onChangeHour={setHour}
              onChangeMinute={setMinute}
              onChangeAmPm={setAmpm}
            />
          </View>
        )}

        {/* Step 2: Range Config */}
        {step === 2 && (
          <View className="gap-6 pt-4">
            <DurationSlider value={duration} onChange={setDuration} />
            <IntervalSelector
              value={interval}
              onChange={setInterval}
              maxInterval={duration}
            />
            <SnoozeSelector value={snoozeDuration} onChange={setSnoozeDuration} />
          </View>
        )}

        {/* Step 3: Preview & Schedule */}
        {step === 3 && (
          <View className="gap-6 pt-4">
            <SequencePreview
              sequence={sequence}
              durationMinutes={duration}
              intervalMinutes={interval}
            />
            <DaySelector selectedDays={days} onToggleDay={toggleDay} />

            {/* Notification count */}
            <View className="flex-row justify-between">
              <Text className="text-xs text-muted-foreground">
                Notifications
              </Text>
              <Text
                className={`text-xs font-semibold ${
                  overLimit ? 'text-danger-400' : 'text-muted-foreground'
                }`}
              >
                {totalCount} / {IOS_NOTIFICATION_LIMIT}
              </Text>
            </View>
            {overLimit && (
              <Text className="text-xs text-danger-400">
                Exceeds iOS notification limit. Reduce duration, interval, or
                active days.
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom navigation */}
      <View className="flex-row gap-3 px-6 pb-8 pt-4">
        {step > 1 && (
          <Pressable
            onPress={() => setStep(step - 1)}
            className="flex-1 items-center rounded-xl bg-navy-600 py-4"
            testID="btn-back"
          >
            <Text className="font-semibold text-muted-foreground">Back</Text>
          </Pressable>
        )}
        {step < 3 ? (
          <Pressable
            onPress={() => setStep(step + 1)}
            className="flex-1 items-center rounded-xl bg-cyan-400 py-4"
            testID="btn-next"
          >
            <Text className="font-semibold text-black">Next</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleSave}
            disabled={overLimit}
            className={`flex-1 items-center rounded-xl py-4 ${
              overLimit ? 'bg-navy-600' : 'bg-cyan-400'
            }`}
            testID="btn-save"
          >
            <Text
              className={`font-semibold ${
                overLimit ? 'text-muted-foreground' : 'text-black'
              }`}
            >
              {initialValues ? 'Update Alarm' : 'Save Alarm'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Verify types compile**

```bash
cd /home/ubuntu/projects/alarm && pnpm type-check
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/alarm/screens/create-screen.tsx
git commit -m "feat: add create screen with 3-step wizard"
```

---

### Task 20: Ringing Screen

**Files:**
- Create: `src/features/alarm/screens/ringing-screen.tsx`

- [ ] **Step 1: Implement ringing screen**

```tsx
// src/features/alarm/screens/ringing-screen.tsx

import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui';
import { dismissAllRemaining, scheduleSnooze } from '../services/scheduler';
import { useAlarmStore } from '../stores/use-alarm-store';
import { useRingingStore } from '../stores/use-ringing-store';

export function RingingScreen() {
  const router = useRouter();
  const {
    activeAlarmId,
    currentSequenceIndex,
    totalInSequence,
    intensityTier,
    snoozeDurationMinutes,
    clear,
  } = useRingingStore();
  const alarms = useAlarmStore((s) => s.alarms);
  const alarm = alarms.find((a) => a.id === activeAlarmId);

  // Current time display
  const [time, setTime] = useState(() => {
    const now = new Date();
    const h = now.getHours() % 12 || 12;
    const m = String(now.getMinutes()).padStart(2, '0');
    const ap = now.getHours() >= 12 ? 'PM' : 'AM';
    return `${h}:${m} ${ap}`;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const h = now.getHours() % 12 || 12;
      const m = String(now.getMinutes()).padStart(2, '0');
      const ap = now.getHours() >= 12 ? 'PM' : 'AM';
      setTime(`${h}:${m} ${ap}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Pulse animation
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 800 }),
        withTiming(1, { duration: 800 }),
      ),
      -1,
    );
  }, [scale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const goBack = useCallback(() => {
    clear();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(alarm)' as any);
    }
  }, [clear, router]);

  const handleSnooze = useCallback(async () => {
    if (!activeAlarmId) return;
    await scheduleSnooze(
      activeAlarmId,
      snoozeDurationMinutes,
      intensityTier,
      currentSequenceIndex,
      totalInSequence,
    );
    goBack();
  }, [
    activeAlarmId,
    snoozeDurationMinutes,
    intensityTier,
    currentSequenceIndex,
    totalInSequence,
    goBack,
  ]);

  const handleDismissThis = useCallback(() => {
    goBack();
  }, [goBack]);

  const handleDismissAll = useCallback(async () => {
    if (alarm) {
      await dismissAllRemaining(alarm, currentSequenceIndex);
    }
    goBack();
  }, [alarm, currentSequenceIndex, goBack]);

  if (!activeAlarmId) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">No active alarm</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-background px-8">
      {/* Pulsing ring */}
      <Animated.View
        style={pulseStyle}
        className="mb-8 h-40 w-40 items-center justify-center rounded-full border-4 border-cyan-400"
      >
        <Text className="text-5xl">&#9200;</Text>
      </Animated.View>

      {/* Current time */}
      <Text className="mb-2 text-5xl font-bold text-white">{time}</Text>

      {/* Label */}
      <Text className="mb-1 text-base text-cyan-400">
        {alarm?.label || 'Range Alarm'}
      </Text>

      {/* Sequence indicator */}
      <Text className="mb-8 text-sm text-muted-foreground">
        Alarm {currentSequenceIndex + 1} of {totalInSequence}
      </Text>

      {/* Action buttons */}
      <View className="w-full gap-3">
        <Pressable
          onPress={handleSnooze}
          className="items-center rounded-xl bg-cyan-400 py-4"
          testID="btn-snooze"
        >
          <Text className="font-semibold text-black">
            Snooze {snoozeDurationMinutes} min
          </Text>
        </Pressable>

        <Pressable
          onPress={handleDismissThis}
          className="items-center rounded-xl bg-navy-600 py-4"
          testID="btn-dismiss-this"
        >
          <Text className="font-semibold text-muted-foreground">
            Dismiss This
          </Text>
        </Pressable>

        <Pressable
          onPress={handleDismissAll}
          className="items-center rounded-xl bg-danger-600 py-4"
          testID="btn-dismiss-all"
        >
          <Text className="font-semibold text-white">Dismiss All</Text>
        </Pressable>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Verify types compile**

```bash
cd /home/ubuntu/projects/alarm && pnpm type-check
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/alarm/screens/ringing-screen.tsx
git commit -m "feat: add ringing screen with pulse animation"
```

---

### Task 21: Route Files

**Files:**
- Create: `src/app/(alarm)/_layout.tsx`
- Create: `src/app/(alarm)/index.tsx`
- Create: `src/app/(alarm)/create.tsx`
- Create: `src/app/(alarm)/edit/[id].tsx`
- Create: `src/app/ringing.tsx`

- [ ] **Step 1: Create alarm group layout**

```tsx
// src/app/(alarm)/_layout.tsx

import { Stack } from 'expo-router';

export default function AlarmLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0a0e1a' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="create"
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
```

- [ ] **Step 2: Create route files**

```tsx
// src/app/(alarm)/index.tsx

export { HomeScreen as default } from '@/features/alarm/screens/home-screen';
```

```tsx
// src/app/(alarm)/create.tsx

export { CreateScreen as default } from '@/features/alarm/screens/create-screen';
```

```tsx
// src/app/(alarm)/edit/[id].tsx

import { useLocalSearchParams } from 'expo-router';

import { CreateScreen } from '@/features/alarm/screens/create-screen';
import { useAlarmStore } from '@/features/alarm/stores/use-alarm-store';

export default function EditAlarmRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const alarm = useAlarmStore((s) => s.alarms.find((a) => a.id === id));

  if (!alarm) return null;

  return <CreateScreen initialValues={alarm} />;
}
```

```tsx
// src/app/ringing.tsx

export { RingingScreen as default } from '@/features/alarm/screens/ringing-screen';
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(alarm\)/_layout.tsx src/app/\(alarm\)/index.tsx src/app/\(alarm\)/create.tsx src/app/\(alarm\)/edit/\[id\].tsx src/app/ringing.tsx
git commit -m "feat: add alarm route files"
```

---

### Task 22: Update Root Layout

**Files:**
- Modify: `src/app/_layout.tsx`

- [ ] **Step 1: Update root layout**

Modify `src/app/_layout.tsx` to:

1. Change `initialRouteName` from `'(app)'` to `'(alarm)'`
2. Add `(alarm)` and `ringing` as stack screens
3. Add notification permission request and channel setup on mount
4. Add the `useNotificationListener` hook
5. Add `hydrateAlarms` call
6. Remove `APIProvider` wrapper (not needed for local-only alarm app)

Replace the `unstable_settings` export:
```typescript
export const unstable_settings = {
  initialRouteName: '(alarm)',
};
```

Add imports:
```typescript
import * as Notifications from 'expo-notifications';
import { useNotificationListener } from '@/features/alarm/hooks/use-notification-listener';
import { setupNotificationChannels } from '@/features/alarm/services/scheduler';
import { useAlarmStore } from '@/features/alarm/stores/use-alarm-store';
```

Add to module scope (after `hydrateAuth()`):
```typescript
useAlarmStore.getState().hydrate();

// Configure foreground notification behavior — show alert and play sound
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
```

Inside `RootLayout`, add before the return:
```typescript
useNotificationListener();

React.useEffect(() => {
  async function setup() {
    await Notifications.requestPermissionsAsync();
    await setupNotificationChannels();
  }
  setup();
}, []);
```

Update the Stack screens:
```tsx
<Stack>
  <Stack.Screen name="(alarm)" options={{ headerShown: false }} />
  <Stack.Screen
    name="ringing"
    options={{
      headerShown: false,
      presentation: 'fullScreenModal',
      animation: 'fade',
    }}
  />
  <Stack.Screen name="(app)" options={{ headerShown: false }} />
  <Stack.Screen name="onboarding" options={{ headerShown: false }} />
  <Stack.Screen name="login" options={{ headerShown: false }} />
</Stack>
```

In the `Providers` function, remove the `<APIProvider>` wrapper and its import `import { APIProvider } from '@/lib/api'` (keep its children):
```tsx
function Providers({ children }: { children: React.ReactNode }) {
  const theme = useThemeConfig();
  return (
    <GestureHandlerRootView
      style={styles.container}
      className={theme.dark ? `dark` : undefined}
    >
      <KeyboardProvider>
        <ThemeProvider value={theme}>
          <BottomSheetModalProvider>
            {children}
            <FlashMessage position="top" />
          </BottomSheetModalProvider>
        </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 2: Verify types compile**

```bash
cd /home/ubuntu/projects/alarm && pnpm type-check
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/_layout.tsx
git commit -m "feat: update root layout for alarm app routing and notifications"
```

---

## Chunk 5: Integration, Sound Assets, and Background Task

### Task 23: Add Placeholder Sound Assets

**Files:**
- Create: `assets/sounds/gentle.wav`
- Create: `assets/sounds/moderate.wav`
- Create: `assets/sounds/strong.wav`
- Create: `assets/sounds/aggressive.wav`

- [ ] **Step 1: Create placeholder sound files**

Generate minimal valid WAV files as placeholders. These will be replaced with real alarm tones later:

```bash
mkdir -p /home/ubuntu/projects/alarm/assets/sounds

# Generate minimal 1-second WAV files using Python
python3 -c "
import struct, math

def make_wav(filename, freq, duration=1.0, volume=0.5):
    sample_rate = 44100
    num_samples = int(sample_rate * duration)
    data = b''
    for i in range(num_samples):
        t = i / sample_rate
        value = int(volume * 32767 * math.sin(2 * math.pi * freq * t))
        data += struct.pack('<h', value)

    # WAV header
    header = struct.pack('<4sI4s4sIHHIIHH4sI',
        b'RIFF', 36 + len(data), b'WAVE',
        b'fmt ', 16, 1, 1, sample_rate, sample_rate * 2, 2, 16,
        b'data', len(data))

    with open(filename, 'wb') as f:
        f.write(header + data)

make_wav('assets/sounds/gentle.wav', 440, 1.0, 0.3)
make_wav('assets/sounds/moderate.wav', 660, 1.0, 0.5)
make_wav('assets/sounds/strong.wav', 880, 1.0, 0.7)
make_wav('assets/sounds/aggressive.wav', 1100, 1.0, 1.0)
"
```

- [ ] **Step 2: Commit**

```bash
git add assets/sounds/
git commit -m "feat: add placeholder alarm sound files"
```

---

### Task 24: Background Re-scheduling Task

**Files:**
- Create: `src/features/alarm/services/background-task.ts`

Note: This requires `expo-background-fetch` (not listed in the original spec but needed for `BackgroundFetch.registerTaskAsync` and result enum).

- [ ] **Step 1: Install expo-background-fetch**

```bash
cd /home/ubuntu/projects/alarm && pnpm add expo-background-fetch
```

- [ ] **Step 2: Implement background task**

```typescript
// src/features/alarm/services/background-task.ts

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
```

- [ ] **Step 3: Verify types compile**

```bash
cd /home/ubuntu/projects/alarm && pnpm type-check
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/features/alarm/services/background-task.ts package.json pnpm-lock.yaml
git commit -m "feat: add background re-scheduling task"
```

---

### Task 25: Wire Up Background Task and Foreground Re-scheduling

**Files:**
- Modify: `src/app/_layout.tsx`

- [ ] **Step 1: Add background task registration and foreground re-schedule**

In `src/app/_layout.tsx`, add imports:
```typescript
import { AppState } from 'react-native';
import { registerBackgroundTask } from '@/features/alarm/services/background-task';
import { rescheduleAllAlarms } from '@/features/alarm/services/scheduler';
```

Inside the `RootLayout` component, update the existing `useEffect` to also register the background task and add foreground re-scheduling:

```typescript
React.useEffect(() => {
  async function setup() {
    await Notifications.requestPermissionsAsync();
    await setupNotificationChannels();
    await registerBackgroundTask();
  }
  setup();

  // Re-schedule on app foreground
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      const alarms = useAlarmStore.getState().alarms;
      rescheduleAllAlarms(alarms);
    }
  });
  return () => sub.remove();
}, []);
```

- [ ] **Step 2: Verify types compile**

```bash
cd /home/ubuntu/projects/alarm && pnpm type-check
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/_layout.tsx
git commit -m "feat: wire up background task and foreground re-scheduling"
```

---

### Task 26: Run All Tests

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

```bash
cd /home/ubuntu/projects/alarm && pnpm test --no-coverage
```

Expected: All tests PASS. If any fail, fix them before proceeding.

- [ ] **Step 2: Run type check**

```bash
cd /home/ubuntu/projects/alarm && pnpm type-check
```

Expected: PASS.

- [ ] **Step 3: Run linter**

```bash
cd /home/ubuntu/projects/alarm && pnpm lint
```

Expected: PASS (fix any lint issues before proceeding).

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -u src/ app.config.ts
git commit -m "fix: resolve test/lint/type issues"
```
