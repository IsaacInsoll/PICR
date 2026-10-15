import { describe, expect, it } from 'vitest';
import { comingSoonCountdown } from './comingSoonCountdown';

describe('Coming Soon countdown', () => {
  it('shows seconds only once less than a day remains', () => {
    expect(comingSoonCountdown(86_400_000, 0)).toMatchObject({
      showSeconds: false,
      days: 1,
      hours: 0,
      minutes: 0,
    });
    expect(comingSoonCountdown(86_399_000, 0)).toMatchObject({
      showSeconds: true,
      days: 0,
      hours: 23,
      minutes: 59,
      seconds: 59,
    });
  });

  it('reaches zero at the estimate instead of showing a stale second', () => {
    expect(comingSoonCountdown(1000, 999)).toMatchObject({
      remaining: true,
      seconds: 1,
    });
    expect(comingSoonCountdown(1000, 1000)).toMatchObject({
      remaining: false,
      showSeconds: false,
    });
  });
});
