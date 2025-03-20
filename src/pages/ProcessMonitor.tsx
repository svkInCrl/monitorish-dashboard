
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Circle, RefreshCw, X, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProcessCount, useProcessInfo } from "@/hooks/useProcessData";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

  // Sample data for the active processes over time
  const processData = [
    { time: '00:00', count: 124 },
    { time: '01:00', count: 135 },
    { time: '02:00', count: 127 },
    { time: '03:00', count: 146 },
    { time: '04:00', count: 138 },
    { time: '05:00', count: 151 },
    { time: '06:00', count: processCount?.process_count || 155 },
  ];

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
          <CardTitle>System Process Overview</CardTitle>
          <CardDescription>Active process count over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={processData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                  name="Process Count"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
