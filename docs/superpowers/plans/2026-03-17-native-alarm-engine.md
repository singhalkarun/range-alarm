# Native Alarm Engine Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace expo-notifications with a native Android alarm engine (AlarmManager + foreground Service + MediaPlayer) so alarms ring continuously until dismissed.

**Architecture:** Expand the existing `modules/alarm-fullscreen` Expo native module with Kotlin components for scheduling (AlarmManager.setAlarmClock), ringing (foreground Service with MediaPlayer on STREAM_ALARM), and boot recovery (BroadcastReceiver + SharedPreferences). JS layer keeps sequence generation, UI, and state — just swaps expo-notifications calls for native module bridge calls.

**Tech Stack:** Kotlin (Android), Expo Modules API, AlarmManager, MediaPlayer, SharedPreferences, TypeScript/React Native

**Spec:** `docs/superpowers/specs/2026-03-17-native-alarm-engine-design.md`

---

## File Map

### Native (Kotlin) — `modules/alarm-fullscreen/android/src/main/java/expo/modules/alarmfullscreen/`

| File | Action | Responsibility |
|------|--------|----------------|
| `AlarmStorage.kt` | Create | SharedPreferences CRUD for alarm entries (JSON serialization via org.json) |
| `AlarmScheduler.kt` | Create | Wraps AlarmManager.setAlarmClock(), creates PendingIntents targeting AlarmReceiver |
| `AlarmEventBus.kt` | Create | Singleton event bus — Service/Receiver post events, Module observes and forwards to JS |
| `AlarmNotificationHelper.kt` | Create | Builds notification channel, notification with full-screen intent + action buttons |
| `AlarmReceiver.kt` | Create | BroadcastReceiver — starts AlarmService on alarm trigger, handles Snooze/Dismiss actions from notification buttons |
| `AlarmService.kt` | Create | Foreground service — MediaPlayer (STREAM_ALARM, looping) + Vibrator + wake lock + auto-silence timeout |
| `BootReceiver.kt` | Create | BOOT_COMPLETED receiver — reads AlarmStorage, reschedules all valid entries |
| `AlarmFullscreenModule.kt` | Modify | Add bridge functions (scheduleAlarm, cancelAlarm, stopRinging, etc.) + event emission |
| `AlarmPresentationDelegate.kt` | Delete | Depends on expo-notifications |
| `AlarmNotificationsService.kt` | Delete | Depends on expo-notifications |

### Native Config

| File | Action | Responsibility |
|------|--------|----------------|
| `modules/alarm-fullscreen/android/src/main/AndroidManifest.xml` | Modify | Add permissions, service, receivers |
| `modules/alarm-fullscreen/android/build.gradle` | Modify | Remove expo-notifications dependency, add org.json (already in Android SDK) |
| `modules/alarm-fullscreen/expo-module.config.json` | Modify | No change needed (module class unchanged) |

### TypeScript

| File | Action | Responsibility |
|------|--------|----------------|
| `modules/alarm-fullscreen/index.ts` | Modify | Export new bridge functions + event listener setup |
| `src/features/alarm/services/scheduler.ts` | Modify | Replace expo-notifications calls with native module calls |
| `src/features/alarm/services/scheduler.test.ts` | Modify | Update mocks from expo-notifications to native module |
| `src/features/alarm/hooks/use-alarm-event-listener.ts` | Create | Native event listener (warm start) + intent extras reader (cold start) |
| `src/features/alarm/hooks/use-notification-listener.ts` | Delete | Replaced by use-alarm-event-listener.ts |
| `src/features/alarm/hooks/use-alarm-permissions.ts` | Modify | Remove expo-notifications permission check |
| `src/features/alarm/screens/ringing-screen.tsx` | Modify | Call native stopRinging/snoozeRinging instead of scheduler functions |
| `src/features/alarm/screens/home-screen.tsx` | Modify | Remove notification permission banner (no longer relevant) |
| `src/app/_layout.tsx` | Modify | Remove expo-notifications setup, add cold-start intent check via getLaunchAlarmData() |
| `app.config.ts` | Modify | Remove expo-notifications plugin, add withAlarmSounds config plugin |
| `package.json` | Modify | Remove expo-notifications dependency |

---

## Task 1: AlarmStorage — Native SharedPreferences CRUD

**Files:**
- Create: `modules/alarm-fullscreen/android/src/main/java/expo/modules/alarmfullscreen/AlarmStorage.kt`

This is the foundation — every other native component reads/writes alarm data through this.

- [ ] **Step 1: Create AlarmStorage.kt**

```kotlin
package expo.modules.alarmfullscreen

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONObject

data class AlarmEntry(
    val id: String,
    val triggerTimestamp: Long,
    val intensityTier: String,
    val label: String,
    val alarmId: String,
    val sequenceIndex: Int,
    val totalInSequence: Int,
    val dayIndex: Int,
    val snoozeDurationMinutes: Int,
    val maxSnoozeCount: Int,
    val snoozeCount: Int,
    val isRecurring: Boolean
) {
    fun toJson(): JSONObject = JSONObject().apply {
        put("id", id)
        put("triggerTimestamp", triggerTimestamp)
        put("intensityTier", intensityTier)
        put("label", label)
        put("alarmId", alarmId)
        put("sequenceIndex", sequenceIndex)
        put("totalInSequence", totalInSequence)
        put("dayIndex", dayIndex)
        put("snoozeDurationMinutes", snoozeDurationMinutes)
        put("maxSnoozeCount", maxSnoozeCount)
        put("snoozeCount", snoozeCount)
        put("isRecurring", isRecurring)
    }

    companion object {
        fun fromJson(json: String): AlarmEntry {
            val obj = JSONObject(json)
            return AlarmEntry(
                id = obj.getString("id"),
                triggerTimestamp = obj.getLong("triggerTimestamp"),
                intensityTier = obj.getString("intensityTier"),
                label = obj.optString("label", ""),
                alarmId = obj.getString("alarmId"),
                sequenceIndex = obj.getInt("sequenceIndex"),
                totalInSequence = obj.getInt("totalInSequence"),
                dayIndex = obj.getInt("dayIndex"),
                snoozeDurationMinutes = obj.getInt("snoozeDurationMinutes"),
                maxSnoozeCount = obj.getInt("maxSnoozeCount"),
                snoozeCount = obj.optInt("snoozeCount", 0),
                isRecurring = obj.optBoolean("isRecurring", false)
            )
        }
    }
}

object AlarmStorage {
    private const val PREFS_NAME = "alarm_engine_data"

    private fun prefs(context: Context): SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun save(context: Context, entry: AlarmEntry) {
        prefs(context).edit().putString(entry.id, entry.toJson().toString()).commit()
    }

    fun get(context: Context, id: String): AlarmEntry? {
        val json = prefs(context).getString(id, null) ?: return null
        return try { AlarmEntry.fromJson(json) } catch (_: Exception) { null }
    }

    fun getAll(context: Context): List<AlarmEntry> {
        return prefs(context).all.values.mapNotNull { value ->
            try { AlarmEntry.fromJson(value as String) } catch (_: Exception) { null }
        }
    }

    fun remove(context: Context, id: String) {
        prefs(context).edit().remove(id).commit()
    }

    fun clear(context: Context) {
        prefs(context).edit().clear().commit()
    }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /home/ubuntu/projects/alarm && npx expo prebuild --platform android --clean 2>&1 | tail -5`

Then: `cd android && ./gradlew :modules:alarm-fullscreen:compileReleaseKotlin 2>&1 | tail -10`

Expected: BUILD SUCCESSFUL

- [ ] **Step 3: Commit**

```bash
git add modules/alarm-fullscreen/android/src/main/java/expo/modules/alarmfullscreen/AlarmStorage.kt
git commit -m "feat(alarm-engine): add AlarmStorage for native SharedPreferences CRUD"
```

