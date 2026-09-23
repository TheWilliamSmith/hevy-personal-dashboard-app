<script setup lang="ts">
/**
 * BodyHeatmap — front/back anatomical diagram coloured by training load.
 *
 * Self-contained: no chart library, no external assets.
 *
 * The geometry is generated rather than hand-drawn: every outline and region
 * is a list of points smoothed into cubic Béziers (Catmull-Rom). The silhouette
 * and most regions are drawn for the left half and mirrored, so the figure is
 * symmetric by construction and each muscle group stays one interactive region.
 *
 * CARDIO and FULL_BODY have no anatomical region, so they render as chips under
 * the figure instead of being silently dropped.
 */
import { computed, ref } from 'vue'

type MuscleGroup =
  | 'CHEST' | 'BACK' | 'TRAPS' | 'SHOULDERS' | 'BICEPS' | 'TRICEPS'
  | 'FOREARMS' | 'QUADS' | 'HAMSTRINGS' | 'GLUTES' | 'ADDUCTORS'
  | 'CALVES' | 'ABS' | 'CARDIO' | 'FULL_BODY'

type Side = 'front' | 'back'

const props = withDefaults(defineProps<{
  /** Metric value per muscle group (sets, volume in kg, reps). */
  values: Partial<Record<MuscleGroup, number>>
  /** Shown in the tooltip after the value, e.g. "sets" or "kg". */
  unit?: string
  /** Which figure(s) to render. */
  view?: 'both' | 'front' | 'back'
  /** Number of colour steps, 1-6. */
  levels?: number
  /** Optional custom value formatter (defaults to fr-FR grouping). */
  format?: (value: number) => string
  /**
   * Externally driven highlight, e.g. the row hovered in a list beside the
   * figure. Pointer hover on the figure takes precedence.
   */
  highlight?: MuscleGroup | null
}>(), {
  unit: 'sets',
  view: 'both',
  levels: 6,
})

const emit = defineEmits<{ select: [group: MuscleGroup] }>()

const LABELS: Record<MuscleGroup, string> = {
  CHEST: 'Chest', BACK: 'Back', TRAPS: 'Traps', SHOULDERS: 'Shoulders',
  BICEPS: 'Biceps', TRICEPS: 'Triceps', FOREARMS: 'Forearms', QUADS: 'Quads',
  HAMSTRINGS: 'Hamstrings', GLUTES: 'Glutes', ADDUCTORS: 'Adductors',
  CALVES: 'Calves', ABS: 'Abs', CARDIO: 'Cardio', FULL_BODY: 'Full body',
}

const UNMAPPED: MuscleGroup[] = ['CARDIO', 'FULL_BODY']

type Region = { group: MuscleGroup; d: string; mirror?: boolean }

/* One figure is 200 x 450 with its centre line at x=100. */
const MIRROR = 'translate(200,0) scale(-1,1)'

/*
 * Left half of the silhouette, crown to crotch. Left open on purpose: an open
 * path still fills as if closed, but only its drawn edge is stroked, so the
 * centre line where the two mirrored halves meet is never outlined.
 */
