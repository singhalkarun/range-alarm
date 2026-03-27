// src/features/alarm/screens/ringing-screen.tsx

import { useRouter } from 'expo-router';
import { cancelAlarm, snoozeRinging, stopRinging } from 'modules/alarm-fullscreen';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { Text } from '@/components/ui';

import { generateSequence } from '../services/sequence-generator';
import { useAlarmStore } from '../stores/use-alarm-store';
import { useRingingStore } from '../stores/use-ringing-store';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrentTime(): { hours: string; minutes: string; ampm: string } {
  const now = new Date();
  const h = now.getHours() % 12 || 12;
  const m = String(now.getMinutes()).padStart(2, '0');
  const ap = now.getHours() >= 12 ? 'PM' : 'AM';
  return { hours: String(h).padStart(2, '0'), minutes: m, ampm: ap };
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

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function SunIcon({ size = 18, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Ellipse cx="12" cy="12" rx="5" ry="5" fill={color} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const cx = 12 + 8.5 * Math.cos(rad);
        const cy = 12 + 8.5 * Math.sin(rad);
        return <Ellipse key={angle} cx={cx} cy={cy} rx="0.9" ry="0.9" fill={color} />;
      })}
    </Svg>
  );
}

function MoonIcon({ size = 16, color = '#6D6C6A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Ellipse cx="12" cy="12" rx="8" ry="8" fill={color} />
      <Ellipse cx="16" cy="8" rx="6" ry="6" fill="#FFFFFF" />
    </Svg>
  );
}

function TimerIcon({ size = 14, color = '#3D8A5A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Ellipse cx="12" cy="13" rx="8" ry="8" stroke={color} strokeWidth="2" fill="none" />
      <Ellipse cx="12" cy="13" rx="0.8" ry="0.8" fill={color} />
      <Ellipse cx="12" cy="9" rx="0.8" ry="2.5" fill={color} />
      <Ellipse cx="14.5" cy="11" rx="2" ry="0.8" fill={color} />
      <Ellipse cx="12" cy="4" rx="1.5" ry="1" fill={color} />
    </Svg>
  );
}

function FlameIcon({ size = 14, color = '#3D8A5A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Ellipse cx="12" cy="14" rx="5" ry="7" fill={color} />
      <Ellipse cx="12" cy="10" rx="3" ry="5" fill={color} opacity={0.6} />
      <Ellipse cx="12" cy="16" rx="2" ry="3" fill="#C8F0D8" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SunriseGradient({ pulseStyle }: { pulseStyle: ReturnType<typeof useAnimatedStyle> }) {
  return (
    <View style={{ width: '100%', height: 340 }}>
      <View style={{ flex: 1, backgroundColor: '#F5F0EB' }} />
      <View style={{ flex: 1, backgroundColor: '#FCEBD4' }} />
      <View style={{ flex: 1, backgroundColor: '#F5D4B3' }} />
      <View style={{ flex: 1, backgroundColor: '#E8C4A0' }} />
      <View style={{ flex: 0.8, backgroundColor: '#D89575' }} />
      <View
        style={{
          position: 'absolute',
          bottom: -40,
          left: '50%',
          marginLeft: -120,
          width: 240,
          height: 120,
        }}
      >
        <Animated.View style={[{ width: 240, height: 120 }, pulseStyle]}>
          <Svg width={240} height={120} viewBox="0 0 240 120">
            <Defs>
              <RadialGradient id="sunGlow" cx="50%" cy="100%" rx="50%" ry="80%">
                <Stop offset="0%" stopColor="#F5E6D0" stopOpacity="1" />
                <Stop offset="60%" stopColor="#F5E6D0" stopOpacity="0.5" />
                <Stop offset="100%" stopColor="#F5E6D0" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Ellipse cx="120" cy="120" rx="120" ry="100" fill="url(#sunGlow)" />
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
}

function RingingContent({
  time,
  alarmLabel,
}: {
  time: { hours: string; minutes: string; ampm: string };
  alarmLabel: string;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <Text style={{ fontSize: 15, fontWeight: '500', letterSpacing: 0.5, color: '#9C9B99', marginBottom: 8 }}>
        good morning
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 4 }}>
        <Text
          style={{
            fontFamily: 'Outfit',
            fontSize: 72,
            fontWeight: '300',
            letterSpacing: -2,
            lineHeight: 72,
            color: '#1A1918',
          }}
        >
          {`${time.hours}:${time.minutes}`}
        </Text>
        <Text style={{ fontSize: 18, fontWeight: '600', letterSpacing: 1, color: '#9C9B99', marginLeft: 6, marginBottom: 8 }}>
          {time.ampm}
        </Text>
      </View>

      <Text style={{ fontSize: 20, fontWeight: '600', letterSpacing: -0.3, color: '#3D8A5A', marginTop: 12, marginBottom: 4 }}>
        {alarmLabel}
      </Text>

      <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B6B6B', marginBottom: 16 }}>
        time to start a gentle day
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#3D8A5A18',
          borderRadius: 999,
          paddingVertical: 8,
          paddingHorizontal: 16,
          marginBottom: 8,
        }}
      >
        <TimerIcon size={14} color="#3D8A5A" />
        <Text style={{ fontSize: 13, fontWeight: '500', color: '#3D8A5A', marginLeft: 6 }}>
          woke you at the perfect time
        </Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#C8F0D820',
          borderRadius: 999,
          paddingVertical: 6,
          paddingHorizontal: 14,
        }}
      >
        <FlameIcon size={14} color="#3D8A5A" />
        <Text style={{ fontSize: 13, fontWeight: '500', color: '#3D8A5A', marginLeft: 6 }}>
          7 day streak
        </Text>
      </View>
    </View>
  );
}

