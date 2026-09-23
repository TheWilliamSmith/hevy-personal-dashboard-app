<script setup lang="ts">
import { computed, type Component } from 'vue';
import {
  Activity, AlertTriangle, Award, Calendar, CalendarCheck, CalendarDays, CheckCircle, Clock,
  Compass, Copy, Crown, Dumbbell, Flag, Flame, Footprints, Gauge, Gift, Grid, Heart, Hourglass,
  Landmark, Layers, Lock, Map, Medal, Moon, MoveVertical, PartyPopper, Plane, Repeat, RotateCcw,
  Ship, Shuffle, Sparkles, Sunrise, Swords, Target, TrendingUp, Truck, Waves, Weight, Zap,
} from 'lucide-vue-next';

const ICONS: Readonly<Record<string, Component>> = {
  activity: Activity, 'alert-triangle': AlertTriangle, calendar: Calendar,
  'calendar-check': CalendarCheck, 'calendar-days': CalendarDays, 'check-circle': CheckCircle,
  clock: Clock, compass: Compass, copy: Copy, crown: Crown, dumbbell: Dumbbell, flag: Flag,
  flame: Flame, footprints: Footprints, gauge: Gauge, gift: Gift, grid: Grid, heart: Heart,
  hourglass: Hourglass, landmark: Landmark, layers: Layers, lock: Lock, map: Map, medal: Medal,
  moon: Moon, 'move-vertical': MoveVertical, 'party-popper': PartyPopper, plane: Plane,
  repeat: Repeat, 'rotate-ccw': RotateCcw, ship: Ship, shuffle: Shuffle, sparkles: Sparkles,
  sunrise: Sunrise, swords: Swords, target: Target, 'trending-up': TrendingUp, truck: Truck,
  waves: Waves, weight: Weight, zap: Zap,
};

const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 24 });

const icon = computed<Component>(() => ICONS[props.name] ?? Award);
</script>

<template>
  <component :is="icon" :size="props.size" :stroke-width="1.75" aria-hidden="true" />
</template>