const HALF = 'M100.0 10.0 C98.7 10.2 94.2 10.0 92.0 11.0 C89.8 12.0 88.2 13.7 87.0 16.0 C85.8 18.3 85.3 21.8 85.0 25.0 C84.7 28.2 84.7 31.8 85.0 35.0 C85.3 38.2 86.3 41.5 87.0 44.0 C87.7 46.5 88.2 48.2 89.0 50.0 C89.8 51.8 91.7 53.2 92.0 55.0 C92.3 56.8 91.3 59.2 91.0 61.0 C90.7 62.8 90.5 64.2 90.0 66.0 C89.5 67.8 89.7 70.3 88.0 72.0 C86.3 73.7 83.0 74.7 80.0 76.0 C77.0 77.3 73.3 78.7 70.0 80.0 C66.7 81.3 63.2 82.7 60.0 84.0 C56.8 85.3 53.8 86.2 51.0 88.0 C48.2 89.8 45.2 92.2 43.0 95.0 C40.8 97.8 39.0 101.3 38.0 105.0 C37.0 108.7 37.3 113.0 37.0 117.0 C36.7 121.0 36.3 124.8 36.0 129.0 C35.7 133.2 35.5 137.7 35.0 142.0 C34.5 146.3 33.7 151.0 33.0 155.0 C32.3 159.0 31.7 162.5 31.0 166.0 C30.3 169.5 29.7 172.7 29.0 176.0 C28.3 179.3 27.7 182.3 27.0 186.0 C26.3 189.7 25.7 194.0 25.0 198.0 C24.3 202.0 23.7 206.0 23.0 210.0 C22.3 214.0 21.5 218.5 21.0 222.0 C20.5 225.5 20.8 228.3 20.0 231.0 C19.2 233.7 17.3 235.5 16.0 238.0 C14.7 240.5 12.8 243.5 12.0 246.0 C11.2 248.5 10.7 251.3 11.0 253.0 C11.3 254.7 13.0 256.3 14.0 256.0 C15.0 255.7 16.3 250.3 17.0 251.0 C17.7 251.7 17.8 256.7 18.0 260.0 C18.2 263.3 17.8 267.8 18.0 271.0 C18.2 274.2 18.5 277.5 19.0 279.0 C19.5 280.5 20.5 281.2 21.0 280.0 C21.5 278.8 21.7 271.7 22.0 272.0 C22.3 272.3 22.5 279.8 23.0 282.0 C23.5 284.2 24.3 284.8 25.0 285.0 C25.7 285.2 26.7 285.0 27.0 283.0 C27.3 281.0 26.8 273.3 27.0 273.0 C27.2 272.7 27.5 279.5 28.0 281.0 C28.5 282.5 29.5 282.5 30.0 282.0 C30.5 281.5 30.8 280.0 31.0 278.0 C31.2 276.0 30.8 270.3 31.0 270.0 C31.2 269.7 31.5 275.2 32.0 276.0 C32.5 276.8 33.7 276.2 34.0 275.0 C34.3 273.8 34.0 271.3 34.0 269.0 C34.0 266.7 34.0 264.0 34.0 261.0 C34.0 258.0 34.2 254.2 34.0 251.0 C33.8 247.8 33.0 245.2 33.0 242.0 C33.0 238.8 33.3 235.7 34.0 232.0 C34.7 228.3 35.8 224.2 37.0 220.0 C38.2 215.8 39.7 211.2 41.0 207.0 C42.3 202.8 43.8 198.8 45.0 195.0 C46.2 191.2 47.2 187.2 48.0 184.0 C48.8 180.8 49.3 179.2 50.0 176.0 C50.7 172.8 51.2 169.2 52.0 165.0 C52.8 160.8 54.0 155.5 55.0 151.0 C56.0 146.5 57.0 142.2 58.0 138.0 C59.0 133.8 60.2 129.3 61.0 126.0 C61.8 122.7 62.5 119.7 63.0 118.0 C63.5 116.3 63.8 114.3 64.0 116.0 C64.2 117.7 63.8 123.7 64.0 128.0 C64.2 132.3 64.5 137.3 65.0 142.0 C65.5 146.7 66.2 151.3 67.0 156.0 C67.8 160.7 69.0 165.3 70.0 170.0 C71.0 174.7 72.3 179.7 73.0 184.0 C73.7 188.3 74.2 192.0 74.0 196.0 C73.8 200.0 72.8 204.0 72.0 208.0 C71.2 212.0 70.0 215.7 69.0 220.0 C68.0 224.3 66.8 229.0 66.0 234.0 C65.2 239.0 64.3 244.7 64.0 250.0 C63.7 255.3 63.7 260.7 64.0 266.0 C64.3 271.3 65.2 276.7 66.0 282.0 C66.8 287.3 67.8 293.3 69.0 298.0 C70.2 302.7 72.0 306.3 73.0 310.0 C74.0 313.7 74.8 316.5 75.0 320.0 C75.2 323.5 74.5 327.0 74.0 331.0 C73.5 335.0 72.2 339.5 72.0 344.0 C71.8 348.5 72.3 353.3 73.0 358.0 C73.7 362.7 75.0 367.3 76.0 372.0 C77.0 376.7 78.2 381.7 79.0 386.0 C79.8 390.3 81.0 394.3 81.0 398.0 C81.0 401.7 79.7 405.0 79.0 408.0 C78.3 411.0 77.0 413.7 77.0 416.0 C77.0 418.3 77.0 420.7 79.0 422.0 C81.0 423.3 86.2 423.8 89.0 424.0 C91.8 424.2 95.0 424.7 96.0 423.0 C97.0 421.3 95.3 417.5 95.0 414.0 C94.7 410.5 94.3 406.3 94.0 402.0 C93.7 397.7 93.3 392.7 93.0 388.0 C92.7 383.3 92.0 379.0 92.0 374.0 C92.0 369.0 92.7 363.0 93.0 358.0 C93.3 353.0 93.8 348.5 94.0 344.0 C94.2 339.5 94.2 335.2 94.0 331.0 C93.8 326.8 93.0 323.3 93.0 319.0 C93.0 314.7 93.5 310.0 94.0 305.0 C94.5 300.0 95.5 294.7 96.0 289.0 C96.5 283.3 96.7 276.7 97.0 271.0 C97.3 265.3 97.7 259.2 98.0 255.0 C98.3 250.8 98.7 248.0 99.0 246.0 C99.3 244.0 99.8 243.5 100.0 243.0'

