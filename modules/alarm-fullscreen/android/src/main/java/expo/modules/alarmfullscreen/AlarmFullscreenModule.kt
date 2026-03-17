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
