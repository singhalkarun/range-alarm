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

### Key Design Decisions

- **`AlarmManager.setAlarmClock()`** is used as the primary scheduling method (not `setExactAndAllowWhileIdle()`). It shows the alarm icon in the status bar, is exempt from all battery optimization restrictions (including Android 15), and is the API specifically designed for alarm clock apps.
- **`USE_EXACT_ALARM`** is the primary permission (auto-granted for alarm apps, cannot be revoked by users). `SCHEDULE_EXACT_ALARM` is dropped — it requires runtime grant on API 33+ and is unnecessary for alarm clock apps.
- **Auto-silence timeout**: Alarms auto-silence after 10 minutes if the user does not interact (prevents indefinite battery drain). The alarm is treated as a missed alarm.
- **Snooze count tracked natively**: `AlarmStorage` tracks `snoozeCount` so notification action buttons can enforce snooze limits without the JS runtime.

## Architecture

### Native Module Components

All files in `modules/alarm-fullscreen/android/src/main/java/expo/modules/alarmfullscreen/`:

| File | Purpose | Status |
|------|---------|--------|
| `AlarmFullscreenModule.kt` | JS bridge — exports functions and events to JS | Existing, expanded |
| `AlarmScheduler.kt` | Wraps `AlarmManager.setAlarmClock()` | **New** |
| `AlarmReceiver.kt` | `BroadcastReceiver` — OS fires this at alarm time | **New** |
| `AlarmService.kt` | Foreground service: `MediaPlayer` + `Vibrator` + notification with full-screen intent | **New** |
| `AlarmStorage.kt` | `SharedPreferences` for alarm data (reboot recovery) | **New** |
| `BootReceiver.kt` | `BOOT_COMPLETED` receiver — reschedules all alarms | **New** |
| `AlarmNotificationHelper.kt` | Builds notification with full-screen intent, channels, action buttons | **New** |

**Deleted files:**
- `AlarmPresentationDelegate.kt` — extended `ExpoPresentationDelegate` from expo-notifications, no longer needed
- `AlarmNotificationsService.kt` — extended `NotificationsService` from expo-notifications, no longer needed

### JS Bridge Functions

Added to `AlarmFullscreenModule.kt`:

- `scheduleAlarm(id, triggerTimestamp, intensityTier, label, alarmId, sequenceIndex, totalInSequence, dayIndex, snoozeDurationMinutes, maxSnoozeCount, isRecurring)` — schedules one alarm entry via `AlarmManager.setAlarmClock()`. Sound file and vibration pattern are derived natively from `intensityTier` (mirrors the JS `intensity.ts` mapping).
- `cancelAlarm(id)` — cancels a single scheduled alarm and removes from storage
- `cancelAllAlarms()` — cancels all scheduled alarms and clears storage
- `stopRinging()` — stops the foreground service (sound + vibration)
- `snoozeRinging(snoozeDurationMinutes)` — stops current ringing, schedules a new alarm at `now + duration`. Increments `snoozeCount` in storage. Returns false if snooze limit reached.
- `isRinging()` — returns whether the service is currently active

### JS Events (Native → JS)

The module emits events via Expo Modules API `Events` DSL. Since `AlarmService` cannot directly access the Module instance, it uses a singleton `AlarmEventBus` object. The Module observes `AlarmEventBus` and calls `sendEvent()` when the JS runtime is active.

For the **cold-start case** (app not running when alarm fires): the full-screen intent launches the app with extras (`alarmId`, `sequenceIndex`, etc.) in the launch intent. The JS root layout reads these extras via `Linking.getInitialURL()` or `expo-linking` and sets the ringing store accordingly. Events are only for the **warm case** (app already foregrounded).

Events:
- `onAlarmFired` — alarm started ringing (data: alarmId, dayIndex, sequenceIndex, totalInSequence, intensityTier, snoozeDurationMinutes, snoozeCount, maxSnoozeCount)
- `onAlarmStopped` — alarm was stopped (from notification Dismiss button or auto-silence timeout)
- `onAlarmSnoozed` — alarm was snoozed (from notification Snooze button)

### Data Flow

1. JS `scheduler.ts` generates the sequence, computes trigger timestamps, calls `AlarmEngine.scheduleAlarm()` for each sequence item
2. `AlarmScheduler` registers with `AlarmManager.setAlarmClock()` using a `PendingIntent` targeting `AlarmReceiver`
3. At trigger time: OS fires `AlarmReceiver.onReceive()` → starts `AlarmService` as foreground service
4. `AlarmService`: plays sound on `STREAM_ALARM` (looping, alarm volume), vibrates, posts notification with full-screen intent + Snooze/Dismiss action buttons
5. Full-screen intent opens app → JS ringing screen shows
6. User interacts via one of three paths:
   - **JS ringing screen**: taps Snooze/Dismiss → JS calls `snoozeRinging()` or `stopRinging()`
   - **Notification action buttons** (app may not be open): Snooze/Dismiss `PendingIntent`s target `AlarmReceiver` with action extras (`ACTION_SNOOZE` / `ACTION_DISMISS`). `AlarmReceiver` updates storage, stops/reschedules the service, and emits events via `AlarmEventBus`.
   - **Auto-silence**: `AlarmService` posts a `Handler.postDelayed()` for 10 minutes. If not dismissed by then, stops itself and marks as missed.