const FRONT: Region[] = [
  { group: 'TRAPS', mirror: true, d: 'M90.0 70.0 C89.5 71.2 85.2 73.5 82.0 75.0 C78.8 76.5 71.8 79.3 71.0 79.0 C70.2 78.7 74.7 74.8 77.0 73.0 C79.3 71.2 82.8 68.5 85.0 68.0 C87.2 67.5 90.5 68.8 90.0 70.0 Z' },
  { group: 'SHOULDERS', mirror: true, d: 'M61.0 86.0 C59.2 85.3 54.0 87.3 51.0 89.0 C48.0 90.7 45.2 93.2 43.0 96.0 C40.8 98.8 39.0 102.5 38.0 106.0 C37.0 109.5 36.7 113.7 37.0 117.0 C37.3 120.3 38.3 124.7 40.0 126.0 C41.7 127.3 44.8 126.7 47.0 125.0 C49.2 123.3 51.2 119.5 53.0 116.0 C54.8 112.5 56.5 107.8 58.0 104.0 C59.5 100.2 61.5 96.0 62.0 93.0 C62.5 90.0 62.8 86.7 61.0 86.0 Z' },
  { group: 'CHEST', mirror: true, d: 'M98.0 88.0 C96.0 82.2 90.0 85.7 86.0 86.0 C82.0 86.3 77.3 87.8 74.0 90.0 C70.7 92.2 67.5 95.7 66.0 99.0 C64.5 102.3 64.2 106.8 65.0 110.0 C65.8 113.2 68.2 115.8 71.0 118.0 C73.8 120.2 77.5 122.5 82.0 123.0 C86.5 123.5 95.3 126.8 98.0 121.0 C100.7 115.2 100.0 93.8 98.0 88.0 Z' },
  { group: 'BICEPS', mirror: true, d: 'M58.0 127.0 C58.8 129.0 56.2 134.8 55.0 139.0 C53.8 143.2 52.3 147.8 51.0 152.0 C49.7 156.2 48.2 160.7 47.0 164.0 C45.8 167.3 45.3 171.0 44.0 172.0 C42.7 173.0 40.2 172.3 39.0 170.0 C37.8 167.7 37.0 162.2 37.0 158.0 C37.0 153.8 38.0 149.2 39.0 145.0 C40.0 140.8 41.2 136.0 43.0 133.0 C44.8 130.0 47.5 128.0 50.0 127.0 C52.5 126.0 57.2 125.0 58.0 127.0 Z' },
  { group: 'FOREARMS', mirror: true, d: 'M46.0 190.0 C46.7 192.3 43.3 196.5 42.0 200.0 C40.7 203.5 39.5 207.3 38.0 211.0 C36.5 214.7 34.7 219.0 33.0 222.0 C31.3 225.0 29.5 228.3 28.0 229.0 C26.5 229.7 24.7 228.3 24.0 226.0 C23.3 223.7 23.5 218.8 24.0 215.0 C24.5 211.2 25.8 206.8 27.0 203.0 C28.2 199.2 29.2 194.8 31.0 192.0 C32.8 189.2 35.5 186.3 38.0 186.0 C40.5 185.7 45.3 187.7 46.0 190.0 Z' },
  { group: 'ABS', d: 'M92.0 127.0 C95.0 123.8 105.0 123.8 108.0 127.0 C111.0 130.2 109.7 139.2 110.0 146.0 C110.3 152.8 110.3 160.7 110.0 168.0 C109.7 175.3 109.2 184.0 108.0 190.0 C106.8 196.0 104.8 201.7 103.0 204.0 C101.2 206.3 98.8 206.3 97.0 204.0 C95.2 201.7 93.2 196.0 92.0 190.0 C90.8 184.0 90.3 175.3 90.0 168.0 C89.7 160.7 89.7 152.8 90.0 146.0 C90.3 139.2 89.0 130.2 92.0 127.0 Z' },
  { group: 'QUADS', mirror: true, d: 'M70.0 238.0 C67.2 241.2 67.3 249.7 67.0 256.0 C66.7 262.3 67.2 269.3 68.0 276.0 C68.8 282.7 70.0 290.3 72.0 296.0 C74.0 301.7 77.2 308.3 80.0 310.0 C82.8 311.7 86.7 309.7 89.0 306.0 C91.3 302.3 93.0 294.7 94.0 288.0 C95.0 281.3 95.2 272.7 95.0 266.0 C94.8 259.3 94.8 252.8 93.0 248.0 C91.2 243.2 87.8 238.7 84.0 237.0 C80.2 235.3 72.8 234.8 70.0 238.0 Z' },
  { group: 'ADDUCTORS', mirror: true, d: 'M95.0 246.0 C95.8 242.7 98.3 246.3 99.0 250.0 C99.7 253.7 99.3 262.7 99.0 268.0 C98.7 273.3 97.8 281.7 97.0 282.0 C96.2 282.3 94.3 276.0 94.0 270.0 C93.7 264.0 94.2 249.3 95.0 246.0 Z' },
  { group: 'CALVES', mirror: true, d: 'M77.0 340.0 C75.8 343.3 74.8 350.7 75.0 356.0 C75.2 361.3 76.5 368.7 78.0 372.0 C79.5 375.3 82.5 378.0 84.0 376.0 C85.5 374.0 86.5 365.3 87.0 360.0 C87.5 354.7 87.8 348.0 87.0 344.0 C86.2 340.0 83.7 336.7 82.0 336.0 C80.3 335.3 78.2 336.7 77.0 340.0 Z' },
]

