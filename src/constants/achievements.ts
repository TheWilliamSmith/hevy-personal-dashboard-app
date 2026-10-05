import { t, translated } from '@/i18n';
import type { AchievementFamily, Rarity } from '@/types/achievements';

export const RARITY_ORDER: readonly Rarity[] = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'];

export interface RarityStyle {
  label: string;
  hex: string;
  badge: string;
  card: string;
  text: string;
  dot: string;
}

export const RARITY_STYLES: Readonly<Record<Rarity, RarityStyle>> = {
  COMMON: {
    get label() {
      return t('rarities.COMMON');
    },
    hex: '#10b981',
    badge: 'bg-emerald-500 text-on-accent',
    card: 'border-emerald-500/30 bg-zinc-900',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
  RARE: {
    get label() {
      return t('rarities.RARE');
    },
    hex: '#3b82f6',
    badge: 'bg-blue-500 text-on-accent',
    card: 'border-blue-500/30 bg-zinc-900',
    text: 'text-blue-400',
    dot: 'bg-blue-400',
  },
  EPIC: {
    get label() {
      return t('rarities.EPIC');
    },
    hex: '#a855f7',
    badge: 'bg-purple-500 text-on-accent',
    card: 'border-purple-500/30 bg-zinc-900',
    text: 'text-purple-400',
    dot: 'bg-purple-400',
  },
  LEGENDARY: {
    get label() {
      return t('rarities.LEGENDARY');
    },
    hex: '#f59e0b',
    badge: 'bg-gradient-to-br from-yellow-400 to-orange-500 text-on-accent',
    card: 'border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-zinc-900',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
  },
};

export const NEGATIVE_STYLE = {
  badge: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/40',
  card: 'border-dashed border-amber-500/50 bg-transparent',
  text: 'text-amber-400',
} as const;

export const FAMILY_ORDER: readonly AchievementFamily[] = [
  'VOLUME',
  'STRENGTH',
  'CONSISTENCY',
  'ENDURANCE',
  'CARDIO',
  'VARIETY',
  'MILESTONE',
  'ODDITY',
];

export const FAMILY_LABELS: Readonly<Record<AchievementFamily, string>> = translated(
  FAMILY_ORDER,
  (key) => `families.${key}`,
);

const LADDER_KEYS = ['WORKOUT', 'VOLUME', 'BENCH', 'SQUAT', 'DEADLIFT', 'TIME', 'STREAK', 'CARDIO', 'EXPLORER'] as const;

export const LADDER_LABELS: Readonly<Record<string, string>> = translated(LADDER_KEYS, (key) => `ladders.${key}`);
