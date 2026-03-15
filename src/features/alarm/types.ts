export type IntensityTier = 'gentle' | 'moderate' | 'strong' | 'aggressive';

export type Alarm = {
  id: string;
  startHour: number; // 0-23
  startMinute: number; // 0-59
  durationMinutes: number; // 2-120
  intervalMinutes: number; // 1 to durationMinutes
  snoozeDurationMinutes: number; // 2, 5, or 10
  days: number[]; // 0=Sun..6=Sat, empty = one-time
  enabled: boolean;
  label?: string;
};

export type AlarmSequenceItem = {
  hour24: number; // 0-23
  minute: number; // 0-59
  display: string; // e.g. "7:00"
  ampm: 'AM' | 'PM';
  intensityTier: IntensityTier;
  sequenceIndex: number;
  crossesMidnight: boolean;
};
