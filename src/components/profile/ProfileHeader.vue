<script setup lang="ts">
import { CalendarDays, MapPin } from 'lucide-vue-next';
import { computed, type DeepReadonly } from 'vue';

import type { ProfileStats } from '@/composables/useProfile';
import type { UserProfile } from '@/types/profile';
import { formatDay, formatInteger } from '@/utils/format';

import ProfileAvatar from './ProfileAvatar.vue';

const props = defineProps<{ profile: DeepReadonly<UserProfile>; stats: ProfileStats }>();

const figures = computed(() => [
  { label: 'Workouts', value: formatInteger(props.stats.workouts) },
  { label: 'Level', value: formatInteger(props.stats.level) },
  { label: 'Trophies', value: formatInteger(props.stats.trophies) },
  { label: 'Streak', value: `${props.stats.streakWeeks} wk` },
]);
</script>

<template>
  <section class="flex flex-col">
    <div class="h-32 rounded-lg bg-gradient-to-br from-blue-900/60 via-zinc-900 to-zinc-950 sm:h-40" aria-hidden="true" />

    <div class="flex flex-col gap-4 px-2 sm:flex-row sm:items-start sm:justify-between sm:px-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
        <ProfileAvatar
          :name="profile.displayName"
          :url="profile.avatarUrl"
          size="lg"
          class="-mt-12 ring-4 ring-zinc-950"
        />
        <div class="min-w-0 sm:pt-3">
          <h2 class="truncate text-2xl font-semibold tracking-tight text-white">{{ profile.displayName }}</h2>
          <p class="text-sm text-zinc-400">@{{ profile.username }}</p>
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
          Member since {{ formatDay(profile.memberSince) }}
        </span>
      </p>
    </div>
  </section>
</template>
