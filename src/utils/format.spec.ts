import { describe, expect, it } from 'vitest';

import {
  EMPTY,
  formatDate,
  formatDay,
  formatDistanceKm,
  formatDuration,
  formatNumber,
  formatPace,
  formatVolume,
  formatWeight,
} from './format';

describe('formatDate', () => {
  it('formats an ISO string in fr-FR', () => {
    expect(formatDate('2026-09-10T15:03:00.000Z')).toBe('jeu. 10 sept. 2026, 15:03');
  });

  it('accepts a Date', () => {
    expect(formatDate(new Date('2026-09-10T15:03:00.000Z'))).toBe('jeu. 10 sept. 2026, 15:03');
  });

  // The API stores Hevy's wall-clock time as UTC (see its french-date.ts), so
  // the rendered hour must be the UTC one. Both assertions above fail on any
  // machine outside UTC if timeZone: 'UTC' is dropped from the formatter.

  it.each([null, undefined, '', 'not-a-date'])('renders %s as an em dash', (value) => {
    expect(formatDate(value)).toBe(EMPTY);
  });
});

describe('formatDuration', () => {
  it.each([
    [3720, '1h02'],
    [3600, '1h00'],
    [7265, '2h01'],
    [600, '10 min'],
    [59, '59 s'],
    [0, '0 s'],
  ])('formats %i as %s', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });

  it.each([null, undefined, -1, Number.NaN])('renders %s as an em dash', (value) => {
    expect(formatDuration(value)).toBe(EMPTY);
  });
});

describe('formatVolume', () => {
  it.each([
    [12500, '12 500 kg'],
    ['12500.000', '12 500 kg'],
    [0, '0 kg'],
    [999, '999 kg'],
    // The API rounds volumes to one decimal; that decimal must survive.
    [14530.5, '14 530,5 kg'],
  ])('formats %s as %s', (value, expected) => {
    expect(formatVolume(value)).toBe(expected);
  });

  it('uses a plain space, never a narrow no-break space', () => {
    expect(formatVolume(12500)).not.toContain(' ');
    expect(formatVolume(12500)).not.toContain(' ');
  });

  it.each([null, undefined, '', 'abc'])('renders %s as an em dash', (value) => {
    expect(formatVolume(value)).toBe(EMPTY);
  });
});

describe('formatWeight', () => {
  it('drops the trailing zeros Prisma Decimal carries', () => {
    expect(formatWeight('60.000')).toBe('60');
    expect(formatWeight('62.500')).toBe('62,5');
  });

  it('renders null as an em dash, never 0', () => {
    expect(formatWeight(null)).toBe(EMPTY);
  });

  it('keeps a real zero', () => {
    expect(formatWeight(0)).toBe('0');
  });
});

describe('formatNumber', () => {
  it('formats RPE strings', () => {
    expect(formatNumber('8.50')).toBe('8,5');
  });

  it('renders null as an em dash', () => {
    expect(formatNumber(null)).toBe(EMPTY);
  });
});

describe('formatDistanceKm', () => {
  it('formats whole and fractional kilometres', () => {
    expect(formatDistanceKm(11)).toBe('11 km');
    expect(formatDistanceKm(5.5)).toBe('5,5 km');
  });

  it('renders null as an em dash', () => {
    expect(formatDistanceKm(null)).toBe(EMPTY);
  });
});

describe('formatPace', () => {
  it('turns decimal minutes into minutes and seconds', () => {
    expect(formatPace(5.83)).toBe('5:50 /km');
    expect(formatPace(6)).toBe('6:00 /km');
  });

  it('carries instead of rendering :60', () => {
    expect(formatPace(5.999)).toBe('6:00 /km');
  });

  it('renders null as an em dash', () => {
    expect(formatPace(null)).toBe(EMPTY);
  });
});

describe('formatDay', () => {
  it('renders a date-only value without a time', () => {
    expect(formatDay('2026-09-01')).toBe('1 sept. 2026');
  });

  it('stays in UTC like formatDate', () => {
    expect(formatDay('2026-09-01T23:30:00.000Z')).toBe('1 sept. 2026');
  });

  it('renders null as an em dash', () => {
    expect(formatDay(null)).toBe(EMPTY);
  });
});
