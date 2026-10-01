<script setup lang="ts">
import { Search } from 'lucide-vue-next';
import { computed, onBeforeUnmount, ref } from 'vue';
import { RouterLink } from 'vue-router';

import FriendActions from '@/components/friends/FriendActions.vue';
import UserRow from '@/components/friends/UserRow.vue';
import ProfileAvatar from '@/components/profile/ProfileAvatar.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import SectionError from '@/components/ui/SectionError.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import SegmentedControl, { type SegmentedOption } from '@/components/ui/SegmentedControl.vue';
import { useFriends } from '@/composables/useFriends';
import { t } from '@/i18n';
import { ApiError, apiGet, apiUrl } from '@/lib/api';
import type { LeaderboardEntry, UserCard } from '@/types/friends';
import { formatDay, formatInteger, formatVolume } from '@/utils/format';

type Metric = 'weekVolumeKg' | 'monthWorkouts' | 'trophies';

const MIN_QUERY = 2;
const SEARCH_DELAY_MS = 250;

const friends = useFriends();

const query = ref('');
const results = ref<UserCard[]>([]);
const searched = ref('');
const isSearching = ref(false);
const searchError = ref<string | null>(null);
let timer: ReturnType<typeof setTimeout> | null = null;
let controller: AbortController | null = null;

async function search(term: string): Promise<void> {
  controller?.abort();
  if (term.replace(/^@/, '').length < MIN_QUERY) {
    results.value = [];
    searched.value = '';
    isSearching.value = false;
    return;
  }
  controller = new AbortController();
  isSearching.value = true;
  searchError.value = null;
  try {
    results.value = await apiGet<UserCard[]>('/users/search', { q: term }, controller.signal);
    searched.value = term;
    isSearching.value = false;
  } catch (caught) {
    if (caught instanceof DOMException && caught.name === 'AbortError') {
      return;
    }
    searchError.value = caught instanceof ApiError ? caught.message : t('errors.generic');
    isSearching.value = false;
  }
}

function onInput(): void {
  if (timer) {
    clearTimeout(timer);
  }
  timer = setTimeout(() => void search(query.value.trim()), SEARCH_DELAY_MS);
}

onBeforeUnmount(() => {
  if (timer) {
    clearTimeout(timer);
  }
  controller?.abort();
});

function onChanged(next: UserCard): void {
  results.value = results.value.map((user) => (user.id === next.id ? next : user));
  void friends.load();
}

const metric = ref<Metric>('weekVolumeKg');
const metrics = computed<ReadonlyArray<SegmentedOption<Metric>>>(() => [
  { value: 'weekVolumeKg', label: t('friends.weekVolume'), shortLabel: t('friends.weekVolumeShort') },
  { value: 'monthWorkouts', label: t('friends.monthWorkouts'), shortLabel: t('friends.monthWorkoutsShort') },
  { value: 'trophies', label: t('friends.trophies') },
]);

const ranking = computed(() =>
  [...friends.leaderboard.value].sort(
    (left, right) => right[metric.value] - left[metric.value] || left.user.displayName.localeCompare(right.user.displayName),
  ),
);
const best = computed(() => Math.max(1, ...ranking.value.map((entry) => entry[metric.value])));

function metricValue(entry: LeaderboardEntry): string {
  return metric.value === 'weekVolumeKg' ? formatVolume(entry.weekVolumeKg) : formatInteger(entry[metric.value]);
}

const requestCount = computed(() => (friends.overview.value?.incoming.length ?? 0) + (friends.overview.value?.outgoing.length ?? 0));
const friendCount = computed(() => friends.overview.value?.friends.length ?? 0);

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400';
</script>

