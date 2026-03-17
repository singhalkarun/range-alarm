// src/features/alarm/components/alarm-card.tsx

import type { Alarm } from '../types';
import { Pressable, Switch, View } from 'react-native';

import { Swipeable } from 'react-native-gesture-handler';
import { Text } from '@/components/ui';
import { DAY_LABELS } from '../constants';
import { generateSequence } from '../services/sequence-generator';
import { to12Hour } from '../utils/time';

type Props = {
  alarm: Alarm;
  onPress: () => void;
  onToggle: () => void;
  onDelete: () => void;
};

function DeleteAction() {
  return (
    <View className="mr-4 mb-3 items-center justify-center rounded-2xl bg-danger-600 px-6">
      <Text className="text-sm font-semibold text-white">Delete</Text>
    </View>
  );
}

export function AlarmCard({ alarm, onPress, onToggle, onDelete }: Props) {
  const { hour, ampm } = to12Hour(alarm.startHour);
  const sequence = generateSequence(alarm);
  const timeDisplay = `${hour}:${String(alarm.startMinute).padStart(2, '0')}`;

  return (
    <Swipeable
      renderRightActions={() => <DeleteAction />}
      onSwipeableOpen={onDelete}
    >
      <Pressable
        onPress={onPress}
        className={`mx-5 mb-3.5 rounded-2xl border border-border bg-card ${
          alarm.enabled ? '' : 'opacity-40'
        }`}
        style={{ paddingHorizontal: 20, paddingVertical: 18 }}
        testID={`alarm-card-${alarm.id}`}
      >
        {/* Top row: time + toggle */}
        <View className="flex-row items-start justify-between">
          <View>
            <View className="flex-row items-baseline">
              <Text className="text-[36px] font-bold text-white" style={{ letterSpacing: -1, lineHeight: 40 }}>
                {timeDisplay}
              </Text>
              <Text className="ml-1 text-base font-normal text-muted-foreground">
                {ampm}
              </Text>
            </View>
            <Text className="mt-1.5 text-[13px] text-muted-foreground">
              Range:
              {' '}
              {alarm.durationMinutes}
              {' '}
              min, every
              {' '}
              {alarm.intervalMinutes}
              {' '}
              min
            </Text>
            {/* Range badge */}
            <View className="mt-1.5 flex-row items-center self-start rounded-full bg-cyan-400/15 px-2.5 py-1">
              <Text className="text-xs font-semibold text-cyan-400">
                {'\u23F1'}
                {' '}
                {sequence.length}
                {' '}
                alarms in sequence
              </Text>
            </View>
          </View>
          <Switch
            value={alarm.enabled}
            onValueChange={onToggle}
            trackColor={{ false: '#243447', true: '#00D4FF' }}
            thumbColor="#fff"
            style={{ width: 52, height: 30 }}
            testID={`alarm-toggle-${alarm.id}`}
          />
        </View>

        {/* Sequence dots */}
        <View className="mt-3 flex-row gap-1">
          {sequence.map((_, i) => (
            <View
              key={i}
              className="size-2 rounded-full bg-cyan-400"
              style={{ opacity: i === 0 ? 1 : 0.3 }}
            />
          ))}
        </View>

        {/* Day chips */}
        <View className="mt-2.5 flex-row gap-1.5">
          {DAY_LABELS.map((label, i) => {
            const isActive = alarm.days.includes(i);
            return (
              <View
                key={i}
                className={`size-7 items-center justify-center rounded-full ${
                  isActive ? 'bg-cyan-400/15' : 'bg-muted'
                }`}
              >
                <Text
                  className={`text-[11px] font-semibold ${
                    isActive ? 'text-cyan-400' : 'text-muted-foreground'
                  }`}
                  style={{ color: isActive ? '#00D4FF' : '#556677' }}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      </Pressable>
    </Swipeable>
  );
}
