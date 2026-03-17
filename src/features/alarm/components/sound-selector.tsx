import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui';
import {
  getDeviceAlarmSounds,
  previewSound,
  stopPreview,
  type AlarmSound,
} from 'modules/alarm-fullscreen';

type Props = {
  value?: string;
  onChange: (uri: string) => void;
};

export function SoundSelector({ value, onChange }: Props) {
  const [sounds, setSounds] = useState<AlarmSound[]>([]);
  const [playingUri, setPlayingUri] = useState<string | null>(null);

  useEffect(() => {
    const list = getDeviceAlarmSounds();
    setSounds(list);
    return () => { stopPreview(); };
  }, []);

  const handlePress = useCallback((uri: string) => {
    if (playingUri === uri) {
      stopPreview();
      setPlayingUri(null);
    } else {
      previewSound(uri);
      setPlayingUri(uri);
    }
    onChange(uri);
  }, [playingUri, onChange]);

  const selected = value || 'bundled_gentle';

  return (
    <View className="flex-1 gap-3">
      <Text className="text-[13px] font-semibold tracking-wider text-muted-foreground uppercase">
        Alarm Sound
      </Text>
      <ScrollView className="flex-1 rounded-xl border border-border bg-card">
        {sounds.map((item, index) => {
          const isActive = item.uri === selected;
          const isPlaying = item.uri === playingUri;
          return (
            <View key={item.uri}>
              {index > 0 && <View className="mx-4 h-px bg-border" />}
              <Pressable
                onPress={() => handlePress(item.uri)}
                className={`flex-row items-center justify-between px-4 ${
                  isActive ? 'bg-cyan-400/10' : ''
                }`}
                style={{ height: 52 }}
              >
                <Text
                  className={`flex-1 text-sm ${
                    isActive ? 'font-semibold text-cyan-400' : 'text-white'
                  }`}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                {isPlaying && (
                  <Text className="text-xs text-cyan-400">{'\u266B'}</Text>
                )}
                {isActive && !isPlaying && (
                  <Text className="text-xs text-cyan-400">{'\u2713'}</Text>
                )}
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
