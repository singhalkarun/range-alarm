// src/features/alarm/components/permission-banner.tsx

import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';

type Props = {
  visible: boolean;
  title?: string;
  message?: string;
  buttonText?: string;
  onPress?: () => void;
  onDismiss?: () => void;
};

export function PermissionBanner({
  visible,
  title = 'Notifications Disabled',
  message = 'Alarms won\'t fire without notification permission. Tap below to enable.',
  buttonText = 'Grant Permission',
  onPress,
  onDismiss,
}: Props) {
  if (!visible)
    return null;

  return (
    <View className="mx-4 mb-4 rounded-xl bg-danger-600/20 p-4">
      <Text className="mb-2 text-sm font-semibold text-danger-400">
        {title}
      </Text>
      <Text className="mb-3 text-xs text-danger-300">
        {message}
      </Text>
      <View className="flex-row gap-3">
        {onPress && (
          <Pressable
            onPress={onPress}
            className="self-start rounded-lg bg-danger-600 px-4 py-2"
          >
            <Text className="text-sm font-semibold text-white">
              {buttonText}
            </Text>
          </Pressable>
        )}
        {onDismiss && (
          <Pressable
            onPress={onDismiss}
            className="self-start rounded-lg px-4 py-2"
          >
            <Text className="text-sm text-danger-300">
              Not now
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
