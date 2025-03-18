
import { useQuery } from "@tanstack/react-query";

export interface SystemMetrics {
  "CPU Usage (%)": number;
  "GPU Usage (%)": number;
  "RAM Usage (%)": number;
  "Disk Usage (%)": number;
  "KB/s Sent": number;
  "KB/s Received": number;
  timestamp?: string; // Added for historical data
}

const fetchMetrics = async (): Promise<SystemMetrics> => {
  const response = await fetch("http://127.0.0.1:8000/metrics");
  if (!response.ok) {
    throw new Error("Failed to fetch system metrics");
  }
  return response.json();
};

export const fetchHistoricalMetrics = async (period: string): Promise<SystemMetrics[]> => {
  const response = await fetch(`http://127.0.0.1:8000/system-info?period=${period}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch historical metrics for period: ${period}`);
  }
  return response.json();
};

export function useMetrics() {
  return useQuery({
    queryKey: ["systemMetrics"],
    queryFn: fetchMetrics,
    refetchInterval: 5000, // Poll every 5 seconds for real-time data
  });
}

export function useHistoricalMetrics(period: string) {
  return useQuery({
    queryKey: ["historicalMetrics", period],
    queryFn: () => fetchHistoricalMetrics(period),
    enabled: !!period, // Only fetch if period is provided
  });
}
