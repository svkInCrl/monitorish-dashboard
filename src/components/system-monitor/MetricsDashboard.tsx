
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
        value={metrics?.["cpu_usage"] ?? 0}
        icon={CpuIcon}
        progress={metrics?.['cpu_usage']}
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
        value={metrics?.["ram_usage"] ?? 0}
        icon={Server}
        progress={metrics?.["ram_usage"]}
        subtitle={
          systemDetails ? `${systemDetails.ram_size.toFixed(1)} GB RAM` : "Memory"
        }
        loading={isLoading}
      />
      <MetricCard
        title="Disk Usage"
        value={metrics?.["disk_usage"] ?? 0}
        icon={HardDrive}
        progress={metrics?.["disk_usage"]}
        subtitle="Storage"
        loading={isLoading}
      />
      <MetricCard
        title="Network"
        value={
          isLoading
            ? "0"
            : `↑ ${metrics?.["kb_sent"].toFixed(2)} KB/s\n↓ ${metrics?.[
                "kb_sent"
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