## AlarmService (Foreground Service) Behavior

### Startup

When `AlarmReceiver` triggers:
1. Starts `AlarmService` via `startForegroundService()`
2. Service immediately calls `startForeground(id, notification, FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)` with a notification (required within 5 seconds). The foreground service type must be passed at runtime for API 34+ (targetSdk 35).

### Notification

Built by `AlarmNotificationHelper.kt`:
- Channel: `alarm-ringing` — high-importance, created at service start if not exists
- Category: `CATEGORY_ALARM`
- Full-screen intent: `PendingIntent` launching app's main activity with alarm data extras
- Action buttons:
  - **Snooze**: `PendingIntent` targeting `AlarmReceiver` with `ACTION_SNOOZE` extra + alarm data
  - **Dismiss**: `PendingIntent` targeting `AlarmReceiver` with `ACTION_DISMISS` extra + alarm data
- Ongoing + non-dismissable (user must explicitly act)
- Visibility: PUBLIC (shows on lock screen)

### Sound Playback

- `MediaPlayer` initialized with sound from `R.raw.*` based on intensity tier:
  - `gentle` → `R.raw.gentle`
  - `moderate` → `R.raw.moderate`
  - `strong` → `R.raw.strong`
  - `aggressive` → `R.raw.aggressive`
- Audio stream: `STREAM_ALARM` (uses alarm volume, bypasses DND if alarm exceptions enabled)
- Volume: device's alarm stream max
- Looping: `setLooping(true)` — plays until stopped or auto-silence timeout
- `AudioAttributes` with `USAGE_ALARM` + `CONTENT_TYPE_SONIFICATION`

### Vibration

- `Vibrator` with intensity tier's pattern (hardcoded in native to match JS `VIBRATION_PATTERNS`):
  - `gentle`: `[0, 100]`
  - `moderate`: `[0, 100, 100]`
  - `strong`: `[0, 100, 200, 100, 200]`
  - `aggressive`: `[0, 200, 300, 200, 300, 200]`
- Repeats indefinitely (`repeat = 0`)

### Wake Lock

- Partial wake lock to prevent CPU from sleeping while alarm plays
- Tagged `"alarm-engine:ringing"` for debugging

### Auto-Silence Timeout

- `Handler.postDelayed()` set for **10 minutes** after service start
- When triggered: stops sound/vibration, removes notification, stops service
- Alarm is treated as missed (not snoozed — it does not reschedule)

### Stopping (Dismiss or Snooze)

- `MediaPlayer.stop()` + `release()`
- `Vibrator.cancel()`
- Auto-silence handler cancelled
- Wake lock released
- `stopForeground(STOP_FOREGROUND_REMOVE)` — removes notification
- `stopSelf()` — kills the service
- Emits event via `AlarmEventBus` (`onAlarmStopped` or `onAlarmSnoozed`)

### Overlapping Alarms

If a new alarm fires while one is already ringing (e.g., 7:10 fires while 7:00 is still going), the service stops the current sound and starts the new one (higher intensity). Only one alarm rings at a time. The auto-silence timer resets for the new alarm.

## Sequence Behavior

Each sequence item (e.g., 7:00 gentle, 7:10 moderate, 7:20 strong, 7:30 aggressive) is scheduled as a **separate, independent `AlarmManager` entry**. Dismissing one does not cancel others.

This is the core design choice for the "range alarm" use case: the sequence keeps escalating even if the user dismisses an earlier alarm and falls back asleep. "Dismiss All" is available as the explicit "I'm fully awake" action.

## AlarmStorage & Boot Recovery

### Problem

When the device reboots, all `AlarmManager` entries are wiped. The native layer needs its own store to reschedule.

### Storage Format

`SharedPreferences` (name: `"alarm_engine_data"`) with each alarm entry as JSON keyed by `id`:

```json
{
  "id": "alarmId_dayIndex_sequenceIndex",
  "triggerTimestamp": 1742300400000,
  "intensityTier": "moderate",
  "label": "Wake up",
  "alarmId": "abc-123",
  "sequenceIndex": 1,
  "totalInSequence": 4,
  "dayIndex": 2,
  "snoozeDurationMinutes": 5,
  "maxSnoozeCount": 3,
  "snoozeCount": 0,
  "isRecurring": true
}
```

Notes:
- `soundFile` and `vibrationPattern` are omitted — derived from `intensityTier` at runtime
- `snoozeCount` tracks how many times this alarm has been snoozed (incremented by native snooze action)
- `isRecurring` distinguishes recurring alarms (can be rescheduled +7 days) from one-time alarms (cleaned up after firing)
- All writes use `commit()` (synchronous) to prevent race conditions between `AlarmReceiver`, `AlarmService`, and the main app process

