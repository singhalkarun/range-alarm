import type { Alarm } from '@/features/alarm/types';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { AlarmCard } from '@/features/alarm/components/alarm-card';
import { useScheduleAlarm } from '@/features/alarm/hooks/use-schedule-alarm';
import { useAlarmStore } from '@/features/alarm/stores/use-alarm-store';

export default function AlarmsTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const alarms = useAlarmStore(s => s.alarms);
  const { toggleAndSchedule, removeAlarm } = useScheduleAlarm();

  const handleDelete = useCallback(
    (alarm: Alarm) => {
      Alert.alert('Delete Alarm', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeAlarm(alarm) },
      ]);
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
    <View style={{ flex: 1, backgroundColor: '#F5F4F1', paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 }}>
        <Text style={{ fontSize: 26, fontWeight: '600', letterSpacing: -0.5, color: '#1A1918' }}>
          your alarms
        </Text>
        <Pressable
          onPress={() => router.push('/create' as any)}
          style={{ backgroundColor: '#3D8A5A', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>+ New</Text>
        </Pressable>
      </View>

      {alarms.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <Text style={{ fontSize: 36, marginBottom: 8 }}>⏰</Text>
          <Text style={{ fontSize: 17, fontWeight: '600', color: '#1A1918', marginBottom: 4 }}>No alarms yet</Text>
          <Text style={{ textAlign: 'center', fontSize: 14, color: '#9C9B99' }}>
            Tap + New to create your first range alarm.
          </Text>
        </View>
      ) : (
        <FlashList
          data={alarms}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 40 }}
        />
      )}
    </View>
  );
}
