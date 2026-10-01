import type { WorkoutDetail, WorkoutExerciseDetail, WorkoutSummary } from '@/types/workouts';

export interface ExercisePair {
  key: string;
  name: string;
  current: WorkoutExerciseDetail;
  reference: WorkoutExerciseDetail;
}

export interface ExerciseMatch {
  pairs: ExercisePair[];
  onlyCurrent: WorkoutExerciseDetail[];
  onlyReference: WorkoutExerciseDetail[];
}

export function normalizeName(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function byOrder(exercises: readonly WorkoutExerciseDetail[]): WorkoutExerciseDetail[] {
  return [...exercises].sort((left, right) => left.order - right.order);
}

export function matchExercises(
  current: readonly WorkoutExerciseDetail[],
  reference: readonly WorkoutExerciseDetail[],
): ExerciseMatch {
  const waiting = new Map<string, WorkoutExerciseDetail[]>();
  for (const exercise of byOrder(reference)) {
    const key = normalizeName(exercise.name);
    waiting.set(key, [...(waiting.get(key) ?? []), exercise]);
  }

  const pairs: ExercisePair[] = [];
  const onlyCurrent: WorkoutExerciseDetail[] = [];
  for (const exercise of byOrder(current)) {
    const key = normalizeName(exercise.name);
    const match = waiting.get(key)?.shift();
    if (match) {
      pairs.push({ key: `${key}#${pairs.length}`, name: exercise.name, current: exercise, reference: match });
    } else {
      onlyCurrent.push(exercise);
    }
  }

  const matched = new Set(pairs.map((pair) => pair.reference.id));
  const onlyReference = byOrder(reference).filter((exercise) => !matched.has(exercise.id));

  return { pairs, onlyCurrent, onlyReference };
}

export function suggestReference(
  workout: Pick<WorkoutDetail, 'id' | 'title' | 'startedAt'>,
  candidates: readonly WorkoutSummary[],
): WorkoutSummary | null {
  const title = normalizeName(workout.title);
  const startedAt = Date.parse(workout.startedAt);
  const earlier = candidates
    .filter((candidate) => candidate.id !== workout.id && Date.parse(candidate.startedAt) < startedAt)
    .sort((left, right) => Date.parse(right.startedAt) - Date.parse(left.startedAt));

  return earlier.find((candidate) => normalizeName(candidate.title) === title) ?? null;
}
