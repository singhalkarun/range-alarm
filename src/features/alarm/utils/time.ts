// src/features/alarm/utils/time.ts
type AmPm = 'AM' | 'PM';

export function to24Hour(hour12: number, ampm: AmPm): number {
  if (ampm === 'AM')
    return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
}

export function to12Hour(hour24: number): { hour: number; ampm: AmPm } {
  if (hour24 === 0)
    return { hour: 12, ampm: 'AM' };
  if (hour24 === 12)
    return { hour: 12, ampm: 'PM' };
  if (hour24 < 12)
    return { hour: hour24, ampm: 'AM' };
  return { hour: hour24 - 12, ampm: 'PM' };
}

export function formatTime12(hour24: number, minute: number): string {
  const { hour, ampm } = to12Hour(hour24);
  return `${hour}:${String(minute).padStart(2, '0')} ${ampm}`;
}

export function minutesOfDay(hour24: number, minute: number): number {
  return hour24 * 60 + minute;
}
