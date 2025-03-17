
import { useQuery } from "@tanstack/react-query";
import { SystemDetails } from "@/types/system";

const fetchSystemDetails = async (): Promise<SystemDetails[]> => {
  const response = await fetch("http://127.0.0.1:8000/system-details/");
  if (!response.ok) {
    throw new Error("Failed to fetch system details");
  }
  return response.json();
};

export function useSystemDetails() {
  return useQuery({
    queryKey: ["systemDetails"],
    queryFn: fetchSystemDetails,
  });
}
