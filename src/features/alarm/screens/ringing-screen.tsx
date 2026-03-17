// src/features/alarm/screens/ringing-screen.tsx

import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, Text } from '@/components/ui';

import { cancelAlarm, snoozeRinging, stopRinging } from 'modules/alarm-fullscreen';
import { generateSequence } from '../services/sequence-generator';
import { useAlarmStore } from '../stores/use-alarm-store';
import { useRingingStore } from '../stores/use-ringing-store';

function formatCurrentTime(): string {
  const now = new Date();
  const h = now.getHours() % 12 || 12;
  const m = String(now.getMinutes()).padStart(2, '0');
  const ap = now.getHours() >= 12 ? 'PM' : 'AM';
  return `${h}:${m} ${ap}`;
}

function usePulseAnimation() {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 800 }),
        withTiming(1, { duration: 800 }),
      ),
      -1,
    );
  }, [scale]);
  return useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
}

function useCurrentTime() {
  const [time, setTime] = useState(formatCurrentTime);
  useEffect(() => {
    const interval = setInterval(() => setTime(formatCurrentTime()), 1000);
    return () => clearInterval(interval);
  }, []);
  return time;
}

function RingingActions({
  onSnooze,
  onDismissThis,
  onDismissAll,
  snoozeDurationMinutes,
  snoozeCount,
  maxSnoozeCount,
}: {
  onSnooze: () => void;
  onDismissThis: () => void;
  onDismissAll: () => void;
  snoozeDurationMinutes: number;
  snoozeCount: number;
  maxSnoozeCount: number;
}) {
  const snoozesRemaining = maxSnoozeCount - snoozeCount;
  const canSnooze = snoozesRemaining > 0;

  return (
    <View className="w-full gap-3" style={{ maxWidth: 300 }}>
      <Pressable
        onPress={onSnooze}
        disabled={!canSnooze}
        className={`items-center rounded-[14px] border-[1.5px] py-[18px] ${
          canSnooze
            ? 'border-cyan-400/30 bg-cyan-400/15'
            : 'border-border bg-card opacity-40'
        }`}
        testID="btn-snooze"
      >
        <Text className={`font-bold ${canSnooze ? 'text-cyan-400' : 'text-muted-foreground'}`}>
          {canSnooze
            ? `Snooze ${snoozeDurationMinutes} min`
            : 'No snoozes left'}
        </Text>
        {canSnooze && (
          <Text className="mt-1 text-xs text-muted-foreground">
            {snoozesRemaining}
            {' '}
            {snoozesRemaining === 1 ? 'snooze' : 'snoozes'}
            {' '}
            remaining
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={onDismissThis}
        className="items-center rounded-[14px] border border-border bg-card py-4"
        testID="btn-dismiss-this"
      >
        <Text className="font-bold text-muted-foreground">
          Dismiss This
        </Text>
      </Pressable>

      <Pressable
        onPress={onDismissAll}
        className="items-center rounded-[14px] bg-danger-500 py-[18px]"
        testID="btn-dismiss-all"
      >
        <Text className="font-bold text-white">Dismiss All</Text>
      </Pressable>
    </View>
  );
}

export function RingingScreen() {
  const router = useRouter();
  const {
    activeAlarmId,
    dayIndex,
    currentSequenceIndex,
    totalInSequence,
    intensityTier,
    snoozeDurationMinutes,
    snoozeCount,
    maxSnoozeCount,
    clear,
  } = useRingingStore();
  const alarms = useAlarmStore(s => s.alarms);
  const alarm = alarms.find(a => a.id === activeAlarmId);
  const time = useCurrentTime();
  const pulseStyle = usePulseAnimation();

  const goBack = useCallback(() => {
    clear();
    if (router.canGoBack()) {
      router.back();
    }
    else {
      router.replace('/(alarm)' as any);
    }
  }, [clear, router]);

  const handleSnooze = useCallback(async () => {
    if (!activeAlarmId) return;
    if (snoozeCount + 1 > maxSnoozeCount) return;
    snoozeRinging(snoozeDurationMinutes);
    goBack();
  }, [activeAlarmId, snoozeDurationMinutes, snoozeCount, maxSnoozeCount, goBack]);

  const handleDismissThis = useCallback(() => {
    stopRinging();
    goBack();
  }, [goBack]);

  const handleDismissAll = useCallback(async () => {
    stopRinging();
    if (alarm) {
      const sequence = generateSequence(alarm);
      for (const item of sequence) {
        if (item.sequenceIndex > currentSequenceIndex) {
          cancelAlarm(`${alarm.id}_${dayIndex}_${item.sequenceIndex}`);
        }
      }
      cancelAlarm(`${alarm.id}_snooze`);
    }
    goBack();
  }, [alarm, currentSequenceIndex, dayIndex, goBack]);

  if (!activeAlarmId) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">No active alarm</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-background px-8">
      <Animated.View
        style={pulseStyle}
        className="mb-8 size-[140px] items-center justify-center rounded-full border-[3px] border-cyan-400"
      >
        <Text className="text-5xl">{'\uD83D\uDD14'}</Text>
      </Animated.View>

      <Text className="mb-2 text-[56px] font-extrabold text-white" style={{ letterSpacing: -2 }}>{time}</Text>

      <Text className="mb-1 text-base text-muted-foreground">
        {alarm?.label || 'Range Alarm'}
      </Text>

      <Text className="mb-10 text-sm font-semibold text-cyan-400">
        Alarm
        {' '}
        {currentSequenceIndex + 1}
        {' '}
        of
        {' '}
        {totalInSequence}
      </Text>

      <RingingActions
        onSnooze={handleSnooze}
        onDismissThis={handleDismissThis}
        onDismissAll={handleDismissAll}
        snoozeDurationMinutes={snoozeDurationMinutes}
        snoozeCount={snoozeCount}
        maxSnoozeCount={maxSnoozeCount}
      />
    </SafeAreaView>
  );
}
