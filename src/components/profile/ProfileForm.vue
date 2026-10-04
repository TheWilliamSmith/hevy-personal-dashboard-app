<script setup lang="ts">
import { computed, reactive, watch, type DeepReadonly } from 'vue';

import SectionHeader from '@/components/ui/SectionHeader.vue';
import { t } from '@/i18n';
import type { UserProfile } from '@/types/profile';
import { fromDisplayWeight, toDisplayWeight, weightUnitLabel } from '@/utils/format';
import { weightUnit } from '@/utils/preferences';
import { USERNAME_PATTERN } from '@/utils/profile';

const props = defineProps<{ profile: DeepReadonly<UserProfile>; isSaving: boolean; usernameError?: string | null }>();

const emit = defineEmits<{ save: [profile: UserProfile] }>();

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

const bodyweightLimits = computed(() => (weightUnit.value === 'lb' ? { min: 44, max: 880, step: 1 } : { min: 20, max: 400, step: 0.1 }));

const bodyweight = computed(() => {
  if (draft.bodyweightKg === null) {
    return '';
  }
  const value = toDisplayWeight(draft.bodyweightKg);
  return String(weightUnit.value === 'lb' ? Math.round(value) : value);
});

function onBodyweight(value: string): void {
  const amount = toNumber(value);
  draft.bodyweightKg = amount === null ? null : Math.round(fromDisplayWeight(amount) * 10) / 10;
}

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400';
const field = `w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 ${focus}`;
const label = 'mb-1 block text-xs text-zinc-400';
</script>

<template>
  <form class="flex flex-col gap-8" @submit.prevent="submit">
    <div class="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-0">
      <section class="flex flex-col gap-5 lg:pr-8">
        <SectionHeader :title="t('profile.publicTitle')" :subtitle="t('profile.publicSubtitle')" />

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="profile-name" :class="label">{{ t('auth.signUp.displayName') }}</label>
            <input id="profile-name" v-model="draft.displayName" type="text" maxlength="80" :class="field" />
          </div>
          <div>
            <label for="profile-username" :class="label">{{ t('auth.signUp.username') }}</label>
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
              {{ visibleUsernameError ?? t('auth.signUp.usernameHint') }}
            </p>
          </div>
        </div>

        <div>
          <label for="profile-bio" :class="label">{{ t('profile.bio') }}</label>
          <textarea id="profile-bio" v-model="draft.bio" rows="3" maxlength="160" :class="[field, 'resize-none']" />
          <p class="mt-1 text-right text-xs text-zinc-500 tabular-nums">{{ draft.bio.length }} / 160</p>
        </div>

        <div class="sm:max-w-xs">
          <label for="profile-location" :class="label">{{ t('profile.location') }}</label>
          <input id="profile-location" v-model="draft.location" type="text" maxlength="80" :class="field" />
        </div>
      </section>

      <section class="flex flex-col gap-5 border-zinc-800 lg:border-l lg:pl-8">
        <SectionHeader :title="t('profile.body')" :subtitle="t('profile.bodySubtitle')" />

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="profile-bodyweight" :class="label">{{ t('profile.bodyweight', { unit: weightUnitLabel() }) }}</label>
            <input
              id="profile-bodyweight"
              :value="bodyweight"
              type="number"
              :min="bodyweightLimits.min"
              :max="bodyweightLimits.max"
              :step="bodyweightLimits.step"
              :class="field"
              @input="onBodyweight(($event.target as HTMLInputElement).value)"
            />
          </div>
          <div>
            <label for="profile-height" :class="label">{{ t('profile.height') }}</label>
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
      <span v-if="isDirty" class="mr-auto text-xs text-zinc-500">{{ t('profile.unsaved') }}</span>
      <button
        type="button"
        class="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800 disabled:opacity-40"
        :class="focus"
        :disabled="!isDirty || isSaving"
        @click="reset"
      >
        {{ t('profile.discard') }}
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
        {{ t('profile.saveChanges') }}
      </button>
    </div>
  </form>
</template>
