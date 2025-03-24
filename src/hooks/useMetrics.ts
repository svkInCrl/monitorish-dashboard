
import { useQuery } from "@tanstack/react-query";

export interface SystemMetrics {
  timestamp: string;
  cpu_usage: number;
  gpu_usage: number | null;
  ram_usage: number;
  disk_usage: number;
  kb_sent: number;
  kb_received: number;
}

export interface PerformanceDetails {
  timestamp: string;
  cpu_usage: number;
  gpu_usage: number | null;
  ram_usage: number;
  disk_usage: number;
  kb_sent: number;
  kb_received: number;
}


const fetchMetrics = async (): Promise<SystemMetrics> => {
  const response = await fetch("http://127.0.0.1:8000/metrics/");
  if (!response.ok) {
    throw new Error("Failed to fetch system metrics");
    
  }
  // console.log(response.json());
  return response.json();
};

export const fetchHistoricalMetrics = async (period: string): Promise<PerformanceDetails[]> => {
  const response = await fetch(`http://127.0.0.1:8000/system-info/?duration=${period}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch historical metrics for period: ${period}`);
  }
  
  return response.json();
};

export function useMetrics() {
  return useQuery({
    queryKey: ["systemMetrics"],
    queryFn: fetchMetrics,
    refetchInterval: 1000, // Poll every second for real-time data
  });
}

export function useHistoricalMetrics(period: string) {
  return useQuery({
    queryKey: ["performanceDetails", period],
    queryFn: () => fetchHistoricalMetrics(period),
    enabled: !!period, // Only fetch if period is provided
    refetchInterval: period === "live" ? 1000 : false, // Refresh every second if in live mode
  });
}
