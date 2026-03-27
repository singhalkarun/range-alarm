// src/features/alarm/screens/create-screen.tsx

import type { Alarm } from '../types';
import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Alert } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { SafeAreaView, Text } from '@/components/ui';
import { DaySelector } from '../components/day-selector';
import { DEFAULT_MAX_SNOOZE_COUNT } from '../constants';
import { useScheduleAlarm } from '../hooks/use-schedule-alarm';
import { to12Hour, to24Hour } from '../utils/time';

type Props = {
  initialValues?: Alarm;
};

const DURATION_PRESETS = [15, 30, 45] as const;
const INTERVAL_PRESETS = [5, 10, 15] as const;

type SoundPreset = 'mist' | 'rain' | 'waves';
function LeafIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z" />
      <Path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </Svg>
  );
}

function CloudRainIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <Path d="M16 14v6" />
      <Path d="M8 14v6" />
      <Path d="M12 16v6" />
    </Svg>
  );
}

function WavesIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <Path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <Path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    </Svg>
  );
}

function SoundIcon({ type, color }: { type: SoundPreset; color: string }) {
  switch (type) {
    case 'mist': return <LeafIcon color={color} />;
    case 'rain': return <CloudRainIcon color={color} />;
    case 'waves': return <WavesIcon color={color} />;
  }
}

const SOUND_PRESETS: { key: SoundPreset; label: string }[] = [
  { key: 'mist', label: 'Mist' },
  { key: 'rain', label: 'Rain' },
  { key: 'waves', label: 'Waves' },
];

function formatMinute(m: number): string {
  return String(m).padStart(2, '0');
}

function addMinutes(
  hour24: number,
  minute: number,
  add: number,
): { hour24: number; minute: number } {
  const total = hour24 * 60 + minute + add;
  return {
    hour24: Math.floor(total / 60) % 24,
    minute: total % 60,
  };
}

function getTimeOfDayLabel(hour24: number): string {
  if (hour24 >= 5 && hour24 < 12) return 'morning';
  if (hour24 >= 12 && hour24 < 17) return 'afternoon';
  if (hour24 >= 17 && hour24 < 21) return 'evening';
  return 'night';
}

function soundPresetToUri(key: SoundPreset): string {
  return key;
}

function uriToSoundPreset(uri?: string): SoundPreset {
  if (uri === 'rain') return 'rain';
  if (uri === 'waves') return 'waves';
  return 'mist';
}

// Section label component
function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 1,
        color: '#9C9B99',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </Text>
  );
}

