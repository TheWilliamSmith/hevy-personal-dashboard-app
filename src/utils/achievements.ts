import { t } from '@/i18n';
import { FAMILY_ORDER, RARITY_STYLES } from '@/constants/achievements';
import type { AchievementItem } from '@/types/achievements';

import { formatDay, formatDecimal, toDisplayWeight, weightUnitLabel } from './format';

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

export function ladderTiers(items: readonly AchievementItem[]): Map<string, AchievementItem[]> {
  const tiers = new Map<string, AchievementItem[]>();
  for (const item of items) {
    if (item.tier !== null) {
      const key = ladderKey(item);
      tiers.set(key, [...(tiers.get(key) ?? []), item]);
    }
  }
  for (const list of tiers.values()) {
    list.sort((a, b) => (a.tier ?? 0) - (b.tier ?? 0));
  }
  return tiers;
}

export interface LadderProgress {
  unlockedCount: number;
  current: AchievementItem | null;
  top: AchievementItem | null;
}

export function ladderProgress(tiers: readonly AchievementItem[]): LadderProgress {
  return {
    unlockedCount: tiers.filter((tier) => tier.unlocked).length,
    current: tiers.find((tier) => !tier.unlocked) ?? null,
    top: [...tiers].reverse().find((tier) => tier.unlocked) ?? null,
  };
}

export interface SectionLayout {
  ladders: Array<{ key: string; tiers: AchievementItem[] }>;
  singles: AchievementItem[];
}

export function layoutSection(
  items: readonly AchievementItem[],
  tiers: ReadonlyMap<string, AchievementItem[]>,
): SectionLayout {
  const ladders: SectionLayout['ladders'] = [];
  const seen = new Set<string>();
  const singles: AchievementItem[] = [];

  for (const item of items) {
    if (item.tier === null) {
      singles.push(item);
      continue;
    }
    const key = ladderKey(item);
    if (!seen.has(key)) {
      seen.add(key);
      ladders.push({ key, tiers: tiers.get(key) ?? [item] });
    }
  }

  const unlockedTiers = (ladder: { tiers: AchievementItem[] }) =>
    ladder.tiers.filter((tier) => tier.unlocked).length;

  ladders.sort((a, b) => Number(unlockedTiers(b) > 0) - Number(unlockedTiers(a) > 0));
  singles.sort((a, b) => Number(b.unlocked) - Number(a.unlocked));
  return { ladders, singles };
}

interface UnitRule {
  divide: number;
  unit: string;
  decimals: number;
  weight?: boolean;
}

const UNIT_RULES: Readonly<Record<string, UnitRule>> = {
  VOLUME: { divide: 1000, unit: 't', decimals: 1, weight: true },
  SESSION_VOLUME: { divide: 1000, unit: 't', decimals: 1, weight: true },
  TIME: { divide: 3600, unit: 'h', decimals: 1 },
  CARDIO: { divide: 1, unit: 'km', decimals: 1 },
  BENCH: { divide: 1, unit: 'kg', decimals: 1, weight: true },
  SQUAT: { divide: 1, unit: 'kg', decimals: 1, weight: true },
  DEADLIFT: { divide: 1, unit: 'kg', decimals: 1, weight: true },
  STREAK: { divide: 1, unit: 'weeks', decimals: 0 },
};

function unitFor(item: AchievementItem): UnitRule | null {
  const code = item.code;
  const prefix = Object.keys(UNIT_RULES)
    .sort((a, b) => b.length - a.length)
    .find((candidate) => code === candidate || code.startsWith(`${candidate}_`));
  return prefix ? (UNIT_RULES[prefix] ?? null) : null;
}

function weightedUnit(rule: UnitRule): string {
  if (!rule.weight || weightUnitLabel() === 'kg') {
    return rule.unit;
  }
  return rule.divide === 1000 ? 'k lb' : 'lb';
}

export function formatProgress(item: AchievementItem): string {
  if (!item.progress) {
    return '';
  }
  const rule = unitFor(item);
  const divide = rule?.divide ?? 1;
  const decimals = rule?.decimals ?? 0;
  const scale = (amount: number) => (rule?.weight ? toDisplayWeight(amount) : amount) / divide;
  const value = formatDecimal(scale(item.progress.value), decimals);
  const target = formatDecimal(scale(item.progress.target), decimals);
  if (!rule) {
    return `${value} / ${target}`;
  }
  const unit = rule.unit === 'weeks' ? t('achievementText.weeks') : weightedUnit(rule);
  return `${value} / ${target} ${unit}`;
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
    return t('achievementText.hiddenLocked');
  }
  const parts = [item.name];
  if (isNegative(item)) {
    parts.push(item.unlocked ? t('achievementText.warningTriggered') : t('achievementText.warningNotTriggered'));
  } else {
    parts.push(
      item.unlocked
        ? t('achievementText.unlocked', { rarity: RARITY_STYLES[item.rarity].label })
        : t('achievementText.locked'),
    );
  }
  if (item.tier !== null) parts.push(t('achievementText.tier', { tier: item.tier }));
  if (item.unlocked && item.unlockedAt) parts.push(t('achievementText.on', { date: formatDay(item.unlockedAt) }));
  if (!item.unlocked && item.progress) {
    parts.push(
      t('achievementText.progress', { progress: formatProgress(item), percent: Math.floor(progressPercent(item)) }),
    );
  }
  parts.push(item.description);
  if (!isNegative(item)) parts.push(`${item.xp} XP`);
  return parts.join(', ');
}

export function familyRank(family: AchievementItem['family']): number {
  const index = FAMILY_ORDER.indexOf(family);
  return index === -1 ? FAMILY_ORDER.length : index;
}
