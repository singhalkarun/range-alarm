// src/features/alarm/services/__tests__/intensity.test.ts
import { getChannelId, getSoundFile, getVibrationPattern } from '../intensity';

describe('getChannelId', () => {
  it('returns correct channel for gentle', () => { expect(getChannelId('gentle')).toBe('alarm-gentle'); });
  it('returns correct channel for aggressive', () => { expect(getChannelId('aggressive')).toBe('alarm-aggressive'); });
});
describe('getSoundFile', () => {
  it('returns correct sound for gentle', () => { expect(getSoundFile('gentle')).toBe('gentle.wav'); });
  it('returns correct sound for strong', () => { expect(getSoundFile('strong')).toBe('strong.wav'); });
});
describe('getVibrationPattern', () => {
  it('returns single pulse for gentle', () => { expect(getVibrationPattern('gentle')).toEqual([100]); });
  it('returns long pattern for aggressive', () => { expect(getVibrationPattern('aggressive')).toEqual([200, 300, 200, 300, 200]); });
});