---

## Task 2: AlarmEventBus — Singleton Event Bridge

**Files:**
- Create: `modules/alarm-fullscreen/android/src/main/java/expo/modules/alarmfullscreen/AlarmEventBus.kt`

Singleton that Service/Receiver post events to. Module observes and forwards to JS via sendEvent().

- [ ] **Step 1: Create AlarmEventBus.kt**

```kotlin
package expo.modules.alarmfullscreen

import org.json.JSONObject

data class AlarmEvent(
    val name: String,
    val data: Map<String, Any?>
)

object AlarmEventBus {
    private val listeners = mutableListOf<(AlarmEvent) -> Unit>()

    fun addListener(listener: (AlarmEvent) -> Unit) {
        synchronized(listeners) {
            listeners.add(listener)
        }
    }

    fun removeListener(listener: (AlarmEvent) -> Unit) {
        synchronized(listeners) {
            listeners.remove(listener)
        }
    }

    fun post(event: AlarmEvent) {
        synchronized(listeners) {
            listeners.forEach { it(event) }
        }
    }

    fun alarmFiredEvent(entry: AlarmEntry): AlarmEvent = AlarmEvent(
        name = "onAlarmFired",
        data = mapOf(
            "alarmId" to entry.alarmId,
            "dayIndex" to entry.dayIndex,
            "sequenceIndex" to entry.sequenceIndex,
            "totalInSequence" to entry.totalInSequence,
            "intensityTier" to entry.intensityTier,
            "snoozeDurationMinutes" to entry.snoozeDurationMinutes,
            "snoozeCount" to entry.snoozeCount,
            "maxSnoozeCount" to entry.maxSnoozeCount
        )
    )

    fun alarmStoppedEvent(alarmId: String): AlarmEvent = AlarmEvent(
        name = "onAlarmStopped",
        data = mapOf("alarmId" to alarmId)
    )

    fun alarmSnoozedEvent(alarmId: String, snoozeCount: Int): AlarmEvent = AlarmEvent(
        name = "onAlarmSnoozed",
        data = mapOf("alarmId" to alarmId, "snoozeCount" to snoozeCount)
    )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /home/ubuntu/projects/alarm/android && ./gradlew :modules:alarm-fullscreen:compileReleaseKotlin 2>&1 | tail -10`

Expected: BUILD SUCCESSFUL

- [ ] **Step 3: Commit**

```bash
git add modules/alarm-fullscreen/android/src/main/java/expo/modules/alarmfullscreen/AlarmEventBus.kt
git commit -m "feat(alarm-engine): add AlarmEventBus singleton for native-to-JS events"
```

---

## Task 3: AlarmNotificationHelper — Notification Builder

**Files:**
- Create: `modules/alarm-fullscreen/android/src/main/java/expo/modules/alarmfullscreen/AlarmNotificationHelper.kt`

Builds the alarm notification with channel, full-screen intent, and Snooze/Dismiss action buttons.

- [ ] **Step 1: Create AlarmNotificationHelper.kt**

```kotlin
package expo.modules.alarmfullscreen

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat

object AlarmNotificationHelper {
    const val CHANNEL_ID = "alarm-ringing"
    const val NOTIFICATION_ID = 9999

    fun ensureChannel(context: Context) {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (nm.getNotificationChannel(CHANNEL_ID) != null) return
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Alarm Ringing",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Active alarm notifications"
            setBypassDnd(true)
            lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            setShowBadge(false)
        }
        nm.createNotificationChannel(channel)
    }

    fun buildNotification(context: Context, entry: AlarmEntry): Notification {
        ensureChannel(context)

        // Full-screen intent — launches app to ringing screen
        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            ?: return buildMinimalNotification(context, entry)
        launchIntent.apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("alarmId", entry.alarmId)
            putExtra("dayIndex", entry.dayIndex)
            putExtra("sequenceIndex", entry.sequenceIndex)
            putExtra("totalInSequence", entry.totalInSequence)
            putExtra("intensityTier", entry.intensityTier)
            putExtra("snoozeDurationMinutes", entry.snoozeDurationMinutes)
            putExtra("snoozeCount", entry.snoozeCount)
            putExtra("maxSnoozeCount", entry.maxSnoozeCount)
        }

        val pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT or
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_IMMUTABLE else 0

        val fullScreenPi = PendingIntent.getActivity(
            context, entry.id.hashCode(), launchIntent, pendingFlags
        )

        // Snooze action — targets AlarmReceiver with ACTION_SNOOZE
        val snoozeIntent = Intent(context, AlarmReceiver::class.java).apply {
            action = AlarmReceiver.ACTION_SNOOZE
            putExtra("entryId", entry.id)
        }
        val snoozePi = PendingIntent.getBroadcast(
            context, "${entry.id}_snooze".hashCode(), snoozeIntent, pendingFlags
        )

        // Dismiss action — targets AlarmReceiver with ACTION_DISMISS
        val dismissIntent = Intent(context, AlarmReceiver::class.java).apply {
            action = AlarmReceiver.ACTION_DISMISS
            putExtra("entryId", entry.id)
        }
        val dismissPi = PendingIntent.getBroadcast(
            context, "${entry.id}_dismiss".hashCode(), dismissIntent, pendingFlags
        )

        val sequenceText = "Alarm ${entry.sequenceIndex + 1} of ${entry.totalInSequence}"
        val label = entry.label.ifEmpty { "RangeAlarm" }

        return NotificationCompat.Builder(context, CHANNEL_ID).apply {
            setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            setContentTitle(label)
            setContentText(sequenceText)
            setCategory(NotificationCompat.CATEGORY_ALARM)
            setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            setOngoing(true)
            setAutoCancel(false)
            priority = NotificationCompat.PRIORITY_MAX
            setFullScreenIntent(fullScreenPi, true)
            setContentIntent(fullScreenPi)
            addAction(0, "Snooze", snoozePi)
            addAction(0, "Dismiss", dismissPi)
        }.build()
    }

    private fun buildMinimalNotification(context: Context, entry: AlarmEntry): Notification {
        ensureChannel(context)
        return NotificationCompat.Builder(context, CHANNEL_ID).apply {
            setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            setContentTitle(entry.label.ifEmpty { "RangeAlarm" })
            setContentText("Alarm ${entry.sequenceIndex + 1} of ${entry.totalInSequence}")
            setCategory(NotificationCompat.CATEGORY_ALARM)
            setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            setOngoing(true)
            priority = NotificationCompat.PRIORITY_MAX
        }.build()
    }
}
```

- [ ] **Step 2: Verify it compiles**

This file references `AlarmReceiver` which doesn't exist yet. Create a stub `AlarmReceiver.kt` first:

```kotlin
package expo.modules.alarmfullscreen

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class AlarmReceiver : BroadcastReceiver() {
    companion object {
        const val ACTION_FIRE = "expo.modules.alarmfullscreen.ACTION_FIRE"
        const val ACTION_SNOOZE = "expo.modules.alarmfullscreen.ACTION_SNOOZE"
        const val ACTION_DISMISS = "expo.modules.alarmfullscreen.ACTION_DISMISS"
    }

    override fun onReceive(context: Context, intent: Intent) {
        // Implemented in Task 6
    }
}
```

Run: `cd /home/ubuntu/projects/alarm/android && ./gradlew :modules:alarm-fullscreen:compileReleaseKotlin 2>&1 | tail -10`

Expected: BUILD SUCCESSFUL

- [ ] **Step 3: Commit**

