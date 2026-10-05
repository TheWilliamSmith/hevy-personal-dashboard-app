import type { EChartsOption } from 'echarts';

import { t, translated } from '@/i18n';
import { formatDuration, formatInteger, formatVolume } from '@/utils/format';
import { resolvedTheme } from '@/utils/preferences';
import type { TimeseriesMetric } from '@/types/stats';

export interface ChartPalette {
  axis: string;
  axisLabel: string;
  splitLine: string;
  text: string;
  mutedText: string;
  tooltipBackground: string;
  tooltipBorder: string;
  tooltipText: string;
  heatmap: [string, string, string, string, string];
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

const APP_DARK: ChartPalette = {
  ...DARK_PALETTE,
  splitLine: '#27272a',
  tooltipBackground: '#18181b',
  tooltipBorder: '#3f3f46',
};

const APP_LIGHT: ChartPalette = {
  ...LIGHT_PALETTE,
  axisLabel: '#52525b',
  splitLine: '#e4e4e7',
  text: '#18181b',
  tooltipBackground: '#ffffff',
  tooltipBorder: '#d4d4d8',
  tooltipText: '#18181b',
};

export function chartPalette(): ChartPalette {
  return resolvedTheme.value === 'light' ? APP_LIGHT : APP_DARK;
}

export const METRIC_COLORS: Readonly<Record<TimeseriesMetric, string>> = {
  volume: '#4f46e5',
  sets: '#0ea5e9',
  reps: '#14b8a6',
  duration: '#f59e0b',
  workouts: '#ec4899',
};

export const WORKOUT_COUNT_COLOR = '#ec4899';

export const METRIC_LABELS: Readonly<Record<TimeseriesMetric, string>> = translated(
  ['volume', 'sets', 'reps', 'duration', 'workouts'],
  (key) => `metrics.${key}`,
);

export function formatMetric(metric: TimeseriesMetric, value: number): string {
  switch (metric) {
    case 'volume':
      return formatVolume(value);
    case 'duration':
      return formatDuration(value);
    default:
      return t(`units.${metric}`, { count: formatInteger(value) }, value);
  }
}

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
