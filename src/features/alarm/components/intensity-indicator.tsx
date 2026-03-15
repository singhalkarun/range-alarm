// src/features/alarm/components/intensity-indicator.tsx

import { View } from 'react-native';

type Props = {
  total: number;
  /** Max dots to render (avoid visual clutter for long sequences) */
  maxDots?: number;
};

export function IntensityIndicator({ total, maxDots = 12 }: Props) {
  const dotCount = Math.min(total, maxDots);

  return (
    <View className="flex-row gap-1">
      {Array.from({ length: dotCount }, (_, i) => {
        const opacity = 0.3 + (0.7 * i) / (dotCount - 1 || 1);
        return (
          <View
            key={i}
            className="size-2 rounded-full bg-cyan-400"
            style={{ opacity }}
          />
        );
      })}
    </View>
  );
}
