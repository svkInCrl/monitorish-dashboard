
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Circle, RefreshCw, X, Terminal, CpuIcon, Server, MemoryStickIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProcessCount, useProcessInfo, useProcessResources, useKillProcess } from "@/hooks/useProcessData";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMetrics } from "@/hooks/useMetrics";
import { useSystemDetails } from "@/hooks/useSystemDetails";
import { MetricCard } from "@/components/system-monitor/MetricCard";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function ProcessMonitor() {
  const { toast } = useToast();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [processToKill, setProcessToKill] = useState<{ pid: number; name: string } | null>(null);
  const [killStatus, setKillStatus] = useState<'idle' | 'killing' | 'killed' | 'error'>('idle');
  const [showKillDialog, setShowKillDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
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

  const { mutateAsync: killProcess, isPending: isKillingProcess } = useKillProcess();

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

  const confirmKillProcess = (pid: number, name: string) => {
    setProcessToKill({ pid, name });
    setShowKillDialog(true);
    setKillStatus('idle');
    setErrorMessage(null);
  };

  const handleEndProcess = async () => {
    if (!processToKill) return;
    
    const { pid, name } = processToKill;
    setKillStatus('killing');
    
    try {
      const result = await killProcess(pid);
      setKillStatus('killed');
      toast({
        title: "Process Terminated",
        description: result.message || `Process ${name} (${pid}) has been terminated`,
      });
      
      // Refresh process list after killing
      setTimeout(async () => {
        await handleRefresh();
        setShowKillDialog(false);
        setKillStatus('idle');
        setProcessToKill(null);
      }, 1000);
      
    } catch (error) {
      setKillStatus('error');
      const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
      setErrorMessage(errorMsg);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMsg,
      });
    }
  };

  const closeKillDialog = () => {
    setShowKillDialog(false);
    setKillStatus('idle');
    setProcessToKill(null);
    setErrorMessage(null);
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8"
                              >
                                <X className="h-4 w-4" />
                                <span className="sr-only">End process</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Kill Process</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to terminate the process <span className="font-semibold">{process.process_name}</span> (PID: {process.pid})? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => confirmKillProcess(process.pid, process.process_name)}
                                >
                                  Kill Process
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
      
      {/* Process Kill Status Dialog */}
      <Dialog open={showKillDialog} onOpenChange={closeKillDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {killStatus === 'killing' ? 'Terminating Process...' : 
               killStatus === 'killed' ? 'Process Terminated' : 
               killStatus === 'error' ? 'Error' : 'Process Status'}
            </DialogTitle>
            <DialogDescription>
              {processToKill && (
                <div className="py-4">
                  <div className="flex flex-col gap-2">
                    <div>
                      <span className="font-semibold">Process:</span> {processToKill.name}
                    </div>
                    <div>
                      <span className="font-semibold">PID:</span> {processToKill.pid}
                    </div>
                    <div className="mt-2">
                      <span className="font-semibold">Status:</span>{" "}
                      {killStatus === 'killing' && (
                        <span className="text-yellow-500 flex items-center gap-1">
                          <RefreshCw className="h-4 w-4 animate-spin" /> Terminating...
                        </span>
                      )}
                      {killStatus === 'killed' && (
                        <span className="text-green-500 flex items-center gap-1">
                          <Circle className="h-4 w-4 fill-green-500" /> Terminated
                        </span>
                      )}
                      {killStatus === 'error' && (
                        <span className="text-red-500 flex items-center gap-1">
                          <X className="h-4 w-4" /> Failed to terminate: {errorMessage}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {killStatus === 'idle' && (
              <>
                <Button variant="outline" onClick={closeKillDialog}>Cancel</Button>
                <Button onClick={handleEndProcess}>Terminate</Button>
              </>
            )}
            {(killStatus === 'killed' || killStatus === 'error') && (
              <Button onClick={closeKillDialog}>Close</Button>
            )}
            {killStatus === 'killing' && (
              <Button disabled>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Terminating...
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
