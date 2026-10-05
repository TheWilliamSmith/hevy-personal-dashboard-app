<script setup lang="ts">
import { CalendarDays, ChevronLeft, Eye, EyeOff, Lock, MapPin } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import AchievementIcon from '@/components/achievements/AchievementIcon.vue';
import FriendActions from '@/components/friends/FriendActions.vue';
import ProfileAvatar from '@/components/profile/ProfileAvatar.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import SectionError from '@/components/ui/SectionError.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import SegmentedControl, { type SegmentedOption } from '@/components/ui/SegmentedControl.vue';
import { useAuth } from '@/composables/useAuth';
import { RARITY_STYLES } from '@/constants/achievements';
import { t } from '@/i18n';
import { ApiError, apiGet, apiUrl } from '@/lib/api';
import type { UserCard, UserPage } from '@/types/friends';
import { formatDate, formatDay, formatDuration, formatInteger, formatVolume } from '@/utils/format';

type ViewAs = 'me' | 'friend' | 'stranger';

const route = useRoute();
const router = useRouter();
const auth = useAuth();

const viewAs = computed<ViewAs>(() => (route.query.as === 'friend' || route.query.as === 'stranger' ? route.query.as : 'me'));
const viewOptions = computed<ReadonlyArray<SegmentedOption<ViewAs>>>(() => [
  { value: 'me', label: t('friends.preview.me') },
  { value: 'friend', label: t('friends.preview.friend') },
  { value: 'stranger', label: t('friends.preview.stranger') },
]);

function setViewAs(next: ViewAs): void {
  const { as: _as, ...query } = route.query;
  void router.replace({ name: 'home', query: next === 'me' ? query : { ...query, as: next } });
}

const username = computed(() => (typeof route.query.user === 'string' ? route.query.user.replace(/^@/, '') : ''));

const page = ref<UserPage | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
const notFound = ref(false);

async function load(): Promise<void> {
  if (!username.value) {
    return;
  }
  isLoading.value = true;
  error.value = null;
  notFound.value = false;
  try {
    const isOwn = auth.user.value?.username === username.value;
    page.value = await apiGet<UserPage>(
      `/users/${encodeURIComponent(username.value)}`,
      isOwn && viewAs.value !== 'me' ? { as: viewAs.value } : undefined,
    );
  } catch (error_) {
    page.value = null;
    notFound.value = error_ instanceof ApiError && error_.status === 404;
    error.value = error_ instanceof ApiError ? error_.message : t('errors.generic');
  } finally {
    isLoading.value = false;
  }
}

watch([username, viewAs], load, { immediate: true });

function onChanged(next: UserCard): void {
  if (page.value) {
    page.value = { ...page.value, friendship: next.friendship, requestId: next.requestId };
  }
}

const avatar = computed(() => (page.value?.avatarUrl ? apiUrl(page.value.avatarUrl) : null));

const nothingShown = computed(
  () => page.value !== null && !page.value.isPrivate && page.value.friendship !== 'self' && !page.value.stats && !page.value.recentWorkouts && !page.value.recentTrophies,
);

const figures = computed(() => {
  const stats = page.value?.stats;
  if (!stats) {
    return [];
  }
  return [
    { label: t('friends.page.workouts'), value: formatInteger(stats.workouts) },
    { label: t('friends.page.level'), value: formatInteger(stats.level) },
    { label: t('friends.page.trophies'), value: formatInteger(stats.trophies) },
    { label: t('friends.page.streak'), value: t('friends.page.streakWeeks', { count: stats.streakWeeks }) },
  ];
});
</script>

