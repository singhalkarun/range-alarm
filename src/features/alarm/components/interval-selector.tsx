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
    <View className="gap-3">
      <Text className="text-[13px] font-semibold tracking-wider text-muted-foreground uppercase">
        Ring Every
      </Text>
      <View className="flex-row gap-2.5">
        {INTERVAL_OPTIONS.map((opt) => {
          const disabled = maxInterval !== undefined && opt > maxInterval;
          const isActive = opt === value;
          return (
            <Pressable
              key={opt}
              onPress={() => !disabled && onChange(opt)}
              disabled={disabled}
              className={`flex-1 items-center rounded-[10px] border-[1.5px] bg-card py-3.5 ${
                isActive
                  ? 'border-cyan-400 bg-cyan-400/15'
                  : disabled
                    ? 'border-border opacity-30'
                    : 'border-border'
              }`}
              testID={`interval-${opt}`}
            >
              <Text
                className={`text-base font-semibold ${
                  isActive ? 'text-cyan-400' : 'text-white'
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
