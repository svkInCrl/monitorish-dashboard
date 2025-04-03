import { useEffect, useState } from "react";
import { FileText, Edit, Trash2, FilePlus, Move } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface FileActivityLog {
  id: string;
  file_path: string;
  file_name: string;
  timestamp: string;
  action: "created" | "modified" | "deleted" | "moved";
  user: string;
  destination?: string;
}

export function FileMonitoringLogs() {
  const { toast } = useToast();
  const [fileActivities, setFileActivities] = useState<FileActivityLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const fetchInitialData = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/user_activity_events/");
      if (!response.ok) {
        throw new Error("Failed to fetch initial data");
      }
      const data: FileActivityLog[] = await response.json();
      setFileActivities(data);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  };
  
  useEffect(() => {
    fetchInitialData();
    
    const eventSource = new EventSource("http://127.0.0.1:8000/sse_file_activity/");

    eventSource.onopen = () => {
      console.log("Connected to file activity stream");
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { event_type, message, timestamp } = data;

        let action: "created" | "modified" | "deleted" | "moved" = "created";
        let filePath = "";
        let destination = "";
        let user = "Unknown";

        if (message.includes("File created:")) {
          action = "created";
          filePath = message.split("File created:")[1].split(" by ")[0].trim();
          user = message.split(" by ")[1] || "Unknown";
        } else if (message.includes("File deleted:")) {
          action = "deleted";
          filePath = message.split("File deleted:")[1].split(" by ")[0].trim();
          user = message.split(" by ")[1] || "Unknown";
        } else if (message.includes("File modified:")) {
          action = "modified";
          filePath = message.split("File modified:")[1].split(" by ")[0].trim();
          user = message.split(" by ")[1] || "Unknown";
        } else if (message.includes("File moved from")) {
          action = "moved";
          filePath = message.split("File moved from")[1].split(" to ")[0].trim();
          destination = message.split(" to ")[1].split(" by ")[0].trim();
          user = message.split(" by ")[1] || "Unknown";
        }

        const fileName = filePath.split("/").pop() || filePath;

        const newActivity: FileActivityLog = {
          id: crypto.randomUUID(),
          file_path: filePath,
          file_name: fileName,
          timestamp: timestamp,
          action: action,
          user: user,
          destination: action === "moved" ? destination : undefined,
        };

        setFileActivities((prev) => [newActivity, ...prev]);

        toast({
          title: `File ${action}`,
          description: `${fileName} was ${action} by ${user}`,
          variant: action === "deleted" ? "destructive" : "default",
        });
      } catch (err) {
        console.error("Error parsing file activity SSE data:", err);
      }
    };

    eventSource.onerror = () => {
      console.error("Connection to file activity stream failed");
      setIsConnected(false);
      eventSource.close();
      setTimeout(() => new EventSource("http://127.0.0.1:8000/sse_file_activity/"), 5000);
    };

    return () => {
      eventSource.close();
    };
  }, [toast]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return <FilePlus className="h-4 w-4 text-green-500" />;
      case "modified":
        return <Edit className="h-4 w-4 text-amber-500" />;
      case "deleted":
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case "moved":
        return <Move className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>File Monitoring Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[300px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>File Path</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fileActivities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No file activity recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                fileActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getActionIcon(activity.action)}
                        <Badge variant="outline">{activity.action}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>{activity.file_name}</TableCell>
                    <TableCell className="font-mono text-xs">{activity.file_path}</TableCell>
                    <TableCell>{activity.user}</TableCell>
                    <TableCell>{activity.timestamp}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
