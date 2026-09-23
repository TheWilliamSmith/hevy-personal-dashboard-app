<script setup lang="ts">
/**
 * BodyHeatmap — front/back anatomical figure colored by training volume.
 *
 * Self-contained: no chart library, no external assets. The SVG geometry is
 * hand-authored and mirror-symmetric (one half per muscle, mirrored with a
 * transform), so a muscle group is a single interactive region.
 *
 * Muscle groups that have no anatomical region (CARDIO, FULL_BODY) are rendered
 * as chips below the figure instead of being silently dropped.
 */
import { computed, ref } from 'vue'

type MuscleGroup =
  | 'CHEST' | 'BACK' | 'TRAPS' | 'SHOULDERS' | 'BICEPS' | 'TRICEPS'
  | 'FOREARMS' | 'QUADS' | 'HAMSTRINGS' | 'GLUTES' | 'ADDUCTORS'
  | 'CALVES' | 'ABS' | 'CARDIO' | 'FULL_BODY'

const props = withDefaults(defineProps<{
  /** Metric value per muscle group (sets, volume in kg, reps — your call). */
  values: Partial<Record<MuscleGroup, number>>
  /** Shown in the tooltip after the value, e.g. "sets" or "kg". */
  unit?: string
  /** Which figure(s) to render. */
  view?: 'both' | 'front' | 'back'
  /** Number of color steps. */
  levels?: number
  /** Optional custom value formatter (defaults to fr-FR grouping). */
  format?: (value: number) => string
  /**
   * Externally driven highlight, e.g. the row the reader is hovering in a
   * ranked list beside the figure. Internal pointer hover takes precedence, so
   * the figure still behaves on its own when this is not passed.
   */
  highlight?: MuscleGroup | null
}>(), {
  unit: 'sets',
  view: 'both',
  levels: 5,
})

const emit = defineEmits<{ select: [group: MuscleGroup] }>()

const LABELS: Record<MuscleGroup, string> = {
  CHEST: 'Chest', BACK: 'Back', TRAPS: 'Traps', SHOULDERS: 'Shoulders',
  BICEPS: 'Biceps', TRICEPS: 'Triceps', FOREARMS: 'Forearms', QUADS: 'Quads',
  HAMSTRINGS: 'Hamstrings', GLUTES: 'Glutes', ADDUCTORS: 'Adductors',
  CALVES: 'Calves', ABS: 'Abs', CARDIO: 'Cardio', FULL_BODY: 'Full body',
}

const UNMAPPED: MuscleGroup[] = ['CARDIO', 'FULL_BODY']

/** d = half-shape drawn on the left side; mirror = also draw it flipped. */
type Region = { group: MuscleGroup; d: string; mirror?: boolean }

const FRONT: Region[] = [
  { group: 'TRAPS', mirror: true, d: 'M112 64 C106 69 98 74 88 79 C96 83 106 85 112 82 Z' },
  { group: 'SHOULDERS', mirror: true, d: 'M80 80 C68 84 59 93 58 106 C61 119 70 123 78 118 C81 105 82 90 80 80 Z' },
  { group: 'CHEST', mirror: true, d: 'M116 88 C104 85 90 90 82 101 C81 113 85 127 93 133 C104 135 113 131 116 124 Z' },
  { group: 'BICEPS', mirror: true, d: 'M74 110 C66 113 60 121 58 133 C56 149 57 161 61 168 C67 168 70 160 71 148 C72 134 74 121 74 110 Z' },
  { group: 'FOREARMS', mirror: true, d: 'M60 172 C54 180 50 196 47 212 C45 224 44 232 44 238 C50 240 55 235 57 227 C60 210 63 190 64 176 Z' },
  { group: 'ABS', d: 'M101 136 C97 152 97 174 100 191 C105 201 116 205 120 205 C124 205 135 201 140 191 C143 174 143 152 139 136 C131 132 109 132 101 136 Z' },
  { group: 'QUADS', mirror: true, d: 'M88 248 C82 266 82 288 88 304 C94 313 101 312 106 304 C109 287 110 265 108 248 C101 244 93 244 88 248 Z' },
  { group: 'ADDUCTORS', mirror: true, d: 'M112 248 C106 254 103 266 104 280 C108 288 116 288 119 282 C120 268 119 256 118 248 Z' },
  { group: 'CALVES', mirror: true, d: 'M99 328 C95 342 95 360 98 374 C103 378 108 376 110 370 C112 354 112 338 110 328 C106 324 102 324 99 328 Z' },
]

