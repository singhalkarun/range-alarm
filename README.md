# RangeAlarm

An Android alarm app that replaces the need to set multiple alarms. Instead of setting 7:00, 7:05, 7:10, 7:15 manually, create a single "range alarm" that escalates in intensity over time.

## How it works

Set a start time, duration, and interval. RangeAlarm generates a sequence of alarms that progressively escalate from gentle to aggressive:

```
7:00 AM  gentle     -> soft chime
7:10 AM  moderate   -> pulse tone
7:20 AM  strong     -> strong beat
7:30 AM  aggressive -> urgent alert
```

Each alarm in the sequence rings **continuously** until you interact with it — just like a real alarm clock.

## Features

- **Escalating sequences** — alarms progress through 4 intensity tiers (gentle, moderate, strong, aggressive)
- **Native alarm engine** — uses Android's `AlarmManager.setAlarmClock()` + foreground `Service` + `MediaPlayer` on `STREAM_ALARM` for reliable, loud alarms that work even when the app is killed
- **Sound selection** — pick from your device's built-in alarm tones or use bundled sounds
- **Full-screen intent** — alarm displays over the lock screen
- **Snooze with limits** — configurable snooze duration (2/5/10 min) and max snooze count
- **Boot recovery** — alarms are rescheduled after device reboot
- **Auto-silence** — alarms stop after 10 minutes if not interacted with

## Tech Stack

- **Expo SDK 54** / React Native 0.81
- **TypeScript** throughout
- **Expo Router** — file-based navigation
- **Zustand + MMKV** — state management and persistence
- **Custom Expo Native Module** (Kotlin) — alarm scheduling, foreground service, sound playback
- **Tailwind CSS** via Uniwind

## Architecture

```
src/features/alarm/
├── components/         # UI: AlarmCard, TimePicker, SoundSelector, etc.
├── screens/            # HomeScreen, CreateScreen, RingingScreen
├── services/           # scheduler.ts, sequence-generator.ts, intensity.ts
├── stores/             # Zustand stores (alarm data, ringing state)
├── hooks/              # useAlarmEventListener, useAlarmPermissions, useScheduleAlarm
├── types.ts            # Alarm, AlarmSequenceItem, IntensityTier
└── constants.ts        # Intensity tiers, sound files, vibration patterns

modules/alarm-fullscreen/
├── index.ts            # JS bridge exports
└── android/src/main/java/expo/modules/alarmfullscreen/
    ├── AlarmFullscreenModule.kt   # Expo Modules API bridge
    ├── AlarmScheduler.kt          # AlarmManager.setAlarmClock() wrapper
    ├── AlarmReceiver.kt           # BroadcastReceiver (fire/snooze/dismiss)
    ├── AlarmService.kt            # Foreground service (MediaPlayer + Vibrator)
    ├── AlarmStorage.kt            # SharedPreferences for reboot recovery
    ├── AlarmNotificationHelper.kt # Notification with full-screen intent
    ├── AlarmEventBus.kt           # Native-to-JS event bridge
    └── BootReceiver.kt            # Reschedules alarms after reboot
```

### Alarm lifecycle

1. **JS** generates the alarm sequence and computes trigger timestamps
2. **Native** `AlarmScheduler` registers each with `AlarmManager.setAlarmClock()`
3. At trigger time: **OS** fires `AlarmReceiver` → starts `AlarmService` as foreground service
4. `AlarmService` plays sound on `STREAM_ALARM` (looping), vibrates, posts notification with full-screen intent
5. User interacts via ringing screen (Stop / Snooze / I'm Up) or notification buttons

## Development

```bash
# Install dependencies
pnpm install

# Start Metro bundler
pnpm start

# Generate native project
pnpm prebuild

# Run on Android
pnpm android

# Run tests
pnpm test

# Type check
pnpm type-check

# Lint
pnpm lint
```

### Android permissions

The app requires these permissions (declared in the native module's AndroidManifest.xml):

| Permission | Why |
|---|---|
| `USE_EXACT_ALARM` | Schedule alarms at exact times (auto-granted for alarm apps) |
| `USE_FULL_SCREEN_INTENT` | Show alarm over lock screen |
| `FOREGROUND_SERVICE` | Keep alarm service alive |
| `FOREGROUND_SERVICE_MEDIA_PLAYBACK` | Play alarm sound in foreground service |
| `POST_NOTIFICATIONS` | Display alarm notification (runtime permission on Android 13+) |
| `RECEIVE_BOOT_COMPLETED` | Reschedule alarms after reboot |
| `VIBRATE` | Vibration feedback |
| `WAKE_LOCK` | Prevent CPU sleep during alarm |

## Project structure

```
├── src/                    # React Native app source
│   ├── app/                # Expo Router file-based routes
│   ├── features/alarm/     # Alarm feature (main feature)
│   ├── components/ui/      # Shared UI components
│   └── lib/                # Utilities, storage, i18n
├── modules/alarm-fullscreen/  # Custom Expo native module (Kotlin)
├── assets/sounds/          # Bundled alarm sound files (WAV)
├── website/                # Next.js marketing site
└── docs/superpowers/       # Design specs and implementation plans
```
