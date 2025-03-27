
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Circle, RefreshCw, X, Terminal, CpuIcon, Server, MemoryStickIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProcessCount, useProcessInfo, useProcessResources } from "@/hooks/useProcessData";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMetrics } from "@/hooks/useMetrics";
import { useSystemDetails } from "@/hooks/useSystemDetails";
import { MetricCard } from "@/components/system-monitor/MetricCard";

export default function ProcessMonitor() {
  const { toast } = useToast();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const { 
    data: processCount, 
    isLoading: isLoadingCount,
    refetch: refetchCount 
  } = useProcessCount();
  
  const { 
    data: processes, 
    isLoading: isLoadingProcesses,
    refetch: refetchProcesses 
  } = useProcessInfo();

  const {
    data: processResources,
    isLoading: isLoadingResources,
    refetch: refetchResources
  } = useProcessResources();

  const { data: metrics, isLoading: isLoadingMetrics } = useMetrics();

  const { data: systemDetails, isLoading: isLoadingDetails } = useSystemDetails();

  const systemInfo = systemDetails && systemDetails.length > 0 ? systemDetails[0] : null;

  const handleRefresh = async () => {
    setRefreshTrigger(prev => prev + 1);
    try {
      await Promise.all([refetchCount(), refetchProcesses(), refetchResources()]);
      toast({
        title: "Refreshed",
        description: "Process data has been updated",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh process data",
      });
    }
  };

  // Function to find CPU and RAM usage by PID
  const getResourceUsage = (pid: number) => {
    if (!processResources) return { cpu: null, ram: null };
    const resource = processResources.find(res => res.pid === pid);
    return {
      cpu: resource?.cpu_usage ?? null,
      ram: resource?.ram_usage ?? null
    };
  };

  const handleEndProcess = (pid: number, name: string) => {
    // This would connect to an API endpoint to end the process
    toast({
      description: `Request to end process ${name} (${pid}) sent`,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Process Monitor</h2>
          <p className="text-muted-foreground">
            Monitor and manage running processes
          </p>
        </div>
        <Button 
          className="flex gap-2 items-center" 
          onClick={handleRefresh}
          disabled={isLoadingCount || isLoadingProcesses || isLoadingResources}
        >
          <RefreshCw className={`h-4 w-4 ${(isLoadingCount || isLoadingProcesses || isLoadingResources) ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Total Processes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Activity className="mr-2 h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">
                {isLoadingCount ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  processCount?.process_count || 0
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <MetricCard
          title="CPU Usage"
          value={metrics?.["cpu_usage"] ?? 0}
          icon={CpuIcon}
          progress={metrics?.['cpu_usage']}
          subtitle={
            systemDetails
              ? `${systemInfo.cpu_count} Cores @ ${systemInfo.cpu_freq.toFixed(
                  2
                )} MHz`
              : "CPU"
          }
          loading={isLoadingMetrics}
        />
        <MetricCard
          title="Memory Usage"
          value={metrics?.["ram_usage"] ?? 0}
          icon={Server}
          progress={metrics?.["ram_usage"]}
          subtitle={
            systemDetails ? `${systemInfo.ram_size.toFixed(1)} GB RAM` : "Memory"
          }
          loading={isLoadingMetrics}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Processes</CardTitle>
          <CardDescription>
            Manage and monitor all running processes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingProcesses || isLoadingResources ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin">
                <RefreshCw className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto relative">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Process</TableHead>
                    <TableHead className="text-right">PID</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead className="text-right">PPID</TableHead>
                    <TableHead className="text-right">Connections</TableHead>
                    <TableHead className="text-right">CPU (%)</TableHead>
                    <TableHead className="text-right">RAM (%)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processes && processes.map((process) => {
                    const resources = getResourceUsage(process.pid);
                    return (
                      <TableRow key={process.pid}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <Terminal className="h-4 w-4 text-muted-foreground" />
                          {process.process_name}
                        </TableCell>
                        <TableCell className="text-right">{process.pid}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={process.path}>
                          {process.path}
                        </TableCell>
                        <TableCell className="text-right">{process.ppid}</TableCell>
                        <TableCell className="text-right">{process.active_connections}</TableCell>
                        <TableCell className="text-right">
                          {resources.cpu !== null ? resources.cpu.toFixed(1) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          {resources.ram !== null ? (resources.ram * 100).toFixed(2) : 'N/A'}
                        </TableCell>
                        <TableCell className="flex items-center gap-2">
                          <Circle className="h-3 w-3 fill-green-500 text-green-500" />
                          Running
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleEndProcess(process.pid, process.process_name)}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">End process</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