<template>
  <div class="px-4 pb-10 sm:px-6">
    <div class="flex flex-col gap-10 pt-6">
      <RouterLink
        :to="{ name: 'home', query: { tab: 'friends' } }"
        class="-ml-2 inline-flex w-fit items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
      >
        <ChevronLeft class="h-4 w-4" aria-hidden="true" />
        {{ t('friends.page.back') }}
      </RouterLink>

      <div v-if="isLoading && !page" class="flex flex-col gap-6" aria-busy="true">
        <div class="h-24 w-96 max-w-full animate-pulse rounded-md bg-zinc-900" />
        <div class="h-16 animate-pulse rounded-md bg-zinc-900" />
      </div>

      <EmptyState v-else-if="notFound" :message="t('friends.page.notFound')" />

      <SectionError v-else-if="error" :message="error" @retry="load" />

      <template v-else-if="page">
        <section class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="flex min-w-0 items-start gap-5">
            <ProfileAvatar :name="page.displayName" :url="avatar" size="lg" />
            <div class="min-w-0 pt-2">
              <h2 class="truncate text-2xl font-semibold tracking-tight text-white">{{ page.displayName }}</h2>
              <p class="text-sm text-zinc-400">@{{ page.username }}</p>
              <p v-if="page.bio" class="mt-2 max-w-prose text-sm text-zinc-300">{{ page.bio }}</p>
              <p class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                <span v-if="page.location" class="flex items-center gap-1.5">
                  <MapPin class="h-3.5 w-3.5" aria-hidden="true" />
                  {{ page.location }}
                </span>
                <span v-if="page.memberSince" class="flex items-center gap-1.5">
                  <CalendarDays class="h-3.5 w-3.5" aria-hidden="true" />
                  {{ t('friends.page.memberSince', { date: formatDay(page.memberSince) }) }}
                </span>
              </p>
            </div>
          </div>
          <div class="sm:pt-3">
            <FriendActions :user="page" @changed="onChanged" />
            <p v-if="page.friendship === 'self'" class="text-xs text-zinc-500">{{ t('friends.page.yourPage') }}</p>
          </div>
        </section>

        <section
          v-if="page.friendship === 'self'"
          class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-blue-500/40 bg-blue-500/10 px-4 py-3"
        >
          <Eye class="h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" />
          <p class="min-w-0 flex-1 text-sm text-zinc-200">{{ t(`friends.preview.hint.${viewAs}`) }}</p>
          <SegmentedControl :model-value="viewAs" :options="viewOptions" :label="t('friends.preview.label')" @update:model-value="setViewAs" />
        </section>

        <section v-if="page.isPrivate" class="flex items-start gap-3 rounded-md border border-zinc-800 bg-zinc-900 p-4">
          <Lock class="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" aria-hidden="true" />
          <div>
            <p class="text-sm font-medium text-zinc-100">{{ t('friends.page.privateTitle') }}</p>
            <p class="mt-0.5 text-sm text-zinc-400">{{ t('friends.page.privateHint', { name: page.displayName }) }}</p>
          </div>
        </section>

        <p v-else-if="nothingShown" class="flex items-center gap-2 text-sm text-zinc-400">
          <EyeOff class="h-4 w-4 shrink-0" aria-hidden="true" />
          {{ t('friends.page.nothingShown', { name: page.displayName }) }}
        </p>

        <section v-if="page.stats" class="flex flex-col gap-5">
          <SectionHeader :title="t('friends.page.stats')" :subtitle="t('friends.page.statsSubtitle')" />
          <dl class="grid grid-cols-2 gap-y-6 sm:grid-cols-4">
            <div
              v-for="(stat, index) in figures"
              :key="stat.label"
              class="flex flex-col-reverse border-zinc-800 pr-4"
              :class="index % 2 === 1 ? 'border-l pl-4' : index > 0 ? 'sm:border-l sm:pl-4' : ''"
            >
              <dt class="mt-1 text-xs text-zinc-500">{{ stat.label }}</dt>
              <dd class="text-2xl font-semibold text-white tabular-nums">{{ stat.value }}</dd>
            </div>
          </dl>
        </section>

        <div
          v-if="page.recentWorkouts || page.recentTrophies"
          class="grid grid-cols-[minmax(0,1fr)] gap-8 lg:gap-0"
          :class="page.recentWorkouts && page.recentTrophies ? 'lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]' : ''"
        >
          <section v-if="page.recentWorkouts" class="flex flex-col gap-4" :class="{ 'lg:pr-8': page.recentTrophies }">
            <SectionHeader :title="t('friends.page.latestWorkouts')" :subtitle="t('friends.page.latestWorkoutsSubtitle')" />
            <EmptyState v-if="page.recentWorkouts.length === 0" :message="t('friends.page.noWorkouts')" />
            <ul v-else class="flex flex-col divide-y divide-zinc-800">
              <li v-for="workout in page.recentWorkouts" :key="workout.startedAt" class="flex flex-col gap-0.5 py-3">
                <span class="flex items-baseline justify-between gap-3">
                  <span class="truncate text-sm font-medium text-zinc-100">{{ workout.title }}</span>
                  <time :datetime="workout.startedAt" class="shrink-0 text-xs text-zinc-500">{{ formatDate(workout.startedAt) }}</time>
                </span>
                <span class="text-xs text-zinc-500 tabular-nums">
                  {{
                    t(
                      'friends.page.workoutSummary',
                      {
                        duration: formatDuration(workout.durationSec),
                        count: workout.exerciseCount,
                        volume: formatVolume(workout.totalVolumeKg),
                      },
                      workout.exerciseCount,
                    )
                  }}
                </span>
              </li>
            </ul>
          </section>

          <section v-if="page.recentTrophies" class="flex flex-col gap-4 border-zinc-800" :class="{ 'lg:border-l lg:pl-8': page.recentWorkouts }">
            <SectionHeader :title="t('friends.page.latestTrophies')" :subtitle="t('friends.page.latestTrophiesSubtitle')" />
            <EmptyState v-if="page.recentTrophies.length === 0" :message="t('friends.page.noTrophies')" />
            <ul v-else class="flex flex-col gap-1">
              <li v-for="trophy in page.recentTrophies" :key="trophy.code" class="flex items-center gap-3 py-1.5">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md" :class="RARITY_STYLES[trophy.rarity].badge">
                  <AchievementIcon :name="trophy.icon" :size="18" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-medium text-zinc-100">{{ trophy.name }}</span>
                  <span class="block text-[11px]" :class="RARITY_STYLES[trophy.rarity].text">
                    {{ RARITY_STYLES[trophy.rarity].label }} · {{ trophy.xp }} XP
                  </span>
                </span>
                <span class="shrink-0 text-xs text-zinc-500">{{ formatDay(trophy.unlockedAt) }}</span>
              </li>
            </ul>
          </section>
        </div>
      </template>
    </div>
  </div>
</template>
