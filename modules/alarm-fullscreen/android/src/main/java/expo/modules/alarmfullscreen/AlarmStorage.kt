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
