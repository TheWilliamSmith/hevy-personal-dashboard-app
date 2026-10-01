<script setup lang="ts">
import { t } from '@/i18n';
import { Eye, EyeOff } from 'lucide-vue-next';
import { computed, ref } from 'vue';

const props = withDefaults(
  defineProps<{
    id: string;
    label: string;
    type?: 'text' | 'email' | 'password';
    autocomplete: string;
    error?: string | null;
    hint?: string;
    prefix?: string;
    maxlength?: number;
  }>(),
  { type: 'text', error: null, hint: undefined, prefix: undefined, maxlength: undefined },
);

const model = defineModel<string>({ required: true });

const emit = defineEmits<{ blur: [] }>();

const revealed = ref(false);
const inputType = computed(() => (props.type === 'password' && revealed.value ? 'text' : props.type));
const describedBy = computed(() => (props.error || props.hint ? `${props.id}-help` : undefined));
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex items-baseline justify-between gap-3">
      <label :for="id" class="text-xs text-zinc-400">{{ label }}</label>
      <slot name="aside" />
    </div>
    <div class="relative">
      <span
        v-if="prefix"
        class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-zinc-500"
        aria-hidden="true"
      >{{ prefix }}</span>
      <input
        :id="id"
        v-model="model"
        :type="inputType"
        :autocomplete="autocomplete"
        :maxlength="maxlength"
        :autocapitalize="prefix ? 'off' : undefined"
        spellcheck="false"
        :aria-invalid="Boolean(error)"
        :aria-describedby="describedBy"
        class="w-full rounded-md border bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        :class="[error ? 'border-red-500/60' : 'border-zinc-700', type === 'password' ? 'pr-10' : '', prefix ? 'pl-7' : '']"
        @blur="emit('blur')"
      />
      <button
        v-if="type === 'password'"
        type="button"
        class="absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-1 text-zinc-500 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-zinc-400"
        :aria-label="revealed ? t('auth.hidePassword') : t('auth.showPassword')"
        :aria-pressed="revealed"
        @click="revealed = !revealed"
      >
        <component :is="revealed ? EyeOff : Eye" class="h-4 w-4" />
      </button>
    </div>
    <slot />
    <p v-if="error || hint" :id="`${id}-help`" class="text-xs" :class="error ? 'text-red-400' : 'text-zinc-500'">
      {{ error ?? hint }}
    </p>
  </div>
</template>
