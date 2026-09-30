'use client';

import { create } from 'zustand';

export interface TelemetryAlert {
  id: string;
  nodeName: string;
  severity: 'critical' | 'warning' | 'info';
  metric: string;
  value: string;
  threshold: string;
  timestamp: string;
}

interface LiveMonitoringStore {
  isMonitoringActive: boolean;
  provider: 'datadog' | 'prometheus' | 'grafana' | 'cloudwatch';
  refreshRateSeconds: number;
  alerts: TelemetryAlert[];
  metricsOverview: {
    globalLatency: number;
    errorRate: number;
    totalRps: number;
    activeIncidents: number;
  };
  toggleMonitoring: () => void;
  setProvider: (provider: 'datadog' | 'prometheus' | 'grafana' | 'cloudwatch') => void;
  dismissAlert: (alertId: string) => void;
  addAlert: (alert: TelemetryAlert) => void;
}

export const useLiveMonitoringStore = create<LiveMonitoringStore>((set) => ({
  isMonitoringActive: false,
  provider: 'datadog',
  refreshRateSeconds: 5,
  alerts: [],
  metricsOverview: {
    globalLatency: 0,
    errorRate: 0,
    totalRps: 0,
    activeIncidents: 0,
  },

  toggleMonitoring: () =>
    set((state) => ({ isMonitoringActive: !state.isMonitoringActive })),

  setProvider: (provider) => set({ provider }),

  dismissAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== alertId),
      metricsOverview: {
        ...state.metricsOverview,
        activeIncidents: Math.max(0, state.metricsOverview.activeIncidents - 1),
      },
    })),

  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts],
      metricsOverview: {
        ...state.metricsOverview,
        activeIncidents: state.metricsOverview.activeIncidents + 1,
      },
    })),
}));
