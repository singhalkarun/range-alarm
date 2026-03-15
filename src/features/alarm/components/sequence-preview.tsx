// src/features/alarm/components/sequence-preview.tsx

import type { AlarmSequenceItem } from '../types';

import { View } from 'react-native';
import { Text } from '@/components/ui';

type Props = {
  sequence: AlarmSequenceItem[];
  durationMinutes: number;
  intervalMinutes: number;
};

const TIER_COLORS = {
  gentle: 'bg-cyan-400/40',
  moderate: 'bg-cyan-400/60',
  strong: 'bg-cyan-400/80',
  aggressive: 'bg-cyan-400',
} as const;

export function SequencePreview({
  sequence,
  durationMinutes,
  intervalMinutes,
}: Props) {
  return (
    <View className="gap-4">
      {/* Timeline */}
      <View className="gap-1">
        {sequence.map((item, i) => {
          const label
            = i === 0
              ? 'First alarm'
              : i === sequence.length - 1
                ? 'Last alarm'
                : `+${i * intervalMinutes} min`;

          return (
            <View key={item.sequenceIndex} className="flex-row items-center gap-3 py-1">
              <View
                className={`size-3 rounded-full ${TIER_COLORS[item.intensityTier]}`}
              />
              <Text className="w-20 text-sm font-semibold text-white">
                {item.display}
                {' '}
                <Text className="text-xs text-muted-foreground">
                  {item.ampm}
                </Text>
              </Text>
              <Text className="text-xs text-muted-foreground">{label}</Text>
            </View>
          );
        })}
      </View>

      {/* Summary */}
      <View className="gap-2 rounded-xl bg-navy-700 p-4">
        <SummaryRow label="Total alarms" value={String(sequence.length)} />
        <SummaryRow
          label="Range"
          value={`${sequence[0]?.display} ${sequence[0]?.ampm} — ${sequence[sequence.length - 1]?.display} ${sequence[sequence.length - 1]?.ampm}`}
        />
        <SummaryRow label="Duration" value={`${durationMinutes} min`} />
        <SummaryRow label="Interval" value={`Every ${intervalMinutes} min`} />
      </View>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="text-sm font-semibold text-white">{value}</Text>
    </View>
  );
}
