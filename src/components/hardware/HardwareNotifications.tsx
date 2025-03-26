
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { HardwareUpdate } from "@/types/hardware";
import { Bell, Usb, Wifi, Monitor } from "lucide-react";

export function HardwareNotifications() {
  useEffect(() => {
    const eventSource = new EventSource("http://127.0.0.1:8000/sse_stream_hardware/");
    
    eventSource.onopen = () => {
      console.log("Connected to hardware updates stream");
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as HardwareUpdate;
        
        // Determine icon based on device description
        let iconDescription = "";
        if (data.hw_description?.toLowerCase().includes("usb")) {
          iconDescription = "🔌 USB";
        } else if (data.hw_description?.toLowerCase().includes("wifi") || data.hw_description?.toLowerCase().includes("network")) {
          iconDescription = "📶 Network";
        } else {
          iconDescription = "🖥️ Device";
        }
        
        toast({
          title: `${iconDescription} ${data.hw_status === "Connected" ? "Connected" : "Disconnected"}`,
          description: `${data.hw_description || "Unknown device"} (ID: ${data.hw_id})`,
          variant: data.hw_status === "Connected" ? "default" : "destructive",
        });
      } catch (err) {
        console.error("Error parsing SSE data:", err);
      }
    };

    eventSource.onerror = () => {
      console.error("Connection to hardware updates stream failed");
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

  return null; // This component doesn't render anything, it just handles notifications
}
