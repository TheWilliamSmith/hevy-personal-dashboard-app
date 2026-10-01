<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import ProfileAvatar from '@/components/profile/ProfileAvatar.vue';
import { apiUrl } from '@/lib/api';
import type { UserCard } from '@/types/friends';

const props = defineProps<{ user: UserCard; detail?: string }>();

const avatar = computed(() => (props.user.avatarUrl ? apiUrl(props.user.avatarUrl) : null));
</script>

<template>
  <li class="flex flex-wrap items-center gap-3 py-2.5">
    <RouterLink
      :to="{ name: 'home', query: { tab: 'friends', user: user.username } }"
      class="-mx-2 flex min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-1 transition-colors hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-400"
    >
      <ProfileAvatar :name="user.displayName" :url="avatar" />
      <span class="min-w-0">
        <span class="block truncate text-sm font-medium text-zinc-100">{{ user.displayName }}</span>
        <span class="block truncate text-[11px] text-zinc-500">@{{ user.username }}<template v-if="detail"> · {{ detail }}</template></span>
      </span>
    </RouterLink>
    <slot />
  </li>
</template>
