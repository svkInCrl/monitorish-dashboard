
import { useQuery, useMutation } from "@tanstack/react-query";

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

export interface ProcessResource {
  pid: number;
  cpu_usage: number | null;
  ram_usage: number | null;
  data_sent_mb?: number | null;
  data_received_mb?: number | null;
  timestamp?: string;
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

const fetchProcessResources = async (): Promise<ProcessResource[]> => {
  const response = await fetch("http://127.0.0.1:8000/process_resources/");
  if (!response.ok) {
    throw new Error("Failed to fetch process resources");
  }
  return response.json();
};

const killProcessById = async (pid: number): Promise<{ message: string }> => {
  const response = await fetch(`http://127.0.0.1:8000/kill_process/${pid}`, {
    method: "POST", // Or use "DELETE" for better semantics
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to terminate process");
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

export function useProcessResources() {
  return useQuery({
    queryKey: ["processResources"],
    queryFn: fetchProcessResources,
    refetchInterval: 5000, // Poll every 5 seconds for real-time data
  });
}

export function useKillProcess() {
  return useMutation({
    mutationFn: killProcessById,
  });
}
