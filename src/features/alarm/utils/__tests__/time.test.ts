// src/features/alarm/utils/__tests__/time.test.ts
import { to24Hour, to12Hour, formatTime12, minutesOfDay } from '../time';

describe('to24Hour', () => {
  it('converts 12 AM to 0', () => { expect(to24Hour(12, 'AM')).toBe(0); });
  it('converts 12 PM to 12', () => { expect(to24Hour(12, 'PM')).toBe(12); });
  it('converts 7 AM to 7', () => { expect(to24Hour(7, 'AM')).toBe(7); });
  it('converts 7 PM to 19', () => { expect(to24Hour(7, 'PM')).toBe(19); });
  it('converts 11 PM to 23', () => { expect(to24Hour(11, 'PM')).toBe(23); });
});

describe('to12Hour', () => {
  it('converts 0 to 12 AM', () => { expect(to12Hour(0)).toEqual({ hour: 12, ampm: 'AM' }); });
  it('converts 12 to 12 PM', () => { expect(to12Hour(12)).toEqual({ hour: 12, ampm: 'PM' }); });
  it('converts 7 to 7 AM', () => { expect(to12Hour(7)).toEqual({ hour: 7, ampm: 'AM' }); });
  it('converts 19 to 7 PM', () => { expect(to12Hour(19)).toEqual({ hour: 7, ampm: 'PM' }); });
  it('converts 23 to 11 PM', () => { expect(to12Hour(23)).toEqual({ hour: 11, ampm: 'PM' }); });
});

describe('formatTime12', () => {
  it('formats 7:00 AM', () => { expect(formatTime12(7, 0)).toBe('7:00 AM'); });
  it('formats 0:05 as 12:05 AM', () => { expect(formatTime12(0, 5)).toBe('12:05 AM'); });
  it('formats 13:30 as 1:30 PM', () => { expect(formatTime12(13, 30)).toBe('1:30 PM'); });
});

describe('minutesOfDay', () => {
  it('converts 7:00 to 420', () => { expect(minutesOfDay(7, 0)).toBe(420); });
  it('converts 0:00 to 0', () => { expect(minutesOfDay(0, 0)).toBe(0); });
  it('converts 23:59 to 1439', () => { expect(minutesOfDay(23, 59)).toBe(1439); });
});
