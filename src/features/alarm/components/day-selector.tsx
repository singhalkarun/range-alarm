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
    <View className="gap-3">
      <Text className="text-center text-[13px] font-semibold tracking-wider text-muted-foreground uppercase">
        Repeat On
      </Text>
      <View className="flex-row justify-center gap-2">
        {DAY_LABELS.map((label, index) => {
          const isSelected = selectedDays.includes(index);
          return (
            <Pressable
              key={index}
              onPress={() => onToggleDay(index)}
              className={`size-10 items-center justify-center rounded-full border-[1.5px] ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-400/15'
                  : 'border-border bg-card'
              }`}
              testID={`day-${index}`}
            >
              <Text
                className={`text-[13px] font-semibold ${
                  isSelected ? 'text-cyan-400' : 'text-muted-foreground'
                }`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
