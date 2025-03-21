
import React from "react";
import { CpuIcon, HardDrive, Server, Network } from "lucide-react";
import { MetricCard } from "./MetricCard";
import { SystemMetrics } from "@/hooks/useMetrics";
import { SystemDetails } from "@/types/system";

interface MetricsDashboardProps {
  metrics: SystemMetrics | undefined;
  systemDetails: SystemDetails | null;
  isLoading: boolean;
}

export function MetricsDashboard({
  metrics,
  systemDetails,
  isLoading,
}: MetricsDashboardProps) {
  
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <MetricCard
        title="CPU Usage"
        value={metrics?.["CPU Usage (%)"] ?? 0}
        icon={CpuIcon}
        progress={metrics?.["CPU Usage (%)"]}
        subtitle={
          systemDetails
            ? `${systemDetails.cpu_count} Cores @ ${systemDetails.cpu_freq.toFixed(
                2
              )} MHz`
            : "CPU"
        }
        loading={isLoading}
      />
      <MetricCard
        title="Memory Usage"
        value={metrics?.["RAM Usage (%)"] ?? 0}
        icon={Server}
        progress={metrics?.["RAM Usage (%)"]}
        subtitle={
          systemDetails ? `${systemDetails.ram_size.toFixed(1)} GB RAM` : "Memory"
        }
        loading={isLoading}
      />
      <MetricCard
        title="Disk Usage"
        value={metrics?.["Disk Usage (%)"] ?? 0}
        icon={HardDrive}
        progress={metrics?.["Disk Usage (%)"]}
        subtitle="Storage"
        loading={isLoading}
      />
      <MetricCard
        title="Network"
        value={
          isLoading
            ? "0"
            : `↑ ${metrics?.["KB/s Sent"].toFixed(2)} KB/s\n↓ ${metrics?.[
                "KB/s Received"
              ].toFixed(2)} KB/s`
        }
        icon={Network}
        subtitle={
          systemDetails
            ? `${systemDetails.interface_count} Interfaces`
            : "Network interfaces"
        }
        loading={isLoading}
      />
    </div>
  );
}