const BACK: Region[] = [
  { group: 'TRAPS', d: 'M100.0 62.0 C96.7 62.0 94.0 66.5 90.0 69.0 C86.0 71.5 80.3 74.5 76.0 77.0 C71.7 79.5 63.3 81.3 64.0 84.0 C64.7 86.7 75.3 88.7 80.0 93.0 C84.7 97.3 89.3 103.2 92.0 110.0 C94.7 116.8 94.7 127.7 96.0 134.0 C97.3 140.3 98.7 148.0 100.0 148.0 C101.3 148.0 102.7 140.3 104.0 134.0 C105.3 127.7 105.3 116.8 108.0 110.0 C110.7 103.2 115.3 97.3 120.0 93.0 C124.7 88.7 135.3 86.7 136.0 84.0 C136.7 81.3 128.3 79.5 124.0 77.0 C119.7 74.5 114.0 71.5 110.0 69.0 C106.0 66.5 103.3 62.0 100.0 62.0 Z' },
  { group: 'SHOULDERS', mirror: true, d: 'M61.0 86.0 C59.2 85.3 54.0 87.3 51.0 89.0 C48.0 90.7 45.2 93.2 43.0 96.0 C40.8 98.8 39.0 102.5 38.0 106.0 C37.0 109.5 36.7 113.7 37.0 117.0 C37.3 120.3 38.3 124.7 40.0 126.0 C41.7 127.3 44.8 126.7 47.0 125.0 C49.2 123.3 51.2 119.5 53.0 116.0 C54.8 112.5 56.5 107.8 58.0 104.0 C59.5 100.2 61.5 96.0 62.0 93.0 C62.5 90.0 62.8 86.7 61.0 86.0 Z' },
  { group: 'BACK', mirror: true, d: 'M94.0 114.0 C91.2 110.0 84.3 111.0 80.0 112.0 C75.7 113.0 70.5 116.0 68.0 120.0 C65.5 124.0 65.2 130.0 65.0 136.0 C64.8 142.0 65.7 149.3 67.0 156.0 C68.3 162.7 70.2 170.3 73.0 176.0 C75.8 181.7 80.5 188.7 84.0 190.0 C87.5 191.3 91.8 189.0 94.0 184.0 C96.2 179.0 96.5 168.0 97.0 160.0 C97.5 152.0 97.5 143.7 97.0 136.0 C96.5 128.3 96.8 118.0 94.0 114.0 Z' },
  { group: 'TRICEPS', mirror: true, d: 'M59.0 125.0 C59.7 127.0 57.2 132.8 56.0 137.0 C54.8 141.2 53.3 145.8 52.0 150.0 C50.7 154.2 49.2 158.7 48.0 162.0 C46.8 165.3 46.3 169.0 45.0 170.0 C43.7 171.0 41.2 170.3 40.0 168.0 C38.8 165.7 38.0 160.3 38.0 156.0 C38.0 151.7 38.8 146.2 40.0 142.0 C41.2 137.8 43.0 133.8 45.0 131.0 C47.0 128.2 49.7 126.0 52.0 125.0 C54.3 124.0 58.3 123.0 59.0 125.0 Z' },
  { group: 'FOREARMS', mirror: true, d: 'M46.0 190.0 C46.7 192.3 43.3 196.5 42.0 200.0 C40.7 203.5 39.5 207.3 38.0 211.0 C36.5 214.7 34.7 219.0 33.0 222.0 C31.3 225.0 29.5 228.3 28.0 229.0 C26.5 229.7 24.7 228.3 24.0 226.0 C23.3 223.7 23.5 218.8 24.0 215.0 C24.5 211.2 25.8 206.8 27.0 203.0 C28.2 199.2 29.2 194.8 31.0 192.0 C32.8 189.2 35.5 186.3 38.0 186.0 C40.5 185.7 45.3 187.7 46.0 190.0 Z' },
  { group: 'GLUTES', mirror: true, d: 'M98.0 213.0 C95.8 206.5 89.2 210.0 85.0 211.0 C80.8 212.0 75.5 215.2 73.0 219.0 C70.5 222.8 70.0 229.2 70.0 234.0 C70.0 238.8 70.5 244.7 73.0 248.0 C75.5 251.3 80.8 253.7 85.0 254.0 C89.2 254.3 95.8 256.8 98.0 250.0 C100.2 243.2 100.2 219.5 98.0 213.0 Z' },
  { group: 'HAMSTRINGS', mirror: true, d: 'M72.0 262.0 C69.3 266.0 69.0 275.3 69.0 282.0 C69.0 288.7 70.2 297.0 72.0 302.0 C73.8 307.0 77.0 311.3 80.0 312.0 C83.0 312.7 87.7 310.3 90.0 306.0 C92.3 301.7 93.2 292.7 94.0 286.0 C94.8 279.3 96.5 270.7 95.0 266.0 C93.5 261.3 88.8 258.7 85.0 258.0 C81.2 257.3 74.7 258.0 72.0 262.0 Z' },
  { group: 'CALVES', mirror: true, d: 'M77.0 338.0 C75.5 341.7 74.0 348.3 74.0 354.0 C74.0 359.7 75.2 368.0 77.0 372.0 C78.8 376.0 82.5 378.7 85.0 378.0 C87.5 377.3 90.7 372.7 92.0 368.0 C93.3 363.3 93.3 355.3 93.0 350.0 C92.7 344.7 91.7 339.0 90.0 336.0 C88.3 333.0 85.2 331.7 83.0 332.0 C80.8 332.3 78.5 334.3 77.0 338.0 Z' },
]

