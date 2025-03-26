import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { HardwareDevice, HardwareUpdate } from "@/types/hardware";
import { toast } from "@/hooks/use-toast";

export interface SoftwareInfo {
    sw_id: string;                    // Unique identifier of the software
    package_manager: string;          // Package manager used for installation (e.g., dpkg, apt, etc.)
    sw_name: string;                  // Name of the software
    sw_privilege: string;             // Privilege level (e.g., root, user, etc.)
    path: string;                     // Path where the software is installed
    installation_timestamp: string;   // Timestamp of installation in ISO format
    version: string;                  // Software version
    libraries?: string;               // Associated libraries or dependencies (optional if not always provided)
  }
  
  
const fetchSoftwareInfo = async (): Promise<SoftwareInfo[]> => {
  const response = await fetch("http://127.0.0.1:8000/software-info/");
  if (!response.ok) {
    throw new Error("Failed to fetch process info");
  }
  return response.json();
};

export function useSoftwareInfo() {
  return useQuery({
    queryKey: ["softwareInfo"],
    queryFn: fetchSoftwareInfo,
    refetchInterval: 5000, // Poll every 5 seconds for real-time data
  });
}