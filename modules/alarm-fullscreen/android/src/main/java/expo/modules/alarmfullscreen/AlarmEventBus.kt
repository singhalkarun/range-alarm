package expo.modules.alarmfullscreen

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
