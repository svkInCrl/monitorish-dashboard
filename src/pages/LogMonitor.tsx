
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LogList } from "@/components/log-monitor/LogList";
import { LogFileList } from "@/components/log-monitor/LogFileList";
import { LogPathAlerts } from "@/components/log-monitor/LogPathAlerts";
import { useLogData } from "@/hooks/useLogData";
import { RefreshCw, FileText, AlertTriangle } from "lucide-react";

export default function LogMonitor() {
  const { logs, logFiles, pathAlerts, isLoading, refetch } = useLogData();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = async () => {
    setRefreshTrigger(prev => prev + 1);
    await refetch();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Log Monitor</h2>
          <p className="text-muted-foreground">
            Monitor system logs and anomalies
          </p>
        </div>
        <Button 
          className="flex gap-2 items-center" 
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Log Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logFiles?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Being monitored
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Anomalous Logs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Detected anomalies
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Path Changes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pathAlerts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Log file path changes
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="anomalies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="anomalies">Anomalous Logs</TabsTrigger>
          <TabsTrigger value="files">Log Files</TabsTrigger>
          <TabsTrigger value="path-alerts">Path Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="anomalies">
          <Card>
            <CardHeader>
              <CardTitle>Anomalous Log Entries</CardTitle>
              <CardDescription>
                Log entries that may indicate security issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LogList logs={logs} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle>Monitored Log Files</CardTitle>
              <CardDescription>
                Log files being monitored for anomalies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LogFileList logFiles={logFiles} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="path-alerts">
          <Card>
            <CardHeader>
              <CardTitle>Log File Path Alerts</CardTitle>
              <CardDescription>
                Changes in log file paths that may indicate tampering
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LogPathAlerts pathAlerts={pathAlerts} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
