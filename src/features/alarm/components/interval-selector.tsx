// src/features/alarm/components/interval-selector.tsx

import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { INTERVAL_OPTIONS } from '../constants';

type Props = {
  value: number;
  onChange: (value: number) => void;
  maxInterval?: number;
};

export function IntervalSelector({ value, onChange, maxInterval }: Props) {
  return (
    <View className="gap-2">
      <Text className="text-sm text-muted-foreground">Ring every</Text>
      <View className="flex-row gap-2">
        {INTERVAL_OPTIONS.map((opt) => {
          const disabled = maxInterval !== undefined && opt > maxInterval;
          const isActive = opt === value;
          return (
            <Pressable
              key={opt}
              onPress={() => !disabled && onChange(opt)}
              disabled={disabled}
              className={`rounded-lg px-4 py-2 ${
                isActive
                  ? 'bg-cyan-400'
                  : disabled
                    ? 'bg-navy-600 opacity-30'
                    : 'bg-navy-600'
              }`}
              testID={`interval-${opt}`}
            >
              <Text
                className={`text-sm font-semibold ${
                  isActive ? 'text-black' : 'text-muted-foreground'
                }`}
              >
                {opt}
                m
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
