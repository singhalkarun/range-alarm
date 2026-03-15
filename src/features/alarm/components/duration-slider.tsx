// src/features/alarm/components/duration-slider.tsx

import Slider from '@react-native-community/slider';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { DURATION_MAX, DURATION_MIN } from '../constants';

type Props = {
  value: number;
  onChange: (value: number) => void;
};

export function DurationSlider({ value, onChange }: Props) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-muted-foreground">Duration</Text>
        <Text className="text-lg font-semibold text-cyan-400">
          {value} <Text className="text-sm text-muted-foreground">min</Text>
        </Text>
      </View>
      <Slider
        minimumValue={DURATION_MIN}
        maximumValue={DURATION_MAX}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor="#00D4FF"
        maximumTrackTintColor="#1a2940"
        thumbTintColor="#00D4FF"
        testID="duration-slider"
      />
    </View>
  );
}
