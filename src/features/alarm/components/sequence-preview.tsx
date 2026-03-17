// src/features/alarm/components/sequence-preview.tsx

import type { AlarmSequenceItem } from '../types';

import { View } from 'react-native';
import { Text } from '@/components/ui';

type Props = {
  sequence: AlarmSequenceItem[];
  durationMinutes: number;
  intervalMinutes: number;
};

export function SequencePreview({
  sequence,
  durationMinutes,
  intervalMinutes,
}: Props) {
  return (
    <View className="gap-5">
      {/* Timeline */}
      <View className="pl-2">
        {sequence.map((item, i) => {
          const isFirst = i === 0;
          const isLast = i === sequence.length - 1;
          const label = isFirst
            ? 'First alarm'
            : isLast
              ? 'Last alarm'
              : `+${i * intervalMinutes} min`;

          return (
            <View
              key={item.sequenceIndex}
              className="flex-row items-center gap-3 border-l-2 border-cyan-400/30 py-2.5 pl-5"
            >
              <View
                className={`rounded-full border-2 border-background bg-cyan-400 ${isFirst ? 'size-4' : 'size-3'}`}
                style={{ marginLeft: isFirst ? -23 : -21 }}
              />
              <Text className="w-20 text-[20px] font-bold text-white">
                {item.display}
                {' '}
                <Text className="text-xs text-muted-foreground">
                  {item.ampm}
                </Text>
              </Text>
              <View
                className={`rounded-md px-2.5 py-1 ${
                  isFirst
                    ? 'bg-cyan-400/15'
                    : isLast
                      ? 'bg-green-400/15'
                      : 'bg-card'
                }`}
              >
                <Text
                  className={`text-[13px] font-medium ${
                    isFirst
                      ? 'text-cyan-400'
                      : isLast
                        ? 'text-green-400'
                        : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Summary */}
      <View className="gap-1.5 rounded-2xl border border-border bg-card" style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
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
    <View className="flex-row justify-between py-1.5">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="text-sm font-semibold text-white">{value}</Text>
    </View>
  );
}
