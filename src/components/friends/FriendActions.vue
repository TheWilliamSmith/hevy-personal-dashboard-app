<script setup lang="ts">
import { Check, Clock, UserPlus, X } from 'lucide-vue-next';
import { computed, ref } from 'vue';

import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import { availableActions, runFriendAction, type FriendAction } from '@/composables/useFriends';
import { useToasts } from '@/composables/useToasts';
import { t } from '@/i18n';
import { ApiError } from '@/lib/api';
import type { UserCard } from '@/types/friends';

const props = withDefaults(defineProps<{ user: UserCard; compact?: boolean }>(), { compact: false });
const emit = defineEmits<{ changed: [user: UserCard] }>();

const { push } = useToasts();
const busy = ref<FriendAction | null>(null);
const confirmingRemove = ref(false);

const actions = computed(() => availableActions(props.user));

const TOASTS: Readonly<Record<FriendAction, string>> = {
  add: 'friends.toasts.sent',
  accept: 'friends.toasts.nowFriends',
  cancel: 'friends.toasts.cancelled',
  decline: 'friends.toasts.declined',
  remove: 'friends.toasts.removed',
};

async function run(action: FriendAction): Promise<void> {
  busy.value = action;
  try {
    const next = await runFriendAction(props.user, action);
    const key = action === 'add' && next.friendship === 'friends' ? 'friends.toasts.nowFriends' : TOASTS[action];
    push({ tone: 'success', title: t(key, { name: props.user.displayName }) });
    confirmingRemove.value = false;
    emit('changed', next);
  } catch (caught) {
    push({
      tone: 'error',
      title: t('friends.toasts.failed'),
      description: caught instanceof ApiError ? caught.message : undefined,
    });
  } finally {
    busy.value = null;
  }
}

const base =
  'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 disabled:cursor-not-allowed disabled:opacity-50';
const primary = `${base} bg-white text-zinc-900 hover:bg-zinc-200`;
const secondary = `${base} border border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800`;
const quiet = `${base} text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100`;
</script>

<template>
  <div v-if="actions.length > 0" class="flex flex-wrap items-center gap-2">
    <button v-if="actions.includes('add')" type="button" :class="primary" :disabled="busy !== null" @click="run('add')">
      <UserPlus class="h-3.5 w-3.5" aria-hidden="true" />
      {{ t('friends.actions.add') }}
    </button>

    <template v-if="actions.includes('cancel')">
      <span v-if="!compact" class="inline-flex items-center gap-1.5 text-xs text-zinc-500">
        <Clock class="h-3.5 w-3.5" aria-hidden="true" />
        {{ t('friends.actions.sent') }}
      </span>
      <button type="button" :class="quiet" :disabled="busy !== null" @click="run('cancel')">
        {{ t('friends.actions.cancel') }}
      </button>
    </template>

    <template v-if="actions.includes('accept')">
      <button type="button" :class="primary" :disabled="busy !== null" @click="run('accept')">
        <Check class="h-3.5 w-3.5" aria-hidden="true" />
        {{ t('friends.actions.accept') }}
      </button>
      <button type="button" :class="secondary" :disabled="busy !== null" @click="run('decline')">
        <X class="h-3.5 w-3.5" aria-hidden="true" />
        {{ t('friends.actions.decline') }}
      </button>
    </template>

    <template v-if="actions.includes('remove')">
      <span v-if="!compact" class="inline-flex items-center gap-1.5 text-xs text-emerald-400">
        <Check class="h-3.5 w-3.5" aria-hidden="true" />
        {{ t('friends.actions.friends') }}
      </span>
      <button type="button" :class="quiet" :disabled="busy !== null" @click="confirmingRemove = true">
        {{ t('friends.actions.remove') }}
      </button>
    </template>

    <ConfirmDialog
      :open="confirmingRemove"
      :labelled-by="`remove-friend-${user.id}`"
      :title="t('friends.removeTitle', { name: user.displayName })"
      :confirm-label="t('friends.actions.remove')"
      tone="danger"
      :is-busy="busy === 'remove'"
      @cancel="confirmingRemove = false"
      @confirm="run('remove')"
    >
      {{ t('friends.removeBody') }}
    </ConfirmDialog>
  </div>
</template>