// Pill button used across sections
function PillButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: selected ? '#3D8A5A' : '#FFFFFF',
        borderWidth: selected ? 0 : 1,
        borderColor: '#EDECEA',
        borderRadius: 999,
        paddingHorizontal: 16,
        paddingVertical: 10,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: '500',
          color: selected ? '#FFFFFF' : '#1A1918',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SoundPillButton({
  soundKey,
  label,
  selected,
  onPress,
}: {
  soundKey: SoundPreset;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: selected ? '#3D8A5A' : '#FFFFFF',
        borderWidth: selected ? 0 : 1,
        borderColor: '#EDECEA',
        borderRadius: 999,
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <SoundIcon type={soundKey} color={selected ? '#FFFFFF' : '#1A1918'} />
      <Text
        style={{
          fontSize: 14,
          fontWeight: '500',
          color: selected ? '#FFFFFF' : '#1A1918',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function CreateScreen({ initialValues }: Props) {
  const router = useRouter();
  const { saveAlarm, removeAlarm } = useScheduleAlarm();

  const initial12 = initialValues
    ? to12Hour(initialValues.startHour)
    : { hour: 6, ampm: 'AM' as const };

  const [hour, setHour] = useState(initial12.hour);
  const [minute, setMinute] = useState(initialValues?.startMinute ?? 0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(initial12.ampm);
  const [duration, setDuration] = useState(initialValues?.durationMinutes ?? 30);
  const [interval, setInterval] = useState(initialValues?.intervalMinutes ?? 10);
  const [days, setDays] = useState<number[]>(initialValues?.days ?? [1, 2, 3, 4, 5]);
  const [sound, setSound] = useState<SoundPreset>(uriToSoundPreset(initialValues?.soundUri));
  const [label, setLabel] = useState(initialValues?.label ?? '');

  const isEdit = !!initialValues;

  const startHour24 = useMemo(() => to24Hour(hour, ampm), [hour, ampm]);
  const endTime = useMemo(
    () => addMinutes(startHour24, minute, duration),
    [startHour24, minute, duration],
  );
  const end12 = useMemo(() => to12Hour(endTime.hour24), [endTime.hour24]);

  const timeOfDay = useMemo(() => getTimeOfDayLabel(startHour24), [startHour24]);

  const toggleDay = useCallback((day: number) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const alarm: Alarm = {
        id: initialValues?.id ?? Crypto.randomUUID(),
        startHour: startHour24,
        startMinute: minute,
        durationMinutes: duration,
        intervalMinutes: interval,
        snoozeDurationMinutes: initialValues?.snoozeDurationMinutes ?? 5,
        maxSnoozeCount: initialValues?.maxSnoozeCount ?? DEFAULT_MAX_SNOOZE_COUNT,
        days,
        enabled: true,
        label: label.trim() || undefined,
        soundUri: soundPresetToUri(sound),
      };
      await saveAlarm(alarm);
      router.back();
    } catch (e) {
      console.error('Failed to save alarm:', e);
    }
  }, [
    initialValues?.id,
    initialValues?.snoozeDurationMinutes,
    initialValues?.maxSnoozeCount,
    startHour24,
    minute,
    duration,
    interval,
    days,
    label,
    sound,
    saveAlarm,
    router,
  ]);

  const handleDelete = useCallback(() => {
    if (!initialValues) return;
    Alert.alert(
      'Delete Alarm',
      'Are you sure you want to delete this alarm?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeAlarm(initialValues);
            router.back();
          },
        },
      ],
    );
  }, [initialValues, removeAlarm, router]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF8F5' }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#1A1918" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="m12 19-7-7 7-7" />
            <Path d="M19 12H5" />
          </Svg>
        </Pressable>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#1A1918',
            marginLeft: 12,
          }}
        >
          {isEdit ? 'edit alarm' : 'create alarm'}
        </Text>
        {isEdit && (
          <Pressable
            onPress={handleDelete}
            style={{ marginLeft: 'auto' }}
            testID="btn-delete-alarm"
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#D94545' }}>
              Delete
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Range Card */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#EDECEA',
            padding: 24,
            alignItems: 'center',
            marginBottom: 28,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              letterSpacing: 1,
              color: '#9C9B99',
              textTransform: 'uppercase',
              marginBottom: 20,
            }}
          >
            I WANT TO WAKE UP
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 24,
              marginBottom: 8,
            }}
          >
            {/* Start time */}
            <View style={{ alignItems: 'center' }}>
              <Pressable
                onPress={() => {
                  // Cycle hour for start time
                  setHour((h) => (h % 12) + 1);
                }}
              >
                <Text
                  style={{
                    fontSize: 40,
                    fontWeight: '700',
                    color: '#1A1918',
                  }}
                >
                  {hour}:{formatMinute(minute)}
                </Text>
              </Pressable>
              <Text style={{ fontSize: 13, color: '#9C9B99', marginTop: 4 }}>
                start
              </Text>
            </View>

            {/* Circular indicator */}
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                borderWidth: 3,
                borderColor: '#3D8A5A',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#3D8A5A',
                }}
              />
            </View>

            {/* End time */}
            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 40,
                  fontWeight: '700',
                  color: '#1A1918',
                }}
              >
                {end12.hour}:{formatMinute(endTime.minute)}
              </Text>
              <Text style={{ fontSize: 13, color: '#9C9B99', marginTop: 4 }}>
                end
              </Text>
            </View>
          </View>

          {/* AM/PM toggle */}
          <Pressable
            onPress={() => setAmpm((v) => (v === 'AM' ? 'PM' : 'AM'))}
          >
            <View
              style={{
                backgroundColor: '#3D8A5A18',
                borderRadius: 999,
                paddingHorizontal: 14,
                paddingVertical: 6,
                marginTop: 12,
              }}
            >
              <Text
                style={{ fontSize: 13, fontWeight: '600', color: '#3D8A5A' }}
              >
                {timeOfDay} · {ampm}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* WAKE-UP RANGE */}
        <View style={{ marginBottom: 28 }}>
          <SectionLabel>WAKE-UP RANGE</SectionLabel>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            {DURATION_PRESETS.map((d) => (
              <PillButton
                key={d}
                label={`${d} min`}
                selected={duration === d}
                onPress={() => setDuration(d)}
              />
            ))}
          </View>
        </View>

        {/* ALARM FREQUENCY */}
        <View style={{ marginBottom: 28 }}>
          <SectionLabel>ALARM FREQUENCY</SectionLabel>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            {INTERVAL_PRESETS.map((i) => (
              <PillButton
                key={i}
                label={`every ${i} min`}
                selected={interval === i}
                onPress={() => setInterval(i)}
              />
            ))}
          </View>
        </View>

        {/* WAKE-UP SOUND */}
        <View style={{ marginBottom: 28 }}>
          <SectionLabel>WAKE-UP SOUND</SectionLabel>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            {SOUND_PRESETS.map((s) => (
              <SoundPillButton
                key={s.key}
                soundKey={s.key}
                label={s.label}
                selected={sound === s.key}
                onPress={() => setSound(s.key)}
              />
            ))}
          </View>
        </View>

        {/* ALARM LABEL */}
        <View style={{ marginBottom: 28 }}>
          <Text style={{ fontSize: 12, color: '#9C9B99', marginBottom: 8 }}>
            alarm label
          </Text>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="Morning Mist"
            placeholderTextColor="#C8C7C5"
            style={{
              fontSize: 20,
              fontWeight: '500',
              color: '#1A1918',
              borderBottomWidth: 1,
              borderBottomColor: '#EDECEA',
              paddingBottom: 10,
            }}
          />
        </View>

        {/* REPEAT */}
        <View style={{ marginBottom: 32 }}>
          <SectionLabel>REPEAT</SectionLabel>
          <DaySelector selectedDays={days} onToggleDay={toggleDay} />
        </View>

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          style={{
            backgroundColor: '#3D8A5A',
            borderRadius: 12,
            paddingVertical: 18,
            alignItems: 'center',
          }}
          testID="btn-save"
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
            {isEdit ? 'Update Alarm' : 'Save Alarm'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
