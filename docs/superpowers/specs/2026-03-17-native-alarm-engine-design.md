# Native Alarm Engine Design

**Date:** 2026-03-17
**Status:** Approved
**Scope:** Android only

## Problem

The current alarm implementation uses `expo-notifications` to schedule local notifications. This results in:

- Sound plays for ~5-10 seconds (notification duration), then stops — not a real alarm
- Volume follows notification channel settings, not alarm stream
- No continuous ringing until user dismisses
- No foreground service — Android can defer or batch delivery (Doze mode)
- No guaranteed exact timing (uses notification scheduling, not AlarmManager)

Users only receive a brief notification when an alarm fires — no actual alarm behavior.

## Solution

Replace `expo-notifications` entirely for alarm functionality with a native Android alarm engine built into the existing `modules/alarm-fullscreen` Expo module. The native layer handles scheduling (AlarmManager), ringing (foreground Service + MediaPlayer), and boot recovery. The JS layer handles UI, state management, and sequence generation.

## Architecture

### Native Module Components

All files in `modules/alarm-fullscreen/android/src/main/java/expo/modules/alarmfullscreen/`:

| File | Purpose | Status |
|------|---------|--------|
| `AlarmFullscreenModule.kt` | JS bridge — exports functions to JS | Existing, expanded |
| `AlarmPresentationDelegate.kt` | Builds notification with full-screen intent | Existing, repurposed |
| `AlarmNotificationsService.kt` | Notification service provider | Existing |
| `AlarmScheduler.kt` | Wraps `AlarmManager.setExactAndAllowWhileIdle()` | **New** |
| `AlarmReceiver.kt` | `BroadcastReceiver` — OS fires this at alarm time | **New** |
| `AlarmService.kt` | Foreground service: `MediaPlayer` + `Vibrator` | **New** |
| `AlarmStorage.kt` | `SharedPreferences` for alarm data (reboot recovery) | **New** |
| `BootReceiver.kt` | `BOOT_COMPLETED` receiver — reschedules all alarms | **New** |

### JS Bridge Functions

Added to `AlarmFullscreenModule.kt`:

- `scheduleAlarm(id, triggerTimestamp, soundFile, intensityTier, vibrationPattern, label, sequenceIndex, totalInSequence, dayIndex, snoozeDuration, maxSnoozeCount)` — schedules one alarm entry via AlarmManager
- `cancelAlarm(id)` — cancels a single scheduled alarm
- `cancelAllAlarms()` — cancels everything
- `stopRinging()` — stops the foreground service (sound + vibration)
- `snoozeRinging(snoozeDurationMs)` — stops current ringing, schedules a new alarm at now + duration
- `isRinging()` — returns whether the service is currently active
- `getScheduledAlarmIds()` — returns list of currently scheduled alarm IDs

### Data Flow

1. JS `scheduler.ts` generates the sequence, computes trigger timestamps, calls `AlarmEngine.scheduleAlarm()` for each sequence item
2. `AlarmScheduler` registers with `AlarmManager` using a `PendingIntent` targeting `AlarmReceiver`
3. At trigger time: OS fires `AlarmReceiver.onReceive()` → starts `AlarmService` as foreground service
4. `AlarmService`: plays sound on `STREAM_ALARM` (looping, alarm volume), vibrates, posts notification with full-screen intent + Snooze/Dismiss actions
5. Full-screen intent opens app → JS ringing screen shows
6. User taps Snooze/Dismiss → JS calls `snoozeRinging()` or `stopRinging()` → native service stops

## AlarmService (Foreground Service) Behavior

### Startup

When `AlarmReceiver` triggers:
1. Starts `AlarmService` via `startForegroundService()`
2. Service immediately calls `startForeground()` with a notification (required within 5 seconds)

### Notification

- Channel: high-importance alarm channel
- Category: `CATEGORY_ALARM`
- Full-screen intent: launches app to ringing screen
- Action buttons: Snooze / Dismiss (handled natively)
- Ongoing + non-dismissable (user must explicitly act)

### Sound Playback

- `MediaPlayer` initialized with correct sound file (gentle.wav, moderate.wav, etc.)
- Audio stream: `STREAM_ALARM` (uses alarm volume, bypasses DND if alarm exceptions enabled)
- Volume: device's alarm stream max
- Looping: `setLooping(true)` — plays indefinitely until stopped
- `AudioAttributes` with `USAGE_ALARM` + `CONTENT_TYPE_SONIFICATION`

### Vibration

- `Vibrator` with the intensity tier's pattern (from existing `VIBRATION_PATTERNS`)
- Repeats indefinitely (`repeat = 0`)

### Wake Lock

- Partial wake lock to prevent CPU from sleeping while alarm plays

### Stopping (Dismiss or Snooze)

- `MediaPlayer.stop()` + `release()`
- `Vibrator.cancel()`
- Wake lock released
- `stopForeground(STOP_FOREGROUND_REMOVE)` — removes notification
- `stopSelf()` — kills the service

### Overlapping Alarms

If a new alarm fires while one is already ringing (e.g., 7:10 fires while 7:00 is still going), the service stops the current sound and starts the new one (higher intensity). Only one alarm rings at a time.

## Sequence Behavior

Each sequence item (e.g., 7:00 gentle, 7:10 moderate, 7:20 strong, 7:30 aggressive) is scheduled as a **separate, independent `AlarmManager` entry**. Dismissing one does not cancel others.

This is the core design choice for the "range alarm" use case: the sequence keeps escalating even if the user dismisses an earlier alarm and falls back asleep. "Dismiss All" is available as the explicit "I'm fully awake" action.

