import { ScrollView, View } from 'react-native';

import { SafeAreaView, Text } from '@/components/ui';

const WEEKLY_DATA = [
  { day: 'M', height: 70, active: true },
  { day: 'T', height: 90, active: true },
  { day: 'W', height: 55, active: true },
  { day: 'T', height: 100, active: true },
  { day: 'F', height: 80, active: true },
  { day: 'S', height: 40, active: true },
  { day: 'S', height: 0, active: false },
];

const MONTHLY_DATA = [
  { week: 'week 1', percent: 72 },
  { week: 'week 2', percent: 80 },
  { week: 'week 3', percent: 88 },
  { week: 'week 4', percent: 85 },
];

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View
      style={[
        {
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          shadowColor: '#1A1918',
          shadowOpacity: 0.03,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 12,
          elevation: 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function CircularProgress() {
  return (
    <View
      style={{
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 6,
        borderColor: '#3D8A5A',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: '700',
          color: '#1A1918',
        }}
      >
        85%
      </Text>
    </View>
  );
}

function ScoreCard() {
  return (
    <Card style={{ padding: 24, minHeight: 130 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: '#9C9B99' }}>weekly consistency</Text>
          <Text style={{ fontSize: 48, fontWeight: '700', color: '#1A1918', lineHeight: 56 }}>
            85%
          </Text>
          <Text style={{ fontSize: 13, color: '#3D8A5A', fontWeight: '500' }}>
            you're doing great!
          </Text>
        </View>
        <CircularProgress />
      </View>
    </Card>
  );
}

function StatsRow() {
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Card style={{ flex: 1, padding: 18 }}>
        <Text style={{ fontSize: 11, color: '#9C9B99' }}>average wake-up</Text>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#1A1918', marginTop: 6 }}>
          6:27 AM
        </Text>
      </Card>
      <Card style={{ flex: 1, padding: 18 }}>
        <Text style={{ fontSize: 11, color: '#9C9B99' }}>current streak</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#1A1918' }}>7 days</Text>
          <Text style={{ fontSize: 20 }}>🔥</Text>
        </View>
      </Card>
    </View>
  );
}

function WeeklyChart() {
  const maxHeight = 100;

  return (
    <Card style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1918', marginBottom: 16 }}>
        this week
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          height: maxHeight + 24,
          paddingHorizontal: 8,
        }}
      >
        {WEEKLY_DATA.map((item, index) => (
          <View key={index} style={{ alignItems: 'center', flex: 1, gap: 6 }}>
            <View
              style={{
                width: 28,
                height: item.height,
                backgroundColor: item.active ? '#3D8A5A' : '#E8E7E5',
                borderRadius: 6,
              }}
            />
            <Text style={{ fontSize: 11, color: '#9C9B99' }}>{item.day}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function BestTimeInsight() {
  return (
    <Card style={{ paddingVertical: 16, paddingHorizontal: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ fontSize: 22 }}>☀️</Text>
        <Text style={{ fontSize: 14, fontWeight: '500', color: '#1A1918', flex: 1 }}>
          you wake up best around 6:30 AM
        </Text>
      </View>
    </Card>
  );
}

function MonthlyTrend() {
  return (
    <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1918', marginBottom: 16 }}>
        monthly trend
      </Text>
      <View style={{ gap: 14 }}>
        {MONTHLY_DATA.map((item) => (
          <View
            key={item.week}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 13, color: '#6D6C6A', width: 52 }}>{item.week}</Text>
            <View
              style={{
                flex: 1,
                height: 8,
                backgroundColor: '#E8E7E5',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${item.percent}%`,
                  height: '100%',
                  backgroundColor: '#3D8A5A',
                  borderRadius: 4,
                }}
              />
            </View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#1A1918', width: 36, textAlign: 'right' }}>
              {item.percent}%
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

export function StatsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F4F1' }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontSize: 26,
            fontWeight: '600',
            letterSpacing: -0.5,
            color: '#1A1918',
            marginBottom: 4,
          }}
        >
          your stats
        </Text>

        <ScoreCard />
        <StatsRow />
        <WeeklyChart />
        <BestTimeInsight />
        <MonthlyTrend />
      </ScrollView>
    </SafeAreaView>
  );
}
