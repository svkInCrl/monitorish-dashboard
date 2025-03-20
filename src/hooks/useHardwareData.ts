
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { HardwareDevice, HardwareUpdate } from "@/types/hardware";
import { toast } from "@/hooks/use-toast";

const fetchHardwareInfo = async (): Promise<HardwareDevice[]> => {
  const response = await fetch("http://127.0.0.1:8000/hardware-info/");
  if (!response.ok) {
    throw new Error("Failed to fetch hardware information");
  }
  return response.json();
};

export function useHardwareInfo() {
  return useQuery({
    queryKey: ["hardwareInfo"],
    queryFn: fetchHardwareInfo,
  });
}

export function useHardwareUpdates() {
  const [updates, setUpdates] = useState<HardwareUpdate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource("http://127.0.0.1:8000/sse_stream_hardware/");
    
    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setUpdates((prev) => {
          // Keep the list at a reasonable size by removing older updates
          const newUpdates = [data, ...prev];
          
          // Show notification for hardware changes
          toast({
            title: `Hardware ${data.HW_Status === "Connected" ? "Connected" : "Disconnected"}`,
            description: `${data.HW_Description} (ID: ${data.HW_ID})`,
            variant: data.HW_Status === "Connected" ? "default" : "destructive",
          });
          
          return newUpdates.slice(0, 20); // Keep only the 20 most recent updates
        });
      } catch (err) {
        console.error("Error parsing SSE data:", err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      setError("Connection to hardware updates stream failed");
      eventSource.close();
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, []);

  return { updates, error, isConnected };
}
