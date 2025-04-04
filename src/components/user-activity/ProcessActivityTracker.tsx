
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Play, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface ProcessActivity {
  event_type: "app_started" | "app_closed";
  message: string;
  timestamp: string;
}

export function ProcessActivityTracker() {
  const [processActivities, setProcessActivities] = useState<ProcessActivity[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [appUsageStats, setAppUsageStats] = useState<Record<string, number>>({});

  useEffect(() => {
    const eventSource = new EventSource("http://127.0.0.1:8000/sse_process_activity/");
    
    eventSource.onopen = () => {
      console.log("Connected to process activity stream");
      setIsConnected(true);
      toast({
        title: "Connected",
        description: "Process activity monitoring is active",
      });
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ProcessActivity;
        
        // Add to activity history
        setProcessActivities(prev => {
          const newActivities = [data, ...prev.slice(0, 19)]; // Keep only the 20 most recent activities
          return newActivities;
        });

        // Update app usage stats
        const appName = getAppNameFromMessage(data.message);
        if (appName) {
          setAppUsageStats(prev => {
            const newStats = { ...prev };
            if (data.event_type === "app_started") {
              newStats[appName] = (newStats[appName] || 0) + 1;
            }
            return newStats;
          });
        }
      } catch (err) {
        console.error("Error parsing process activity SSE data:", err);
      }
    };

    eventSource.onerror = () => {
      console.error("Connection to process activity stream failed");
      setIsConnected(false);
      
      // Try to reconnect after a delay
      setTimeout(() => {
        eventSource.close();
      }, 5000);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Function to extract app name from message
  const getAppNameFromMessage = (message: string): string | null => {
    // Message format: "AppName started" or "AppName closed"
    if (message) {
      const matchStart = message.match(/^(.*?) started$/);
      if (matchStart) return matchStart[1];
      
      const matchClosed = message.match(/^(.*?) closed$/);
      if (matchClosed) return matchClosed[1];
    }
    return null;
  };

  // Get the top 5 most used applications
  const topApps = Object.entries(appUsageStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Application Usage</CardTitle>
          <Badge variant={isConnected ? "outline" : "destructive"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
        <CardDescription>
          Most frequently used applications
        </CardDescription>
      </CardHeader>
      <CardContent>
        {topApps.length > 0 ? (
          <div className="space-y-4">
            <div className="grid gap-2">
              {topApps.map(([appName, count], index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-2 border rounded-md"
                >
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span>{appName}</span>
                  </div>
                  <Badge variant="secondary">{count} launches</Badge>
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent Activity</h3>
              <div className="space-y-2 max-h-[150px] overflow-y-auto">
                {processActivities.map((activity, index) => (
                  <div key={index} className="flex justify-between text-sm p-2 border rounded-md">
                    <div className="flex items-center space-x-2">
                      {activity.event_type === "app_started" ? (
                        <Play className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                      <span className="truncate max-w-[200px]">
                        {activity.message}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {activity.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[250px] flex items-center justify-center">
            <p className="text-muted-foreground">No application activity recorded yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
