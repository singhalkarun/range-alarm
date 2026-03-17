// src/features/alarm/components/max-snooze-selector.tsx

import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { MAX_SNOOZE_OPTIONS } from '../constants';

type Props = {
  value: number;
  onChange: (value: number) => void;
};

export function MaxSnoozeSelector({ value, onChange }: Props) {
  return (
    <View className="gap-3">
      <Text className="text-[13px] font-semibold tracking-wider text-muted-foreground uppercase">
        Max Snoozes
      </Text>
      <View className="flex-row gap-2.5">
        {MAX_SNOOZE_OPTIONS.map((opt) => {
          const isActive = opt === value;
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              className={`flex-1 items-center rounded-[10px] border-[1.5px] bg-card py-3.5 ${
                isActive
                  ? 'border-cyan-400 bg-cyan-400/15'
                  : 'border-border'
              }`}
              testID={`max-snooze-${opt}`}
            >
              <Text
                className={`text-base font-semibold ${
                  isActive ? 'text-cyan-400' : 'text-white'
                }`}
              >
                {opt}
                x
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
