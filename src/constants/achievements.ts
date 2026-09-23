import type { AchievementFamily, Rarity } from '@/types/achievements';

export const RARITY_ORDER: readonly Rarity[] = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'];

export interface RarityStyle {
  label: string;
  hex: string;
  badge: string;
  card: string;
  text: string;
}

export const RARITY_STYLES: Readonly<Record<Rarity, RarityStyle>> = {
  COMMON: {
    label: 'Common',
    hex: '#10b981',
    badge: 'bg-emerald-500 text-white',
    card: 'border-emerald-300 bg-emerald-50',
    text: 'text-emerald-700',
  },
  RARE: {
    label: 'Rare',
    hex: '#3b82f6',
    badge: 'bg-blue-500 text-white',
    card: 'border-blue-300 bg-blue-50',
    text: 'text-blue-700',
  },
  EPIC: {
    label: 'Epic',
    hex: '#a855f7',
    badge: 'bg-purple-500 text-white',
    card: 'border-purple-300 bg-purple-50',
    text: 'text-purple-700',
  },
  LEGENDARY: {
    label: 'Legendary',
    hex: '#f59e0b',
    badge: 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white',
    card: 'border-orange-300 bg-gradient-to-br from-yellow-50 to-orange-100',
    text: 'text-orange-700',
  },
};

export const NEGATIVE_STYLE = {
  badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-300',
  card: 'border-dashed border-amber-400 bg-white',
  text: 'text-amber-700',
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

export const FAMILY_LABELS: Readonly<Record<AchievementFamily, string>> = {
  VOLUME: 'Volume',
  STRENGTH: 'Strength',
  CONSISTENCY: 'Consistency',
  ENDURANCE: 'Endurance',
  CARDIO: 'Cardio',
  VARIETY: 'Variety',
  MILESTONE: 'Milestone',
  ODDITY: 'Oddity',
};
