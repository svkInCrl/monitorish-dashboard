import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CpuIcon, HardDrive, Server, Network } from "lucide-react";
import { useMetrics } from "@/hooks/useMetrics";
import { useSystemDetails } from "@/hooks/useSystemDetails";

// Sample data for charts (we'll keep this for historical charts)
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
  const { data: metrics, isLoading: isLoadingMetrics, error: metricsError } = useMetrics();
  const { data: systemDetails, isLoading: isLoadingDetails } = useSystemDetails();
  
  // Get the first system details object if available
  const systemInfo = systemDetails && systemDetails.length > 0 ? systemDetails[0] : null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Monitor</h2>
        <p className="text-muted-foreground">
          Monitor system resources and performance
        </p>
      </div>

      {metricsError && (
        <div className="p-4 text-red-500 bg-red-50 rounded-md">
          Error loading metrics: {metricsError instanceof Error ? metricsError.message : 'Unknown error'}
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
                CPU and memory usage over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={performanceData}
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
                    />
                    <Line
                      type="monotone"
                      dataKey="cpu"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="memory"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
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
                  Read/write operations over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={performanceData}
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
                      />
                      <Line
                        type="monotone"
                        dataKey="disk"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
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
                Network throughput over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={performanceData}
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
                    />
                    <Line
                      type="monotone"
                      dataKey="network"
                      stroke="#10B981"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
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