```bash
git add modules/alarm-fullscreen/android/src/main/java/expo/modules/alarmfullscreen/AlarmNotificationHelper.kt
git add modules/alarm-fullscreen/android/src/main/java/expo/modules/alarmfullscreen/AlarmReceiver.kt
git commit -m "feat(alarm-engine): add AlarmNotificationHelper and AlarmReceiver stub"
```

---

## Task 4: AlarmScheduler — AlarmManager Wrapper

**Files:**
- Create: `modules/alarm-fullscreen/android/src/main/java/expo/modules/alarmfullscreen/AlarmScheduler.kt`

Wraps `AlarmManager.setAlarmClock()` and PendingIntent creation.

- [ ] **Step 1: Create AlarmScheduler.kt**

```kotlin
package expo.modules.alarmfullscreen

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build

object AlarmScheduler {

    fun schedule(context: Context, entry: AlarmEntry) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = AlarmReceiver.ACTION_FIRE
            putExtra("entryId", entry.id)
        }

        val pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT or
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_IMMUTABLE else 0

        val pendingIntent = PendingIntent.getBroadcast(
            context, entry.id.hashCode(), intent, pendingFlags
        )

        // Show alarm icon — launch app when user taps clock icon in status bar
        val showIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            ?: Intent()
        val showPi = PendingIntent.getActivity(
            context, 0, showIntent, pendingFlags
        )

        val alarmClockInfo = AlarmManager.AlarmClockInfo(entry.triggerTimestamp, showPi)
        alarmManager.setAlarmClock(alarmClockInfo, pendingIntent)

        // Persist for reboot recovery
        AlarmStorage.save(context, entry)
    }

    fun cancel(context: Context, entryId: String) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = AlarmReceiver.ACTION_FIRE
            putExtra("entryId", entryId)
        }

        val pendingFlags = PendingIntent.FLAG_NO_CREATE or
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_IMMUTABLE else 0

        val pendingIntent = PendingIntent.getBroadcast(
            context, entryId.hashCode(), intent, pendingFlags
        )

        if (pendingIntent != null) {
            alarmManager.cancel(pendingIntent)
            pendingIntent.cancel()
        }

        AlarmStorage.remove(context, entryId)
    }

    fun cancelAll(context: Context) {
        val entries = AlarmStorage.getAll(context)
        for (entry in entries) {
            cancel(context, entry.id)
        }
        AlarmStorage.clear(context)
    }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /home/ubuntu/projects/alarm/android && ./gradlew :modules:alarm-fullscreen:compileReleaseKotlin 2>&1 | tail -10`

Expected: BUILD SUCCESSFUL

- [ ] **Step 3: Commit**

```bash
git add modules/alarm-fullscreen/android/src/main/java/expo/modules/alarmfullscreen/AlarmScheduler.kt
git commit -m "feat(alarm-engine): add AlarmScheduler wrapping AlarmManager.setAlarmClock()"
```

---

## Task 5: AlarmService — Foreground Service with MediaPlayer

**Files:**
- Create: `modules/alarm-fullscreen/android/src/main/java/expo/modules/alarmfullscreen/AlarmService.kt`

The core ringing service — MediaPlayer on STREAM_ALARM, vibration, wake lock, auto-silence.

- [ ] **Step 1: Create AlarmService.kt**

```kotlin
package expo.modules.alarmfullscreen

import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

class AlarmService : Service() {

    companion object {
        private const val AUTO_SILENCE_MS = 10L * 60 * 1000 // 10 minutes
        var isRunning = false
            private set
        var currentEntryId: String? = null
            private set

        fun start(context: Context, entryId: String) {
            val intent = Intent(context, AlarmService::class.java).apply {
                putExtra("entryId", entryId)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, AlarmService::class.java))
        }
    }

    private var mediaPlayer: MediaPlayer? = null
    private var vibrator: Vibrator? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private val handler = Handler(Looper.getMainLooper())
    private val autoSilenceRunnable = Runnable {
        val entryId = currentEntryId
        if (entryId != null) {
            val entry = AlarmStorage.get(this@AlarmService, entryId)
            if (entry != null) {
                AlarmEventBus.post(AlarmEventBus.alarmStoppedEvent(entry.alarmId))
            }
        }
        stopSelf()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val entryId = intent?.getStringExtra("entryId") ?: run {
            stopSelf()
            return START_NOT_STICKY
        }

        val entry = AlarmStorage.get(this, entryId) ?: run {
            stopSelf()
            return START_NOT_STICKY
        }

        // Stop any currently playing alarm (overlapping alarm case)
        stopPlayback()

        currentEntryId = entryId
        isRunning = true

        // Must call startForeground within 5 seconds
        val notification = AlarmNotificationHelper.buildNotification(this, entry)
        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(
                AlarmNotificationHelper.NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
            )
        } else {
            startForeground(AlarmNotificationHelper.NOTIFICATION_ID, notification)
        }

        // Acquire wake lock
        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK, "alarm-engine:ringing"
        ).apply { acquire(AUTO_SILENCE_MS + 60_000) } // extra minute buffer

        // Start sound
        startSound(entry)

        // Start vibration
        startVibration(entry)

        // Set auto-silence timeout
        handler.removeCallbacks(autoSilenceRunnable)
        handler.postDelayed(autoSilenceRunnable, AUTO_SILENCE_MS)

        // Emit event
        AlarmEventBus.post(AlarmEventBus.alarmFiredEvent(entry))

        return START_NOT_STICKY
    }

    private fun startSound(entry: AlarmEntry) {
        val resId = getSoundResource(entry.intensityTier)
        if (resId == 0) return

        // IMPORTANT: Do NOT use MediaPlayer.create() — it returns an already-prepared player
        // and setAudioAttributes() is a no-op after prepare(). We must construct manually.
        mediaPlayer = MediaPlayer().apply {
            setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            )
            val afd = resources.openRawResourceFd(resId) ?: return
            setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
            afd.close()
            isLooping = true
            prepare()

            // Set alarm volume to max
            val audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
            val maxVol = audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM)
            audioManager.setStreamVolume(AudioManager.STREAM_ALARM, maxVol, 0)

            start()
        }
    }

    private fun getSoundResource(tier: String): Int {
        return when (tier) {
            "gentle" -> resources.getIdentifier("gentle", "raw", packageName)
            "moderate" -> resources.getIdentifier("moderate", "raw", packageName)
            "strong" -> resources.getIdentifier("strong", "raw", packageName)
            "aggressive" -> resources.getIdentifier("aggressive", "raw", packageName)
            else -> resources.getIdentifier("gentle", "raw", packageName)
        }
    }

    private fun startVibration(entry: AlarmEntry) {
        vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }

        val pattern = getVibrationPattern(entry.intensityTier)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 0))
        } else {
            @Suppress("DEPRECATION")
            vibrator?.vibrate(pattern, 0)
        }
    }

    private fun getVibrationPattern(tier: String): LongArray {
        return when (tier) {
            "gentle" -> longArrayOf(0, 100)
            "moderate" -> longArrayOf(0, 100, 100)
            "strong" -> longArrayOf(0, 100, 200, 100, 200)
            "aggressive" -> longArrayOf(0, 200, 300, 200, 300, 200)
            else -> longArrayOf(0, 100)
        }
    }

    private fun stopPlayback() {
        mediaPlayer?.let {
            if (it.isPlaying) it.stop()
            it.release()
        }
        mediaPlayer = null

        vibrator?.cancel()
        vibrator = null
    }

    override fun onDestroy() {
        stopPlayback()
        handler.removeCallbacks(autoSilenceRunnable)
        wakeLock?.let {
            if (it.isHeld) it.release()
        }
        wakeLock = null
        isRunning = false
        currentEntryId = null
        super.onDestroy()
    }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /home/ubuntu/projects/alarm/android && ./gradlew :modules:alarm-fullscreen:compileReleaseKotlin 2>&1 | tail -10`

