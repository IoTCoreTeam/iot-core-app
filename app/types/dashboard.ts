export type Status = "good" | "warning" | "critical" | "info";
export type TimeframeKey = "second" | "minute" | "hour" | "day";

export interface StatusRule {
  warnLow?: number;
  warnHigh?: number;
  dangerLow?: number;
  dangerHigh?: number;
}

export interface DashboardMetric {
  key: string;
  title: string;
  subtitle: string;
  value: number;
  unit: string;
  icon: string;
  change: number | null;
  status: Status;
  statusText: string;
  description: string;
  min: number;
  max: number;
  trend: number[];
  rules?: StatusRule;
}

export interface SeriesPoint {
  label: string;
  value: number;
}

export type SeriesCollection = Record<TimeframeKey, SeriesPoint[]>;
