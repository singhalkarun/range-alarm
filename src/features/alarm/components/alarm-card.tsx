// src/features/alarm/components/alarm-card.tsx

import { Pressable, Switch, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { Text } from '@/components/ui';
import type { Alarm } from '../types';
import { DAY_LABELS } from '../constants';
import { generateSequence } from '../services/sequence-generator';
import { to12Hour } from '../utils/time';
import { IntensityIndicator } from './intensity-indicator';

type Props = {
  alarm: Alarm;
  onPress: () => void;
  onToggle: () => void;
  onDelete: () => void;
};

function DeleteAction() {
  return (
    <View className="mb-3 mr-4 items-center justify-center rounded-2xl bg-danger-600 px-6">
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
      className={`mx-4 mb-3 rounded-2xl border p-4 ${
        alarm.enabled
          ? 'border-cyan-400/15 bg-card'
          : 'border-border/5 bg-card opacity-50'
      }`}
      testID={`alarm-card-${alarm.id}`}
    >
      {/* Top row: time + toggle */}
      <View className="flex-row items-center justify-between mb-2">
        <View>
          <View className="flex-row items-baseline">
            <Text className="text-3xl font-bold text-white">
              {timeDisplay}
            </Text>
            <Text className="ml-1 text-base text-muted-foreground">
              {ampm}
            </Text>
          </View>
          <Text className="text-xs text-cyan-400 mt-0.5">
            {alarm.durationMinutes} min range, every {alarm.intervalMinutes} min
          </Text>
          {alarm.label ? (
            <Text className="text-xs text-muted-foreground mt-0.5">
              {alarm.label}
            </Text>
          ) : null}
        </View>
        <Switch
          value={alarm.enabled}
          onValueChange={onToggle}
          trackColor={{ false: '#333', true: '#00D4FF' }}
          thumbColor="#fff"
          testID={`alarm-toggle-${alarm.id}`}
        />
      </View>

      {/* Intensity dots */}
      <View className="mb-2">
        <IntensityIndicator total={sequence.length} />
      </View>

      {/* Day chips */}
      <View className="flex-row gap-1">
        {DAY_LABELS.map((label, i) => {
          const isActive = alarm.days.includes(i);
          return (
            <View
              key={i}
              className={`rounded-md px-1.5 py-0.5 ${
                isActive ? 'bg-cyan-400' : 'bg-navy-800/50'
              }`}
            >
              <Text
                className={`text-[10px] font-semibold ${
                  isActive ? 'text-black' : 'text-muted-foreground'
                }`}
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
