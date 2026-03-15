// src/features/alarm/screens/create-screen.tsx

import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui';
import { DaySelector } from '../components/day-selector';
import { DurationSlider } from '../components/duration-slider';
import { IntervalSelector } from '../components/interval-selector';
import { SequencePreview } from '../components/sequence-preview';
import { SnoozeSelector } from '../components/snooze-selector';
import { TimePicker } from '../components/time-picker';
import { IOS_NOTIFICATION_LIMIT } from '../constants';
import { useScheduleAlarm } from '../hooks/use-schedule-alarm';
import {
  countScheduledNotifications,
  generateSequence,
} from '../services/sequence-generator';
import { useAlarmStore } from '../stores/use-alarm-store';
import type { Alarm } from '../types';
import { to12Hour, to24Hour } from '../utils/time';

type Props = {
  initialValues?: Alarm;
};

export function CreateScreen({ initialValues }: Props) {
  const router = useRouter();
  const { saveAlarm } = useScheduleAlarm();
  const alarms = useAlarmStore((s) => s.alarms);

  const initial12 = initialValues
    ? to12Hour(initialValues.startHour)
    : { hour: 7, ampm: 'AM' as const };

  const [step, setStep] = useState(1);
  const [hour, setHour] = useState(initial12.hour);
  const [minute, setMinute] = useState(initialValues?.startMinute ?? 0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(initial12.ampm);
  const [duration, setDuration] = useState(
    initialValues?.durationMinutes ?? 30,
  );
  const [interval, setInterval] = useState(
    initialValues?.intervalMinutes ?? 10,
  );
  const [snoozeDuration, setSnoozeDuration] = useState(
    initialValues?.snoozeDurationMinutes ?? 5,
  );
  const [days, setDays] = useState<number[]>(
    initialValues?.days ?? [1, 2, 3, 4, 5],
  );

  const previewAlarm = useMemo((): Alarm => {
    return {
      id: initialValues?.id ?? 'preview',
      startHour: to24Hour(hour, ampm),
      startMinute: minute,
      durationMinutes: duration,
      intervalMinutes: interval,
      snoozeDurationMinutes: snoozeDuration,
      days,
      enabled: true,
    };
  }, [hour, minute, ampm, duration, interval, snoozeDuration, days, initialValues?.id]);

  const sequence = useMemo(
    () => generateSequence(previewAlarm),
    [previewAlarm],
  );

  // Notification count check
  const otherAlarms = alarms.filter((a) => a.id !== initialValues?.id);
  const otherCount = countScheduledNotifications(otherAlarms);
  const thisCount = sequence.length * (days.length || 1);
  const totalCount = otherCount + thisCount;
  const overLimit = totalCount > IOS_NOTIFICATION_LIMIT;

  const toggleDay = useCallback((day: number) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (overLimit) return;
    const alarm: Alarm = {
      ...previewAlarm,
      id: initialValues?.id ?? Crypto.randomUUID(),
    };
    await saveAlarm(alarm);
    router.back();
  }, [previewAlarm, initialValues?.id, saveAlarm, router, overLimit]);

  return (
    <View className="flex-1 bg-background">
      {/* Step indicators */}
      <View className="flex-row items-center justify-center gap-2 py-4">
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            className={`h-2 w-2 rounded-full ${
              s === step
                ? 'bg-cyan-400'
                : s < step
                  ? 'bg-cyan-400/50'
                  : 'bg-navy-600'
            }`}
          />
        ))}
      </View>

      <ScrollView className="flex-1 px-6" keyboardShouldPersistTaps="handled">
        {/* Step 1: Time Picker */}
        {step === 1 && (
          <View className="gap-6 pt-8">
            <Text className="text-center text-lg text-muted-foreground">
              Set alarm start time
            </Text>
            <TimePicker
              hour={hour}
              minute={minute}
              ampm={ampm}
              onChangeHour={setHour}
              onChangeMinute={setMinute}
              onChangeAmPm={setAmpm}
            />
          </View>
        )}

        {/* Step 2: Range Config */}
        {step === 2 && (
          <View className="gap-6 pt-4">
            <DurationSlider value={duration} onChange={setDuration} />
            <IntervalSelector
              value={interval}
              onChange={setInterval}
              maxInterval={duration}
            />
            <SnoozeSelector value={snoozeDuration} onChange={setSnoozeDuration} />
          </View>
        )}

        {/* Step 3: Preview & Schedule */}
        {step === 3 && (
          <View className="gap-6 pt-4">
            <SequencePreview
              sequence={sequence}
              durationMinutes={duration}
              intervalMinutes={interval}
            />
            <DaySelector selectedDays={days} onToggleDay={toggleDay} />

            {/* Notification count */}
            <View className="flex-row justify-between">
              <Text className="text-xs text-muted-foreground">
                Notifications
              </Text>
              <Text
                className={`text-xs font-semibold ${
                  overLimit ? 'text-danger-400' : 'text-muted-foreground'
                }`}
              >
                {totalCount} / {IOS_NOTIFICATION_LIMIT}
              </Text>
            </View>
            {overLimit && (
              <Text className="text-xs text-danger-400">
                Exceeds iOS notification limit. Reduce duration, interval, or
                active days.
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom navigation */}
      <View className="flex-row gap-3 px-6 pb-8 pt-4">
        {step > 1 && (
          <Pressable
            onPress={() => setStep(step - 1)}
            className="flex-1 items-center rounded-xl bg-navy-600 py-4"
            testID="btn-back"
          >
            <Text className="font-semibold text-muted-foreground">Back</Text>
          </Pressable>
        )}
        {step < 3 ? (
          <Pressable
            onPress={() => setStep(step + 1)}
            className="flex-1 items-center rounded-xl bg-cyan-400 py-4"
            testID="btn-next"
          >
            <Text className="font-semibold text-black">Next</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleSave}
            disabled={overLimit}
            className={`flex-1 items-center rounded-xl py-4 ${
              overLimit ? 'bg-navy-600' : 'bg-cyan-400'
            }`}
            testID="btn-save"
          >
            <Text
              className={`font-semibold ${
                overLimit ? 'text-muted-foreground' : 'text-black'
              }`}
            >
              {initialValues ? 'Update Alarm' : 'Save Alarm'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
