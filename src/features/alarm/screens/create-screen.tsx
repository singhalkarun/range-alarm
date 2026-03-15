// src/features/alarm/screens/create-screen.tsx

import type { Alarm } from '../types';
import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { to12Hour, to24Hour } from '../utils/time';

type Props = {
  initialValues?: Alarm;
};

function StepDots({ step }: { step: number }) {
  return (
    <View className="flex-row items-center justify-center gap-2 py-4">
      {[1, 2, 3].map(s => (
        <View
          key={s}
          className={`size-2 rounded-full ${
            s === step
              ? 'bg-cyan-400'
              : s < step
                ? 'bg-cyan-400/50'
                : 'bg-navy-600'
          }`}
        />
      ))}
    </View>
  );
}

function BottomNav({
  step,
  overLimit,
  isEdit,
  onBack,
  onNext,
  onSave,
}: {
  step: number;
  overLimit: boolean;
  isEdit: boolean;
  onBack: () => void;
  onNext: () => void;
  onSave: () => void;
}) {
  return (
    <View className="flex-row gap-3 px-6 pt-4 pb-8">
      {step > 1 && (
        <Pressable
          onPress={onBack}
          className="flex-1 items-center rounded-xl bg-navy-600 py-4"
          testID="btn-back"
        >
          <Text className="font-semibold text-muted-foreground">Back</Text>
        </Pressable>
      )}
      {step < 3
        ? (
            <Pressable
              onPress={onNext}
              className="flex-1 items-center rounded-xl bg-cyan-400 py-4"
              testID="btn-next"
            >
              <Text className="font-semibold text-black">Next</Text>
            </Pressable>
          )
        : (
            <Pressable
              onPress={onSave}
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
                {isEdit ? 'Update Alarm' : 'Save Alarm'}
              </Text>
            </Pressable>
          )}
    </View>
  );
}

export function CreateScreen({ initialValues }: Props) {
  const router = useRouter();
  const { saveAlarm } = useScheduleAlarm();
  const alarms = useAlarmStore(s => s.alarms);

  const initial12 = initialValues
    ? to12Hour(initialValues.startHour)
    : { hour: 7, ampm: 'AM' as const };

  const [step, setStep] = useState(1);
  const [hour, setHour] = useState(initial12.hour);
  const [minute, setMinute] = useState(initialValues?.startMinute ?? 0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(initial12.ampm);
  const [duration, setDuration] = useState(initialValues?.durationMinutes ?? 30);
  const [interval, setInterval] = useState(initialValues?.intervalMinutes ?? 10);
  const [snoozeDuration, setSnoozeDuration] = useState(initialValues?.snoozeDurationMinutes ?? 5);
  const [days, setDays] = useState<number[]>(initialValues?.days ?? [1, 2, 3, 4, 5]);

  const previewAlarm = useMemo((): Alarm => ({
    id: initialValues?.id ?? 'preview',
    startHour: to24Hour(hour, ampm),
    startMinute: minute,
    durationMinutes: duration,
    intervalMinutes: interval,
    snoozeDurationMinutes: snoozeDuration,
    days,
    enabled: true,
  }), [hour, minute, ampm, duration, interval, snoozeDuration, days, initialValues?.id]);

  const sequence = useMemo(() => generateSequence(previewAlarm), [previewAlarm]);

  const otherAlarms = alarms.filter(a => a.id !== initialValues?.id);
  const totalCount = countScheduledNotifications(otherAlarms) + sequence.length * (days.length || 1);
  const overLimit = totalCount > IOS_NOTIFICATION_LIMIT;

  const toggleDay = useCallback((day: number) => {
    setDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  }, []);

  const handleSave = useCallback(async () => {
    if (overLimit)
      return;
    const alarm: Alarm = { ...previewAlarm, id: initialValues?.id ?? Crypto.randomUUID() };
    await saveAlarm(alarm);
    router.back();
  }, [previewAlarm, initialValues?.id, saveAlarm, router, overLimit]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StepDots step={step} />

      <ScrollView className="flex-1 px-6" keyboardShouldPersistTaps="handled">
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

        {step === 2 && (
          <View className="gap-6 pt-4">
            <DurationSlider value={duration} onChange={setDuration} />
            <IntervalSelector value={interval} onChange={setInterval} maxInterval={duration} />
            <SnoozeSelector value={snoozeDuration} onChange={setSnoozeDuration} />
          </View>
        )}

        {step === 3 && (
          <View className="gap-6 pt-4">
            <SequencePreview sequence={sequence} durationMinutes={duration} intervalMinutes={interval} />
            <DaySelector selectedDays={days} onToggleDay={toggleDay} />
            <View className="flex-row justify-between">
              <Text className="text-xs text-muted-foreground">Notifications</Text>
              <Text className={`text-xs font-semibold ${overLimit ? 'text-danger-400' : 'text-muted-foreground'}`}>
                {totalCount}
                {' '}
                /
                {IOS_NOTIFICATION_LIMIT}
              </Text>
            </View>
            {overLimit && (
              <Text className="text-xs text-danger-400">
                Exceeds iOS notification limit. Reduce duration, interval, or active days.
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      <BottomNav
        step={step}
        overLimit={overLimit}
        isEdit={!!initialValues}
        onBack={() => setStep(step - 1)}
        onNext={() => setStep(step + 1)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}
