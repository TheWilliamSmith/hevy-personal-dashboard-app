export interface SearchableExercise {
  id: string;
  name: string;
  sessions: number;
}

export const SEARCH_RESULT_LIMIT = 8;

export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function rank(name: string, query: string): number | null {
  const normalized = normalizeSearch(name);
  if (normalized.startsWith(query)) {
    return 0;
  }
  const words = normalized.split(/[^a-z0-9]+/).filter(Boolean);
  return words.some((word) => word.startsWith(query)) ? 1 : null;
}

export function searchExercises<T extends SearchableExercise>(
  exercises: readonly T[],
  query: string,
  limit = SEARCH_RESULT_LIMIT,
): T[] {
  const needle = normalizeSearch(query);
  const byUsage = (a: T, b: T) => b.sessions - a.sessions || a.name.localeCompare(b.name);

  if (!needle) {
    return [...exercises].sort(byUsage).slice(0, limit);
  }

  return exercises
    .flatMap((exercise) => {
      const score = rank(exercise.name, needle);
      return score === null ? [] : [{ exercise, score }];
    })
    .sort((a, b) => a.score - b.score || byUsage(a.exercise, b.exercise))
    .slice(0, limit)
    .map(({ exercise }) => exercise);
}
