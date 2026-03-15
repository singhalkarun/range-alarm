// src/features/alarm/screens/home-screen.tsx

import type { Alarm } from '../types';
import { FlashList } from '@shopify/flash-list';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { Alert, AppState, Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { AlarmCard } from '../components/alarm-card';
import { PermissionBanner } from '../components/permission-banner';
import { useScheduleAlarm } from '../hooks/use-schedule-alarm';
import { useAlarmStore } from '../stores/use-alarm-store';

export function HomeScreen() {
  const router = useRouter();
  const alarms = useAlarmStore(s => s.alarms);
  const { toggleAndSchedule, removeAlarm } = useScheduleAlarm();
  const [permissionDenied, setPermissionDenied] = useState(false);

  const checkPermission = useCallback(async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionDenied(status !== 'granted');
  }, []);

  useEffect(() => {
    checkPermission();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active')
        checkPermission();
    });
    return () => sub.remove();
  }, [checkPermission]);

  const handleDelete = useCallback(
    (alarm: Alarm) => {
      Alert.alert(
        'Delete Alarm',
        'Are you sure you want to delete this alarm?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => removeAlarm(alarm),
          },
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
    <View className="flex-1 bg-background">
      <PermissionBanner visible={permissionDenied} />

      {alarms.length === 0
        ? (
            <View className="flex-1 items-center justify-center px-8">
              <Text className="mb-2 text-4xl">&#9200;</Text>
              <Text className="mb-1 text-lg font-semibold text-white">
                No alarms yet
              </Text>
              <Text className="text-center text-sm text-muted-foreground">
                Tap + to create your first range alarm. Set once, wake up right.
              </Text>
            </View>
          )
        : (
            <FlashList
              data={alarms}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
            />
          )}

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/create' as any)}
        className="absolute right-6 bottom-8 size-14 items-center justify-center rounded-full bg-cyan-400"
        style={{
          shadowColor: '#00D4FF',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 8,
        }}
        testID="fab-create"
      >
        <Text className="text-2xl font-bold text-black">+</Text>
      </Pressable>
    </View>
  );
}
