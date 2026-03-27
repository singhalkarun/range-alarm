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
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        padding: 16,
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#DC2626', marginBottom: 6 }}>
        {title}
      </Text>
      <Text style={{ fontSize: 13, color: '#991B1B', marginBottom: 12 }}>
        {message}
      </Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {onPress && (
          <Pressable
            onPress={onPress}
            style={{
              alignSelf: 'flex-start',
              borderRadius: 8,
              backgroundColor: '#DC2626',
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
              {buttonText}
            </Text>
          </Pressable>
        )}
        {onDismiss && (
          <Pressable
            onPress={onDismiss}
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
          >
            <Text style={{ fontSize: 14, color: '#991B1B' }}>
              Not now
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
