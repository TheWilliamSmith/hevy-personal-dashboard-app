export interface Trend {
  slope: number;
  intercept: number;
  points: number[];
}

export function linearTrend(values: ReadonlyArray<number | null>): Trend | null {
  const samples: Array<{ x: number; y: number }> = [];

  values.forEach((value, index) => {
    if (value !== null && Number.isFinite(value)) {
      samples.push({ x: index, y: value });
    }
  });

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
