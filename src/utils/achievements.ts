import { FAMILY_ORDER, RARITY_STYLES } from '@/constants/achievements';
import type { AchievementItem } from '@/types/achievements';

import { formatDay } from './format';

export function isMasked(item: AchievementItem): boolean {
  return item.secret && !item.unlocked;
}

export function isNegative(item: AchievementItem): boolean {
  return item.xp === 0;
}

export function ladderKey(item: AchievementItem): string {
  if (item.tier === null) {
    return item.code;
  }
  const cut = item.code.lastIndexOf('_');
  return cut > 0 ? item.code.slice(0, cut) : item.code;
}

export function orderWithLadders(items: readonly AchievementItem[]): AchievementItem[] {
  const firstSeen = new Map<string, number>();
  items.forEach((item, index) => {
    const key = ladderKey(item);
    if (!firstSeen.has(key)) firstSeen.set(key, index);
  });
  return [...items].sort((a, b) => {
    const byLadder = (firstSeen.get(ladderKey(a)) ?? 0) - (firstSeen.get(ladderKey(b)) ?? 0);
    return byLadder !== 0 ? byLadder : (a.tier ?? 0) - (b.tier ?? 0);
  });
}

export function ladderSizes(items: readonly AchievementItem[]): Map<string, number> {
  const sizes = new Map<string, number>();
  for (const item of items) {
    if (item.tier !== null) {
      const key = ladderKey(item);
      sizes.set(key, Math.max(sizes.get(key) ?? 0, item.tier));
    }
  }
  return sizes;
}

interface UnitRule {
  divide: number;
  unit: string;
  decimals: number;
}

const UNIT_RULES: Readonly<Record<string, UnitRule>> = {
  VOLUME: { divide: 1000, unit: 't', decimals: 1 },
  SESSION_VOLUME: { divide: 1000, unit: 't', decimals: 1 },
  TIME: { divide: 3600, unit: 'h', decimals: 1 },
  CARDIO: { divide: 1, unit: 'km', decimals: 1 },
  BENCH: { divide: 1, unit: 'kg', decimals: 1 },
  SQUAT: { divide: 1, unit: 'kg', decimals: 1 },
  DEADLIFT: { divide: 1, unit: 'kg', decimals: 1 },
  STREAK: { divide: 1, unit: 'weeks', decimals: 0 },
};

function unitFor(item: AchievementItem): UnitRule | null {
  const code = item.code;
  const prefix = Object.keys(UNIT_RULES)
    .sort((a, b) => b.length - a.length)
    .find((candidate) => code === candidate || code.startsWith(`${candidate}_`));
  return prefix ? (UNIT_RULES[prefix] ?? null) : null;
}

function number(value: number, decimals: number): string {
  return value.toLocaleString('fr-FR', { maximumFractionDigits: decimals }).replace(/ | /g, ' ');
}

export function formatProgress(item: AchievementItem): string {
  if (!item.progress) {
    return '';
  }
  const rule = unitFor(item);
  const divide = rule?.divide ?? 1;
  const decimals = rule?.decimals ?? 0;
  const value = number(item.progress.value / divide, decimals);
  const target = number(item.progress.target / divide, decimals);
  return rule ? `${value} / ${target} ${rule.unit}` : `${value} / ${target}`;
}

export function progressPercent(item: AchievementItem): number {
  if (!item.progress || item.progress.target <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, (item.progress.value / item.progress.target) * 100));
}

export function isInProgress(item: AchievementItem): boolean {
  return !item.unlocked && item.progress !== null && item.progress.value > 0;
}

export function describeAchievement(item: AchievementItem): string {
  if (isMasked(item)) {
    return 'Hidden achievement, locked';
  }
  const parts = [item.name];
  if (isNegative(item)) {
    parts.push(item.unlocked ? 'warning, triggered' : 'warning, not triggered');
  } else {
    parts.push(item.unlocked ? `unlocked, ${RARITY_STYLES[item.rarity].label}` : 'locked');
  }
  if (item.tier !== null) parts.push(`tier ${item.tier}`);
  if (item.unlocked && item.unlockedAt) parts.push(`on ${formatDay(item.unlockedAt)}`);
  if (!item.unlocked && item.progress) {
    parts.push(`progress ${formatProgress(item)}, ${Math.floor(progressPercent(item))} percent`);
  }
  parts.push(item.description);
  if (!isNegative(item)) parts.push(`${item.xp} XP`);
  return parts.join(', ');
}

export function familyRank(family: AchievementItem['family']): number {
  const index = FAMILY_ORDER.indexOf(family);
  return index === -1 ? FAMILY_ORDER.length : index;
}
