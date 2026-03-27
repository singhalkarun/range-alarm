/* eslint-disable max-lines-per-function */
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Dimensions, StyleSheet } from 'react-native';

import {
  FocusAwareStatusBar,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { useIsFirstTime } from '@/lib/hooks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  bg: '#FAF8F5',
  textPrimary: '#1A1918',
  textMuted: '#9C9B99',
  textBody: '#6D6C6A',
  green: '#3D8A5A',
  gold: '#D4A64A',
  dotInactive: '#D1D0CD',
  cardWhite: '#FFFFFF',
  cardPink: '#FFF5F3',
};

const ALARM_CARDS = [
  { time: '6:00 AM', rotation: -4, bg: COLORS.cardWhite, dot: COLORS.green },
  { time: '6:15 AM', rotation: 3, bg: COLORS.cardPink, dot: '#E8887A' },
  { time: '6:30 AM', rotation: -2, bg: COLORS.cardWhite, dot: COLORS.green },
  { time: '6:45 AM', rotation: 5, bg: COLORS.cardPink, dot: '#E8887A' },
  { time: '7:00 AM', rotation: -3, bg: COLORS.cardWhite, dot: COLORS.green },
  { time: '7:15 AM', rotation: 2, bg: COLORS.cardPink, dot: '#E8887A' },
];

// ——— Shared components ———

function PageDots({ active }: { active: number }) {
  return (
    <View className="flex-row items-center justify-center" style={{ gap: 8 }}>
      {[0, 1, 2].map(i => (
        <View
          key={i}
          style={{
            width: i === active ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === active ? COLORS.green : COLORS.dotInactive,
          }}
        />
      ))}
    </View>
  );
}

function GreenButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.greenButton}>
      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}

function SkipButton({ onPress }: { onPress: () => void }) {
  return (
    <View className="flex-row justify-end" style={{ paddingTop: 8 }}>
      <Pressable onPress={onPress} hitSlop={12}>
        <Text style={{ fontSize: 14, color: COLORS.textMuted }}>Skip</Text>
      </Pressable>
    </View>
  );
}

function SunriseGradient({ size = 120 }: { size?: number }) {
  const half = size / 2;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: half,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      {/* Sky — pale peach */}
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: '#FDE8D0',
        }}
      />
      {/* Mid warm band */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: size * 0.55,
          backgroundColor: '#F9C98C',
          borderTopLeftRadius: size * 0.4,
          borderTopRightRadius: size * 0.4,
        }}
      />
      {/* Sun glow */}
      <View
        style={{
          position: 'absolute',
          bottom: size * 0.08,
          width: size * 0.5,
          height: size * 0.5,
          borderRadius: size * 0.25,
          backgroundColor: '#F5A962',
        }}
      />
      {/* Bright sun center */}
      <View
        style={{
          position: 'absolute',
          bottom: size * 0.15,
          width: size * 0.28,
          height: size * 0.28,
          borderRadius: size * 0.14,
          backgroundColor: '#FFD6A0',
        }}
      />
      {/* Horizon line */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: size * 0.18,
          backgroundColor: '#EAB980',
        }}
      />
    </View>
  );
}

// ——— Screen 1: Hero ———

function SlideHero({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <View style={[styles.slide, { paddingHorizontal: 28 }]}>
      <View
        className="flex-1 items-center justify-center"
        style={{ gap: 28 }}
      >
        {/* Sunrise illustration */}
        <SunriseGradient size={140} />

        {/* Brand name */}
        <Text
          style={{
            fontSize: 40,
            fontWeight: '300',
            color: COLORS.textPrimary,
            letterSpacing: -1,
          }}
        >
          sora
        </Text>

        {/* Subtitle */}
        <Text
          style={{
            fontSize: 14,
            color: COLORS.textMuted,
            textAlign: 'center',
            lineHeight: 22.4,
            paddingHorizontal: 20,
          }}
        >
          set one alarm, pick your wake window
          {'\n'}
          and let sora handle the rest
        </Text>

        {/* Social proof */}
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <Text style={{ fontSize: 15, color: COLORS.gold, letterSpacing: 2 }}>
            ★★★★★
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textMuted }}>
            4.9 · 50K+ happy risers
          </Text>
        </View>
      </View>

      {/* Bottom */}
      <View style={{ paddingBottom: 20, gap: 24 }}>
        <GreenButton label="Get Started" onPress={onGetStarted} />
        <PageDots active={0} />
      </View>
    </View>
  );
}

// ——— Screen 2: Problem ———

