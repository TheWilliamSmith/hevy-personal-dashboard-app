<script setup lang="ts">
import { t } from '@/i18n';
import { CalendarDays, Camera, MapPin } from 'lucide-vue-next';
import { computed, ref, type DeepReadonly } from 'vue';

import type { ProfileStats, UserProfile } from '@/types/profile';
import { EMPTY, formatDay, formatInteger } from '@/utils/format';

import ProfileAvatar from './ProfileAvatar.vue';

const props = defineProps<{ profile: DeepReadonly<UserProfile>; stats: ProfileStats | null; isSaving: boolean }>();
const emit = defineEmits<{ upload: [file: File]; remove: [] }>();

const fileInput = ref<HTMLInputElement | null>(null);

const figures = computed(() => [
  { label: t('profile.workouts'), value: props.stats ? formatInteger(props.stats.workouts) : EMPTY },
  { label: t('profile.level'), value: props.stats ? formatInteger(props.stats.level) : EMPTY },
  { label: t('profile.trophies'), value: props.stats ? formatInteger(props.stats.trophies) : EMPTY },
  { label: t('profile.streak'), value: props.stats ? t('profile.streakWeeks', { count: props.stats.streakWeeks }) : EMPTY },
]);

function onFile(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (file) {
    emit('upload', file);
  }
}

const discreet =
  'rounded-md px-2 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400';
</script>

<template>
  <section class="flex flex-col">
    <div class="h-32 rounded-lg bg-gradient-to-br from-blue-900/60 via-zinc-900 to-zinc-950 sm:h-40" aria-hidden="true" />

    <div class="flex flex-col gap-4 px-2 sm:flex-row sm:items-start sm:justify-between sm:px-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
        <button
          type="button"
          class="group relative -mt-12 w-fit rounded-full ring-4 ring-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
          :disabled="isSaving"
          :aria-label="t('profile.changePicture')"
          @click="fileInput?.click()"
        >
          <ProfileAvatar :name="profile.displayName" :url="profile.avatarUrl" size="lg" />
          <span
            class="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            aria-hidden="true"
          >
            <Camera class="h-5 w-5" />
          </span>
        </button>
        <label for="profile-avatar-file" class="sr-only">{{ t('profile.changePicture') }}</label>
        <input
          id="profile-avatar-file"
          ref="fileInput"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          class="sr-only"
          tabindex="-1"
          aria-hidden="true"
          @change="onFile"
        />
        <div class="min-w-0 sm:pt-3">
          <h2 class="truncate text-2xl font-semibold tracking-tight text-white">{{ profile.displayName }}</h2>
          <p class="text-sm text-zinc-400">@{{ profile.username }}</p>
          <div class="-ml-2 mt-1 flex gap-1">
            <button type="button" :class="discreet" :disabled="isSaving" @click="fileInput?.click()">
              {{ profile.avatarUrl ? t('profile.changePhoto') : t('profile.addPhoto') }}
            </button>
            <button v-if="profile.avatarUrl" type="button" :class="discreet" :disabled="isSaving" @click="emit('remove')">
              {{ t('profile.remove') }}
            </button>
          </div>
        </div>
      </div>

      <dl class="flex gap-6 sm:pt-3">
        <div v-for="stat in figures" :key="stat.label" class="flex flex-col-reverse">
          <dt class="text-xs text-zinc-500">{{ stat.label }}</dt>
          <dd class="text-xl font-semibold text-white tabular-nums">{{ stat.value }}</dd>
        </div>
      </dl>
    </div>

    <div class="mt-4 flex flex-col gap-2 px-2 sm:px-6">
      <p v-if="profile.bio" class="max-w-prose text-sm text-zinc-300">{{ profile.bio }}</p>
      <p class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
        <span v-if="profile.location" class="flex items-center gap-1.5">
          <MapPin class="h-3.5 w-3.5" aria-hidden="true" />
          {{ profile.location }}
        </span>
        <span class="flex items-center gap-1.5">
          <CalendarDays class="h-3.5 w-3.5" aria-hidden="true" />
          {{ t('profile.memberSince', { date: formatDay(profile.memberSince) }) }}
        </span>
      </p>
    </div>
  </section>
</template>
