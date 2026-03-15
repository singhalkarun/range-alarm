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
    <View className="flex-row gap-2">
      {DAY_LABELS.map((label, index) => {
        const isSelected = selectedDays.includes(index);
        return (
          <Pressable
            key={label}
            onPress={() => onToggleDay(index)}
            className={`size-8 items-center justify-center rounded-full ${
              isSelected ? 'bg-cyan-400' : 'bg-navy-600'
            }`}
            testID={`day-${index}`}
          >
            <Text
              className={`text-xs font-semibold ${
                isSelected ? 'text-black' : 'text-muted-foreground'
              }`}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
