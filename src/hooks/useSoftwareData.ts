

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
    throw new Error("Failed to fetch software info");
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

// Pagination helper hook to handle paginated software data
export function usePaginatedSoftwareInfo(pageSize = 5) {
  const { data: rawData, isLoading, error } = useSoftwareInfo();
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedData, setPaginatedData] = useState<SoftwareInfo[]>([]);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (rawData) {
      setTotalPages(Math.ceil(rawData.length / pageSize));
      
      // Ensure current page is valid
      const validCurrentPage = Math.min(currentPage, Math.ceil(rawData.length / pageSize));
      
      // Calculate page slice
      const startIndex = (validCurrentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      setPaginatedData(rawData.slice(startIndex, endIndex));
    }
  }, [rawData, currentPage, pageSize]);

  // Page navigation functions
  const goToPage = (page: number) => {
    const targetPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(targetPage);
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);
  const firstPage = () => goToPage(1);
  const lastPage = () => goToPage(totalPages);

  return {
    data: paginatedData,
    rawData, // Expose the full dataset for global search
    isLoading,
    error,
    pagination: {
      currentPage,
      totalPages,
      goToPage,
      nextPage,
      prevPage,
      firstPage,
      lastPage
    }
  };
}
