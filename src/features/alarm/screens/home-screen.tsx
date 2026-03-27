// src/features/alarm/screens/home-screen.tsx

import type { Alarm } from '../types';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { Alert, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Text } from '@/components/ui';
import { AlarmCard } from '../components/alarm-card';
import { PermissionBanner } from '../components/permission-banner';
import { useAlarmPermissions } from '../hooks/use-alarm-permissions';
import { useScheduleAlarm } from '../hooks/use-schedule-alarm';
import { useAlarmStore } from '../stores/use-alarm-store';

const STREAK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;
// Mock streak data — replace with real store data when available
const COMPLETED_DAYS = [true, true, true, true, true, true, true];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function EmptyState() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
      }}
    >
      <Text style={{ fontSize: 36, marginBottom: 8 }}>&#9200;</Text>
      <Text
        style={{
          fontSize: 17,
          fontWeight: '600',
          color: '#1A1918',
          marginBottom: 4,
        }}
      >
        No alarms yet
      </Text>
      <Text
        style={{ textAlign: 'center', fontSize: 14, color: '#9C9B99' }}
      >
        Tap the button below to create your first range alarm.
      </Text>
    </View>
  );
}

function StreakCard() {
  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#1A191808',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      {/* Title row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1918' }}>
            Wake-up Streak
          </Text>
          <Text style={{ fontSize: 13, color: '#9C9B99', marginTop: 4 }}>
            You're on fire this week!
          </Text>
        </View>
        <View
          style={{
            backgroundColor: '#3D8A5A',
            borderRadius: 12,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
            7 days
          </Text>
        </View>
      </View>

      {/* Day dots */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 16,
        }}
      >
        {STREAK_DAYS.map((day, i) => (
          <View key={i} style={{ alignItems: 'center', gap: 6 }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: COMPLETED_DAYS[i] ? '#3D8A5A' : '#D1D0CD',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {COMPLETED_DAYS[i] && (
                <Text
                  style={{ fontSize: 12, color: '#FFFFFF', fontWeight: '700' }}
                >
                  {'\u2713'}
                </Text>
              )}
            </View>
            <Text
              style={{ fontSize: 11, fontWeight: '500', color: '#9C9B99' }}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function AddAlarmButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        marginHorizontal: 20,
        marginTop: 4,
        marginBottom: 24,
        borderWidth: 1.5,
        borderColor: '#D1D0CD',
        borderStyle: 'dashed',
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      testID="add-alarm-inline"
    >
      <Text style={{ fontSize: 15, fontWeight: '600', color: '#9C9B99' }}>
        + Add new alarm
      </Text>
    </Pressable>
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

  const navigateToCreate = useCallback(() => {
    router.push('/create' as any);
  }, [router]);

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

  const listFooter = useCallback(
    () => <AddAlarmButton onPress={navigateToCreate} />,
    [navigateToCreate],
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F4F1', paddingTop: insets.top }}>
      {/* Permission banners */}
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

      {/* Header row: logo + bell */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 4,
        }}
      >
        <Text
          style={{
            fontFamily: 'Outfit',
            fontSize: 26,
            fontWeight: '600',
            letterSpacing: -0.5,
            color: '#1A1918',
          }}
        >
          sora
        </Text>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#EDECEA',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#1A1918" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </Svg>
        </View>
      </View>

      {/* Greeting */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1918' }}>
          {getGreeting()}
        </Text>
      </View>

      {/* Streak Card */}
      <StreakCard />

      {/* Your Alarms section */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1918' }}>
          Your Alarms
        </Text>
      </View>

      {alarms.length === 0 ? (
        <>
          <EmptyState />
          <AddAlarmButton onPress={navigateToCreate} />
        </>
      ) : (
        <FlashList
          data={alarms}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 40 }}
          ListFooterComponent={listFooter}
        />
      )}
    </View>
  );
}