const BACK: Region[] = [
  { group: 'TRAPS', d: 'M120 62 C109 65 96 71 86 81 C97 86 106 94 111 105 L111 126 C115 131 125 131 129 126 L129 105 C134 94 143 86 154 81 C144 71 131 65 120 62 Z' },
  { group: 'SHOULDERS', mirror: true, d: 'M80 80 C68 84 59 93 58 106 C61 119 70 123 78 118 C81 105 82 90 80 80 Z' },
  { group: 'BACK', mirror: true, d: 'M104 106 C92 112 82 124 79 142 C81 160 88 176 97 186 C105 183 111 174 112 162 C113 142 109 122 104 106 Z' },
  { group: 'TRICEPS', mirror: true, d: 'M76 108 C68 112 62 122 60 136 C58 152 60 164 64 170 C70 168 73 158 74 146 C75 132 77 118 76 108 Z' },
  { group: 'FOREARMS', mirror: true, d: 'M60 172 C54 180 50 196 47 212 C45 224 44 232 44 238 C50 240 55 235 57 227 C60 210 63 190 64 176 Z' },
  { group: 'GLUTES', mirror: true, d: 'M90 224 C83 229 81 242 84 254 C89 264 101 268 110 263 C116 256 118 242 116 228 C108 221 96 220 90 224 Z' },
  { group: 'HAMSTRINGS', mirror: true, d: 'M92 262 C86 278 86 296 92 308 C98 316 105 314 109 306 C113 289 113 274 111 262 C104 258 97 258 92 262 Z' },
  { group: 'CALVES', mirror: true, d: 'M96 324 C90 338 90 358 95 372 C101 378 108 376 111 368 C113 352 113 336 110 324 C104 320 100 320 96 324 Z' },
]

const MIRROR = 'translate(240,0) scale(-1,1)'

const max = computed(() => {
  const mapped = Object.entries(props.values)
    .filter(([g]) => !UNMAPPED.includes(g as MuscleGroup))
    .map(([, v]) => v ?? 0)
  return Math.max(0, ...mapped)
})

/** 0 = no data, 1..levels = intensity bucket. */
function levelOf(group: MuscleGroup): number {
  const value = props.values[group] ?? 0
  if (value <= 0 || max.value <= 0) return 0
  return Math.max(1, Math.ceil((value / max.value) * props.levels))
}

const fmt = (v: number) =>
  props.format ? props.format(v) : new Intl.NumberFormat('fr-FR').format(v)

const hovered = ref<MuscleGroup | null>(null)
const pointer = ref({ x: 0, y: 0 })

/** What is outlined: the pointer wins, the external highlight is the fallback. */
const active = computed(() => hovered.value ?? props.highlight ?? null)

function onEnter(group: MuscleGroup, event: PointerEvent) {
  hovered.value = group
  onMove(event)
}
function onMove(event: PointerEvent) {
  const host = (event.currentTarget as SVGElement).ownerSVGElement?.parentElement
  if (!host) return
  const rect = host.getBoundingClientRect()
  pointer.value = { x: event.clientX - rect.left, y: event.clientY - rect.top }
}

const tooltip = computed(() => {
  if (!hovered.value) return null
  const value = props.values[hovered.value] ?? 0
  const share = max.value > 0 ? Math.round((value / max.value) * 100) : 0
  return { label: LABELS[hovered.value], value, share }
})

const unmappedPresent = computed(() =>
  UNMAPPED.filter((g) => (props.values[g] ?? 0) > 0),
)

const legendSteps = computed(() =>
  Array.from({ length: props.levels }, (_, i) => i + 1),
)
const showFront = computed(() => props.view !== 'back')
const showBack = computed(() => props.view !== 'front')
const isEmpty = computed(() => max.value <= 0)
</script>

