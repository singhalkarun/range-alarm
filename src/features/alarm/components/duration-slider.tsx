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
    <View className="gap-3">
      <Text className="text-[13px] font-semibold tracking-wider text-muted-foreground uppercase">
        Duration
      </Text>
      <View className="mb-3 items-center">
        <Text className="text-[40px] font-bold text-white" style={{ lineHeight: 50 }}>
          {value}
          {' '}
          <Text className="text-xl text-cyan-400">min</Text>
        </Text>
      </View>
      <Slider
        minimumValue={DURATION_MIN}
        maximumValue={DURATION_MAX}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor="#00D4FF"
        maximumTrackTintColor="#243447"
        thumbTintColor="#00D4FF"
        testID="duration-slider"
      />
    </View>
  );
}
