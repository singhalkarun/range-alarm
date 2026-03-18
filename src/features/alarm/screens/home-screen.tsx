// src/features/alarm/screens/home-screen.tsx

import type { Alarm } from '../types';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { Alert, Pressable, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView, Text } from '@/components/ui';
import { AlarmCard } from '../components/alarm-card';
import { PermissionBanner } from '../components/permission-banner';
import { useAlarmPermissions } from '../hooks/use-alarm-permissions';
import { useScheduleAlarm } from '../hooks/use-schedule-alarm';
import { useAlarmStore } from '../stores/use-alarm-store';

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center p-10">
      <Text className="mb-2 text-4xl">&#9200;</Text>
      <Text className="mb-1 text-lg font-semibold text-white">No alarms yet</Text>
      <Text className="text-center text-sm text-muted-foreground">
        Tap + to create your first range alarm. Wake up gradually, not abruptly.
      </Text>
    </View>
  );
}

export function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const alarms = useAlarmStore(s => s.alarms);
  const { toggleAndSchedule, removeAlarm } = useScheduleAlarm();
  const {
    fsiDenied,
    batteryOptEnabled,
    batteryOptDismissed,
    openFsiSettings,
    openBatteryOptSettings,
    dismissBatteryOptBanner,
  } = useAlarmPermissions();

  const handleDelete = useCallback(
    (alarm: Alarm) => {
      Alert.alert(
        'Delete Alarm',
        'Are you sure you want to delete this alarm?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => removeAlarm(alarm) },
        ],
      );
    },
    [removeAlarm],
  );

  const renderItem = useCallback(
    ({ item }: { item: Alarm }) => (
      <AlarmCard
        alarm={item}
        onPress={() => router.push(`/edit/${item.id}` as any)}
        onToggle={() => toggleAndSchedule(item)}
        onDelete={() => handleDelete(item)}
      />
    ),
    [router, toggleAndSchedule, handleDelete],
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <PermissionBanner
        visible={fsiDenied}
        title="Full-Screen Alarm Disabled"
        message="Alarms can't display over the lock screen. Tap below to allow full-screen notifications."
        buttonText="Allow Full-Screen"
        onPress={openFsiSettings}
      />
      <PermissionBanner
        visible={batteryOptEnabled && !batteryOptDismissed && !fsiDenied}
        title="Battery Optimization Active"
        message="Your device may delay or suppress alarms to save battery. Tap below to exempt this app."
        buttonText="Disable Optimization"
        onPress={openBatteryOptSettings}
        onDismiss={dismissBatteryOptBanner}
      />

      <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 }}>
        <Text className="text-[28px] font-extrabold text-cyan-400">RangeAlarm</Text>
        <Text className="mt-1 text-sm text-muted-foreground">Wake up gradually, not abruptly.</Text>
      </View>

      {alarms.length === 0
        ? <EmptyState />
        : (
            <FlashList
              data={alarms}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
            />
          )}

      <Pressable
        onPress={() => router.push('/create' as any)}
        className="absolute right-6 size-[60px] items-center justify-center rounded-full bg-cyan-400"
        style={{
          bottom: 32 + insets.bottom,
          shadowColor: '#00D4FF',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 25,
          elevation: 8,
        }}
        testID="fab-create"
      >
        <Text className="text-[32px] font-bold text-white">+</Text>
      </Pressable>
    </SafeAreaView>
  );
}
