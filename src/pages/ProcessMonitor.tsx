
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Circle, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Sample process data
const processes = [
  { id: 1, name: "System", cpu: 2.5, memory: "120 MB", status: "Running", pid: 4 },
  { id: 2, name: "Browser", cpu: 15.8, memory: "1.2 GB", status: "Running", pid: 1056 },
  { id: 3, name: "IDE", cpu: 10.2, memory: "750 MB", status: "Running", pid: 2145 },
  { id: 4, name: "Terminal", cpu: 0.5, memory: "45 MB", status: "Running", pid: 3267 },
  { id: 5, name: "File Manager", cpu: 1.2, memory: "85 MB", status: "Running", pid: 4589 },
  { id: 6, name: "Media Player", cpu: 5.7, memory: "320 MB", status: "Running", pid: 5123 },
  { id: 7, name: "Background Service", cpu: 0.3, memory: "25 MB", status: "Running", pid: 6012 },
  { id: 8, name: "Package Manager", cpu: 8.1, memory: "150 MB", status: "Running", pid: 7345 },
];

export default function ProcessMonitor() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Process Monitor</h2>
          <p className="text-muted-foreground">
            Monitor and manage running processes
          </p>
        </div>
        <Button className="flex gap-2 items-center">
          <RefreshCw className="h-4 w-4" />
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
              <div className="text-2xl font-bold">32</div>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Process</TableHead>
                <TableHead className="text-right">PID</TableHead>
                <TableHead className="text-right">CPU %</TableHead>
                <TableHead className="text-right">Memory</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processes.map((process) => (
                <TableRow key={process.id}>
                  <TableCell className="font-medium">{process.name}</TableCell>
                  <TableCell className="text-right">{process.pid}</TableCell>
                  <TableCell className="text-right">{process.cpu}%</TableCell>
                  <TableCell className="text-right">{process.memory}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    <Circle className="h-3 w-3 fill-green-500 text-green-500" />
                    {process.status}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <X className="h-4 w-4" />
                      <span className="sr-only">End process</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
