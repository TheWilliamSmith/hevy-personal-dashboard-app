<script setup lang="ts">
import { computed, reactive, watch, type DeepReadonly } from 'vue';

import SectionHeader from '@/components/ui/SectionHeader.vue';
import SegmentedControl, { type SegmentedOption } from '@/components/ui/SegmentedControl.vue';
import type { UserProfile, WeekStart, WeightUnit } from '@/types/profile';
import { USERNAME_PATTERN } from '@/utils/profile';

const props = defineProps<{ profile: DeepReadonly<UserProfile>; isSaving: boolean; usernameError?: string | null }>();

const emit = defineEmits<{ save: [profile: UserProfile] }>();

const UNITS: ReadonlyArray<SegmentedOption<WeightUnit>> = [
  { value: 'kg', label: 'Kilograms' },
  { value: 'lb', label: 'Pounds' },
];

const WEEK_STARTS: ReadonlyArray<SegmentedOption<WeekStart>> = [
  { value: 'monday', label: 'Monday' },
  { value: 'sunday', label: 'Sunday' },
];

const draft = reactive<UserProfile>({ ...props.profile });

watch(
  () => props.profile,
  (next) => Object.assign(draft, next),
  { deep: true },
);

const isDirty = computed(() =>
  (Object.keys(draft) as Array<keyof UserProfile>).some((key) => draft[key] !== props.profile[key]),
);

const usernameValid = computed(() => USERNAME_PATTERN.test(draft.username));
const visibleUsernameError = computed(() =>
  props.usernameError && draft.username !== props.profile.username ? props.usernameError : null,
);

function reset(): void {
  Object.assign(draft, props.profile);
}

function submit(): void {
  if (usernameValid.value && draft.displayName.trim()) {
    emit('save', { ...draft, displayName: draft.displayName.trim(), bio: draft.bio.trim() });
  }
}

function toNumber(value: string): number | null {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400';
const field = `w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 ${focus}`;
const label = 'mb-1 block text-xs text-zinc-400';
</script>

<template>
  <form class="flex flex-col gap-8" @submit.prevent="submit">
    <div class="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-0">
      <section class="flex flex-col gap-5 lg:pr-8">
        <SectionHeader title="Public profile" subtitle="How you appear across the dashboard" />

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="profile-name" :class="label">Display name</label>
            <input id="profile-name" v-model="draft.displayName" type="text" maxlength="80" :class="field" />
          </div>
          <div>
            <label for="profile-username" :class="label">Username</label>
            <div class="relative">
              <span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-zinc-500">@</span>
              <input
                id="profile-username"
                v-model="draft.username"
                type="text"
                maxlength="30"
                autocomplete="off"
                spellcheck="false"
                :aria-invalid="!usernameValid || Boolean(visibleUsernameError)"
                aria-describedby="profile-username-hint"
                :class="[field, 'pl-7']"
              />
            </div>
            <p
              id="profile-username-hint"
              class="mt-1 text-xs"
              :class="usernameValid && !visibleUsernameError ? 'text-zinc-500' : 'text-red-400'"
            >
              {{ visibleUsernameError ?? '3 to 30 characters: lowercase letters, digits, dots and underscores.' }}
            </p>
          </div>
        </div>

        <div>
          <label for="profile-bio" :class="label">Bio</label>
          <textarea id="profile-bio" v-model="draft.bio" rows="3" maxlength="160" :class="[field, 'resize-none']" />
          <p class="mt-1 text-right text-xs text-zinc-500 tabular-nums">{{ draft.bio.length }} / 160</p>
        </div>

        <div class="sm:max-w-xs">
          <label for="profile-location" :class="label">Location</label>
          <input id="profile-location" v-model="draft.location" type="text" maxlength="80" :class="field" />
        </div>
      </section>

      <section class="flex flex-col gap-5 border-zinc-800 lg:border-l lg:pl-8">
        <SectionHeader title="Preferences" subtitle="Units and body measurements" />

        <div class="flex flex-col gap-2">
          <span :class="label">Weight unit</span>
          <SegmentedControl v-model="draft.weightUnit" :options="UNITS" label="Weight unit" />
        </div>

        <div class="flex flex-col gap-2">
          <span :class="label">Week starts on</span>
          <SegmentedControl v-model="draft.weekStart" :options="WEEK_STARTS" label="Week start" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="profile-bodyweight" :class="label">Bodyweight (kg)</label>
            <input
              id="profile-bodyweight"
              :value="draft.bodyweightKg ?? ''"
              type="number"
              min="20"
              max="400"
              step="0.1"
              :class="field"
              @input="draft.bodyweightKg = toNumber(($event.target as HTMLInputElement).value)"
            />
          </div>
          <div>
            <label for="profile-height" :class="label">Height (cm)</label>
            <input
              id="profile-height"
              :value="draft.heightCm ?? ''"
              type="number"
              min="100"
              max="250"
              :class="field"
              @input="draft.heightCm = toNumber(($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>
      </section>
    </div>

    <div class="flex items-center justify-end gap-3 border-t border-zinc-800 pt-5">
      <span v-if="isDirty" class="mr-auto text-xs text-zinc-500">Unsaved changes</span>
      <button
        type="button"
        class="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800 disabled:opacity-40"
        :class="focus"
        :disabled="!isDirty || isSaving"
        @click="reset"
      >
        Discard
      </button>
      <button
        type="submit"
        class="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!isDirty || !usernameValid || !draft.displayName.trim() || isSaving"
        :aria-busy="isSaving"
      >
        <span
          v-if="isSaving"
          class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-900/30 border-t-zinc-900"
          aria-hidden="true"
        />
        Save changes
      </button>
    </div>
  </form>
</template>
