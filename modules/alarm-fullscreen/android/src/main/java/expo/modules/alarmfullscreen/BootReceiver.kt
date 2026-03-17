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
                    AlarmScheduler.schedule(context, entry)
                }
                entry.isRecurring -> {
                    val advanced = entry.copy(
                        triggerTimestamp = entry.triggerTimestamp + 7L * 24 * 60 * 60 * 1000,
                        snoozeCount = 0
                    )
                    AlarmStorage.remove(context, entry.id)
                    AlarmScheduler.schedule(context, advanced)
                }
                else -> {
                    AlarmStorage.remove(context, entry.id)
                }
            }
        }
    }
}