/* Anatomy lines: drawn over the figure, non-interactive, purely descriptive. */
const LINES: Record<Side, { half: string[]; centre: string[] }> = {
  front: {
    half: [
      'M88.0 77.0 C86.7 77.5 83.0 79.2 80.0 80.0 C77.0 80.8 73.0 81.0 70.0 82.0 C67.0 83.0 63.3 85.3 62.0 86.0',
      'M99.0 121.0 C97.5 121.7 93.2 124.7 90.0 125.0 C86.8 125.3 83.3 124.5 80.0 123.0 C76.7 121.5 71.7 117.2 70.0 116.0',
      'M62.0 96.0 C61.7 98.0 60.2 104.3 60.0 108.0 C59.8 111.7 60.8 116.3 61.0 118.0',
      'M75.0 204.0 C76.5 206.8 80.8 215.7 84.0 221.0 C87.2 226.3 92.3 233.5 94.0 236.0',
      'M79.0 317.0 C80.0 318.0 83.0 322.7 85.0 323.0 C87.0 323.3 90.0 319.7 91.0 319.0',
      'M80.0 346.0 C80.3 348.7 81.3 357.0 82.0 362.0 C82.7 367.0 83.7 373.7 84.0 376.0',
    ],
    centre: [
      'M100.0 124.0 C100.0 130.0 100.0 147.7 100.0 160.0 C100.0 172.3 100.0 191.7 100.0 198.0',
      'M91.0 142.0 C92.5 142.3 97.0 144.0 100.0 144.0 C103.0 144.0 107.5 142.3 109.0 142.0',
      'M91.0 158.0 C92.5 158.3 97.0 160.0 100.0 160.0 C103.0 160.0 107.5 158.3 109.0 158.0',
      'M92.0 174.0 C93.3 174.3 97.3 176.0 100.0 176.0 C102.7 176.0 106.7 174.3 108.0 174.0',
    ],
  },
  back: {
    half: [
      'M96.0 92.0 C94.3 92.7 89.0 93.7 86.0 96.0 C83.0 98.3 79.0 101.7 78.0 106.0 C77.0 110.3 77.7 118.3 80.0 122.0 C82.3 125.7 90.0 127.0 92.0 128.0',
      'M67.0 160.0 C68.3 163.3 71.7 174.3 75.0 180.0 C78.3 185.7 85.0 191.7 87.0 194.0',
      'M98.0 250.0 C96.3 250.7 91.7 254.0 88.0 254.0 C84.3 254.0 78.0 250.7 76.0 250.0',
      'M80.0 318.0 C81.0 318.7 84.0 322.0 86.0 322.0 C88.0 322.0 91.0 318.7 92.0 318.0',
      'M80.0 344.0 C80.7 346.7 83.0 354.3 84.0 360.0 C85.0 365.7 85.7 375.0 86.0 378.0',
    ],
    centre: [
      'M100.0 72.0 C100.0 83.3 100.0 117.3 100.0 140.0 C100.0 162.7 100.0 196.7 100.0 208.0',
      'M100.0 214.0 C100.0 218.0 100.0 234.0 100.0 238.0',
    ],
  },
}

