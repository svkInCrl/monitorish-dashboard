
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMetrics, useHistoricalMetrics } from "@/hooks/useMetrics";
import { useSystemDetails } from "@/hooks/useSystemDetails";
import { TimePeriodSelector, type TimePeriod } from "@/components/TimePeriodSelector";
import { MetricsDashboard } from "@/components/system-monitor/MetricsDashboard";
import { PerformanceChart } from "@/components/system-monitor/PerformanceChart";
import { DiskStorageChart } from "@/components/system-monitor/DiskStorageChart";
import { DiskPerformanceChart } from "@/components/system-monitor/DiskPerformanceChart";
import { NetworkActivityChart } from "@/components/system-monitor/NetworkActivityChart";
import { ErrorMessage } from "@/components/system-monitor/ErrorMessage";

// Placeholder data for when real data is not available
const performanceData = [
  { name: "00:00", cpu: 45, memory: 60, disk: 30, network: 20 },
  { name: "04:00", cpu: 65, memory: 55, disk: 35, network: 30 },
  { name: "08:00", cpu: 90, memory: 75, disk: 40, network: 60 },
  { name: "12:00", cpu: 80, memory: 80, disk: 45, network: 50 },
  { name: "16:00", cpu: 95, memory: 85, disk: 50, network: 70 },
  { name: "20:00", cpu: 70, memory: 70, disk: 40, network: 40 },
  { name: "24:00", cpu: 40, memory: 65, disk: 35, network: 25 },
];

export default function SystemMonitor() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("day");
  
  const { data: metrics, isLoading: isLoadingMetrics, error: metricsError } = useMetrics();
  const { data: historicalMetrics, isLoading: isLoadingHistorical, error: historicalError } = useHistoricalMetrics(timePeriod);
  const { data: systemDetails, isLoading: isLoadingDetails } = useSystemDetails();
  
  const systemInfo = systemDetails && systemDetails.length > 0 ? systemDetails[0] : null;

  const formatHistoricalData = () => {
    if (!historicalMetrics || historicalMetrics.length === 0) {
      return performanceData;
    }

    return historicalMetrics.map(metric => ({
      name: metric.timestamp ? new Date(metric.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
      cpu: metric["CPU Usage (%)"],
      memory: metric["RAM Usage (%)"],
      disk: metric["Disk Usage (%)"],
      network: (metric["KB/s Sent"] + metric["KB/s Received"]) / 2,
    }));
  };

  const chartData = formatHistoricalData();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Monitor</h2>
          <p className="text-muted-foreground">
            Monitor system resources and performance
          </p>
        </div>
        <TimePeriodSelector 
          value={timePeriod} 
          onChange={setTimePeriod} 
          className="mr-2"
        />
      </div>

      {metricsError && (
        <ErrorMessage 
          message={metricsError instanceof Error ? metricsError.message : 'Unknown error'} 
          variant="error"
        />
      )}

      {historicalError && (
        <ErrorMessage 
          message={historicalError instanceof Error ? historicalError.message : 'Unknown error'} 
          variant="warning"
        />
      )}

      <MetricsDashboard 
        metrics={metrics} 
        systemDetails={systemInfo} 
        isLoading={isLoadingMetrics} 
      />

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="processes">Processes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance" className="space-y-4">
          <PerformanceChart 
            data={chartData} 
            isLoading={isLoadingHistorical} 
            timePeriod={timePeriod} 
          />
        </TabsContent>
        
        <TabsContent value="storage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <DiskStorageChart />
            <DiskPerformanceChart 
              data={chartData} 
              isLoading={isLoadingHistorical} 
              timePeriod={timePeriod} 
            />
          </div>
        </TabsContent>
        
        <TabsContent value="network" className="space-y-4">
          <NetworkActivityChart 
            data={chartData} 
            isLoading={isLoadingHistorical} 
            timePeriod={timePeriod} 
          />
        </TabsContent>
        
        <TabsContent value="processes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Processes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">
                See the Process Monitor for detailed information
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
