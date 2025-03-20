
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Circle, RefreshCw, X, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProcessCount, useProcessInfo } from "@/hooks/useProcessData";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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

  const handleRefresh = async () => {
    setRefreshTrigger(prev => prev + 1);
    try {
      await Promise.all([refetchCount(), refetchProcesses()]);
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
          disabled={isLoadingCount || isLoadingProcesses}
        >
          <RefreshCw className={`h-4 w-4 ${(isLoadingCount || isLoadingProcesses) ? 'animate-spin' : ''}`} />
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">CPU Load</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">45%</div>
              <div className="text-xs text-muted-foreground">4 cores @ 3.2GHz</div>
            </div>
            <Progress value={45} className="h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Memory Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">3.8 GB</div>
              <div className="text-xs text-muted-foreground">of 16 GB (24%)</div>
            </div>
            <Progress value={24} className="h-2" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Processes</CardTitle>
          <CardDescription>
            Manage and monitor all running processes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingProcesses ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin">
                <RefreshCw className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          ) : (
            <div className="relative max-h-[400px] overflow-hidden border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Process</TableHead>
                    <TableHead className="text-right">PID</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead className="text-right">PPID</TableHead>
                    <TableHead className="text-right">Connections</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <div className="overflow-y-auto max-h-[350px]">
                  <TableBody>
                    {processes && processes.map((process) => (
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
                    ))}
                  </TableBody>
                </div>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
