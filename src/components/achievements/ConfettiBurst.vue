<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

/**
 * A one-shot canvas confetti burst, about 1.5 kB — no library. It runs for
 * DURATION_MS then stops its animation frame loop entirely. The parent does
 * not mount it at all under prefers-reduced-motion.
 */
const props = withDefaults(defineProps<{ colors: readonly string[]; count?: number }>(), {
  count: 110,
});

const DURATION_MS = 2400;
const GRAVITY = 0.16;

const canvas = ref<HTMLCanvasElement | null>(null);
let frame = 0;

interface Piece {
  x: number; y: number; vx: number; vy: number;
  size: number; spin: number; angle: number; color: string;
}

onMounted(() => {
  const el = canvas.value;
  const ctx = el?.getContext('2d');
  if (!el || !ctx) return;

  const ratio = window.devicePixelRatio || 1;
  el.width = el.clientWidth * ratio;
  el.height = el.clientHeight * ratio;
  ctx.scale(ratio, ratio);

  const w = el.clientWidth;
  const h = el.clientHeight;
  const pieces: Piece[] = Array.from({ length: props.count }, (_, i) => ({
    x: w / 2,
    y: h * 0.45,
    vx: (Math.random() - 0.5) * 11,
    vy: -Math.random() * 9 - 3,
    size: 5 + Math.random() * 5,
    spin: (Math.random() - 0.5) * 0.3,
    angle: Math.random() * Math.PI,
    color: props.colors[i % props.colors.length] ?? '#6366f1',
  }));

  const start = performance.now();
  const tick = (now: number): void => {
    const elapsed = now - start;
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = Math.max(0, 1 - elapsed / DURATION_MS);
    for (const p of pieces) {
      p.vy += GRAVITY;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.spin;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    if (elapsed < DURATION_MS) {
      frame = requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, w, h);
    }
  };
  frame = requestAnimationFrame(tick);
});

onBeforeUnmount(() => cancelAnimationFrame(frame));
</script>

<template>
  <!-- Decorative only. -->
  <canvas ref="canvas" class="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
</template>
