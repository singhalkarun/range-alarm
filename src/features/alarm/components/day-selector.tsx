// src/features/alarm/components/day-selector.tsx

import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { DAY_LABELS } from '../constants';

type Props = {
  selectedDays: number[];
  onToggleDay: (day: number) => void;
};

export function DaySelector({ selectedDays, onToggleDay }: Props) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 12 }}>
      {DAY_LABELS.map((label, index) => {
        const isSelected = selectedDays.includes(index);
        return (
          <Pressable
            key={index}
            onPress={() => onToggleDay(index)}
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 20,
              backgroundColor: isSelected ? '#3D8A5A' : '#EDECEA',
            }}
            testID={`day-${index}`}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: isSelected ? '#FFFFFF' : '#6D6C6A',
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
