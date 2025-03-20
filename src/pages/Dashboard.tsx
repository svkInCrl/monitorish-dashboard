
import { useSystemDetails } from "@/hooks/useSystemDetails";
import { AreaChart, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, Bar } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CpuIcon, HardDrive, MonitorIcon, Server, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProcessInfo } from "@/hooks/useProcessData";

// Sample data for charts
const performanceData = [
  { name: "00:00", cpu: 45, memory: 60, disk: 30 },
  { name: "04:00", cpu: 65, memory: 55, disk: 35 },
  { name: "08:00", cpu: 90, memory: 75, disk: 40 },
  { name: "12:00", cpu: 80, memory: 80, disk: 45 },
  { name: "16:00", cpu: 95, memory: 85, disk: 50 },
  { name: "20:00", cpu: 70, memory: 70, disk: 40 },
  { name: "24:00", cpu: 40, memory: 65, disk: 35 },
];

export default function Dashboard() {
  const { data: systemDetails, isLoading, error } = useSystemDetails();
  const { data: processes, isLoading: isLoadingProcesses } = useProcessInfo();
  
  // Use only the first object from the array if available
  const systemInfo = systemDetails?.[0];

  const stats = [
    {
      title: "CPU Cores",
      value: systemInfo ? `${systemInfo.cpu_count}` : "—",
      change: systemInfo ? `${systemInfo.cpu_freq.toFixed(2)} MHz` : "",
      icon: CpuIcon,
      color: "text-blue-500",
    },
    {
      title: "Memory",
      value: systemInfo ? `${systemInfo.ram_size.toFixed(2)} GB` : "—",
      change: systemInfo ? `${systemInfo.virtual_mem_size} GB Virtual` : "",
      icon: Server,
      color: "text-purple-500",
    },
    {
      title: "OS",
      value: systemInfo ? systemInfo.os_type : "—",
      change: systemInfo ? systemInfo.system_arch : "",
      icon: HardDrive,
      color: "text-amber-500",
    },
    {
      title: "Host",
      value: systemInfo ? systemInfo.host_name.split("-")[0] : "—",
      change: systemInfo ? `${systemInfo.interface_count} Interfaces` : "",
      icon: Users,
      color: "text-green-500",
    },
  ];

  // Format process data for the chart
  const processChartData = processes ? 
    processes.slice(0, 5).map(p => ({ name: p.process_name, usage: Math.floor(Math.random() * 30) + 5 })) : 
    [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Monitor your system performance and activity
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={stat.title} className="overflow-hidden">
            <CardContent className="p-6">
              <div
                className="flex items-center justify-between"
                style={{ "--delay": i } as React.CSSProperties}
              >
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <div className="flex items-baseline">
                    {isLoading ? (
                      <Skeleton className="h-6 w-20" />
                    ) : (
                      <>
                        <h3 className="text-2xl font-bold">{stat.value}</h3>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {stat.change}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className={`rounded-full p-2 ${stat.color} bg-primary/10`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Detailed information about your system</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">
              Failed to load system information
            </div>
          ) : systemInfo ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">OS</TableCell>
                  <TableCell>{systemInfo.os_type}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">OS Release</TableCell>
                  <TableCell>{systemInfo.os_release}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">CPU Frequency</TableCell>
                  <TableCell>{systemInfo.cpu_freq.toFixed(2)} MHz</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Architecture</TableCell>
                  <TableCell>{systemInfo.system_arch}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Kernel Version</TableCell>
                  <TableCell>{systemInfo.kernel_version || "N/A"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Last Boot</TableCell>
                  <TableCell>{systemInfo.boot_time ? new Date(systemInfo.boot_time).toLocaleString() : "N/A"}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4">No system information available</div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
            <CardDescription>
              CPU, memory, and disk usage over time
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
                  <Line
                    type="monotone"
                    dataKey="disk"
                    stroke="#F59E0B"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Active Processes</CardTitle>
            <CardDescription>
              Current resource usage by process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoadingProcesses ? (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={processChartData}
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
                    <Bar
                      dataKey="usage"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card> */}

<Card>
          <CardHeader>
            <CardTitle>Active Processes</CardTitle>
            <CardDescription>
              Active processes in real-time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {isLoadingProcesses ? (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={processChartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorProcess" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip
                      contentStyle={{ 
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        border: 'none'
                      }}
                      formatter={(value) => [`${value}%`]}
                    />
                    <Area
                      type="monotone"
                      dataKey="usage"
                      stroke="#3B82F6"
                      fillOpacity={1}
                      fill="url(#colorProcess)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="grid gap-4 grid-cols-1">
        
      </div>
    </div>
  );
}
