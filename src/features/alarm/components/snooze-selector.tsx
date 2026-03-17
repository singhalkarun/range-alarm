// src/features/alarm/components/snooze-selector.tsx

import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { SNOOZE_OPTIONS } from '../constants';

type Props = {
  value: number;
  onChange: (value: number) => void;
};

export function SnoozeSelector({ value, onChange }: Props) {
  return (
    <View className="gap-3">
      <Text className="text-[13px] font-semibold tracking-wider text-muted-foreground uppercase">
        Snooze Duration
      </Text>
      <View className="flex-row gap-2.5">
        {SNOOZE_OPTIONS.map((opt) => {
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
              testID={`snooze-${opt}`}
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
