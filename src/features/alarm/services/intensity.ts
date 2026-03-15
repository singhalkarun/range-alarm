// src/features/alarm/services/intensity.ts
import type { IntensityTier } from '../types';
import { CHANNEL_CONFIG, SOUND_FILES, VIBRATION_PATTERNS } from '../constants';

export function getChannelId(tier: IntensityTier): string { return CHANNEL_CONFIG[tier].id; }
export function getSoundFile(tier: IntensityTier): string { return SOUND_FILES[tier]; }
export function getVibrationPattern(tier: IntensityTier): number[] { return VIBRATION_PATTERNS[tier]; }
