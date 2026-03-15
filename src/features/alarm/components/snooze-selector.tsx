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
    <View className="gap-2">
      <Text className="text-sm text-muted-foreground">Snooze duration</Text>
      <View className="flex-row gap-2">
        {SNOOZE_OPTIONS.map((opt) => {
          const isActive = opt === value;
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              className={`rounded-lg px-4 py-2 ${
                isActive ? 'bg-cyan-400' : 'bg-navy-600'
              }`}
              testID={`snooze-${opt}`}
            >
              <Text
                className={`text-sm font-semibold ${
                  isActive ? 'text-black' : 'text-muted-foreground'
                }`}
              >
                {opt}m
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
