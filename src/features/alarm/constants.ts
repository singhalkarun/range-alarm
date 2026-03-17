import type { IntensityTier } from './types';

export const MAX_SEQUENCE_LENGTH = 64;
export const IOS_NOTIFICATION_LIMIT = 64;

export const DURATION_MIN = 2;
export const DURATION_MAX = 120;
export const INTERVAL_MIN = 1;

export const INTERVAL_OPTIONS = [2, 5, 10, 15, 20] as const;
export const SNOOZE_OPTIONS = [2, 5, 10] as const;

export const DEFAULT_MAX_SNOOZE_COUNT = 3;
export const MAX_SNOOZE_OPTIONS = [1, 2, 3, 5, 10] as const;

export const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

export const INTENSITY_TIERS: IntensityTier[] = [
  'gentle',
  'moderate',
  'strong',
  'aggressive',
];

export const SOUND_FILES: Record<IntensityTier, string> = {
  gentle: 'gentle.wav',
  moderate: 'moderate.wav',
  strong: 'strong.wav',
  aggressive: 'aggressive.wav',
};

export const VIBRATION_PATTERNS: Record<IntensityTier, number[]> = {
  gentle: [100],
  moderate: [100, 100],
  strong: [100, 200, 100, 200],
  aggressive: [200, 300, 200, 300, 200],
};

export const CHANNEL_CONFIG: Record<
  IntensityTier,
  { id: string; name: string; importance: number }
> = {
  gentle: { id: 'alarm-gentle-v2', name: 'Gentle Alarm', importance: 4 },
  moderate: { id: 'alarm-moderate-v2', name: 'Moderate Alarm', importance: 4 },
  strong: { id: 'alarm-strong-v2', name: 'Strong Alarm', importance: 5 },
  aggressive: { id: 'alarm-aggressive-v2', name: 'Urgent Alarm', importance: 5 },
};

export const STALE_CHANNEL_IDS = [
  'alarm-gentle',
  'alarm-moderate',
  'alarm-strong',
  'alarm-aggressive',
];
