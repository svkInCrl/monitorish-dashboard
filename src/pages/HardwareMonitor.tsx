import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, Cpu, HardDrive, MemoryStick, Server, Usb } from "lucide-react";
import { useHardwareInfo, useHardwareUpdates } from "@/hooks/useHardwareData";
import { HardwareStatusTable } from "@/components/hardware-monitor/HardwareStatusTable";
import { HardwareUpdatesFeed } from "@/components/hardware-monitor/HardwareUpdatesFeed";
import { useTemperatureInfo } from "@/hooks/useHardwareData";

// Sample data for charts
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
  const { data: hardwareDevices, isLoading: isLoadingDevices } = useHardwareInfo();
  const { updates, isConnected, error } = useHardwareUpdates();
  const {data : temp, isLoading: isLoadingTemp} = useTemperatureInfo();

  // console.log(temp, isLoadingTemp);

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
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingTemp ? (
              <div className="text-sm text-muted-foreground">Loading temperature...</div>
            ) : (
              <div>
                <div className="text-2xl font-bold">{temp?.temperatures}°C</div>
                {temp['temperatures'] > 65 ? <AlertTriangle className="inline h-3 w-3 text-amber-500 mr-1" /> : <CheckCircle className="inline text-green-500 h-3 w-3 mr-1" />}
                {temp['temperatures'] > 65 ? <span className="text-xs text-amber-500"> High</span> : <span className="text-xs text-green-500"> Normal </span> }
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">USB Devices</CardTitle>
            <Usb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hardwareDevices?.filter(d => d.hw_type === "USB Device").length || 0}
            </div>
            <div className="flex items-center pt-1">
              <span className="text-xs text-green-500">
                <CheckCircle className="inline h-3 w-3 mr-1" />
                All Connected
              </span>
            </div>
            <Progress value={100} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Storage Devices</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hardwareDevices?.filter(d => d.hw_type.includes("Storage")).length || 0}
            </div>
            <div className="flex items-center pt-1">
              <span className="text-xs text-green-500">
                <CheckCircle className="inline h-3 w-3 mr-1" />
                Healthy
              </span>
            </div>
            <Progress value={95} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Memory Status</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">OK</div>
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

      <Tabs defaultValue="updates" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="updates">Live Updates</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>
        
        <TabsContent value="updates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1">
            <HardwareUpdatesFeed 
              updates={updates} 
              isConnected={isConnected} 
              error={error} 
            />
            
          </div>
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
              <div className="space-y-4">
                {resourceData.map((resource) => (
                  <div key={resource.name} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{resource.name}</span>
                      <span className="text-sm text-muted-foreground">{resource.usage}%</span>
                    </div>
                    <Progress value={resource.usage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="devices" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1">
          <HardwareStatusTable 
              devices={hardwareDevices || []} 
              isLoading={isLoadingDevices} 
            />
            {/* <Card>
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
                  <Server className="h-4 w-4 text-muted-foreground" />
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
                  <MemoryStick className="h-4 w-4 text-muted-foreground" />
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
            </Card> */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
