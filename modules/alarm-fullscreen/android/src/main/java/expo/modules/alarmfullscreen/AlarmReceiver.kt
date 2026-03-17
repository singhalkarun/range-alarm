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
        // Stub — full implementation in a later task
    }
}
