// src/features/alarm/components/alarm-card.tsx

import type { Alarm } from '../types';
import { Pressable, Switch, View } from 'react-native';

import { Swipeable } from 'react-native-gesture-handler';
import { Text } from '@/components/ui';
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
    <View
      style={{
        marginRight: 20,
        marginBottom: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        backgroundColor: '#DC2626',
        paddingHorizontal: 24,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>
        Delete
      </Text>
    </View>
  );
}

export function AlarmCard({ alarm, onPress, onToggle, onDelete }: Props) {
  const sequence = generateSequence(alarm);

  // Build start time display
  const { hour: startHour, ampm: startAmpm } = to12Hour(alarm.startHour);
  const startDisplay = `${startHour}:${String(alarm.startMinute).padStart(2, '0')}`;

  // Build end time display from last sequence item
  const lastItem = sequence[sequence.length - 1];
  const endDisplay = lastItem?.display ?? startDisplay;

  // Sequence times string (e.g. "6:00 · 6:15 · 6:30 · 6:45 · 7:00 · 7:15 · 7:30")
  const sequenceTimesStr = sequence.map(item => item.display).join(' \u00B7 ');

  // Label line: "AM · Morning Mist" or just "AM"
  const labelLine = alarm.label
    ? `${startAmpm} \u00B7 ${alarm.label}`
    : startAmpm;

  return (
    <Swipeable
      renderRightActions={() => <DeleteAction />}
      onSwipeableOpen={onDelete}
    >
      <Pressable
        onPress={onPress}
        style={{
          marginHorizontal: 20,
          marginBottom: 12,
          borderRadius: 16,
          backgroundColor: '#FFFFFF',
          paddingHorizontal: 18,
          paddingVertical: 18,
          opacity: alarm.enabled ? 1 : 0.5,
          shadowColor: '#1A191808',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 12,
          elevation: 2,
        }}
        testID={`alarm-card-${alarm.id}`}
      >
        {/* Top row: time range + toggle */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: '700',
              color: '#1A1918',
              letterSpacing: -0.3,
            }}
          >
            {startDisplay} — {endDisplay}
          </Text>
          <Switch
            value={alarm.enabled}
            onValueChange={onToggle}
            trackColor={{ false: '#D1D0CD', true: '#3D8A5A' }}
            thumbColor="#FFFFFF"
            testID={`alarm-toggle-${alarm.id}`}
          />
        </View>

        {/* Label line */}
        <Text
          style={{
            fontSize: 13,
            color: '#9C9B99',
            marginTop: 6,
          }}
        >
          {labelLine}
        </Text>

        {/* Sequence times */}
        <Text
          style={{
            fontSize: 11,
            color: '#A8A7A5',
            marginTop: 8,
          }}
          numberOfLines={1}
        >
          {sequenceTimesStr}
        </Text>
      </Pressable>
    </Swipeable>
  );
}
