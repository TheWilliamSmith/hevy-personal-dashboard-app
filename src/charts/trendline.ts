/**
 * Ordinary least-squares fit over (index, value) pairs.
 *
 * Indices are used rather than timestamps on purpose: the progression chart's
 * x axis is the ordered list of sessions, so the trend follows session order
 * and is not distorted by long gaps between them.
 */
export interface Trend {
  slope: number;
  intercept: number;
  /** Fitted value at each input index, same length as the input. */
  points: number[];
}

export function linearTrend(values: ReadonlyArray<number | null>): Trend | null {
  const samples: Array<{ x: number; y: number }> = [];

  values.forEach((value, index) => {
    if (value !== null && Number.isFinite(value)) {
      samples.push({ x: index, y: value });
    }
  });

  // Two distinct points are the minimum for a meaningful line.
  if (samples.length < 2) {
    return null;
  }

  const count = samples.length;
  const sumX = samples.reduce((total, sample) => total + sample.x, 0);
  const sumY = samples.reduce((total, sample) => total + sample.y, 0);
  const sumXY = samples.reduce((total, sample) => total + sample.x * sample.y, 0);
  const sumXX = samples.reduce((total, sample) => total + sample.x * sample.x, 0);

  const denominator = count * sumXX - sumX * sumX;
  if (denominator === 0) {
    return null;
  }

  const slope = (count * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / count;

  return {
    slope,
    intercept,
    points: values.map((_, index) => slope * index + intercept),
  };
}
