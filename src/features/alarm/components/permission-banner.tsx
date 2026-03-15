// src/features/alarm/components/permission-banner.tsx

import { Linking, Pressable, View } from 'react-native';

import { Text } from '@/components/ui';

type Props = {
  visible: boolean;
};

export function PermissionBanner({ visible }: Props) {
  if (!visible) return null;

  const openSettings = async () => {
    await Linking.openSettings();
  };

  return (
    <View className="mx-4 mb-4 rounded-xl bg-danger-600/20 p-4">
      <Text className="mb-2 text-sm font-semibold text-danger-400">
        Notifications Disabled
      </Text>
      <Text className="mb-3 text-xs text-danger-300">
        Alarms won't fire without notification permission. Tap below to enable.
      </Text>
      <Pressable
        onPress={openSettings}
        className="self-start rounded-lg bg-danger-600 px-4 py-2"
      >
        <Text className="text-sm font-semibold text-white">
          Grant Permission
        </Text>
      </Pressable>
    </View>
  );
}
