// src/features/alarm/screens/create-screen.tsx

import type { Alarm } from '../types';
import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Pressable, ScrollView, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView, Text } from '@/components/ui';
import { DaySelector } from '../components/day-selector';
import { DurationSlider } from '../components/duration-slider';
import { IntervalSelector } from '../components/interval-selector';
import { MaxSnoozeSelector } from '../components/max-snooze-selector';
import { SequencePreview } from '../components/sequence-preview';
import { SoundSelector } from '../components/sound-selector';
import { SnoozeSelector } from '../components/snooze-selector';
import { TimePicker } from '../components/time-picker';
import { DEFAULT_MAX_SNOOZE_COUNT } from '../constants';
import { stopPreview } from 'modules/alarm-fullscreen';
import { useScheduleAlarm } from '../hooks/use-schedule-alarm';
import { generateSequence } from '../services/sequence-generator';
import { to12Hour, to24Hour } from '../utils/time';

type Props = {
  initialValues?: Alarm;
};

function StepBars({ step }: { step: number }) {
  return (
    <View className="flex-row gap-2 px-6 pb-5">
      {[1, 2, 3].map(s => (
        <View
          key={s}
          className={`h-1 flex-1 rounded-sm ${
            s <= step ? 'bg-cyan-400' : 'bg-muted'
          }`}
          style={s === step ? { opacity: 1 } : s < step ? { opacity: 1 } : {}}
        />
      ))}
    </View>
  );
}

function BottomNav({
  step,
  isEdit,
  onBack,
  onNext,
  onSave,
}: {
  step: number;
  isEdit: boolean;
  onBack: () => void;
  onNext: () => void;
  onSave: () => void;
}) {
  return (
    <View className="flex-row gap-3" style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}>
      <Pressable
        onPress={onBack}
        className="items-center justify-center rounded-[14px] border-[1.5px] border-border px-5"
        style={{ height: 52 }}
        testID="btn-back"
      >
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Pressable>
      {step < 3
        ? (
            <Pressable
              onPress={onNext}
              className="flex-1 items-center justify-center rounded-[14px] bg-cyan-400"
              style={{ height: 52 }}
              testID="btn-next"
            >
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-bold text-white">
                  {step === 1 ? 'Next' : 'Preview'}
                </Text>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
            </Pressable>
          )
        : (
            <Pressable
              onPress={onSave}
              className="flex-1 items-center justify-center rounded-[14px] bg-cyan-400"
              style={{ height: 52 }}
              testID="btn-save"
            >
              <Text className="text-base font-bold text-white" style={{ includeFontPadding: false }}>
                {isEdit ? 'Update Alarm' : 'Save Alarm'}
              </Text>
            </Pressable>
          )}
    </View>
  );
}

const STEP_SUBTITLES = [
  'When should your alarm range begin?',
  'How long and how often should alarms ring?',
  'Here\'s your alarm sequence',
] as const;

export function CreateScreen({ initialValues }: Props) {
  const router = useRouter();
  const { saveAlarm } = useScheduleAlarm();

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
  const [maxSnoozeCount, setMaxSnoozeCount] = useState(initialValues?.maxSnoozeCount ?? DEFAULT_MAX_SNOOZE_COUNT);
  const [days, setDays] = useState<number[]>(initialValues?.days ?? [1, 2, 3, 4, 5]);
  const [soundUri, setSoundUri] = useState<string | undefined>(initialValues?.soundUri);

  useEffect(() => {
    if (step !== 2) {
      stopPreview();
    }
  }, [step]);

  const previewAlarm = useMemo((): Alarm => ({
    id: initialValues?.id ?? 'preview',
    startHour: to24Hour(hour, ampm),
    startMinute: minute,
    durationMinutes: duration,
    intervalMinutes: interval,
    snoozeDurationMinutes: snoozeDuration,
    maxSnoozeCount,
    days,
    enabled: true,
    soundUri,
  }), [hour, minute, ampm, duration, interval, snoozeDuration, maxSnoozeCount, days, soundUri, initialValues?.id]);

  const sequence = useMemo(() => generateSequence(previewAlarm), [previewAlarm]);

  const toggleDay = useCallback((day: number) => {
    setDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      stopPreview();
      const alarm: Alarm = { ...previewAlarm, id: initialValues?.id ?? Crypto.randomUUID() };
      await saveAlarm(alarm);
      router.back();
    } catch (e) {
      console.error('Failed to save alarm:', e);
    }
  }, [previewAlarm, initialValues?.id, saveAlarm, router]);

  const isEdit = !!initialValues;
  const stepTitle = step === 1
    ? 'Pick Start Time'
    : step === 2
      ? 'Set Your Range'
      : 'Preview Alarms';

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
        <Text className="text-lg font-bold text-white">
          {isEdit ? 'Edit Range Alarm' : 'New Range Alarm'}
        </Text>
      </View>

      <StepBars step={step} />

      <ScrollView className="flex-1 px-6" keyboardShouldPersistTaps="handled">
        {/* Step title & subtitle */}
        <Text className="mb-1.5 text-[22px] font-bold text-white">
          {stepTitle}
        </Text>
        <Text className="mb-6 text-sm text-muted-foreground">
          {STEP_SUBTITLES[step - 1]}
        </Text>

        {step === 1 && (
          <View className="gap-6" style={{ paddingVertical: 30 }}>
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
          <View className="gap-7">
            <DurationSlider value={duration} onChange={setDuration} />
            <IntervalSelector value={interval} onChange={setInterval} maxInterval={duration} />
            <SnoozeSelector value={snoozeDuration} onChange={setSnoozeDuration} />
            <MaxSnoozeSelector value={maxSnoozeCount} onChange={setMaxSnoozeCount} />
            <SoundSelector value={soundUri} onChange={setSoundUri} />
          </View>
        )}

        {step === 3 && (
          <View className="gap-5">
            <SequencePreview sequence={sequence} durationMinutes={duration} intervalMinutes={interval} />
            <DaySelector selectedDays={days} onToggleDay={toggleDay} />
          </View>
        )}
      </ScrollView>

      <BottomNav
        step={step}
        isEdit={isEdit}
        onBack={() => step > 1 ? setStep(step - 1) : router.back()}
        onNext={() => setStep(step + 1)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}
