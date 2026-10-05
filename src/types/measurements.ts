export type MeasurementField = 'weightKg' | 'armCm' | 'waistCm' | 'thighCm' | 'chestCm';

export interface Measurement {
  id: string;
  measuredOn: string;
  weightKg: number | null;
  armCm: number | null;
  waistCm: number | null;
  thighCm: number | null;
  chestCm: number | null;
}

export type MeasurementInput = Partial<Record<MeasurementField, number | null>> & { measuredOn?: string };
