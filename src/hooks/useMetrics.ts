
import { useQuery } from "@tanstack/react-query";

export interface SystemMetrics {
  "CPU Usage (%)": number;
  "GPU Usage (%)": number;
  "RAM Usage (%)": number;
  "Disk Usage (%)": number;
  "KB/s Sent": number;
  "KB/s Received": number;
}

const fetchMetrics = async (): Promise<SystemMetrics> => {
  const response = await fetch("http://127.0.0.1:8000/metrics/", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
});
  if (!response.ok) {
    throw new Error("Failed to fetch system metrics");
  }
  // console.log(response.json());
  
  return response.json();
};

export function useMetrics() {
  return useQuery({
    queryKey: ["systemMetrics"],
    queryFn: fetchMetrics,
    refetchInterval: 1000, // Poll every 5 seconds for real-time data
  });
}