<template>
  <div class="body-heatmap" @pointerleave="hovered = null">
    <svg
      class="body-heatmap__svg"
      :viewBox="showFront && showBack ? '0 0 500 430' : '0 0 240 430'"
      role="img"
      :aria-label="`Training volume per muscle group, in ${unit}`"
    >
      <defs>
        <g id="bh-limbs">
          <path d="M86 241 C81 259 81 281 86 299 C89 309 92 315 94 322 C93 338 94 354 96 368 C97 380 98 390 99 398 L115 398 C116 388 117 378 117 368 C118 352 118 336 117 322 C118 306 119 292 120 278 C121 262 121 250 120 241 Z" />
          <path d="M98 394 C93 401 84 406 81 411 C82 416 100 417 111 414 C116 410 117 400 116 394 Z" />
          <path d="M76 80 C64 84 58 92 57 102 C55 124 52 146 50 168 C47 192 44 212 42 234 C41 244 42 252 44 258 C48 263 55 263 59 258 C61 250 61 242 60 234 C62 212 66 192 69 168 C71 146 74 126 78 104 Z" />
          <path d="M43 254 C39 262 38 272 41 278 C46 282 54 280 57 274 C59 266 59 258 58 252 Z" />
        </g>
        <g id="bh-body">
          <ellipse cx="120" cy="36" rx="19" ry="23" />
          <path d="M108 52 L108 72 Q120 78 132 72 L132 52 Z" />
          <path d="M108 66 C97 70 84 75 76 83 C71 91 70 99 71 110 C74 124 79 134 82 146 C86 162 88 176 90 190 C88 202 85 212 84 222 C83 233 86 241 92 244 L148 244 C154 241 157 233 156 222 C155 212 152 202 150 190 C152 176 154 162 158 146 C161 134 166 124 169 110 C170 99 169 91 164 83 C156 75 143 70 132 66 Z" />
          <use href="#bh-limbs" />
          <use href="#bh-limbs" :transform="MIRROR" />
        </g>
      </defs>

      <!-- FRONT -->
      <g v-if="showFront">
        <use href="#bh-body" class="body-heatmap__base" />
        <g
          v-for="region in FRONT"
          :key="`f-${region.group}-${region.d.length}`"
          class="body-heatmap__muscle"
          :data-level="levelOf(region.group)"
          :class="{ 'is-active': active === region.group }"
          tabindex="0"
          role="button"
          :aria-label="`${LABELS[region.group]}: ${fmt(values[region.group] ?? 0)} ${unit}`"
          @pointerenter="onEnter(region.group, $event)"
          @pointermove="onMove"
          @focus="hovered = region.group"
          @blur="hovered = null"
          @click="emit('select', region.group)"
          @keydown.enter.prevent="emit('select', region.group)"
        >
          <path :d="region.d" />
          <path v-if="region.mirror" :d="region.d" :transform="MIRROR" />
        </g>
        <text x="120" y="426" class="body-heatmap__caption">Front</text>
      </g>

      <!-- BACK -->
      <g v-if="showBack" :transform="showFront ? 'translate(260,0)' : undefined">
        <use href="#bh-body" class="body-heatmap__base" />
        <g
          v-for="region in BACK"
          :key="`b-${region.group}-${region.d.length}`"
          class="body-heatmap__muscle"
          :data-level="levelOf(region.group)"
          :class="{ 'is-active': active === region.group }"
          tabindex="0"
          role="button"
          :aria-label="`${LABELS[region.group]}: ${fmt(values[region.group] ?? 0)} ${unit}`"
          @pointerenter="onEnter(region.group, $event)"
          @pointermove="onMove"
          @focus="hovered = region.group"
          @blur="hovered = null"
          @click="emit('select', region.group)"
          @keydown.enter.prevent="emit('select', region.group)"
        >
          <path :d="region.d" />
          <path v-if="region.mirror" :d="region.d" :transform="MIRROR" />
        </g>
        <text x="120" y="426" class="body-heatmap__caption">Back</text>
      </g>
    </svg>

    <!-- Tooltip -->
    <div
      v-if="tooltip"
      class="body-heatmap__tooltip"
      :style="{ left: `${pointer.x}px`, top: `${pointer.y}px` }"
      role="status"
    >
      <strong>{{ tooltip.label }}</strong>
      <span>{{ fmt(tooltip.value) }} {{ unit }}</span>
      <span class="body-heatmap__share">{{ tooltip.share }}% of top muscle</span>
    </div>

    <!-- Footer: legend + unmapped groups -->
    <div class="body-heatmap__footer">
      <div class="body-heatmap__legend" aria-hidden="true">
        <span>Less</span>
        <i data-level="0" />
        <i v-for="step in legendSteps" :key="step" :data-level="step" />
        <span>More</span>
      </div>

      <div v-if="unmappedPresent.length" class="body-heatmap__chips">
        <button
          v-for="group in unmappedPresent"
          :key="group"
          type="button"
          class="body-heatmap__chip"
          @click="emit('select', group)"
        >
          {{ LABELS[group] }}
          <b>{{ fmt(values[group] ?? 0) }}</b>
        </button>
      </div>
    </div>

    <p v-if="isEmpty" class="body-heatmap__empty">
      No training data in this period.
    </p>
  </div>