<template>
  <div class="px-4 pb-10 sm:px-6">
    <div class="flex flex-col gap-10 pt-6">
      <SectionError v-if="friends.error.value" :message="friends.error.value" @retry="friends.load" />

      <div class="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-0">
        <section class="flex flex-col gap-4 lg:pr-8">
          <SectionHeader :title="t('friends.find')" :subtitle="t('friends.findSubtitle')" />
          <label for="friends-search" class="sr-only">{{ t('friends.searchLabel') }}</label>
          <div class="relative max-w-xl">
            <Search class="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
            <input
              id="friends-search"
              v-model="query"
              type="search"
              autocomplete="off"
              spellcheck="false"
              :placeholder="t('friends.searchPlaceholder')"
              class="w-full rounded-md border border-zinc-700 bg-zinc-950 py-2 pr-3 pl-8 text-sm text-zinc-100 placeholder:text-zinc-600"
              :class="focus"
              @input="onInput"
            />
          </div>

          <p v-if="searchError" class="text-sm text-red-400" role="alert">{{ searchError }}</p>
          <p v-else-if="query.trim().replace(/^@/, '').length < 2" class="text-xs text-zinc-500">{{ t('friends.searchHint') }}</p>
          <p v-else-if="isSearching && results.length === 0" class="text-sm text-zinc-500" role="status">{{ t('friends.searching') }}</p>
          <p v-else-if="searched && results.length === 0" class="text-sm text-zinc-500" role="status">
            {{ t('friends.noResult', { query: searched }) }}
          </p>
          <ul v-else class="flex flex-col divide-y divide-zinc-800" :aria-busy="isSearching">
            <UserRow v-for="user in results" :key="user.id" :user="user">
              <FriendActions :user="user" @changed="onChanged" />
            </UserRow>
          </ul>
        </section>

        <section class="flex flex-col gap-4 border-zinc-800 lg:border-l lg:pl-8">
          <SectionHeader :title="t('friends.requests')" :subtitle="t('friends.requestsSubtitle')" />
          <div v-if="friends.isLoading.value && !friends.overview.value" class="flex flex-col gap-3" aria-hidden="true">
            <div v-for="row in 2" :key="row" class="h-10 animate-pulse rounded-md bg-zinc-900" />
          </div>
          <p v-else-if="requestCount === 0" class="text-sm text-zinc-500">{{ t('friends.noRequest') }}</p>
          <template v-else>
            <div v-if="friends.overview.value?.incoming.length">
              <h3 class="text-xs font-medium text-zinc-400">{{ t('friends.incoming') }}</h3>
              <ul class="flex flex-col divide-y divide-zinc-800">
                <UserRow
                  v-for="request in friends.overview.value.incoming"
                  :key="request.id"
                  :user="request.user"
                  :detail="formatDay(request.createdAt)"
                >
                  <FriendActions :user="request.user" compact @changed="onChanged" />
                </UserRow>
              </ul>
            </div>
            <div v-if="friends.overview.value?.outgoing.length">
              <h3 class="text-xs font-medium text-zinc-400">{{ t('friends.outgoing') }}</h3>
              <ul class="flex flex-col divide-y divide-zinc-800">
                <UserRow
                  v-for="request in friends.overview.value.outgoing"
                  :key="request.id"
                  :user="request.user"
                  :detail="formatDay(request.createdAt)"
                >
                  <FriendActions :user="request.user" compact @changed="onChanged" />
                </UserRow>
              </ul>
            </div>
          </template>
        </section>
      </div>

      <div class="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-0">
        <section class="flex flex-col gap-4 lg:pr-8">
          <SectionHeader :title="t('friends.leaderboard')" :subtitle="t('friends.leaderboardSubtitle')">
            <SegmentedControl v-model="metric" :options="metrics" :label="t('friends.metric')" />
          </SectionHeader>
          <ol v-if="ranking.length > 0" class="flex flex-col gap-1">
            <li v-for="(entry, index) in ranking" :key="entry.user.id">
              <RouterLink
                :to="{ name: 'home', query: { tab: 'friends', user: entry.user.username } }"
                class="block rounded-md px-2 py-2 transition-colors hover:bg-zinc-900"
                :class="[focus, entry.user.friendship === 'self' ? 'bg-zinc-900/60' : '']"
              >
                <span class="flex items-center gap-3 text-sm">
                  <span class="w-5 text-right text-xs text-zinc-500 tabular-nums">{{ index + 1 }}</span>
                  <ProfileAvatar :name="entry.user.displayName" :url="entry.user.avatarUrl ? apiUrl(entry.user.avatarUrl) : null" />
                  <span class="min-w-0 flex-1 truncate text-zinc-200">
                    {{ entry.user.displayName }}
                    <span v-if="entry.user.friendship === 'self'" class="text-xs text-zinc-500">· {{ t('friends.you') }}</span>
                  </span>
                  <span class="shrink-0 text-zinc-100 tabular-nums">{{ metricValue(entry) }}</span>
                </span>
                <span class="mt-1.5 ml-16 block h-1.5 rounded-full bg-zinc-900">
                  <span
                    class="block h-full rounded-full"
                    :class="entry.user.friendship === 'self' ? 'bg-blue-500' : 'bg-zinc-500'"
                    :style="{ width: `${(entry[metric] / best) * 100}%` }"
                  />
                </span>
              </RouterLink>
            </li>
          </ol>
          <p v-if="!friends.isLoading.value && friendCount === 0" class="text-xs text-zinc-500">{{ t('friends.noFriendsYet') }}</p>
        </section>

        <section class="flex flex-col gap-4 border-zinc-800 lg:border-l lg:pl-8">
          <SectionHeader :title="t('friends.list')" :subtitle="t('friends.listSubtitle', { count: friendCount }, friendCount)" />
          <EmptyState v-if="friends.overview.value && friendCount === 0" :message="t('friends.noFriends')" />
          <ul v-else class="flex flex-col divide-y divide-zinc-800">
            <UserRow
              v-for="friend in friends.overview.value?.friends ?? []"
              :key="friend.user.id"
              :user="friend.user"
              :detail="t('friends.since', { date: formatDay(friend.since) })"
            />
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>
