
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppWindow } from "lucide-react";
import { format } from "date-fns";

interface WindowActivity {
  window: string;
  timestamp: Date;
}

export function WindowActivityTracker() {
  const [currentWindow, setCurrentWindow] = useState<string>("Unknown");
  const [windowActivities, setWindowActivities] = useState<WindowActivity[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource("http://127.0.0.1:8000/sse_window_activity/");
    
    eventSource.onopen = () => {
      console.log("Connected to window activity stream");
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.message && data.message.includes("Switched to Window:")) {
          const windowName = data.message.replace("Switched to Window:", "").trim();
          setCurrentWindow(windowName);
          
          // Add to activity history
          setWindowActivities(prev => {
            const newActivities = [
              { window: windowName, timestamp: new Date() },
              ...prev.slice(0, 9) // Keep only the 10 most recent activities
            ];
            return newActivities;
          });
        }
      } catch (err) {
        console.error("Error parsing window activity SSE data:", err);
      }
    };

    eventSource.onerror = () => {
      console.error("Connection to window activity stream failed");
      setIsConnected(false);
      eventSource.close();
      
      // Try to reconnect after a delay
      setTimeout(() => {
        eventSource.close();
      }, 5000);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Current Active Window</CardTitle>
        <Badge variant={isConnected ? "outline" : "destructive"}>
          {isConnected ? "Connected" : "Disconnected"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <AppWindow className="h-5 w-5 text-blue-500" />
          <div className="text-xl font-semibold truncate">{currentWindow}</div>
        </div>
        
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent Window Switches</h3>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {windowActivities.length === 0 ? (
            <div className="text-center py-2 text-muted-foreground text-sm">
              No window activity recorded yet
            </div>
          ) : (
            windowActivities.map((activity, index) => (
              <div key={index} className="flex justify-between text-sm p-2 border rounded-md">
                <span className="truncate max-w-[200px]">{activity.window}</span>
                <span className="text-muted-foreground">
                  {format(activity.timestamp, "HH:mm:ss")}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