function SlideProblem({
  onNext,
  onSkip,
}: {
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <View style={[styles.slide, { paddingHorizontal: 24 }]}>
      <SkipButton onPress={onSkip} />

      <View className="flex-1" style={{ gap: 24 }}>
        {/* Title */}
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: COLORS.textPrimary,
            letterSpacing: -0.5,
            lineHeight: 33.6,
            marginTop: 12,
          }}
        >
          tired of setting
          {'\n'}
          10 alarms?
        </Text>

        {/* Scattered alarm cards */}
        <View
          style={{
            height: 220,
            position: 'relative',
            marginHorizontal: 4,
          }}
        >
          {ALARM_CARDS.map((card, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            const cardWidth = (SCREEN_WIDTH - 80) * 0.32;
            const left = col * cardWidth + (row % 2 === 0 ? 4 : 16);
            const top = row * 100 + (col === 1 ? 16 : 0);
            return (
              <View
                key={card.time}
                style={[
                  styles.alarmCard,
                  {
                    backgroundColor: card.bg,
                    transform: [{ rotate: `${card.rotation}deg` }],
                    position: 'absolute',
                    left,
                    top,
                  },
                ]}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: card.dot,
                  }}
                />
                <Text style={{ fontSize: 11, color: COLORS.textMuted }}>
                  ⏰
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: COLORS.textPrimary,
                  }}
                >
                  {card.time}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Sound familiar */}
        <View style={{ gap: 10, paddingHorizontal: 4 }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '600',
              color: COLORS.textPrimary,
            }}
          >
            sound familiar?
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: COLORS.textBody,
              lineHeight: 22.5,
            }}
          >
            most people set multiple alarms because they're afraid of
            oversleeping. it's stressful and cluttered.
          </Text>
        </View>
      </View>

      {/* Bottom */}
      <View style={{ paddingBottom: 20, gap: 24 }}>
        <GreenButton label="Next" onPress={onNext} />
        <PageDots active={1} />
      </View>
    </View>
  );
}

// ——— Screen 3: Solution ———

function SlideSolution({
  onFinish,
  onSkip,
}: {
  onFinish: () => void;
  onSkip: () => void;
}) {
  return (
    <View style={[styles.slide, { paddingHorizontal: 24 }]}>
      <SkipButton onPress={onSkip} />

      <View
        className="flex-1 items-center"
        style={{ gap: 24, paddingTop: 20 }}
      >
        {/* Small sunrise */}
        <SunriseGradient size={72} />

        {/* Time card */}
        <View style={styles.solutionCard}>
          <Text
            style={{
              fontSize: 34,
              fontWeight: '700',
              color: COLORS.textPrimary,
              textAlign: 'center',
              letterSpacing: -0.5,
            }}
          >
            6:30 AM
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: COLORS.textMuted,
              textAlign: 'center',
              marginTop: 6,
            }}
          >
            between 6:00 — 7:30
          </Text>
          <View style={styles.badge}>
            <Text
              style={{
                fontSize: 11,
                color: COLORS.textMuted,
                fontWeight: '500',
              }}
            >
              morning · AM
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text
          style={{
            fontSize: 26,
            fontWeight: '600',
            color: COLORS.textPrimary,
            textAlign: 'center',
            letterSpacing: -0.3,
          }}
        >
          set your start time
          {'\n'}
          & range
        </Text>

        {/* Description */}
        <Text
          style={{
            fontSize: 14,
            color: COLORS.textMuted,
            textAlign: 'center',
            lineHeight: 21,
            paddingHorizontal: 12,
          }}
        >
          pick when you want to wake up and how wide your range should be. sora
          will gently wake you at the perfect moment.
        </Text>
      </View>

      {/* Bottom */}
      <View style={{ paddingBottom: 20, gap: 24 }}>
        <GreenButton label="start waking up better" onPress={onFinish} />
        <PageDots active={2} />
      </View>
    </View>
  );
}

// ——— Main Screen ———

export function OnboardingScreen() {
  const [_, setIsFirstTime] = useIsFirstTime();
  const router = useRouter();
  const [page, setPage] = React.useState(0);

  const goTo = React.useCallback((index: number) => {
    setPage(index);
  }, []);

  const finishOnboarding = React.useCallback(() => {
    setIsFirstTime(false);
    router.replace('/(alarm)');
  }, [setIsFirstTime, router]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <FocusAwareStatusBar />

      {page === 0 && <SlideHero onGetStarted={() => goTo(1)} />}
      {page === 1 && (
        <SlideProblem onNext={() => goTo(2)} onSkip={finishOnboarding} />
      )}
      {page === 2 && (
        <SlideSolution
          onFinish={finishOnboarding}
          onSkip={finishOnboarding}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  greenButton: {
    backgroundColor: COLORS.green,
    height: 56,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 0,
  },
  alarmCard: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  solutionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 28,
    paddingHorizontal: 36,
    alignItems: 'center',
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  badge: {
    marginTop: 14,
    backgroundColor: '#F5F4F2',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
});
