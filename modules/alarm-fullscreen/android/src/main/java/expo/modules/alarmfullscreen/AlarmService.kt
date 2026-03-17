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

        // Reference to the running instance for immediate sound stop
        private var instance: AlarmService? = null

        fun stop(context: Context) {
            // Immediately stop playback (don't wait for onDestroy)
            instance?.stopPlayback()
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
        instance = this

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
        ).apply { acquire(AUTO_SILENCE_MS + 60_000) }

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
        val soundUri = entry.soundUri

        mediaPlayer = MediaPlayer().apply {
            setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            )

            try {
                if (soundUri != null && !soundUri.startsWith("bundled_")) {
                    // Device alarm sound (content URI)
                    setDataSource(this@AlarmService, android.net.Uri.parse(soundUri))
                } else {
                    // Bundled sound — either from soundUri prefix or fallback to intensity tier
                    val resName = if (soundUri != null && soundUri.startsWith("bundled_")) {
                        soundUri.removePrefix("bundled_")
                    } else {
                        entry.intensityTier
                    }
                    val resId = resources.getIdentifier(resName, "raw", packageName)
                    if (resId == 0) return
                    val afd = resources.openRawResourceFd(resId) ?: return
                    setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
                    afd.close()
                }

                isLooping = true
                prepare()

                val audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
                val maxVol = audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM)
                audioManager.setStreamVolume(AudioManager.STREAM_ALARM, maxVol, 0)

                start()
            } catch (e: Exception) {
                // If custom sound fails, fall back to default
                release()
                mediaPlayer = null
                startFallbackSound(entry)
            }
        }
    }

    private fun startFallbackSound(entry: AlarmEntry) {
        val resId = getSoundResource(entry.intensityTier)
        if (resId == 0) return

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
        instance = null
        currentEntryId = null
        super.onDestroy()
    }
}
