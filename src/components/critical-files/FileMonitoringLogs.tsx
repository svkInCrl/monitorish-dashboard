
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { FileText, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FileActivityLog {
  id: string;
  file_path: string;
  file_name: string;
  timestamp: string;
  action: "opened" | "modified" | "deleted";
  user: string;
}

export function FileMonitoringLogs() {
  const { toast } = useToast();
  const [fileActivities, setFileActivities] = useState<FileActivityLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Simulate some initial data
  const initialLogs: FileActivityLog[] = [
    {
      id: "1",
      file_path: "/etc/passwd",
      file_name: "passwd",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      action: "opened",
      user: "root"
    },
    {
      id: "2",
      file_path: "/etc/shadow",
      file_name: "shadow",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      action: "modified",
      user: "system"
    }
  ];

  useEffect(() => {
    // Set initial logs
    setFileActivities(initialLogs);

    // Connect to SSE endpoint for real-time file activity updates
    const eventSource = new EventSource("http://127.0.0.1:8000/sse_file_activity/");
    
    eventSource.onopen = () => {
      console.log("Connected to file activity stream");
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.message) {
          const message = data.message;
          let action: "opened" | "modified" | "deleted" = "opened";
          let filePath = "";
          let fileName = "";
          
          if (message.includes("opened")) {
            action = "opened";
            filePath = message.replace(" was opened", "").trim();
          } else if (message.includes("modified")) {
            action = "modified";
            filePath = message.replace(" was modified", "").trim();
          } else if (message.includes("deleted")) {
            action = "deleted";
            filePath = message.replace(" was deleted", "").trim();
          }
          
          fileName = filePath.split("/").pop() || filePath;
          
          if (filePath) {
            const newActivity: FileActivityLog = {
              id: Date.now().toString(),
              file_path: filePath,
              file_name: fileName,
              timestamp: new Date().toISOString(),
              action: action,
              user: "system" // In a real app, you'd get the actual user
            };
            
            setFileActivities(prev => [newActivity, ...prev]);
            
            // Show toast notification for critical file activities
            toast({
              title: `File ${action}`,
              description: `${fileName} was ${action} by ${newActivity.user}`,
              variant: action === "deleted" ? "destructive" : "default",
            });
          }
        }
      } catch (err) {
        console.error("Error parsing file activity SSE data:", err);
      }
    };

    eventSource.onerror = () => {
      console.error("Connection to file activity stream failed");
      setIsConnected(false);
      
      // Try to reconnect after a delay
      setTimeout(() => {
        eventSource.close();
      }, 5000);
    };

    return () => {
      eventSource.close();
    };
  }, [toast]);

  // Function to get appropriate icon based on action
  const getActionIcon = (action: string) => {
    switch (action) {
      case "opened":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "modified":
        return <Edit className="h-4 w-4 text-amber-500" />;
      case "deleted":
        return <Trash2 className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Function to get appropriate badge color based on action
  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "opened":
        return "outline";
      case "modified":
        return "warning";
      case "deleted":
        return "destructive";
      default:
        return "outline";
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
                        <Badge variant={getActionBadgeVariant(activity.action) as any}>
                          {activity.action}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{activity.file_name}</TableCell>
                    <TableCell className="font-mono text-xs">{activity.file_path}</TableCell>
                    <TableCell>{activity.user}</TableCell>
                    <TableCell>{new Date(activity.timestamp).toLocaleString()}</TableCell>
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

// Export data for use in other components
export const useFileActivityData = () => {
  const [fileActivities, setFileActivities] = useState<FileActivityLog[]>([]);
  
  useEffect(() => {
    // Simulate initial data to match the FileMonitoringLogs component
    const initialLogs: FileActivityLog[] = [
      {
        id: "1",
        file_path: "/etc/passwd",
        file_name: "passwd",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        action: "opened",
        user: "root"
      },
      {
        id: "2",
        file_path: "/etc/shadow",
        file_name: "shadow",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        action: "modified",
        user: "system"
      }
    ];
    
    setFileActivities(initialLogs);
    
    // Listen for SSE events
    const eventSource = new EventSource("http://127.0.0.1:8000/sse_file_activity/");
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.message) {
          const message = data.message;
          let action: "opened" | "modified" | "deleted" = "opened";
          let filePath = "";
          
          if (message.includes("opened")) {
            action = "opened";
            filePath = message.replace(" was opened", "").trim();
          } else if (message.includes("modified")) {
            action = "modified";
            filePath = message.replace(" was modified", "").trim();
          } else if (message.includes("deleted")) {
            action = "deleted";
            filePath = message.replace(" was deleted", "").trim();
          }
          
          const fileName = filePath.split("/").pop() || filePath;
          
          if (filePath) {
            const newActivity: FileActivityLog = {
              id: Date.now().toString(),
              file_path: filePath,
              file_name: fileName,
              timestamp: new Date().toISOString(),
              action: action,
              user: "system"
            };
            
            setFileActivities(prev => [newActivity, ...prev]);
          }
        }
      } catch (err) {
        console.error("Error parsing file activity SSE data:", err);
      }
    };
    
    return () => {
      eventSource.close();
    };
  }, []);
  
  return fileActivities;
};

export type { FileActivityLog };
