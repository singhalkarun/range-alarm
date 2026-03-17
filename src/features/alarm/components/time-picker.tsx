// src/features/alarm/components/time-picker.tsx

import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';

type Props = {
  hour: number; // 1-12
  minute: number; // 0-59
  ampm: 'AM' | 'PM';
  onChangeHour: (hour: number) => void;
  onChangeMinute: (minute: number) => void;
  onChangeAmPm: (ampm: 'AM' | 'PM') => void;
};

function wrapHour(h: number): number {
  if (h > 12)
    return 1;
  if (h < 1)
    return 12;
  return h;
}

function wrapMinute(m: number): number {
  if (m >= 60)
    return 0;
  if (m < 0)
    return 59;
  return m;
}

function ArrowButton({
  direction,
  onPress,
  testID,
}: {
  direction: 'up' | 'down';
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="size-11 items-center justify-center rounded-full border border-border bg-card"
      testID={testID}
    >
      <Text className="text-xl text-cyan-400">
        {direction === 'up' ? '\u25B2' : '\u25BC'}
      </Text>
    </Pressable>
  );
}

export function TimePicker({
  hour,
  minute,
  ampm,
  onChangeHour,
  onChangeMinute,
  onChangeAmPm,
}: Props) {
  return (
    <View className="flex-row items-center justify-center gap-4">
      {/* Hour column */}
      <View className="items-center">
        <ArrowButton
          direction="up"
          onPress={() => onChangeHour(wrapHour(hour + 1))}
          testID="hour-up"
        />
        <Text className="text-[64px] font-bold text-white" style={{ letterSpacing: -2 }}>
          {String(hour).padStart(2, '0')}
        </Text>
        <ArrowButton
          direction="down"
          onPress={() => onChangeHour(wrapHour(hour - 1))}
          testID="hour-down"
        />
      </View>

      <Text className="text-[64px] font-light text-cyan-400">:</Text>

      {/* Minute column */}
      <View className="items-center">
        <ArrowButton
          direction="up"
          onPress={() => onChangeMinute(wrapMinute(minute + 1))}
          testID="minute-up"
        />
        <Text className="text-[64px] font-bold text-white" style={{ letterSpacing: -2 }}>
          {String(minute).padStart(2, '0')}
        </Text>
        <ArrowButton
          direction="down"
          onPress={() => onChangeMinute(wrapMinute(minute - 1))}
          testID="minute-down"
        />
      </View>

      {/* AM/PM column */}
      <View className="ml-2 gap-1" style={{ marginTop: 30 }}>
        <Pressable
          onPress={() => onChangeAmPm('AM')}
          className={`rounded-lg border px-3 py-1.5 ${
            ampm === 'AM'
              ? 'border-cyan-400 bg-cyan-400'
              : 'border-border bg-card'
          }`}
          testID="am-btn"
        >
          <Text
            className={`text-sm font-semibold ${
              ampm === 'AM' ? 'text-black' : 'text-muted-foreground'
            }`}
          >
            AM
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onChangeAmPm('PM')}
          className={`rounded-lg border px-3 py-1.5 ${
            ampm === 'PM'
              ? 'border-cyan-400 bg-cyan-400'
              : 'border-border bg-card'
          }`}
          testID="pm-btn"
        >
          <Text
            className={`text-sm font-semibold ${
              ampm === 'PM' ? 'text-black' : 'text-muted-foreground'
            }`}
          >
            PM
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
