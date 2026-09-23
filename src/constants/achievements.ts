import type { AchievementFamily, Rarity } from '@/types/achievements';

/**
 * The single source of truth for rarity colour and family naming. The hero,
 * the grid, the celebration and the dashboard card all read from here.
 */
export const RARITY_ORDER: readonly Rarity[] = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'];

export interface RarityStyle {
  label: string;
  /** Solid colour, for the completion ring, dots and confetti. */
  hex: string;
  /** Icon medallion on an earned card: solid colour, white glyph. */
  badge: string;
  /** Earned card: tinted background and coloured border. */
  card: string;
  text: string;
}

/**
 * Four bright, clearly separated colours: green, blue, violet, and a
 * yellow-to-orange gradient for Legendary. Earned cards wear them fully;
 * locked cards keep the colour only in their rarity label, so the page stays
 * colourful without a locked trophy ever looking earned.
 */
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

/**
 * Negative achievements (xp 0) are warnings, not trophies: amber and outlined,
 * deliberately distinct from Legendary's warm gold wash.
 */
export const NEGATIVE_STYLE = {
  badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-300',
  card: 'border-dashed border-amber-400 bg-white',
  text: 'text-amber-700',
} as const;

/** Tab order on the page. The API's own group order differs; this one reads better. */
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
