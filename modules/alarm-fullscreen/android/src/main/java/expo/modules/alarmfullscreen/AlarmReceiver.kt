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

        AlarmService.stop(context)

        val newSnoozeCount = entry.snoozeCount + 1
        if (newSnoozeCount > entry.maxSnoozeCount) {
            AlarmStorage.remove(context, entryId)
            AlarmEventBus.post(AlarmEventBus.alarmStoppedEvent(entry.alarmId))
            return
        }

        AlarmStorage.remove(context, entryId)

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

        AlarmService.stop(context)
        AlarmStorage.remove(context, entryId)

        val snoozeId = "${entry.alarmId}_snooze"
        AlarmScheduler.cancel(context, snoozeId)

        AlarmEventBus.post(AlarmEventBus.alarmStoppedEvent(entry.alarmId))
    }
}
