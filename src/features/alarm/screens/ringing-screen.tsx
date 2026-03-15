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

import { Text } from '@/components/ui';
import { dismissAllRemaining, scheduleSnooze } from '../services/scheduler';
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
}: {
  onSnooze: () => void;
  onDismissThis: () => void;
  onDismissAll: () => void;
  snoozeDurationMinutes: number;
}) {
  return (
    <View className="w-full gap-3">
      <Pressable
        onPress={onSnooze}
        className="items-center rounded-xl bg-cyan-400 py-4"
        testID="btn-snooze"
      >
        <Text className="font-semibold text-black">
          Snooze
          {' '}
          {snoozeDurationMinutes}
          {' '}
          min
        </Text>
      </Pressable>

      <Pressable
        onPress={onDismissThis}
        className="items-center rounded-xl bg-navy-600 py-4"
        testID="btn-dismiss-this"
      >
        <Text className="font-semibold text-muted-foreground">
          Dismiss This
        </Text>
      </Pressable>

      <Pressable
        onPress={onDismissAll}
        className="items-center rounded-xl bg-danger-600 py-4"
        testID="btn-dismiss-all"
      >
        <Text className="font-semibold text-white">Dismiss All</Text>
      </Pressable>
    </View>
  );
}

export function RingingScreen() {
  const router = useRouter();
  const {
    activeAlarmId,
    currentSequenceIndex,
    totalInSequence,
    intensityTier,
    snoozeDurationMinutes,
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
    if (!activeAlarmId)
      return;
    await scheduleSnooze({
      alarmId: activeAlarmId,
      snoozeDurationMinutes,
      intensityTier,
      sequenceIndex: currentSequenceIndex,
      totalInSequence,
    });
    goBack();
  }, [activeAlarmId, snoozeDurationMinutes, intensityTier, currentSequenceIndex, totalInSequence, goBack]);

  const handleDismissAll = useCallback(async () => {
    if (alarm) {
      await dismissAllRemaining(alarm, currentSequenceIndex);
    }
    goBack();
  }, [alarm, currentSequenceIndex, goBack]);

  if (!activeAlarmId) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">No active alarm</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-background px-8">
      <Animated.View
        style={pulseStyle}
        className="mb-8 size-40 items-center justify-center rounded-full border-4 border-cyan-400"
      >
        <Text className="text-5xl">&#9200;</Text>
      </Animated.View>

      <Text className="mb-2 text-5xl font-bold text-white">{time}</Text>

      <Text className="mb-1 text-base text-cyan-400">
        {alarm?.label || 'Range Alarm'}
      </Text>

      <Text className="mb-8 text-sm text-muted-foreground">
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
        onDismissThis={goBack}
        onDismissAll={handleDismissAll}
        snoozeDurationMinutes={snoozeDurationMinutes}
      />
    </View>
  );
}
