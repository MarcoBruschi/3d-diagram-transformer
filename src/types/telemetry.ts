export interface MetricPoint {
  time: string;
  rps: number;
  latency: number;
  errors: number;
  cpu: number;
}

export interface TelemetryHistory {
  nodeId: string;
  points: MetricPoint[];
  avgLatency: number;
  p99Latency: number;
  peakRps: number;
}
