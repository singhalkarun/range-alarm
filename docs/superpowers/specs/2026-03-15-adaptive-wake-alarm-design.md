# Adaptive Wake — Range Alarm App Design

## Overview

Adaptive Wake is a mobile alarm app that replaces single-alarm wake-ups with a **range alarm** system. Users set a start time, duration, and interval to generate a sequence of alarms that progressively intensify, increasing the chance of waking up over the specified window.

**Platform:** iOS + Android (Expo SDK 54, React Native)
**Architecture:** Fully local — no backend. MMKV for persistence, Zustand for state, `expo-notifications` for scheduling.

## Data Model

### Alarm Entity (persisted to MMKV)

```typescript
type Alarm = {
  id: string;                     // UUID
  startHour: number;              // 0-23
  startMinute: number;            // 0-59
  durationMinutes: number;        // Range duration (e.g., 30)
  intervalMinutes: number;        // Ring interval (e.g., 10)
  snoozeDurationMinutes: number;  // Configurable snooze (2, 5, 10)
  days: number[];                 // 0=Sun..6=Sat, empty = one-time
  enabled: boolean;
  label?: string;
};
```

### Derived at Runtime

- `generateSequence(alarm)` — computes the ordered list of alarm times from start time, duration, and interval. Handles midnight boundary wrap-around. Capped at 64 entries.
- `getIntensityTier(sequenceIndex, totalCount)` — returns one of four tiers (gentle, moderate, strong, aggressive) based on position in sequence.

### Notification ID Convention

