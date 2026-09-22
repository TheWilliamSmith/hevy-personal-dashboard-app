/**
 * Granular ECharts registration. Importing from 'echarts' directly would pull
 * the whole bundle (~1 MB); everything below is only what the dashboard draws.
 *
 * Imported by BaseChart.vue, which every card renders through. Keeping it out
 * of main.ts is what keeps ECharts in the lazily-loaded dashboard chunk: the
 * Workouts and Imports routes never download it.
 */
import { BarChart, HeatmapChart, LineChart, PieChart } from 'echarts/charts';
import {
  CalendarComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';

use([
  BarChart,
  LineChart,
  HeatmapChart,
  PieChart,
  CalendarComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer,
]);
