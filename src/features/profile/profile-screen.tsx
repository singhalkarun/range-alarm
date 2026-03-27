import { useState } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { SafeAreaView, Text } from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useAlarmStore } from '@/features/alarm/stores/use-alarm-store';

const SHADOW = {
  shadowColor: '#1A1918',
  shadowOpacity: 0.024,
  shadowOffset: { width: 0, height: 1 },
  shadowRadius: 8,
  elevation: 1,
} as const;

// Lucide-style SVG icons
function BrainIcon({ size = 20, color = '#1A1918' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <Path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <Path d="M12 5v13" />
    </Svg>
  );
}

function VibrateIcon({ size = 20, color = '#1A1918' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m2 8 2 2-2 2 2 2-2 2" />
      <Path d="m22 8-2 2 2 2-2 2 2 2" />
      <Path d="M8 8v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V8c0-.55-.45-1-1-1H9c-.55 0-1 .45-1 1Z" />
    </Svg>
  );
}

function BellIcon({ size = 20, color = '#1A1918' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </Svg>
  );
}

function MoonIcon({ size = 20, color = '#1A1918' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </Svg>
  );
}

function CircleHelpIcon({ size = 20, color = '#1A1918' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <Path d="M12 17h.01" />
    </Svg>
  );
}

function ShieldIcon({ size = 20, color = '#1A1918' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </Svg>
  );
}

function LogOutIcon({ size = 20, color = '#EF4444' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <Path d="m16 17 5-5-5-5" />
      <Path d="M21 12H9" />
    </Svg>
  );
}

function PenIcon({ size = 16, color = '#9C9B99' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = '#A8A7A5' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m9 18 6-6-6-6" />
    </Svg>
  );
}

function ProfileHeader() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#3D8A5A', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF' }}>HK</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#1A1918' }}>Harry Kapoor</Text>
        <Text style={{ fontSize: 13, color: '#9C9B99', marginTop: 2 }}>member since march 2026</Text>
      </View>
      <Pressable style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F4F1', borderWidth: 1, borderColor: '#E5E4E1', alignItems: 'center', justifyContent: 'center' }}>
        <PenIcon />
      </Pressable>
    </View>
  );
}

function QuickStats({ alarmCount }: { alarmCount: number }) {
  const stats = [
    { value: '7', label: 'day streak' },
    { value: String(alarmCount), label: 'alarms' },
    { value: '6:27', label: 'avg wake' },
  ];
  return (
    <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingTop: 20, gap: 12 }}>
      {stats.map((stat) => (
        <View key={stat.label} style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 14, alignItems: 'center', ...SHADOW }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#1A1918' }}>{stat.value}</Text>
          <Text style={{ fontSize: 11, color: '#9C9B99', marginTop: 4 }}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

const PREF_ICONS: Record<string, React.ReactNode> = {
  'Smart Wake': <BrainIcon />,
  'Vibration': <VibrateIcon />,
  'Notifications': <BellIcon />,
  'Dark Mode': <MoonIcon />,
};

type ToggleRow = { label: string; value: boolean; onToggle: (val: boolean) => void };

function PreferencesCard({ rows }: { rows: ToggleRow[] }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: '#9C9B99', textTransform: 'uppercase', marginBottom: 10 }}>
        PREFERENCES
      </Text>
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, ...SHADOW }}>
        {rows.map((row, i) => (
          <View key={row.label}>
            {i > 0 && <View style={{ height: 1, backgroundColor: '#F5F4F1', marginHorizontal: 16 }} />}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 }}>
              <View style={{ width: 24, alignItems: 'center' }}>
                {PREF_ICONS[row.label]}
              </View>
              <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: '#1A1918', marginLeft: 12 }}>{row.label}</Text>
              <Switch value={row.value} onValueChange={row.onToggle} trackColor={{ false: '#EDECEA', true: '#3D8A5A' }} thumbColor="#FFFFFF" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

type AccountRowType = { label: string; isDestructive?: boolean; onPress: () => void };

const ACCT_ICONS: Record<string, React.ReactNode> = {
  'Help & Support': <CircleHelpIcon />,
  'Privacy Policy': <ShieldIcon />,
  'Log Out': <LogOutIcon />,
};

function AccountCard({ rows }: { rows: AccountRowType[] }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: '#9C9B99', textTransform: 'uppercase', marginBottom: 10 }}>
        ACCOUNT
      </Text>
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, ...SHADOW }}>
        {rows.map((row, i) => (
          <View key={row.label}>
            {i > 0 && <View style={{ height: 1, backgroundColor: '#F5F4F1', marginHorizontal: 16 }} />}
            <Pressable onPress={row.onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 }}>
              <View style={{ width: 24, alignItems: 'center' }}>
                {ACCT_ICONS[row.label]}
              </View>
              <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: row.isDestructive ? '#EF4444' : '#1A1918', marginLeft: 12 }}>{row.label}</Text>
              {!row.isDestructive && <ChevronRightIcon />}
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

export function ProfileScreen() {
  const signOut = useAuthStore.use.signOut();
  const alarms = useAlarmStore((s) => s.alarms);

  const [smartWake, setSmartWake] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [notifications, setNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleRows: ToggleRow[] = [
    { label: 'Smart Wake', value: smartWake, onToggle: setSmartWake },
    { label: 'Vibration', value: vibration, onToggle: setVibration },
    { label: 'Notifications', value: notifications, onToggle: setNotifications },
    { label: 'Dark Mode', value: darkMode, onToggle: setDarkMode },
  ];

  const accountRows: AccountRowType[] = [
    { label: 'Help & Support', onPress: () => {} },
    { label: 'Privacy Policy', onPress: () => {} },
    { label: 'Log Out', isDestructive: true, onPress: signOut },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F4F1' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <ProfileHeader />
        <QuickStats alarmCount={alarms.length} />
        <PreferencesCard rows={toggleRows} />
        <AccountCard rows={accountRows} />
      </ScrollView>
    </SafeAreaView>
  );
}