## AlarmStorage & Boot Recovery

### Problem

When the device reboots, all `AlarmManager` entries are wiped. The native layer needs its own store to reschedule.

### Storage Format

`SharedPreferences` with each alarm entry as JSON:

```json
{
  "id": "alarmId_dayIndex_sequenceIndex",
  "triggerTimestamp": 1742300400000,
  "soundFile": "moderate.wav",
  "intensityTier": "moderate",
  "vibrationPattern": [100, 100],
  "label": "Wake up",
  "alarmId": "abc-123",
  "sequenceIndex": 1,
  "totalInSequence": 4,
  "dayIndex": 2,
  "snoozeDurationMinutes": 5,
  "maxSnoozeCount": 3
}
```

### BootReceiver

1. Listens for `BOOT_COMPLETED`, `QUICKBOOT_POWERON`
2. Reads all entries from `AlarmStorage`
3. Skips any with `triggerTimestamp` in the past
4. For recurring alarms with past timestamps: computes next occurrence (advance by 7 days)
5. Re-registers each with `AlarmManager`

### Storage Lifecycle

- `scheduleAlarm()` → writes entry
- `cancelAlarm()` → removes entry
- `cancelAllAlarms()` → clears all entries
- `stopRinging()` → removes the fired entry
- `snoozeRinging()` → removes old entry, writes new entry with updated timestamp

### Sync with JS Layer

JS `rescheduleAllAlarms()` (called on app foreground) remains the source of truth. It calls `cancelAllAlarms()` then re-schedules everything from the Zustand store. Native storage self-corrects every time the app opens — it's a safety net for reboot recovery.

## JS-Side Changes

### `modules/alarm-fullscreen/index.ts`

Add new bridge function exports:
- `scheduleAlarm(params)`
- `cancelAlarm(id)`
- `cancelAllAlarms()`
- `stopRinging()`
- `snoozeRinging(durationMs)`
- `isRinging()`

### `src/features/alarm/services/scheduler.ts`

- `scheduleAlarmSequence()` — calls `AlarmEngine.scheduleAlarm()` for each sequence item instead of `Notifications.scheduleNotificationAsync()`
- `cancelAlarmNotifications()` — calls `AlarmEngine.cancelAlarm()` for each ID
- `scheduleSnooze()` — calls `AlarmEngine.snoozeRinging()`
- `rescheduleAllAlarms()` — calls `AlarmEngine.cancelAllAlarms()` then re-schedules
- **Remove:** `setupNotificationChannels()`, `setupNotificationCategory()`

### `src/features/alarm/hooks/use-notification-listener.ts`

- Remove `expo-notifications` listeners
- Replace with native module event listeners:
  - `onAlarmFired` → sets ringing store, navigates to `/ringing`
  - `onAlarmDismissed` (from notification action button) → clears ringing store
  - `onAlarmSnoozed` (from notification action button) → triggers snooze logic

### `src/features/alarm/screens/ringing-screen.tsx`

- Snooze button calls `AlarmEngine.snoozeRinging()` then `stopRinging()`
- Dismiss buttons call `AlarmEngine.stopRinging()`
- Dismiss All also calls `AlarmEngine.cancelAlarm()` for remaining sequence items

### `src/app/_layout.tsx`

- Remove `Notifications.setNotificationHandler()`
- Remove `setupNotificationChannels()`, `setupNotificationCategory()`
- Remove `Notifications.requestPermissionsAsync()`
- Keep `registerBackgroundTask()` and `rescheduleAllAlarms()` on foreground

### `src/features/alarm/services/background-task.ts`

- Unchanged logic — calls updated `rescheduleAllAlarms()` which uses native module internally

## Permissions & Manifest

### AndroidManifest.xml (native module)

```xml
<!-- Existing (via app.config.ts plugin, move to native manifest) -->
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />
<uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT" />

<!-- New -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />

<!-- Components -->
<service
    android:name=".AlarmService"
    android:foregroundServiceType="mediaPlayback"
    android:exported="false" />

<receiver
    android:name=".AlarmReceiver"
    android:exported="false" />

<receiver
    android:name=".BootReceiver"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
        <action android:name="android.intent.action.QUICKBOOT_POWERON" />
        <action android:name="com.htc.intent.action.QUICKBOOT_POWERON" />
    </intent-filter>
</receiver>
```

### Permission Checks

Add to `use-alarm-permissions.ts`:
- `canScheduleExactAlarms()` — checks `AlarmManager.canScheduleExactAlarms()` (API 31+)

### Sound Files

The 4 WAV files (`gentle.wav`, `moderate.wav`, `strong.wav`, `aggressive.wav`) need to be copied into `android/app/src/main/res/raw/` at build time so `MediaPlayer` can load them via `R.raw.gentle`. Added via Expo config plugin in `app.config.ts`.

## Removals

### Fully removed from alarm path:

- **`expo-notifications`** — removed from `package.json`
- All `Notifications.*` calls in `scheduler.ts`
- All notification listeners in `use-notification-listener.ts`
- `Notifications.setNotificationHandler()` in `_layout.tsx`
- `expo-notifications` plugin in `app.config.ts`
- `withAlarmPermissions` config plugin in `app.config.ts` (permissions move to native manifest)

### Kept:

- `expo-background-fetch` + `expo-task-manager` — periodic rescheduling
- `modules/alarm-fullscreen/` — expanded with new native components
- All JS UI code (ringing screen, alarm creation, stores, sequence generation)