Expected: BUILD SUCCESSFUL

- [ ] **Step 3: Commit**

```bash
git add modules/alarm-fullscreen/android/src/main/java/expo/modules/alarmfullscreen/AlarmService.kt
git commit -m "feat(alarm-engine): add AlarmService foreground service with MediaPlayer + Vibrator"
```

---

## Task 6: AlarmReceiver — Full Implementation

**Files:**
- Modify: `modules/alarm-fullscreen/android/src/main/java/expo/modules/alarmfullscreen/AlarmReceiver.kt`

Replace the stub with full implementation handling FIRE, SNOOZE, and DISMISS actions.

- [ ] **Step 1: Implement AlarmReceiver.kt**

Replace the entire stub with:

```kotlin
package expo.modules.alarmfullscreen

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class AlarmReceiver : BroadcastReceiver() {
    companion object {
        const val ACTION_FIRE = "expo.modules.alarmfullscreen.ACTION_FIRE"
        const val ACTION_SNOOZE = "expo.modules.alarmfullscreen.ACTION_SNOOZE"
        const val ACTION_DISMISS = "expo.modules.alarmfullscreen.ACTION_DISMISS"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val entryId = intent.getStringExtra("entryId") ?: return

        when (intent.action) {
            ACTION_FIRE -> handleFire(context, entryId)
            ACTION_SNOOZE -> handleSnooze(context, entryId)
            ACTION_DISMISS -> handleDismiss(context, entryId)
        }
    }

    private fun handleFire(context: Context, entryId: String) {
        val entry = AlarmStorage.get(context, entryId) ?: return
        AlarmService.start(context, entryId)
    }

    private fun handleSnooze(context: Context, entryId: String) {
        val entry = AlarmStorage.get(context, entryId) ?: return

        // Stop the current ringing
        AlarmService.stop(context)

        // Enforce snooze limit
        val newSnoozeCount = entry.snoozeCount + 1
        if (newSnoozeCount > entry.maxSnoozeCount) {
            // No more snoozes — treat as dismiss
            AlarmStorage.remove(context, entryId)
            AlarmEventBus.post(AlarmEventBus.alarmStoppedEvent(entry.alarmId))
            return
        }

        // Remove old entry
        AlarmStorage.remove(context, entryId)

        // Schedule snooze alarm
        val snoozeEntry = entry.copy(
            id = "${entry.alarmId}_snooze",
            triggerTimestamp = System.currentTimeMillis() + entry.snoozeDurationMinutes * 60 * 1000L,
            snoozeCount = newSnoozeCount
        )
        AlarmScheduler.schedule(context, snoozeEntry)

        AlarmEventBus.post(AlarmEventBus.alarmSnoozedEvent(entry.alarmId, newSnoozeCount))
    }

    private fun handleDismiss(context: Context, entryId: String) {
        val entry = AlarmStorage.get(context, entryId) ?: return

        // Stop the current ringing
        AlarmService.stop(context)

        // Remove the entry (one-time cleanup; recurring stays for next week via reschedule)
        AlarmStorage.remove(context, entryId)

        // Cancel any existing snooze for this alarm
        val snoozeId = "${entry.alarmId}_snooze"
        AlarmScheduler.cancel(context, snoozeId)

        AlarmEventBus.post(AlarmEventBus.alarmStoppedEvent(entry.alarmId))
    }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /home/ubuntu/projects/alarm/android && ./gradlew :modules:alarm-fullscreen:compileReleaseKotlin 2>&1 | tail -10`

Expected: BUILD SUCCESSFUL

- [ ] **Step 3: Commit**

```bash
git add modules/alarm-fullscreen/android/src/main/java/expo/modules/alarmfullscreen/AlarmReceiver.kt
git commit -m "feat(alarm-engine): implement AlarmReceiver with fire/snooze/dismiss actions"
```

---

## Task 7: BootReceiver — Reboot Recovery

**Files:**
- Create: `modules/alarm-fullscreen/android/src/main/java/expo/modules/alarmfullscreen/BootReceiver.kt`

- [ ] **Step 1: Create BootReceiver.kt**

```kotlin
package expo.modules.alarmfullscreen

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED &&
            intent.action != "android.intent.action.QUICKBOOT_POWERON" &&
            intent.action != "com.htc.intent.action.QUICKBOOT_POWERON") {
            return
        }

        val entries = AlarmStorage.getAll(context)
        val now = System.currentTimeMillis()

        for (entry in entries) {
            when {
                entry.triggerTimestamp > now -> {
                    // Future alarm — reschedule as-is
                    AlarmScheduler.schedule(context, entry)
                }
                entry.isRecurring -> {
                    // Past recurring alarm — advance by 7 days
                    val advanced = entry.copy(
                        triggerTimestamp = entry.triggerTimestamp + 7L * 24 * 60 * 60 * 1000,
                        snoozeCount = 0
                    )
                    AlarmStorage.remove(context, entry.id)
                    AlarmScheduler.schedule(context, advanced)
                }
                else -> {
                    // Past one-time alarm — missed, clean up
                    AlarmStorage.remove(context, entry.id)
                }
            }
        }
    }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /home/ubuntu/projects/alarm/android && ./gradlew :modules:alarm-fullscreen:compileReleaseKotlin 2>&1 | tail -10`

Expected: BUILD SUCCESSFUL

- [ ] **Step 3: Commit**

```bash
git add modules/alarm-fullscreen/android/src/main/java/expo/modules/alarmfullscreen/BootReceiver.kt
git commit -m "feat(alarm-engine): add BootReceiver for alarm rescheduling after reboot"
```

---

## Task 8: AndroidManifest + build.gradle Updates

**Files:**
- Modify: `modules/alarm-fullscreen/android/src/main/AndroidManifest.xml`
- Modify: `modules/alarm-fullscreen/android/build.gradle`
- Delete: `modules/alarm-fullscreen/android/src/main/java/expo/modules/alarmfullscreen/AlarmPresentationDelegate.kt`
- Delete: `modules/alarm-fullscreen/android/src/main/java/expo/modules/alarmfullscreen/AlarmNotificationsService.kt`

- [ ] **Step 1: Delete old files that depend on expo-notifications**

```bash
rm modules/alarm-fullscreen/android/src/main/java/expo/modules/alarmfullscreen/AlarmPresentationDelegate.kt
rm modules/alarm-fullscreen/android/src/main/java/expo/modules/alarmfullscreen/AlarmNotificationsService.kt
```

- [ ] **Step 2: Update AndroidManifest.xml**

Replace entire file with:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

  <uses-permission android:name="android.permission.USE_EXACT_ALARM" />
  <uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT" />
  <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
  <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
  <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
  <uses-permission android:name="android.permission.VIBRATE" />
  <uses-permission android:name="android.permission.WAKE_LOCK" />

  <application>
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
  </application>