### BootReceiver

1. Listens for `BOOT_COMPLETED`, `QUICKBOOT_POWERON`
2. Reads all entries from `AlarmStorage`
3. For each entry:
   - If `triggerTimestamp` is in the future → re-register with `AlarmManager`
   - If in the past AND `isRecurring` → advance by 7 days, update storage, re-register
   - If in the past AND NOT `isRecurring` → remove from storage (one-time alarm that was missed)
4. Re-registers each valid entry with `AlarmManager.setAlarmClock()`

### Storage Lifecycle

- `scheduleAlarm()` → writes entry
- `cancelAlarm()` → removes entry
- `cancelAllAlarms()` → clears all entries
- `stopRinging()` → removes the fired entry (for one-time); keeps for recurring
- `snoozeRinging()` → increments `snoozeCount`, removes old entry, writes new entry with updated timestamp

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

### `src/features/alarm/hooks/use-notification-listener.ts` → `use-alarm-event-listener.ts`

Renamed to reflect its new purpose. Two paths for detecting alarm:

**Warm start (app already running):**
- Listen for `onAlarmFired` event from native module via `AlarmEngine.addListener()`
- Sets ringing store, navigates to `/ringing`
- Listen for `onAlarmStopped` / `onAlarmSnoozed` to clear ringing store (e.g., user acted via notification button while app was backgrounded)

**Cold start (app launched by full-screen intent):**
- In root layout, check launch intent extras for `alarmId`
- If present, set ringing store from extras and navigate to `/ringing`

### `src/features/alarm/screens/ringing-screen.tsx`

- Snooze button calls `AlarmEngine.snoozeRinging(snoozeDurationMinutes)` — this stops current ringing AND schedules the snooze in one call
- Dismiss This button calls `AlarmEngine.stopRinging()`
- Dismiss All calls `AlarmEngine.stopRinging()` then cancels remaining sequence items by calling `AlarmEngine.cancelAlarm(id)` for each remaining ID (computed from `alarmId`, `dayIndex`, and `sequenceIndex + 1..totalInSequence`)

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
<!-- Permissions -->
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />
<uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT" />
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

Note: `SCHEDULE_EXACT_ALARM` is intentionally omitted. `USE_EXACT_ALARM` is auto-granted for alarm clock apps and cannot be revoked by users — it is the correct permission for this use case.

### Permission Checks

Update `use-alarm-permissions.ts`:
- Remove `Notifications.getPermissionsAsync()` check
- Keep `canUseFullScreenIntent()` and `isBatteryOptimizationEnabled()` as-is
- No need for `canScheduleExactAlarms()` — `USE_EXACT_ALARM` is always granted

### Sound Files

The 4 WAV files (`gentle.wav`, `moderate.wav`, `strong.wav`, `aggressive.wav`) need to be copied into `android/app/src/main/res/raw/` at build time so `MediaPlayer` can load them via `R.raw.gentle`.

This requires a **new Expo config plugin** (`withAlarmSounds`) in `app.config.ts` that:
1. Copies WAV files from `assets/sounds/` to `android/app/src/main/res/raw/`
2. Ensures filenames are lowercase alphanumeric with underscores only (current names are already compliant)

This replaces the sound file deployment previously handled by the `expo-notifications` plugin config.

### AlarmManager Entry Limits

Some OEMs impose soft limits on AlarmManager entries (~500). With the current design: a 120-min duration, 1-min interval, 7-day recurring alarm = 121 items x 7 days = 847 entries. The existing `MAX_SEQUENCE_LENGTH = 64` cap in JS prevents this from exceeding reasonable bounds (64 x 7 = 448 entries worst case for a single alarm). With multiple alarms, the total should be monitored but is unlikely to be a problem for typical usage.

## Removals

### Fully removed from alarm path:

- **`expo-notifications`** — removed from `package.json` (not used for anything else in this project)
- All `Notifications.*` calls in `scheduler.ts`
- `use-notification-listener.ts` — replaced by `use-alarm-event-listener.ts`
- `Notifications.setNotificationHandler()` in `_layout.tsx`
- `expo-notifications` plugin in `app.config.ts`
- `withAlarmPermissions` config plugin in `app.config.ts` (permissions move to native manifest)
- `AlarmPresentationDelegate.kt` — extended expo-notifications, no longer compiles
- `AlarmNotificationsService.kt` — extended expo-notifications, no longer compiles
- `expo-notifications` dependency in native module's `build.gradle`
- Notification channel setup / category setup (now handled natively in `AlarmNotificationHelper.kt`)

### Kept:

- `expo-background-fetch` + `expo-task-manager` — periodic rescheduling
- `modules/alarm-fullscreen/` — expanded with new native components
- All JS UI code (ringing screen, alarm creation, stores, sequence generation)
- `intensity.ts`, `sequence-generator.ts`, `constants.ts` — unchanged
