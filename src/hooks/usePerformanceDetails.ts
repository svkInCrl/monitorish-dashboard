import { useQuery } from "@tanstack/react-query";

export interface PerformanceDetails {
  timestamp: string;
  cpu_usage: number;
  gpu_usage: number | null;
  ram_usage: number;
  disk_usage: number;
  kb_sent: number;
  kb_received: number;
}

const fetchPerformanceDetails = async (): Promise<PerformanceDetails> => {
  const response = await fetch("http://127.0.0.1:8000/system-info/", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch system metrics");
  }

  return response.json();
};

export function usePerformanceDetails() {
  return useQuery({
    queryKey: ["performanceMetrics"],
    queryFn: fetchPerformanceDetails,
    refetchInterval: 1000, // Polling every second for real-time data
  });
}
