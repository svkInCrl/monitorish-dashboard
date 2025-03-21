
import { useQuery } from "@tanstack/react-query";

export interface Process {
  process_name: string;
  path: string;
  pid: number;
  ppid: number;
  active_connections: number;
  open_ports_tcp: string[] | null;
  open_ports_udp: string[] | null;
  communicating_ips: string[] | null;
  first_seen: string;
}

export interface ProcessCount {
  process_count: number;
}

const fetchProcessCount = async (): Promise<ProcessCount> => {
  const response = await fetch("http://127.0.0.1:8000/process-count/");
  if (!response.ok) {
    throw new Error("Failed to fetch process count");
  }
  return response.json();
};

const fetchProcessInfo = async (): Promise<Process[]> => {
  const response = await fetch("http://127.0.0.1:8000/process-info/");
  if (!response.ok) {
    throw new Error("Failed to fetch process info");
  }
  return response.json();
};

export function useProcessCount() {
  return useQuery({
    queryKey: ["processCount"],
    queryFn: fetchProcessCount,
    refetchInterval: 5000, // Poll every 5 seconds for real-time data
  });
}

export function useProcessInfo() {
  return useQuery({
    queryKey: ["processInfo"],
    queryFn: fetchProcessInfo,
    refetchInterval: 5000, // Poll every 5 seconds for real-time data
  });
}
