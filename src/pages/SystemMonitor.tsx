import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CpuIcon, HardDrive, Server, Network, AlertTriangle } from "lucide-react";
import { useMetrics, useHistoricalMetrics } from "@/hooks/useMetrics";
import { useSystemDetails } from "@/hooks/useSystemDetails";
import { useState } from "react";
import { TimePeriodSelector, type TimePeriod } from "@/components/TimePeriodSelector";

const performanceData = [
  { name: "00:00", cpu: 45, memory: 60, disk: 30, network: 20 },
  { name: "04:00", cpu: 65, memory: 55, disk: 35, network: 30 },
  { name: "08:00", cpu: 90, memory: 75, disk: 40, network: 60 },
  { name: "12:00", cpu: 80, memory: 80, disk: 45, network: 50 },
  { name: "16:00", cpu: 95, memory: 85, disk: 50, network: 70 },
  { name: "20:00", cpu: 70, memory: 70, disk: 40, network: 40 },
  { name: "24:00", cpu: 40, memory: 65, disk: 35, network: 25 },
];

const diskData = [
  { name: 'System', value: 120 },
  { name: 'Applications', value: 250 },
  { name: 'User Data', value: 180 },
  { name: 'Media', value: 320 },
  { name: 'Other', value: 130 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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
        <div className="p-4 text-red-500 bg-red-50 rounded-md">
          <AlertTriangle className="h-4 w-4 inline mr-2" />
          Error loading metrics: {metricsError instanceof Error ? metricsError.message : 'Unknown error'}
        </div>
      )}

      {historicalError && (
        <div className="p-4 text-amber-500 bg-amber-50 rounded-md">
          <AlertTriangle className="h-4 w-4 inline mr-2" />
          Error loading historical data: {historicalError instanceof Error ? historicalError.message : 'Unknown error'}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <CpuIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <div className="h-6 animate-pulse bg-muted rounded"></div>
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics?.["CPU Usage (%)"].toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {systemInfo ? `${systemInfo.cpu_count} Cores @ ${systemInfo.cpu_freq.toFixed(2)} MHz` : 'CPU'}
                </p>
                <Progress value={metrics?.["CPU Usage (%)"]} className="h-2 mt-2" />
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <div className="h-6 animate-pulse bg-muted rounded"></div>
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics?.["RAM Usage (%)"].toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {systemInfo ? `${systemInfo.ram_size.toFixed(1)} GB RAM` : 'Memory'}
                </p>
                <Progress value={metrics?.["RAM Usage (%)"]} className="h-2 mt-2" />
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <div className="h-6 animate-pulse bg-muted rounded"></div>
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics?.["Disk Usage (%)"].toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Storage
                </p>
                <Progress value={metrics?.["Disk Usage (%)"]} className="h-2 mt-2" />
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Network</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <div className="h-6 animate-pulse bg-muted rounded"></div>
            ) : (
              <>
                <div className="text-lg font-bold">↑ {metrics?.["KB/s Sent"].toFixed(2)} KB/s</div>
                <div className="text-lg font-bold">↓ {metrics?.["KB/s Received"].toFixed(2)} KB/s</div>
                <p className="text-xs text-muted-foreground">
                  {systemInfo ? `${systemInfo.interface_count} Interfaces` : 'Network interfaces'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="processes">Processes</TabsTrigger>
        </TabsList>
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
              <CardDescription>
                CPU and memory usage over {timePeriod === "day" ? "the last 24 hours" : 
                                          timePeriod === "week" ? "the last week" : 
                                          timePeriod === "month" ? "the last month" : "the last year"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {isLoadingHistorical ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{ 
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          border: 'none'
                        }}
                        formatter={(value) => [`${value}%`]}
                      />
                      <Line
                        type="monotone"
                        dataKey="cpu"
                        name="CPU"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="memory"
                        name="Memory"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="storage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Storage Usage</CardTitle>
                <CardDescription>
                  Disk space allocation by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={diskData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {diskData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ 
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          border: 'none'
                        }}
                        formatter={(value) => [`${value} GB`]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Disk Performance</CardTitle>
                <CardDescription>
                  Read/write operations over {timePeriod === "day" ? "the last 24 hours" : 
                                             timePeriod === "week" ? "the last week" : 
                                             timePeriod === "month" ? "the last month" : "the last year"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {isLoadingHistorical ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          contentStyle={{ 
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            border: 'none'
                          }}
                          formatter={(value) => [`${value}%`]}
                        />
                        <Line
                          type="monotone"
                          dataKey="disk"
                          name="Disk"
                          stroke="#F59E0B"
                          strokeWidth={2}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Activity</CardTitle>
              <CardDescription>
                Network throughput over {timePeriod === "day" ? "the last 24 hours" : 
                                          timePeriod === "week" ? "the last week" : 
                                          timePeriod === "month" ? "the last month" : "the last year"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {isLoadingHistorical ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{ 
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          border: 'none'
                        }}
                        formatter={(value) => [`${value}KB/s`]}
                      />
                      <Line
                        type="monotone"
                        dataKey="network"
                        name="Network"
                        stroke="#10B981"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="processes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Processes</CardTitle>
              <CardDescription>
                System processes and resource usage
              </CardDescription>
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