</template>

<style scoped>
.body-heatmap {
  --bh-base: #dfe3ea;
  --bh-outline: #aeb6c2;
  --bh-l0: #e8eaef;
  --bh-l1: #c2d4f7;
  --bh-l2: #97b4ee;
  --bh-l3: #6f93e8;
  --bh-l4: #3f63d6;
  --bh-l5: #2440a8;
  --bh-text: #4b5563;
  --bh-tooltip-bg: #111827;
  --bh-tooltip-fg: #f9fafb;
  position: relative;
  width: 100%;
}

@media (prefers-color-scheme: dark) {
  .body-heatmap {
    --bh-base: #2b313b;
    --bh-outline: #3d4653;
    --bh-l0: #262b33;
    --bh-l1: #27395c;
    --bh-l2: #35578c;
    --bh-l3: #3f6dbb;
    --bh-l4: #5a8ae8;
    --bh-l5: #8fb4f5;
    --bh-text: #9ca3af;
    --bh-tooltip-bg: #f9fafb;
    --bh-tooltip-fg: #111827;
  }
}
/* If the app toggles a class instead of relying on the media query, mirror the
   dark block under `:global(.dark) .body-heatmap` too. */

.body-heatmap__svg {
  display: block;
  width: 100%;
  height: auto;
}

.body-heatmap__base {
  fill: var(--bh-base);
  stroke: var(--bh-outline);
  stroke-width: 0.5;
}

.body-heatmap__muscle {
  cursor: pointer;
  outline: none;
  transition: opacity 120ms ease;
}
.body-heatmap__muscle path {
  stroke: var(--bh-outline);
  stroke-width: 0.4;
  transition: fill 200ms ease;
}
.body-heatmap__muscle[data-level='0'] path { fill: var(--bh-l0); }
.body-heatmap__muscle[data-level='1'] path { fill: var(--bh-l1); }
.body-heatmap__muscle[data-level='2'] path { fill: var(--bh-l2); }
.body-heatmap__muscle[data-level='3'] path { fill: var(--bh-l3); }
.body-heatmap__muscle[data-level='4'] path { fill: var(--bh-l4); }
.body-heatmap__muscle[data-level='5'] path { fill: var(--bh-l5); }

.body-heatmap__muscle.is-active path,
.body-heatmap__muscle:focus-visible path {
  stroke: currentColor;
  stroke-width: 1.4;
  paint-order: stroke;
}

.body-heatmap__caption {
  fill: var(--bh-text);
  font-size: 12px;
  text-anchor: middle;
  font-family: inherit;
}

.body-heatmap__tooltip {
  position: absolute;
  z-index: 10;
  transform: translate(-50%, calc(-100% - 12px));
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--bh-tooltip-bg);
  color: var(--bh-tooltip-fg);
  font-size: 12px;
  line-height: 1.35;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 6px 16px rgb(0 0 0 / 0.22);
}
.body-heatmap__share { opacity: 0.7; }

.body-heatmap__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  color: var(--bh-text);
  font-size: 12px;
}

.body-heatmap__legend {
  display: flex;
  align-items: center;
  gap: 4px;
}
.body-heatmap__legend i {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  display: inline-block;
}
.body-heatmap__legend i[data-level='0'] { background: var(--bh-l0); }
.body-heatmap__legend i[data-level='1'] { background: var(--bh-l1); }
.body-heatmap__legend i[data-level='2'] { background: var(--bh-l2); }
.body-heatmap__legend i[data-level='3'] { background: var(--bh-l3); }
.body-heatmap__legend i[data-level='4'] { background: var(--bh-l4); }
.body-heatmap__legend i[data-level='5'] { background: var(--bh-l5); }

.body-heatmap__chips { display: flex; gap: 6px; flex-wrap: wrap; }
.body-heatmap__chip {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 3px 8px;
  border: 1px solid var(--bh-outline);
  border-radius: 999px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.body-heatmap__empty {
  margin: 8px 0 0;
  text-align: center;
  color: var(--bh-text);
  font-size: 13px;
}
</style>
