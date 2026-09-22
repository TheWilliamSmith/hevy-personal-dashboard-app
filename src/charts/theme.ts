import type { EChartsOption } from 'echarts';

import { formatDuration, formatInteger, formatVolume } from '@/utils/format';
import type { TimeseriesMetric } from '@/types/stats';

/**
 * The only place chart colours are defined. Charts read from here; none of them
 * hardcodes a hex value.
 *
 * Both palettes are exported even though the app is light-only today, so
 * turning on dark mode is a matter of flipping `resolveTheme`.
 */
export interface ChartPalette {
  axis: string;
  axisLabel: string;
  splitLine: string;
  text: string;
  mutedText: string;
  tooltipBackground: string;
  tooltipBorder: string;
  tooltipText: string;
  /** Low -> high ramp for the calendar heatmap. */
  heatmap: [string, string, string, string, string];
  /** Categorical series that are not a metric (weekday, rep ranges). */
  categorical: string[];
}

export const LIGHT_PALETTE: ChartPalette = {
  axis: '#cbd5e1',
  axisLabel: '#64748b',
  splitLine: '#e2e8f0',
  text: '#0f172a',
  mutedText: '#64748b',
  tooltipBackground: '#ffffff',
  tooltipBorder: '#e2e8f0',
  tooltipText: '#0f172a',
  heatmap: ['#eef2ff', '#c7d2fe', '#a5b4fc', '#6366f1', '#4338ca'],
  categorical: ['#4f46e5', '#0ea5e9', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6'],
};

export const DARK_PALETTE: ChartPalette = {
  axis: '#475569',
  axisLabel: '#94a3b8',
  splitLine: '#1e293b',
  text: '#f1f5f9',
  mutedText: '#94a3b8',
  tooltipBackground: '#0f172a',
  tooltipBorder: '#334155',
  tooltipText: '#f1f5f9',
  heatmap: ['#1e1b4b', '#312e81', '#4338ca', '#6366f1', '#a5b4fc'],
  categorical: ['#818cf8', '#38bdf8', '#2dd4bf', '#fbbf24', '#f472b6', '#a78bfa'],
};

/**
 * A metric keeps its hue everywhere it appears: volume is indigo in the main
 * chart, in the top-exercises ranking and in the progression chart.
 */
export const METRIC_COLORS: Readonly<Record<TimeseriesMetric, string>> = {
  volume: '#4f46e5',
  sets: '#0ea5e9',
  reps: '#14b8a6',
  duration: '#f59e0b',
  workouts: '#ec4899',
};

/** Workout count rides the secondary axis of the main chart. */
export const WORKOUT_COUNT_COLOR = '#ec4899';

export const METRIC_LABELS: Readonly<Record<TimeseriesMetric, string>> = {
  volume: 'Volume',
  sets: 'Sets',
  reps: 'Reps',
  duration: 'Duration',
  workouts: 'Workouts',
};

export const METRIC_UNITS: Readonly<Record<TimeseriesMetric, string>> = {
  volume: 'kg',
  sets: 'sets',
  reps: 'reps',
  duration: '',
  workouts: 'workouts',
};

/** Axis and tooltip rendering per metric, so no chart formats numbers inline. */
export function formatMetric(metric: TimeseriesMetric, value: number): string {
  switch (metric) {
    case 'volume':
      return formatVolume(value);
    case 'duration':
      return formatDuration(value);
    default:
      return `${formatInteger(value)} ${METRIC_UNITS[metric]}`;
  }
}

/** Compact axis labels: thousands collapse so ticks stay readable. */
export function formatAxisValue(metric: TimeseriesMetric, value: number): string {
  if (metric === 'duration') {
    return formatDuration(value);
  }

  if (Math.abs(value) >= 1000) {
    return `${formatInteger(Math.round(value / 100) / 10)} k`;
  }

  return formatInteger(value);
}

export function resolveTheme(dark = false): ChartPalette {
  return dark ? DARK_PALETTE : LIGHT_PALETTE;
}

/**
 * Shared skeleton every chart option spreads. Holds grid, tooltip and text
 * styling so cards line up and tooltips behave identically.
 */
export function baseOption(palette: ChartPalette): EChartsOption {
  return {
    textStyle: {
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontSize: 12,
      color: palette.text,
    },
    grid: { left: 8, right: 8, top: 24, bottom: 8, containLabel: true },
    tooltip: {
      backgroundColor: palette.tooltipBackground,
      borderColor: palette.tooltipBorder,
      borderWidth: 1,
      textStyle: { color: palette.tooltipText, fontSize: 12 },
      extraCssText: 'box-shadow: 0 4px 16px rgba(15,23,42,.12); border-radius: 8px;',
    },
    animationDuration: 240,
  };
}

/** Category or time axis shared by every cartesian chart. */
export function categoryAxis(palette: ChartPalette) {
  return {
    type: 'category' as const,
    axisLine: { lineStyle: { color: palette.axis } },
    axisTick: { show: false },
    axisLabel: { color: palette.axisLabel, hideOverlap: true },
    splitLine: { show: false },
  };
}

export function valueAxis(palette: ChartPalette, name = '') {
  return {
    type: 'value' as const,
    name,
    nameTextStyle: { color: palette.mutedText, fontSize: 11, align: 'left' as const },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: palette.axisLabel },
    splitLine: { lineStyle: { color: palette.splitLine } },
  };
}
