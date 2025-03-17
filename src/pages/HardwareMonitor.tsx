
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { AlertTriangle, CheckCircle, Cpu, Gauge, HardDrive, MonitorIcon, ThermometerSun } from "lucide-react";

// Sample data for charts
const temperatureData = [
  { name: "00:00", cpu: 45, gpu: 50, ssd: 35 },
  { name: "04:00", cpu: 50, gpu: 55, ssd: 36 },
  { name: "08:00", cpu: 65, gpu: 70, ssd: 40 },
  { name: "12:00", cpu: 70, gpu: 75, ssd: 42 },
  { name: "16:00", cpu: 75, gpu: 80, ssd: 45 },
  { name: "20:00", cpu: 60, gpu: 65, ssd: 38 },
  { name: "24:00", cpu: 45, gpu: 50, ssd: 35 },
];

const resourceData = [
  { name: "CPU Core 1", usage: 75 },
  { name: "CPU Core 2", usage: 60 },
  { name: "CPU Core 3", usage: 82 },
  { name: "CPU Core 4", usage: 45 },
  { name: "RAM", usage: 65 },
  { name: "GPU Core", usage: 55 },
  { name: "SSD", usage: 40 },
];

export default function HardwareMonitor() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Hardware Monitor</h2>
        <p className="text-muted-foreground">
          Monitor hardware components and their performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">CPU Temperature</CardTitle>
            <ThermometerSun className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">65°C</div>
            <div className="flex items-center pt-1">
              <span className="text-xs text-amber-500">
                <AlertTriangle className="inline h-3 w-3 mr-1" />
                Moderate
              </span>
            </div>
            <Progress value={65} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">GPU Temperature</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">70°C</div>
            <div className="flex items-center pt-1">
              <span className="text-xs text-amber-500">
                <AlertTriangle className="inline h-3 w-3 mr-1" />
                Moderate
              </span>
            </div>
            <Progress value={70} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fan Speed</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2400 RPM</div>
            <div className="flex items-center pt-1">
              <span className="text-xs text-green-500">
                <CheckCircle className="inline h-3 w-3 mr-1" />
                Normal
              </span>
            </div>
            <Progress value={60} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">SSD Health</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">95%</div>
            <div className="flex items-center pt-1">
              <span className="text-xs text-green-500">
                <CheckCircle className="inline h-3 w-3 mr-1" />
                Good
              </span>
            </div>
            <Progress value={95} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="temperature" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="temperature">Temperature</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>
        <TabsContent value="temperature" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Temperature Monitoring</CardTitle>
              <CardDescription>
                Component temperatures over the last 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={temperatureData}
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
                      formatter={(value) => [`${value}°C`]}
                    />
                    <Legend />
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
                      dataKey="gpu"
                      name="GPU"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="ssd"
                      name="SSD"
                      stroke="#F59E0B"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resource Usage</CardTitle>
              <CardDescription>
                Current hardware utilization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={resourceData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={100} />
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
                      name="Usage"
                      fill="hsl(var(--primary))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="devices" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">CPU</CardTitle>
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Model</span>
                  <span className="text-sm font-medium">Intel Core i7-11700K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cores</span>
                  <span className="text-sm font-medium">8 cores / 16 threads</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Base Clock</span>
                  <span className="text-sm font-medium">3.6 GHz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Boost Clock</span>
                  <span className="text-sm font-medium">5.0 GHz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">TDP</span>
                  <span className="text-sm font-medium">125W</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">GPU</CardTitle>
                  <MonitorIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Model</span>
                  <span className="text-sm font-medium">NVIDIA RTX 3080</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Memory</span>
                  <span className="text-sm font-medium">10 GB GDDR6X</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Core Clock</span>
                  <span className="text-sm font-medium">1.44 GHz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Boost Clock</span>
                  <span className="text-sm font-medium">1.71 GHz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">TDP</span>
                  <span className="text-sm font-medium">320W</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Storage</CardTitle>
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Primary</span>
                  <span className="text-sm font-medium">Samsung 970 EVO Plus 1TB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Secondary</span>
                  <span className="text-sm font-medium">WD Black 2TB HDD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Read Speed</span>
                  <span className="text-sm font-medium">3,500 MB/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Write Speed</span>
                  <span className="text-sm font-medium">2,500 MB/s</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Memory</CardTitle>
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">RAM</span>
                  <span className="text-sm font-medium">32 GB DDR4</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Speed</span>
                  <span className="text-sm font-medium">3200 MHz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Channels</span>
                  <span className="text-sm font-medium">Dual Channel</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Latency</span>
                  <span className="text-sm font-medium">CL16</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
