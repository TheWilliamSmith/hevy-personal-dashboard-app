import type { AchievementFamily, Rarity } from '@/types/achievements';

/**
 * The single source of truth for rarity colour and family naming. The hero,
 * the grid, the celebration and the dashboard card all read from here.
 */
export const RARITY_ORDER: readonly Rarity[] = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'];

export interface RarityStyle {
  label: string;
  /** Solid colour, for the completion ring and the confetti. */
  hex: string;
  /** Icon badge on an unlocked card. */
  badge: string;
  /** The subtle tinted border and wash of an unlocked card. */
  card: string;
  text: string;
}

export const RARITY_STYLES: Readonly<Record<Rarity, RarityStyle>> = {
  COMMON: {
    label: 'Common',
    hex: '#64748b',
    badge: 'bg-slate-100 text-slate-700',
    card: 'border-slate-300 bg-white',
    text: 'text-slate-600',
  },
  RARE: {
    label: 'Rare',
    hex: '#2563eb',
    badge: 'bg-blue-100 text-blue-700',
    card: 'border-blue-300 bg-blue-50/40',
    text: 'text-blue-700',
  },
  EPIC: {
    label: 'Epic',
    hex: '#7c3aed',
    badge: 'bg-violet-100 text-violet-700',
    card: 'border-violet-300 bg-violet-50/40',
    text: 'text-violet-700',
  },
  LEGENDARY: {
    label: 'Legendary',
    hex: '#d97706',
    badge: 'bg-amber-100 text-amber-700',
    card: 'border-amber-400 bg-amber-50/50',
    text: 'text-amber-700',
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