const SIDES: Side[] = ['front', 'back']

const max = computed(() => {
  const mapped = Object.entries(props.values)
    .filter(([group]) => !UNMAPPED.includes(group as MuscleGroup))
    .map(([, value]) => value ?? 0)
  return Math.max(0, ...mapped)
})

/** 0 = untrained, 1..levels = intensity bucket. */
function levelOf(group: MuscleGroup): number {
  const value = props.values[group] ?? 0
  if (value <= 0 || max.value <= 0) return 0
  return Math.max(1, Math.ceil((value / max.value) * props.levels))
}

const fmt = (value: number) =>
  props.format ? props.format(value) : new Intl.NumberFormat('fr-FR').format(value)

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
  UNMAPPED.filter((group) => (props.values[group] ?? 0) > 0),
)

const legendSteps = computed(() => Array.from({ length: props.levels }, (_, i) => i + 1))
const visibleSides = computed(() =>
  SIDES.filter((side) => props.view === 'both' || props.view === side),
)
const isEmpty = computed(() => max.value <= 0)

/** The back figure sits to the right of the front one when both are shown. */
function offsetOf(side: Side): string | undefined {
  return side === 'back' && visibleSides.value.length === 2 ? 'translate(240,0)' : undefined
}

function regionsOf(side: Side): Region[] {
  return side === 'front' ? FRONT : BACK
}

function describe(group: MuscleGroup): string {
  return `${LABELS[group]}: ${fmt(props.values[group] ?? 0)} ${props.unit}`
}
</script>

