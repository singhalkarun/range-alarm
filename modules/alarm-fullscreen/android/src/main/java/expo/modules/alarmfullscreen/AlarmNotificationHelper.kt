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

    private fun getSmallIconResId(context: Context): Int {
        // Try app's notification icon first, then launcher icon, then system fallback
        val notifIcon = context.resources.getIdentifier(
            "notification_icon", "drawable", context.packageName
        )
        if (notifIcon != 0) return notifIcon

        val launcherIcon = context.resources.getIdentifier(
            "ic_launcher", "mipmap", context.packageName
        )
        if (launcherIcon != 0) return launcherIcon

        return android.R.drawable.ic_lock_idle_alarm
    }

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

        val snoozeIntent = Intent(context, AlarmReceiver::class.java).apply {
            action = AlarmReceiver.ACTION_SNOOZE
            putExtra("entryId", entry.id)
        }
        val snoozePi = PendingIntent.getBroadcast(
            context, "${entry.id}_snooze".hashCode(), snoozeIntent, pendingFlags
        )

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
            setSmallIcon(getSmallIconResId(context))
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
            setSmallIcon(getSmallIconResId(context))
            setContentTitle(entry.label.ifEmpty { "RangeAlarm" })
            setContentText("Alarm ${entry.sequenceIndex + 1} of ${entry.totalInSequence}")
            setCategory(NotificationCompat.CATEGORY_ALARM)
            setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            setOngoing(true)
            priority = NotificationCompat.PRIORITY_MAX
        }.build()
    }
}
