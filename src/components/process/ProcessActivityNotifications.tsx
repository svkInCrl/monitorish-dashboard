
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { Play, X } from "lucide-react";

export function ProcessActivityNotifications() {
  useEffect(() => {
    const eventSource = new EventSource("http://127.0.0.1:8000/sse_process_activity/");
    
    eventSource.onopen = () => {
      console.log("Connected to process activity stream");
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.message) {
          // Determine if process was started or closed
          const isProcessStarted = data.message.includes("started");
          const appName = data.message.split(" ")[0];
          
          // toast({
          //   title: isProcessStarted ? `🚀 Process Started` : `🛑 Process Closed`,
          //   description: appName ? `${appName}` : "Unknown application",
          //   variant: "default",
          // });
        }
      } catch (err) {
        console.error("Error parsing process activity SSE data:", err);
      }
    };

    eventSource.onerror = () => {
      console.error("Connection to process activity stream failed");
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

  return null; // This component doesn't render anything
}