function RingingActions({
  onImUp,
  onSnooze,
  canSnooze,
  snoozeDurationMinutes,
}: {
  onImUp: () => void;
  onSnooze: () => void;
  canSnooze: boolean;
  snoozeDurationMinutes: number;
}) {
  return (
    <SafeAreaView edges={['bottom']} style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
      <Pressable
        onPress={onImUp}
        testID="btn-im-up"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#3D8A5A',
          borderRadius: 16,
          height: 56,
          width: '100%',
          marginBottom: 12,
          shadowColor: '#3D8A5A',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <SunIcon size={18} color="#FFFFFF" />
        <Text style={{ fontSize: 17, fontWeight: '600', color: '#FFFFFF', marginLeft: 8 }}>
          I'm Awake
        </Text>
      </Pressable>

      {canSnooze && (
        <Pressable
          onPress={onSnooze}
          testID="btn-snooze"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            height: 52,
            width: '100%',
            borderWidth: 1,
            borderColor: '#E5E4E1',
            shadowColor: '#1A1918',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.03,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <MoonIcon size={16} color="#6D6C6A" />
          <Text style={{ fontSize: 16, fontWeight: '500', color: '#6D6C6A', marginLeft: 8 }}>
            {`Snooze ${snoozeDurationMinutes} min`}
          </Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function RingingScreen() {
  const router = useRouter();
  const {
    activeAlarmId,
    dayIndex,
    currentSequenceIndex,
    totalInSequence,
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
    if (!activeAlarmId)
      return;
    if (snoozeCount + 1 > maxSnoozeCount)
      return;
    const snoozed = snoozeRinging(snoozeDurationMinutes);
    if (!snoozed) {
      stopRinging();
    }
    goBack();
  }, [activeAlarmId, snoozeDurationMinutes, snoozeCount, maxSnoozeCount, goBack]);

  const _handleStop = useCallback(() => {
    stopRinging();
    goBack();
  }, [goBack]);

  const handleImUp = useCallback(async () => {
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F0EB' }}>
        <Text style={{ color: '#9C9B99' }}>No active alarm</Text>
      </View>
    );
  }

  const canSnooze = maxSnoozeCount - snoozeCount > 0;
  const _isLastInSequence = currentSequenceIndex + 1 >= totalInSequence;

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F0EB' }}>
      <SunriseGradient pulseStyle={pulseStyle} />
      <RingingContent time={time} alarmLabel={alarm?.label || 'Range Alarm'} />
      <RingingActions
        onImUp={handleImUp}
        onSnooze={handleSnooze}
        canSnooze={canSnooze}
        snoozeDurationMinutes={snoozeDurationMinutes}
      />
    </View>
  );
}
