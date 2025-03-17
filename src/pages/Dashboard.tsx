
import { AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CpuIcon, HardDrive, MonitorIcon, Server, Users } from "lucide-react";

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

const processData = [
  { name: "Chrome", usage: 35 },
  { name: "System", usage: 25 },
  { name: "Node", usage: 20 },
  { name: "VS Code", usage: 15 },
  { name: "Other", usage: 5 },
];

export default function Dashboard() {
  const stats = [
    {
      title: "CPU Usage",
      value: "45%",
      change: "+5%",
      icon: CpuIcon,
      color: "text-blue-500",
    },
    {
      title: "Memory Usage",
      value: "60%",
      change: "-2%",
      icon: Server,
      color: "text-purple-500",
    },
    {
      title: "Storage",
      value: "250GB",
      change: "30% Free",
      icon: HardDrive,
      color: "text-amber-500",
    },
    {
      title: "Active Users",
      value: "12",
      change: "+3",
      icon: Users,
      color: "text-green-500",
    },
  ];

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
                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {stat.change}
                    </span>
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

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Active Processes</CardTitle>
            <CardDescription>
              Current resource usage by process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={processData}
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
                  <Bar
                    dataKey="usage"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
            <CardDescription>
              Real-time system metrics and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={performanceData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
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
                  />
                  <Area
                    type="monotone"
                    dataKey="cpu"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorCpu)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
