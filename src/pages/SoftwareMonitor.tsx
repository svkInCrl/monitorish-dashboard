
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle, Clock, Code, Shield, XCircle } from "lucide-react";
import { useSoftwareInfo } from "@/hooks/useSoftwareData";
// Sample data

const softwareData = [
  { id: 1, name: "Chrome", version: "112.0.5615.138", status: "Running", lastUpdated: "Today", category: "Browser" },
  { id: 2, name: "Visual Studio Code", version: "1.77.3", status: "Running", lastUpdated: "2 days ago", category: "Development" },
  { id: 3, name: "Slack", version: "4.29.149", status: "Running", lastUpdated: "1 week ago", category: "Communication" },
  { id: 4, name: "Spotify", version: "1.2.0.1165", status: "Not Running", lastUpdated: "3 days ago", category: "Media" },
  { id: 5, name: "Adobe Photoshop", version: "24.5.0", status: "Not Running", lastUpdated: "2 weeks ago", category: "Design" },
  { id: 6, name: "Node.js", version: "18.15.0", status: "Running", lastUpdated: "1 month ago", category: "Development" },
  { id: 7, name: "Zoom", version: "5.14.7", status: "Not Running", lastUpdated: "5 days ago", category: "Communication" },
  { id: 8, name: "Microsoft Office", version: "16.68.1", status: "Running", lastUpdated: "2 days ago", category: "Productivity" },
];

const updateData = [
  { name: "Jan", updates: 5 },
  { name: "Feb", updates: 3 },
  { name: "Mar", updates: 7 },
  { name: "Apr", updates: 2 },
  { name: "May", updates: 8 },
  { name: "Jun", updates: 4 },
];

export default function SoftwareMonitor() {
  const { data : softwareInfo , isLoading: isLoadingSoftware,
    error: softwareError,} = useSoftwareInfo();

  console.log(softwareInfo);
  

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Software Monitor</h2>
        <p className="text-muted-foreground">
          Monitor installed applications and their status
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Installed Software</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              Applications tracked
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Updates Available</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Security updates: 1
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Security Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Good</div>
            <p className="text-xs text-muted-foreground">
              All critical systems up to date
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Update History</CardTitle>
            <CardDescription>
              Software updates over the past 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={updateData}
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
                    dataKey="updates"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Software Categories</CardTitle>
            <CardDescription>
              Breakdown of installed applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <p className="text-sm font-medium">Development</p>
                  </div>
                  <span className="text-sm">35%</span>
                </div>
                <Progress value={35} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <p className="text-sm font-medium">Productivity</p>
                  </div>
                  <span className="text-sm">25%</span>
                </div>
                <Progress value={25} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <p className="text-sm font-medium">Communication</p>
                  </div>
                  <span className="text-sm">20%</span>
                </div>
                <Progress value={20} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <p className="text-sm font-medium">Media</p>
                  </div>
                  <span className="text-sm">15%</span>
                </div>
                <Progress value={15} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <p className="text-sm font-medium">Other</p>
                  </div>
                  <span className="text-sm">5%</span>
                </div>
                <Progress value={5} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Installed Software</CardTitle>
          <CardDescription>
            All installed applications and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Privilege</TableHead>
                {/* <TableHead>Status</TableHead> */}
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {softwareInfo && softwareInfo.map((app) => (
                <TableRow key={app.sw_id}>
                  <TableCell className="font-medium">{app.sw_name}</TableCell>
                  <TableCell>{app.version}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{app.sw_privilege}</Badge>
                  </TableCell>
                  {/* <TableCell>
                    {app.status === "Running" ? (
                      <span className="flex items-center text-green-500">
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Running
                      </span>
                    ) : (
                      <span className="flex items-center text-gray-500">
                        <XCircle className="mr-1 h-4 w-4" />
                        Not Running
                      </span>
                    )}
                  </TableCell> */}
                  <TableCell>{app.installation_timestamp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
