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

        val showIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            ?: Intent()
        val showPi = PendingIntent.getActivity(
            context, 0, showIntent, pendingFlags
        )

        val alarmClockInfo = AlarmManager.AlarmClockInfo(entry.triggerTimestamp, showPi)
        alarmManager.setAlarmClock(alarmClockInfo, pendingIntent)

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