</manifest>
```

- [ ] **Step 3: Update build.gradle — remove expo-notifications dependency**

Replace `dependencies` block in `modules/alarm-fullscreen/android/build.gradle`:

```gradle
dependencies {
  implementation 'androidx.core:core-ktx:1.6.0'
}
```

Remove the `expo-notifications` dependency and the `kotlinx-coroutines-android` dependency (no longer needed since we removed the suspend function in AlarmPresentationDelegate).

- [ ] **Step 4: Verify it compiles**

Run: `cd /home/ubuntu/projects/alarm && npx expo prebuild --platform android --clean 2>&1 | tail -5`

Then: `cd android && ./gradlew :modules:alarm-fullscreen:compileReleaseKotlin 2>&1 | tail -10`

Expected: BUILD SUCCESSFUL

- [ ] **Step 5: Commit**

```bash
git add -A modules/alarm-fullscreen/android/
git commit -m "feat(alarm-engine): update manifest/gradle, remove expo-notifications native deps"
```

---

## Task 9: AlarmFullscreenModule — JS Bridge Expansion

**Files:**
- Modify: `modules/alarm-fullscreen/android/src/main/java/expo/modules/alarmfullscreen/AlarmFullscreenModule.kt`

Add all bridge functions and event emission.

- [ ] **Step 1: Rewrite AlarmFullscreenModule.kt**

Replace entire file with:

```kotlin
package expo.modules.alarmfullscreen

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AlarmFullscreenModule : Module() {

    private val eventListener: (AlarmEvent) -> Unit = { event ->
        sendEvent(event.name, event.data)
    }

    override fun definition() = ModuleDefinition {
        Name("AlarmFullscreen")

        Events("onAlarmFired", "onAlarmStopped", "onAlarmSnoozed")

        OnCreate {
            AlarmEventBus.addListener(eventListener)
        }

        OnDestroy {
            AlarmEventBus.removeListener(eventListener)
        }

        // --- Existing permission functions ---

        Function("canUseFullScreenIntent") {
            if (Build.VERSION.SDK_INT < 34) return@Function true
            val context = appContext.reactContext ?: return@Function true
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            return@Function (nm?.canUseFullScreenIntent() ?: true)
        }

        Function("isBatteryOptimizationEnabled") {
            val context = appContext.reactContext ?: return@Function false
            val pm = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
            val isIgnoring = pm?.isIgnoringBatteryOptimizations(context.packageName) ?: true
            return@Function !isIgnoring
        }

        Function("requestDisableBatteryOptimization") {
            val context = appContext.reactContext ?: return@Function null
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                data = Uri.parse("package:${context.packageName}")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
            return@Function null
        }

        Function("openFullScreenIntentSettings") {
            if (Build.VERSION.SDK_INT < 34) return@Function null
            val context = appContext.reactContext ?: return@Function null
            val intent = Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT).apply {
                data = Uri.parse("package:${context.packageName}")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
            return@Function null
        }

        // --- New alarm engine functions ---

        Function("scheduleAlarm") { params: Map<String, Any> ->
            val context = appContext.reactContext ?: return@Function false
            val entry = AlarmEntry(
                id = params["id"] as String,
                triggerTimestamp = (params["triggerTimestamp"] as Number).toLong(),
                intensityTier = params["intensityTier"] as String,
                label = (params["label"] as? String) ?: "",
                alarmId = params["alarmId"] as String,
                sequenceIndex = (params["sequenceIndex"] as Number).toInt(),
                totalInSequence = (params["totalInSequence"] as Number).toInt(),
                dayIndex = (params["dayIndex"] as Number).toInt(),
                snoozeDurationMinutes = (params["snoozeDurationMinutes"] as Number).toInt(),
                maxSnoozeCount = (params["maxSnoozeCount"] as Number).toInt(),
                snoozeCount = (params["snoozeCount"] as? Number)?.toInt() ?: 0,
                isRecurring = (params["isRecurring"] as? Boolean) ?: false
            )
            AlarmScheduler.schedule(context, entry)
            return@Function true
        }

        Function("cancelAlarm") { id: String ->
            val context = appContext.reactContext ?: return@Function
            AlarmScheduler.cancel(context, id)
        }

        Function("cancelAllAlarms") {
            val context = appContext.reactContext ?: return@Function
            AlarmScheduler.cancelAll(context)
        }

        Function("stopRinging") {
            val context = appContext.reactContext ?: return@Function
            val entryId = AlarmService.currentEntryId
            if (entryId != null) {
                val entry = AlarmStorage.get(context, entryId)
                AlarmService.stop(context)
                if (entry != null) {
                    AlarmStorage.remove(context, entryId)
                    AlarmEventBus.post(AlarmEventBus.alarmStoppedEvent(entry.alarmId))
                }
            }
        }

        Function("snoozeRinging") { snoozeDurationMinutes: Int ->
            val context = appContext.reactContext ?: return@Function false
            val entryId = AlarmService.currentEntryId ?: return@Function false
            val entry = AlarmStorage.get(context, entryId) ?: return@Function false

            val newSnoozeCount = entry.snoozeCount + 1
            if (newSnoozeCount > entry.maxSnoozeCount) return@Function false

            // Stop ringing
            AlarmService.stop(context)
            AlarmStorage.remove(context, entryId)

            // Schedule snooze
            val snoozeEntry = entry.copy(
                id = "${entry.alarmId}_snooze",
                triggerTimestamp = System.currentTimeMillis() + snoozeDurationMinutes * 60 * 1000L,
                snoozeCount = newSnoozeCount
            )
            AlarmScheduler.schedule(context, snoozeEntry)

            AlarmEventBus.post(AlarmEventBus.alarmSnoozedEvent(entry.alarmId, newSnoozeCount))
            return@Function true
        }

        Function("isRinging") {
            return@Function AlarmService.isRunning
        }

        // Cold-start: read alarm data from the launch intent extras
        Function("getLaunchAlarmData") {
            val activity = appContext.currentActivity ?: return@Function null
            val intent = activity.intent ?: return@Function null
            val alarmId = intent.getStringExtra("alarmId") ?: return@Function null
            val data = mapOf(
                "alarmId" to alarmId,
                "dayIndex" to intent.getIntExtra("dayIndex", 0),
                "sequenceIndex" to intent.getIntExtra("sequenceIndex", 0),
                "totalInSequence" to intent.getIntExtra("totalInSequence", 1),
                "intensityTier" to (intent.getStringExtra("intensityTier") ?: "gentle"),
                "snoozeDurationMinutes" to intent.getIntExtra("snoozeDurationMinutes", 5),
                "snoozeCount" to intent.getIntExtra("snoozeCount", 0),
                "maxSnoozeCount" to intent.getIntExtra("maxSnoozeCount", 3),
            )
            // Clear extras so we don't re-trigger on next read
            intent.removeExtra("alarmId")
            return@Function data
        }
    }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /home/ubuntu/projects/alarm/android && ./gradlew :modules:alarm-fullscreen:compileReleaseKotlin 2>&1 | tail -10`

Expected: BUILD SUCCESSFUL

- [ ] **Step 3: Commit**

```bash
git add modules/alarm-fullscreen/android/src/main/java/expo/modules/alarmfullscreen/AlarmFullscreenModule.kt
git commit -m "feat(alarm-engine): expand AlarmFullscreenModule with scheduling/ringing bridge functions"
```

---

## Task 10: JS Bridge Exports — index.ts

**Files:**
- Modify: `modules/alarm-fullscreen/index.ts`

- [ ] **Step 1: Rewrite index.ts with new exports**

Replace entire file:

```typescript
import { Platform } from 'react-native';

let AlarmFullscreen: Record<string, (...args: unknown[]) => unknown> | null = null;

if (Platform.OS === 'android') {
  try {
    const { requireNativeModule } = require('expo-modules-core');
    AlarmFullscreen = requireNativeModule('AlarmFullscreen');
  }
  catch {
    // Native module not available (e.g. Expo Go)
  }
}

// --- Permission functions (existing) ---

export function canUseFullScreenIntent(): boolean {
  return (AlarmFullscreen?.canUseFullScreenIntent() as boolean) ?? true;
}

export function isBatteryOptimizationEnabled(): boolean {
  return (AlarmFullscreen?.isBatteryOptimizationEnabled() as boolean) ?? false;
}

export function requestDisableBatteryOptimization(): void {
  AlarmFullscreen?.requestDisableBatteryOptimization();
}

export function openFullScreenIntentSettings(): void {
  AlarmFullscreen?.openFullScreenIntentSettings();
}

// --- Alarm engine functions (new) ---

export type ScheduleAlarmParams = {
  id: string;
  triggerTimestamp: number;
  intensityTier: string;
  label: string;
  alarmId: string;
  sequenceIndex: number;
  totalInSequence: number;
  dayIndex: number;
  snoozeDurationMinutes: number;
  maxSnoozeCount: number;
  snoozeCount?: number;
  isRecurring: boolean;
};

export function scheduleAlarm(params: ScheduleAlarmParams): boolean {
  return (AlarmFullscreen?.scheduleAlarm(params) as boolean) ?? false;
}

export function cancelAlarm(id: string): void {
  AlarmFullscreen?.cancelAlarm(id);
}

export function cancelAllAlarms(): void {
  AlarmFullscreen?.cancelAllAlarms();
}

export function stopRinging(): void {
  AlarmFullscreen?.stopRinging();
}

export function snoozeRinging(snoozeDurationMinutes: number): boolean {
  return (AlarmFullscreen?.snoozeRinging(snoozeDurationMinutes) as boolean) ?? false;
}

export function isRinging(): boolean {
  return (AlarmFullscreen?.isRinging() as boolean) ?? false;
}

export function getLaunchAlarmData(): AlarmEventPayload | null {
  return (AlarmFullscreen?.getLaunchAlarmData() as AlarmEventPayload | null) ?? null;
}

// --- Event listener (new) ---

export type AlarmEventPayload = {
  alarmId: string;
  dayIndex?: number;
  sequenceIndex?: number;
  totalInSequence?: number;
  intensityTier?: string;
  snoozeDurationMinutes?: number;
  snoozeCount?: number;
  maxSnoozeCount?: number;
};

type EventSubscription = { remove: () => void };

export function addAlarmListener(
  eventName: 'onAlarmFired' | 'onAlarmStopped' | 'onAlarmSnoozed',
  listener: (payload: AlarmEventPayload) => void,
): EventSubscription {
  if (!AlarmFullscreen) return { remove: () => {} };
  try {
    const { EventEmitter } = require('expo-modules-core');
    const emitter = new EventEmitter(AlarmFullscreen);
    return emitter.addListener(eventName, listener);
  } catch {
    return { remove: () => {} };
  }
}
```

- [ ] **Step 2: Verify types**

Run: `cd /home/ubuntu/projects/alarm && pnpm type-check 2>&1 | tail -10`

Expected: No errors related to alarm-fullscreen module

- [ ] **Step 3: Commit**

```bash
git add modules/alarm-fullscreen/index.ts
git commit -m "feat(alarm-engine): export new bridge functions and event listener from JS"
```

---

## Task 11: Sound File Config Plugin

**Files:**
- Modify: `app.config.ts`

Add `withAlarmSounds` config plugin that copies WAV files to `res/raw/`, replace `expo-notifications` plugin, remove `withAlarmPermissions`.

- [ ] **Step 1: Update app.config.ts**

Add new config plugin function and update plugins array.

Add after the existing `withAlarmPermissions` definition (around line 16):

```typescript
const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withAlarmSounds = (config: ExpoConfig): ExpoConfig => {
  return withDangerousMod(config, [
    'android',
    (mod: { modResults: unknown; modRequest: { projectRoot: string; platformProjectRoot: string } }) => {
      const rawDir = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/res/raw');
      if (!fs.existsSync(rawDir)) {
        fs.mkdirSync(rawDir, { recursive: true });
      }

      const soundFiles = ['gentle.wav', 'moderate.wav', 'strong.wav', 'aggressive.wav'];
      for (const file of soundFiles) {
        const src = path.join(mod.modRequest.projectRoot, 'assets/sounds', file);
        const dest = path.join(rawDir, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      }
      return mod;
    },
  ]);
};
```

In the `plugins` array:
- Remove the `expo-notifications` plugin entry (the `['expo-notifications', { sounds: [...] }]` block)
- Remove `withAlarmPermissions as unknown as string`
- Add `withAlarmSounds as unknown as string`

- [ ] **Step 2: Verify prebuild works**

Run: `cd /home/ubuntu/projects/alarm && npx expo prebuild --platform android --clean 2>&1 | tail -10`

Then verify sound files were copied:

```bash
ls -la android/app/src/main/res/raw/
```

Expected: `gentle.wav`, `moderate.wav`, `strong.wav`, `aggressive.wav` present

- [ ] **Step 3: Commit**

```bash
git add app.config.ts
git commit -m "feat(alarm-engine): add withAlarmSounds config plugin, remove expo-notifications plugin"
```

---

## Task 12: Update scheduler.ts — Replace expo-notifications

**Files:**
- Modify: `src/features/alarm/services/scheduler.ts`

Replace all expo-notifications calls with native module calls.

- [ ] **Step 1: Rewrite scheduler.ts**

Replace entire file:

```typescript
// src/features/alarm/services/scheduler.ts

import type { Alarm } from '../types';

import { DEFAULT_MAX_SNOOZE_COUNT } from '../constants';
import {
  cancelAlarm,
  cancelAllAlarms,
  scheduleAlarm,
  snoozeRinging,
  stopRinging,
} from 'modules/alarm-fullscreen';
import { generateSequence } from './sequence-generator';

/**
 * Build a deterministic notification ID for an alarm sequence item.
 */
function buildAlarmEntryId(
  alarmId: string,
  dayIndex: number,
  sequenceIndex: number,
): string {
  return `${alarmId}_${dayIndex}_${sequenceIndex}`;
}

/**
 * Get the day indices used for scheduling. For recurring alarms, these are
 * the selected days. For one-time alarms, we use a sentinel value (7).
 */
function getScheduleDays(alarm: Alarm): number[] {
  return alarm.days.length > 0 ? alarm.days : [7];
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
 * Cancel all scheduled alarms for a given alarm.
 */
export async function cancelAlarmNotifications(alarm: Alarm): Promise<void> {
  const sequence = generateSequence(alarm);
  const days = getScheduleDays(alarm);

  for (const day of days) {
    for (const item of sequence) {
      cancelAlarm(buildAlarmEntryId(alarm.id, day, item.sequenceIndex));
    }
  }
  // Also cancel any snooze
  cancelAlarm(`${alarm.id}_snooze`);
}

/**
 * Schedule all alarms for an alarm's sequence.
 */
export async function scheduleAlarmSequence(alarm: Alarm): Promise<void> {
  await cancelAlarmNotifications(alarm);

  if (!alarm.enabled) return;

  const sequence = generateSequence(alarm);
  const days = getScheduleDays(alarm);
  const isRecurring = alarm.days.length > 0;

  for (const day of days) {
    for (const item of sequence) {
      const triggerDate = getNextOccurrence(day, item.hour24, item.minute);

      scheduleAlarm({
        id: buildAlarmEntryId(alarm.id, day, item.sequenceIndex),
        triggerTimestamp: triggerDate.getTime(),
        intensityTier: item.intensityTier,
        label: alarm.label || '',
        alarmId: alarm.id,
        sequenceIndex: item.sequenceIndex,
        totalInSequence: sequence.length,
        dayIndex: day,
        snoozeDurationMinutes: alarm.snoozeDurationMinutes,
        maxSnoozeCount: alarm.maxSnoozeCount ?? DEFAULT_MAX_SNOOZE_COUNT,
        snoozeCount: 0,
        isRecurring,
      });
    }
  }
}

/**
 * Dismiss all remaining notifications in the current day's sequence.
 */
export async function dismissAllRemaining(
  alarm: Alarm,
  currentSequenceIndex: number,
  dayIndex: number,
): Promise<void> {
  // Stop current ringing
  stopRinging();

  const sequence = generateSequence(alarm);
  for (const item of sequence) {
    if (item.sequenceIndex > currentSequenceIndex) {
      cancelAlarm(buildAlarmEntryId(alarm.id, dayIndex, item.sequenceIndex));
    }
  }
  // Cancel any snooze
  cancelAlarm(`${alarm.id}_snooze`);
}

/**
 * Re-schedule all enabled alarms.
 */
export async function rescheduleAllAlarms(alarms: Alarm[]): Promise<void> {
  cancelAllAlarms();
  for (const alarm of alarms) {
    if (alarm.enabled) {
      await scheduleAlarmSequence(alarm);
    }
  }
}
```

- [ ] **Step 2: Verify types**

Run: `cd /home/ubuntu/projects/alarm && pnpm type-check 2>&1 | tail -10`

Expected: No errors in scheduler.ts

- [ ] **Step 3: Commit**

```bash
git add src/features/alarm/services/scheduler.ts
git commit -m "feat(alarm-engine): replace expo-notifications with native module in scheduler"
```

---

## Task 13: Update Scheduler Tests

**Files:**
- Modify: `src/features/alarm/services/__tests__/scheduler.test.ts`

Replace expo-notifications mocks with native module mocks.

- [ ] **Step 1: Rewrite scheduler.test.ts**

Replace entire file:

```typescript
import type { Alarm } from '../../types';

import { cancelAlarmNotifications, dismissAllRemaining, scheduleAlarmSequence } from '../scheduler';

const mockScheduleAlarm = jest.fn().mockReturnValue(true);
const mockCancelAlarm = jest.fn();
const mockCancelAllAlarms = jest.fn();
const mockStopRinging = jest.fn();

jest.mock('modules/alarm-fullscreen', () => ({
  scheduleAlarm: (...args: unknown[]) => mockScheduleAlarm(...args),
  cancelAlarm: (...args: unknown[]) => mockCancelAlarm(...args),
  cancelAllAlarms: (...args: unknown[]) => mockCancelAllAlarms(...args),
  stopRinging: (...args: unknown[]) => mockStopRinging(...args),
  snoozeRinging: jest.fn().mockReturnValue(true),
}));

function makeAlarm(overrides: Partial<Alarm> = {}): Alarm {
  return {
    id: 'test-alarm',
    startHour: 7,
    startMinute: 0,
    durationMinutes: 30,
    intervalMinutes: 10,
    snoozeDurationMinutes: 5,
    maxSnoozeCount: 3,
    days: [1, 2, 3, 4, 5],
    enabled: true,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('scheduleAlarmSequence', () => {
  it('cancels existing before scheduling new', async () => {
    await scheduleAlarmSequence(makeAlarm());
    expect(mockCancelAlarm).toHaveBeenCalled();
    // 4 sequence items x 5 days = 20 schedules
    expect(mockScheduleAlarm).toHaveBeenCalledTimes(20);
  });

  it('does not schedule if disabled', async () => {
    await scheduleAlarmSequence(makeAlarm({ enabled: false }));
    expect(mockScheduleAlarm).not.toHaveBeenCalled();
  });

  it('uses deterministic IDs', async () => {
    await scheduleAlarmSequence(makeAlarm({ days: [1] }));
    const ids = mockScheduleAlarm.mock.calls.map(
      (c: unknown[]) => (c[0] as { id: string }).id,
    );
    expect(ids).toContain('test-alarm_1_0');
    expect(ids).toContain('test-alarm_1_3');
  });

  it('uses sentinel day 7 for one-time', async () => {
    await scheduleAlarmSequence(makeAlarm({ days: [] }));
    const ids = mockScheduleAlarm.mock.calls.map(
      (c: unknown[]) => (c[0] as { id: string }).id,
    );
    expect(ids[0]).toBe('test-alarm_7_0');
  });

  it('passes correct params to native module', async () => {
    await scheduleAlarmSequence(makeAlarm({ days: [1], label: 'Wake up' }));
    const firstCall = mockScheduleAlarm.mock.calls[0][0] as Record<string, unknown>;
    expect(firstCall.alarmId).toBe('test-alarm');
    expect(firstCall.label).toBe('Wake up');
    expect(firstCall.intensityTier).toBe('gentle');
    expect(firstCall.dayIndex).toBe(1);
    expect(firstCall.sequenceIndex).toBe(0);
    expect(firstCall.totalInSequence).toBe(4);
    expect(firstCall.isRecurring).toBe(true);
    expect(firstCall.snoozeDurationMinutes).toBe(5);
    expect(firstCall.maxSnoozeCount).toBe(3);
    expect(firstCall.snoozeCount).toBe(0);
    expect(typeof firstCall.triggerTimestamp).toBe('number');
  });
});

describe('cancelAlarmNotifications', () => {
  it('cancels all IDs including snooze', async () => {
    await cancelAlarmNotifications(makeAlarm({ days: [1] }));
    const ids = mockCancelAlarm.mock.calls.map((c: unknown[]) => c[0]);
    expect(ids).toContain('test-alarm_1_0');
    expect(ids).toContain('test-alarm_1_3');
    expect(ids).toContain('test-alarm_snooze');
  });
});

describe('dismissAllRemaining', () => {
  it('stops ringing and cancels after current index for the given day only', async () => {
    await dismissAllRemaining(makeAlarm({ days: [1, 3, 5] }), 1, 3);
    expect(mockStopRinging).toHaveBeenCalledTimes(1);
    const ids = mockCancelAlarm.mock.calls.map((c: unknown[]) => c[0]);
    expect(ids).toContain('test-alarm_3_2');
    expect(ids).toContain('test-alarm_3_3');
    expect(ids).toContain('test-alarm_snooze');
    // Should not cancel other days
    expect(ids).not.toContain('test-alarm_1_2');
    expect(ids).not.toContain('test-alarm_5_2');
  });
});
```

- [ ] **Step 2: Run tests**

Run: `cd /home/ubuntu/projects/alarm && pnpm test -- --testPathPattern=scheduler.test 2>&1 | tail -20`

Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add src/features/alarm/services/__tests__/scheduler.test.ts
git commit -m "test(alarm-engine): update scheduler tests for native module"
```

---

## Task 14: Alarm Event Listener Hook

**Files:**
- Create: `src/features/alarm/hooks/use-alarm-event-listener.ts`
- Delete: `src/features/alarm/hooks/use-notification-listener.ts`

- [ ] **Step 1: Create use-alarm-event-listener.ts**

```typescript
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
      router.push('/ringing');
    });

    stoppedSub.current = addAlarmListener('onAlarmStopped', () => {
      useRingingStore.getState().clear();
    });

    snoozedSub.current = addAlarmListener('onAlarmSnoozed', () => {
      useRingingStore.getState().clear();
    });

    return () => {
      firedSub.current?.remove();
      stoppedSub.current?.remove();
      snoozedSub.current?.remove();
    };
  }, [router]);
}
```

- [ ] **Step 2: Delete old notification listener**

```bash
rm src/features/alarm/hooks/use-notification-listener.ts
```

- [ ] **Step 3: Verify types**

Run: `cd /home/ubuntu/projects/alarm && pnpm type-check 2>&1 | tail -10`

Expected: Error about `use-notification-listener` import in `_layout.tsx` (will be fixed in Task 16)

- [ ] **Step 4: Commit**

```bash
git add src/features/alarm/hooks/use-alarm-event-listener.ts
git rm src/features/alarm/hooks/use-notification-listener.ts
git commit -m "feat(alarm-engine): add use-alarm-event-listener, delete use-notification-listener"
```

---

## Task 15: Update Ringing Screen

**Files:**
- Modify: `src/features/alarm/screens/ringing-screen.tsx`

Replace scheduler calls with native module calls.

- [ ] **Step 1: Update imports and handlers in ringing-screen.tsx**

Replace the import line:

```typescript
// Old:
import { dismissAllRemaining, scheduleSnooze } from '../services/scheduler';
// New:
import { cancelAlarm, snoozeRinging, stopRinging } from 'modules/alarm-fullscreen';
import { generateSequence } from '../services/sequence-generator';
import { useAlarmStore } from '../stores/use-alarm-store';
```

Replace `handleSnooze`:

```typescript
  const handleSnooze = useCallback(async () => {
    if (!activeAlarmId) return;
    if (snoozeCount + 1 > maxSnoozeCount) return;
    snoozeRinging(snoozeDurationMinutes);
    goBack();
  }, [activeAlarmId, snoozeDurationMinutes, snoozeCount, maxSnoozeCount, goBack]);
```

Replace `handleDismissAll`:

```typescript
  const handleDismissAll = useCallback(async () => {
    stopRinging();
    if (alarm) {
      // Cancel remaining sequence items
      const sequence = generateSequence(alarm);
      for (const item of sequence) {
        if (item.sequenceIndex > currentSequenceIndex) {
          cancelAlarm(`${alarm.id}_${dayIndex}_${item.sequenceIndex}`);
        }
      }
      cancelAlarm(`${alarm.id}_snooze`);
    }
    goBack();
  }, [alarm, currentSequenceIndex, dayIndex, goBack]);
```

Update `onDismissThis` to call `stopRinging()`:

```typescript
  const handleDismissThis = useCallback(() => {
    stopRinging();
    goBack();
  }, [goBack]);
```

And update the JSX to use `handleDismissThis`:

```tsx
      <RingingActions
        onSnooze={handleSnooze}
        onDismissThis={handleDismissThis}
        onDismissAll={handleDismissAll}
        ...
      />
```

- [ ] **Step 2: Verify types**

Run: `cd /home/ubuntu/projects/alarm && pnpm type-check 2>&1 | tail -10`

- [ ] **Step 3: Commit**

```bash
git add src/features/alarm/screens/ringing-screen.tsx
git commit -m "feat(alarm-engine): update ringing screen to use native stopRinging/snoozeRinging"
```

---

## Task 16: Update Root Layout + Permissions Hook + Home Screen

**Files:**
- Modify: `src/app/_layout.tsx`
- Modify: `src/features/alarm/hooks/use-alarm-permissions.ts`
- Modify: `src/features/alarm/screens/home-screen.tsx`

Remove all expo-notifications references.

- [ ] **Step 1: Update _layout.tsx**

Remove these imports:

```typescript
// Remove:
import * as Notifications from 'expo-notifications';
import { useNotificationListener } from '@/features/alarm/hooks/use-notification-listener';
import { setupNotificationCategory, setupNotificationChannels } from '@/features/alarm/services/scheduler';
```

Add:

```typescript
import { useAlarmEventListener } from '@/features/alarm/hooks/use-alarm-event-listener';
```

In `RootLayout` function:
- Replace `useNotificationListener()` with `useAlarmEventListener()`
- Remove the `Notifications.setNotificationHandler({...})` block (around line 37-44)
- In the `setup()` function, remove:
  - `await Notifications.requestPermissionsAsync()`
  - `await setupNotificationChannels()`
  - `await setupNotificationCategory()`
- Keep `await registerBackgroundTask()` and the AppState listener for `rescheduleAllAlarms()`
- Update the `rescheduleAllAlarms` import to only import what's needed
- Add cold-start intent check in setup:

```typescript
import { getLaunchAlarmData } from 'modules/alarm-fullscreen';
import { useRingingStore } from '@/features/alarm/stores/use-ringing-store';

// In setup(), after registerBackgroundTask():
const launchData = getLaunchAlarmData();
if (launchData?.alarmId) {
  useRingingStore.getState().setRinging({
    alarmId: launchData.alarmId,
    dayIndex: launchData.dayIndex ?? 0,
    sequenceIndex: launchData.sequenceIndex ?? 0,
    total: launchData.totalInSequence ?? 1,
    tier: (launchData.intensityTier as IntensityTier) ?? 'gentle',
    snoozeDuration: launchData.snoozeDurationMinutes ?? 5,
    snoozeCount: launchData.snoozeCount ?? 0,
    maxSnoozeCount: launchData.maxSnoozeCount ?? 3,
  });
  router.push('/ringing');
}
```

- [ ] **Step 2: Update use-alarm-permissions.ts**

Remove the `expo-notifications` import and permission check:

```typescript
// Remove:
import * as Notifications from 'expo-notifications';

// In checkPermissions, remove:
const { status } = await Notifications.getPermissionsAsync();
setPermissionDenied(status !== 'granted');

// Replace with just the Android-specific checks (already there)
```

Remove `permissionDenied` and `openNotificationSettings` from state and return value, since notification permissions are no longer relevant (alarm uses foreground service, not notification delivery).

- [ ] **Step 3: Update home-screen.tsx**

In `src/features/alarm/screens/home-screen.tsx`:

- Remove `permissionDenied` and `openNotificationSettings` from the `useAlarmPermissions()` destructure
- Remove the first `<PermissionBanner visible={permissionDenied} .../>` (notification permission banner)
- In the remaining FSI banner, remove the `&& !permissionDenied` condition
- In the battery banner, remove the `&& !permissionDenied` condition

- [ ] **Step 4: Verify types**

Run: `cd /home/ubuntu/projects/alarm && pnpm type-check 2>&1 | tail -10`

Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/app/_layout.tsx src/features/alarm/hooks/use-alarm-permissions.ts src/features/alarm/screens/home-screen.tsx
git commit -m "feat(alarm-engine): remove expo-notifications from root layout, permissions, and home screen"
```

---

## Task 17: Remove expo-notifications Dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove expo-notifications**

Run: `cd /home/ubuntu/projects/alarm && pnpm remove expo-notifications`

- [ ] **Step 2: Verify no remaining references**

Run: `cd /home/ubuntu/projects/alarm && grep -r "expo-notifications" src/ modules/ app.config.ts --include="*.ts" --include="*.tsx" --include="*.kt" --include="*.java"`

Expected: No matches (or only in test files that will be updated)

- [ ] **Step 3: Run all tests**

Run: `cd /home/ubuntu/projects/alarm && pnpm test 2>&1 | tail -20`

Expected: All tests pass

- [ ] **Step 4: Run type check**

Run: `cd /home/ubuntu/projects/alarm && pnpm type-check 2>&1 | tail -10`

Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: remove expo-notifications dependency"
```

---

## Task 18: Full Build Verification

**Files:** None (verification only)

- [ ] **Step 1: Clean prebuild**

Run: `cd /home/ubuntu/projects/alarm && npx expo prebuild --platform android --clean 2>&1 | tail -10`

Expected: Success

- [ ] **Step 2: Verify sound files in res/raw**

Run: `ls -la /home/ubuntu/projects/alarm/android/app/src/main/res/raw/`

Expected: `gentle.wav`, `moderate.wav`, `strong.wav`, `aggressive.wav`

- [ ] **Step 3: Verify manifest has all components**

Run: `grep -A 2 "AlarmService\|AlarmReceiver\|BootReceiver\|USE_EXACT_ALARM\|FOREGROUND_SERVICE" /home/ubuntu/projects/alarm/android/app/src/main/AndroidManifest.xml`

Expected: Service and receivers registered, permissions present

- [ ] **Step 4: Full Android build**

Run: `cd /home/ubuntu/projects/alarm/android && ./gradlew assembleDebug 2>&1 | tail -20`

Expected: BUILD SUCCESSFUL

- [ ] **Step 5: Run all tests one final time**

Run: `cd /home/ubuntu/projects/alarm && pnpm test 2>&1 | tail -20`

Expected: All tests pass

- [ ] **Step 6: Commit any fixes if needed, then tag**

```bash
git commit -m "build: verify native alarm engine compiles and tests pass" --allow-empty
```
