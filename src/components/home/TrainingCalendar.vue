<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';

import SectionError from '@/components/home/SectionError.vue';
import SectionHeader from '@/components/home/SectionHeader.vue';
import type { CalendarDay } from '@/types/stats';
import { buildCalendarGrid, type CalendarCell } from '@/utils/calendar';
import { formatInteger } from '@/utils/format';

const props = defineProps<{
  weekCount: number;
  days: CalendarDay[] | null;
  isLoading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{ retry: [] }>();

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', ''];

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const grid = computed(() => {
  const byDate = new Map((props.days ?? []).map((day) => [day.date, day.workouts]));
  return buildCalendarGrid(new Date(), props.weekCount, byDate);
});

const workoutCount = computed(() =>
  grid.value.weeks.flat().reduce((total, day) => total + day.workouts, 0),
);

const monthCount = computed(() => Math.round((props.weekCount * 7) / 30));

const scroller = ref<HTMLElement | null>(null);

watch(
  [scroller, () => props.days],
  async () => {
    await nextTick();
    if (scroller.value) {
      scroller.value.scrollLeft = scroller.value.scrollWidth;
    }
  },
  { immediate: true },
);

const columns = computed(() => `2rem repeat(${props.weekCount}, minmax(0.625rem, 1fr))`);

function cellClass(day: CalendarCell): string {
  if (day.isFuture) {
    return 'bg-transparent';
  }
  if (props.isLoading && props.days === null) {
    return 'animate-pulse bg-zinc-800';
  }
  return day.workouts > 0 ? 'bg-blue-800' : 'bg-blue-100';
}

function cellTitle(day: CalendarCell): string | undefined {
  if (day.isFuture) {
    return undefined;
  }
  const date = DATE_FORMATTER.format(new Date(day.date));
  if (day.workouts === 0) {
    return `${date} · rest`;
  }
  return `${date} · ${day.workouts} workout${day.workouts > 1 ? 's' : ''}`;
}
</script>

<template>
  <section class="flex flex-col gap-4">
    <SectionHeader title="Training calendar" subtitle="Days with at least one workout" />

    <SectionError v-if="error" :message="error" @retry="emit('retry')" />

    <div v-else ref="scroller" class="overflow-x-auto">
      <div
        class="grid gap-[3px]"
        :style="{ gridTemplateColumns: columns }"
        role="img"
        :aria-label="`${workoutCount} workouts over the last ${weekCount} weeks`"
      >
        <span />
        <span
          v-for="(_, week) in grid.weeks"
          :key="`month-${week}`"
          class="relative h-4 text-[11px] text-zinc-400"
        >
          <span class="absolute left-0 whitespace-nowrap">
            {{ grid.monthLabels.find((month) => month.week === week)?.label ?? '' }}
          </span>
        </span>

        <template v-for="(label, weekday) in DAY_LABELS" :key="`row-${weekday}`">
          <span class="flex items-center text-[11px] leading-none text-zinc-400">{{ label }}</span>
          <span
            v-for="week in grid.weeks"
            :key="week[weekday]?.date"
            class="aspect-square rounded-[3px]"
            :class="week[weekday] ? cellClass(week[weekday]) : ''"
            :title="week[weekday] ? cellTitle(week[weekday]) : undefined"
          />
        </template>
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3 text-xs">
      <p class="font-medium text-zinc-200">
        {{ formatInteger(workoutCount) }} workouts in the last {{ monthCount }} months
      </p>
      <div class="flex items-center gap-3 text-zinc-400">
        <span class="flex items-center gap-1.5">
          <span class="h-2.5 w-2.5 rounded-[3px] bg-blue-100" aria-hidden="true" />
          Rest
        </span>
        <span class="flex items-center gap-1.5">
          <span class="h-2.5 w-2.5 rounded-[3px] bg-blue-800" aria-hidden="true" />
          Workout
        </span>
      </div>
    </div>
  </section>
</template>
