import { readonly, ref } from 'vue';

const version = ref(0);

export const dataVersion = readonly(version);

export function invalidateWorkoutData(): void {
  version.value += 1;
}

export function shouldBypassHttpCache(): boolean {
  return version.value > 0;
}