Each scheduled notification uses a deterministic ID: `{alarmId}_{dayIndex}_{sequenceIndex}`. This allows targeted cancellation for "Dismiss All" (cancel remaining in today's sequence) and toggle-off (cancel all for an alarm).

## State Management

### `useAlarmStore` (Zustand + MMKV persist)

- `alarms: Alarm[]` — the source of truth
- `addAlarm(alarm)` / `updateAlarm(id, partial)` / `deleteAlarm(id)`
- `toggleAlarm(id)` — flip `enabled`, trigger re-schedule or cancel

### `useRingingStore` (Zustand, ephemeral)

- `activeAlarmId: string | null`
- `currentSequenceIndex: number`
- `totalInSequence: number`
- `intensityTier: IntensityTier`

Used exclusively by the ringing screen. Not persisted — if the app is killed during ringing, the notification remains in the OS notification shade.

## Notification Scheduling

### Approach: Pre-schedule All Independently

When a user saves or enables an alarm, all notifications in the sequence are scheduled independently via `expo-notifications`. Each fires regardless of whether the user interacted with previous ones.

### Scheduling Flow

1. User saves/edits an alarm → `scheduleAlarmSequence(alarm)` runs
2. Cancel any existing notifications for this alarm ID
3. For each enabled day, compute all alarm times via `generateSequence()`
4. For each time in the sequence, determine intensity tier and select corresponding sound/vibration
5. Schedule via `Notifications.scheduleNotificationAsync()` with a date trigger
6. Store notification IDs for later cancellation

### Recurring Alarm Re-scheduling

Individual notifications are scheduled for the next 7 days. A weekly re-scheduling mechanism refreshes them:

- **Primary:** `expo-task-manager` background fetch task, registered to run periodically. On each run, cancel expired notifications and schedule the next 7 days.
- **Fallback:** Re-schedule on app foreground via `AppState` listener.

This approach is necessary because each alarm in a sequence needs a different sound/intensity, so repeating triggers cannot be used.

### Snooze

When the user taps "Snooze" on the ringing screen, a one-off notification is scheduled with ID `{alarmId}_snooze_{timestamp}`, firing in `snoozeDurationMinutes`. It uses the same intensity tier as the alarm that was snoozed.

### Dismiss Behaviors

- **Dismiss This:** Dismisses the current notification only. The next alarm in the sequence fires at its scheduled time.
- **Dismiss All:** Cancels all remaining notifications in today's sequence for this alarm (all IDs matching `{alarmId}_{todayDayIndex}_{i}` where `i > currentIndex`). Also cancels any active snooze for this alarm.

## Progressive Intensity

Sound and vibration escalate through the alarm sequence based on position:

| Sequence Position | Tier       | Sound         | Vibration          |
|-------------------|------------|---------------|--------------------|
| First 25%         | Gentle     | Soft chime    | Single short pulse |
| 25–50%            | Moderate   | Medium tone   | Double pulse       |
| 50–75%            | Strong     | Louder tone   | Continuous short   |
| Last 25%          | Aggressive | Sharp alarm   | Continuous long    |

Four audio files are bundled as assets. The tier is determined at schedule time from `sequenceIndex / totalCount` and encoded in the notification's channel (Android) or sound file (iOS).

## Navigation & Routing

### Route Structure (Expo Router)

```
src/app/
  _layout.tsx              — Root layout: notification listeners, permission setup
  ringing.tsx              — Full-screen alarm modal (root-level, outside tab groups)
  (alarm)/
    _layout.tsx            — Stack layout for alarm screens
    index.tsx              — Home: alarm list
    create.tsx             — 3-step creation wizard
    edit/[id].tsx          — Edit: pre-filled wizard
  (app)/                   — Existing auth/settings (hidden, retained for later)
```

### Screen Descriptions

**Home (`(alarm)/index.tsx`)**
- Alarm card list (FlashList)
- Each card shows: start time, range/interval info, intensity dots, day chips, enable toggle
- FAB "+" navigates to create
- Tap card navigates to edit
- Swipe-to-delete with confirmation
- Empty state when no alarms exist
- Permission banner if notification permissions not granted

**Create / Edit (`(alarm)/create.tsx`, `(alarm)/edit/[id].tsx`)**
- 3-step wizard with step-dot progress indicator
- Step 1: Time picker (scrollable hour/minute, AM/PM toggle)
- Step 2: Duration slider, interval quick-select (2, 5, 10, 15, 20 min), snooze duration selector
- Step 3: Sequence preview (timeline visualization), summary stats, day-of-week selector
- Edit mode: determined by presence of `[id]` route param, pre-fills from store
- Save triggers notification scheduling

**Ringing (`ringing.tsx`)**
- Root-level modal — renders full-screen over everything
- Triggered by notification response listener in root layout
- Pulsing alarm animation with intensity-appropriate visual treatment
- Large current time display
- Sequence counter ("Alarm 2 of 4")
- Progressive intensity indicator
- Three action buttons: Snooze (configurable duration), Dismiss This, Dismiss All

### Navigation Triggers

- FAB on Home → push `create`
- Tap alarm card → push `edit/[id]`
- Save alarm → pop back to Home
- Notification received while app is foregrounded → navigate to `ringing` modal
- Notification tapped from shade → launch app and navigate to `ringing` modal

## Feature Module Structure

```
src/features/alarm/
├── stores/
│   ├── use-alarm-store.ts           # Zustand + MMKV: alarm CRUD
│   └── use-ringing-store.ts         # Ephemeral ringing state
├── services/
│   ├── scheduler.ts                 # Schedule/cancel notifications
│   ├── sequence-generator.ts        # Alarm config → time list
│   └── intensity.ts                 # Sequence index → tier + sound
├── screens/
│   ├── home-screen.tsx              # Alarm list
│   ├── create-screen.tsx            # 3-step wizard (shared for edit)
│   └── ringing-screen.tsx           # Full-screen alarm UI
├── components/
│   ├── alarm-card.tsx               # Single alarm card
│   ├── time-picker.tsx              # Hour/minute selector
│   ├── duration-slider.tsx          # Range duration control
│   ├── interval-selector.tsx        # Quick-select interval buttons
│   ├── snooze-selector.tsx          # Snooze duration picker
│   ├── day-selector.tsx             # Day-of-week chips
│   ├── sequence-preview.tsx         # Timeline visualization
│   └── intensity-indicator.tsx      # Progressive intensity visual
├── hooks/
│   ├── use-notification-listener.ts # Notification response → ringing
│   └── use-schedule-alarm.ts        # Hook wrapping scheduler
├── utils/
│   └── time.ts                      # 12/24hr conversion, midnight math
├── constants.ts                     # Sound files, intensity tiers, limits
└── types.ts                         # Alarm, AlarmSequenceItem, IntensityTier
```

### Boundaries

- **`services/`** — pure logic, no React dependencies. Independently testable.
- **`stores/`** — state only, no scheduling side effects.
- **`hooks/`** — bridge services and screens. `use-schedule-alarm` calls the scheduler on save.
- **`screens/`** — UI only. Consume stores and hooks.
- **`components/`** — reusable UI pieces consumed by screens.

## Visual Design

**Style:** Dark Cyan — matching the reference prototype.

- **Background:** Deep navy (#0a0e1a, #0d1b2a)
- **Accent:** Cyan (#00D4FF) for primary actions, active states, and enabled indicators
- **Cards:** Subtle gradient (dark navy range), thin cyan border for enabled alarms
- **Typography:** Inter font family, large bold time display, light secondary text
- **Intensity visualization:** Opacity-graduated cyan dots on alarm cards
- **Toggle:** Cyan when on, dark gray when off
- **FAB:** Cyan circle with cyan glow shadow
- **Ringing screen:** Pulsing cyan ring animation, intensity-appropriate color shifts (gentle=soft cyan, aggressive=bright white/cyan)

Styling via NativeWind/TailwindCSS, consistent with the project's existing approach.

## Error Handling & Edge Cases

### Notification Permissions

If denied, show a persistent inline banner on the Home screen explaining alarms won't fire. Include a "Grant Permission" button that opens OS settings. Re-check on app foreground via `AppState`.

### Platform Notification Limits

iOS allows a maximum of 64 scheduled local notifications. One range alarm with a 60-min duration at 1-min intervals consumes 61 slots. Enforce a warning when the total scheduled notification count across all enabled alarms approaches 64. Android has no practical limit.

### Midnight Boundary

`generateSequence()` wraps minutes past 1440 (midnight). A range starting at 11:50 PM with 30-min duration generates times crossing into the next day. The day assignment uses the start time's day for scheduling purposes.

### Alarm Overlap

Two range alarms overlapping in time both fire independently. No deduplication — this is intentional and expected.

### App Lifecycle

- **App killed:** Notifications are OS-scheduled and fire regardless. On relaunch, `useAlarmStore` rehydrates from MMKV.
- **App in background:** Notification response listener handles user interaction, navigating to the ringing screen.
- **App killed during ringing:** Ringing state is ephemeral. The notification remains in the OS shade for the user to interact with.

### Weekly Re-scheduling Failure

If the background task fails to run (OS restrictions), the app-foreground fallback ensures notifications are re-scheduled whenever the user opens the app. Alarms may stop firing after 7 days without opening the app — an acceptable trade-off for a local-only alarm app.
