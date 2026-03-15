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
  if (h > 12) return 1;
  if (h < 1) return 12;
  return h;
}

function wrapMinute(m: number): number {
  if (m >= 60) return 0;
  if (m < 0) return 59;
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
      className="h-10 w-full items-center justify-center"
      testID={testID}
    >
      <Text className="text-2xl text-cyan-400">
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
        <Text className="text-6xl font-bold text-white">
          {String(hour).padStart(2, '0')}
        </Text>
        <ArrowButton
          direction="down"
          onPress={() => onChangeHour(wrapHour(hour - 1))}
          testID="hour-down"
        />
      </View>

      <Text className="text-6xl font-light text-muted-foreground">:</Text>

      {/* Minute column */}
      <View className="items-center">
        <ArrowButton
          direction="up"
          onPress={() => onChangeMinute(wrapMinute(minute + 1))}
          testID="minute-up"
        />
        <Text className="text-6xl font-bold text-white">
          {String(minute).padStart(2, '0')}
        </Text>
        <ArrowButton
          direction="down"
          onPress={() => onChangeMinute(wrapMinute(minute - 1))}
          testID="minute-down"
        />
      </View>

      {/* AM/PM column */}
      <View className="ml-2 gap-2">
        <Pressable
          onPress={() => onChangeAmPm('AM')}
          className={`rounded-lg px-4 py-2 ${
            ampm === 'AM' ? 'bg-cyan-400' : 'bg-navy-600'
          }`}
          testID="am-btn"
        >
          <Text
            className={`font-semibold ${
              ampm === 'AM' ? 'text-black' : 'text-muted-foreground'
            }`}
          >
            AM
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onChangeAmPm('PM')}
          className={`rounded-lg px-4 py-2 ${
            ampm === 'PM' ? 'bg-cyan-400' : 'bg-navy-600'
          }`}
          testID="pm-btn"
        >
          <Text
            className={`font-semibold ${
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
