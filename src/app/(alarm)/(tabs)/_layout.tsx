import { Tabs } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { Text } from '@/components/ui';

const TAB_CONFIG = [
  { name: 'index', label: 'HOME', icon: 'home' },
  { name: 'alarms', label: 'ALARMS', icon: 'alarm-clock' },
  { name: 'stats', label: 'STATS', icon: 'chart' },
  { name: 'profile', label: 'PROFILE', icon: 'user' },
] as const;

function HomeIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <Path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </Svg>
  );
}

function AlarmClockIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="13" r="8" />
      <Path d="M12 9v4l2 2" />
      <Path d="M5 3 2 6" />
      <Path d="m22 6-3-3" />
      <Path d="M6.38 18.7 4 21" />
      <Path d="M17.64 18.67 20 21" />
    </Svg>
  );
}

function ChartIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 20V10" />
      <Path d="M18 20V4" />
      <Path d="M6 20v-4" />
    </Svg>
  );
}

function UserIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  );
}

function getIcon(name: string, color: string, size: number) {
  switch (name) {
    case 'home': return <HomeIcon color={color} size={size} />;
    case 'alarm-clock': return <AlarmClockIcon color={color} size={size} />;
    case 'chart': return <ChartIcon color={color} size={size} />;
    case 'user': return <UserIcon color={color} size={size} />;
    default: return null;
  }
}

function SoraTabBar({ state, navigation }: { state: any; navigation: any }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingHorizontal: 21, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 21), backgroundColor: '#F5F4F1' }}>
      <View style={{
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 36,
        height: 62,
        padding: 4,
        borderWidth: 1,
        borderColor: '#E5E4E1',
      }}>
        {TAB_CONFIG.map((tab, index) => {
          const isFocused = state.index === index;
          const color = isFocused ? '#FFFFFF' : '#A8A7A5';

          return (
            <Pressable
              key={tab.name}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: state.routes[index].key, canPreventDefault: true });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(state.routes[index].name);
                }
              }}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                borderRadius: 26,
                backgroundColor: isFocused ? '#3D8A5A' : 'transparent',
              }}
            >
              {getIcon(tab.icon, color, 18)}
              <Text style={{
                fontSize: 10,
                fontWeight: isFocused ? '600' : '500',
                letterSpacing: 0.5,
                color,
              }}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <SoraTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="alarms" options={{ title: 'Alarms' }} />
      <Tabs.Screen name="stats" options={{ title: 'Stats' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
