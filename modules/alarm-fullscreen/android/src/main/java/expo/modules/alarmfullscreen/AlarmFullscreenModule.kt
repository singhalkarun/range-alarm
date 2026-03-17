package expo.modules.alarmfullscreen

import android.media.MediaPlayer
import android.Manifest
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AlarmFullscreenModule : Module() {

    private val eventListener: (AlarmEvent) -> Unit = { event ->
        sendEvent(event.name, event.data)
    }

    private var previewPlayer: android.media.MediaPlayer? = null

    private fun stopPreviewPlayer() {
        previewPlayer?.let {
            if (it.isPlaying) it.stop()
            it.release()
        }
        previewPlayer = null
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

        Function("hasNotificationPermission") {
            if (Build.VERSION.SDK_INT < 33) return@Function true
            val context = appContext.reactContext ?: return@Function true
            return@Function ContextCompat.checkSelfPermission(
                context, Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        }

        Function("requestNotificationPermission") {
            if (Build.VERSION.SDK_INT < 33) return@Function null
            val activity = appContext.currentActivity ?: return@Function null
            ActivityCompat.requestPermissions(
                activity,
                arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                1001
            )
            return@Function null
        }

        Function("getDeviceAlarmSounds") {
            val context = appContext.reactContext ?: return@Function emptyList<Map<String, String>>()
            val mgr = android.media.RingtoneManager(context)
            mgr.setType(android.media.RingtoneManager.TYPE_ALARM)
            val cursor = mgr.cursor
            val sounds = mutableListOf<Map<String, String>>()

            // Add bundled sounds first
            val bundledSounds = listOf(
                mapOf("uri" to "bundled_gentle", "title" to "Gentle Wake"),
                mapOf("uri" to "bundled_moderate", "title" to "Moderate Pulse"),
                mapOf("uri" to "bundled_strong", "title" to "Strong Beat"),
                mapOf("uri" to "bundled_aggressive", "title" to "Urgent Alert"),
            )
            sounds.addAll(bundledSounds)

            // Add device alarm sounds
            while (cursor.moveToNext()) {
                val uri = mgr.getRingtoneUri(cursor.position).toString()
                val title = cursor.getString(android.media.RingtoneManager.TITLE_COLUMN_INDEX)
                sounds.add(mapOf("uri" to uri, "title" to title))
            }
            return@Function sounds
        }

        Function("previewSound") { uri: String ->
            val context = appContext.reactContext ?: return@Function null
            stopPreviewPlayer()
            try {
                previewPlayer = if (uri.startsWith("bundled_")) {
                    val resName = uri.removePrefix("bundled_")
                    val resId = context.resources.getIdentifier(resName, "raw", context.packageName)
                    if (resId == 0) return@Function null
                    MediaPlayer().apply {
                        setAudioAttributes(
                            android.media.AudioAttributes.Builder()
                                .setUsage(android.media.AudioAttributes.USAGE_ALARM)
                                .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                                .build()
                        )
                        val afd = context.resources.openRawResourceFd(resId) ?: return@Function null
                        setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
                        afd.close()
                        isLooping = false
                        prepare()
                        start()
                    }
                } else {
                    MediaPlayer().apply {
                        setAudioAttributes(
                            android.media.AudioAttributes.Builder()
                                .setUsage(android.media.AudioAttributes.USAGE_ALARM)
                                .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                                .build()
                        )
                        setDataSource(context, android.net.Uri.parse(uri))
                        prepare()
                        start()
                    }
                }
            } catch (e: Exception) {
                // Silently fail if sound can't be played
            }
            return@Function null
        }

        Function("stopPreview") {
            stopPreviewPlayer()
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
                isRecurring = (params["isRecurring"] as? Boolean) ?: false,
                soundUri = params["soundUri"] as? String
            )
            AlarmScheduler.schedule(context, entry)
            return@Function true
        }

        Function("cancelAlarm") { id: String ->
            val context = appContext.reactContext ?: return@Function null
            AlarmScheduler.cancel(context, id)
            return@Function null
        }

        Function("cancelAllAlarms") {
            val context = appContext.reactContext ?: return@Function null
            AlarmScheduler.cancelAll(context)
            return@Function null
        }

        Function("stopRinging") {
            val context = appContext.reactContext ?: return@Function null
            val entryId = AlarmService.currentEntryId
            if (entryId != null) {
                val entry = AlarmStorage.get(context, entryId)
                AlarmService.stop(context)
                if (entry != null) {
                    AlarmStorage.remove(context, entryId)
                    AlarmEventBus.post(AlarmEventBus.alarmStoppedEvent(entry.alarmId))
                }
            }
            return@Function null
        }

        Function("snoozeRinging") { snoozeDurationMinutes: Int ->
            val context = appContext.reactContext ?: return@Function false
            val entryId = AlarmService.currentEntryId ?: return@Function false
            val entry = AlarmStorage.get(context, entryId) ?: return@Function false

            val newSnoozeCount = entry.snoozeCount + 1
            if (newSnoozeCount > entry.maxSnoozeCount) return@Function false

            AlarmService.stop(context)
            AlarmStorage.remove(context, entryId)

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