<template>
  <div class="body-heatmap" @pointerleave="hovered = null">
    <svg
      class="body-heatmap__svg"
      :viewBox="visibleSides.length === 2 ? '0 0 440 450' : '0 0 200 450'"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      :aria-label="`Training per muscle group, in ${unit}`"
    >
      <defs>
        <path id="bh-half" :d="HALF" />
      </defs>

      <g v-for="side in visibleSides" :key="side" :transform="offsetOf(side)">
        <use href="#bh-half" class="body-heatmap__base" />
        <use href="#bh-half" class="body-heatmap__base" :transform="MIRROR" />

        <g
          v-for="region in regionsOf(side)"
          :key="`${side}-${region.group}`"
          class="body-heatmap__muscle"
          :data-level="levelOf(region.group)"
          :class="{ 'is-active': active === region.group }"
          tabindex="0"
          role="button"
          :aria-label="describe(region.group)"
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

        <g class="body-heatmap__lines" aria-hidden="true">
          <path v-for="(line, i) in LINES[side].centre" :key="`c${i}`" :d="line" />
          <template v-for="(line, i) in LINES[side].half" :key="`h${i}`">
            <path :d="line" />
            <path :d="line" :transform="MIRROR" />
          </template>
        </g>

        <text x="100" y="446" class="body-heatmap__caption">
          {{ side === 'front' ? 'Front' : 'Back' }}
        </text>
      </g>
    </svg>

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

    <p v-if="isEmpty" class="body-heatmap__empty">No training data in this period.</p>
  </div>
</template>

<style scoped>
/*
 * White diagram, light theme only. The app has no dark mode, and the former
 * prefers-color-scheme block made this one figure invert on dark-OS machines.
 */
.body-heatmap {
  --bh-base: #ffffff;
  --bh-outline: #1e293b;
  --bh-line: #94a3b8;
  --bh-l0: #ffffff;
  /* Very light to very dark blue. */
  --bh-l1: #dbe9fe;
  --bh-l2: #a9caf9;
  --bh-l3: #6da5f0;
  --bh-l4: #3b7ad9;
  --bh-l5: #2052ad;
  --bh-l6: #10306e;
  --bh-text: #475569;
  --bh-tooltip-bg: #0f172a;
  --bh-tooltip-fg: #f8fafc;
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.body-heatmap__svg {
  display: block;
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
}

.body-heatmap__base {
  fill: var(--bh-base);
  stroke: var(--bh-outline);
  stroke-width: 1.1;
  stroke-linejoin: round;
}

.body-heatmap__muscle {
  cursor: pointer;
  outline: none;
}
.body-heatmap__muscle path {
  stroke: var(--bh-outline);
  stroke-width: 0.6;
  stroke-linejoin: round;
  transition: fill 160ms ease;
}
.body-heatmap__muscle[data-level='0'] path { fill: var(--bh-l0); }
.body-heatmap__muscle[data-level='1'] path { fill: var(--bh-l1); }
.body-heatmap__muscle[data-level='2'] path { fill: var(--bh-l2); }
.body-heatmap__muscle[data-level='3'] path { fill: var(--bh-l3); }
.body-heatmap__muscle[data-level='4'] path { fill: var(--bh-l4); }
.body-heatmap__muscle[data-level='5'] path { fill: var(--bh-l5); }
.body-heatmap__muscle[data-level='6'] path { fill: var(--bh-l6); }

.body-heatmap__muscle.is-active path,
.body-heatmap__muscle:focus-visible path {
  stroke: #f59e0b;
  stroke-width: 1.6;
}

.body-heatmap__lines path {
  fill: none;
  stroke: var(--bh-line);
  stroke-width: 0.6;
  stroke-linecap: round;
  pointer-events: none;
}

.body-heatmap__caption {
  fill: var(--bh-text);
  font-size: 11px;
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
  box-shadow: 0 6px 16px rgb(0 0 0 / 0.18);
}
.body-heatmap__share { opacity: 0.7; }

.body-heatmap__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 6px;
  color: var(--bh-text);
  font-size: 12px;
}

.body-heatmap__legend { display: flex; align-items: center; gap: 4px; }
.body-heatmap__legend i {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 1px solid #cbd5e1;
  border-radius: 3px;
}
.body-heatmap__legend i[data-level='0'] { background: var(--bh-l0); }
.body-heatmap__legend i[data-level='1'] { background: var(--bh-l1); }
.body-heatmap__legend i[data-level='2'] { background: var(--bh-l2); }
.body-heatmap__legend i[data-level='3'] { background: var(--bh-l3); }
.body-heatmap__legend i[data-level='4'] { background: var(--bh-l4); }
.body-heatmap__legend i[data-level='5'] { background: var(--bh-l5); }
.body-heatmap__legend i[data-level='6'] { background: var(--bh-l6); }

.body-heatmap__chips { display: flex; flex-wrap: wrap; gap: 6px; }
.body-heatmap__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.body-heatmap__empty {
  margin: 6px 0 0;
  text-align: center;
  color: var(--bh-text);
  font-size: 13px;
}
</style>
