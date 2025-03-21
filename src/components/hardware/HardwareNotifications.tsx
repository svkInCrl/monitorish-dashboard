
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
        if (data.HW_Description?.toLowerCase().includes("usb")) {
          iconDescription = "🔌 USB";
        } else if (data.HW_Description?.toLowerCase().includes("wifi") || data.HW_Description?.toLowerCase().includes("network")) {
          iconDescription = "📶 Network";
        } else {
          iconDescription = "🖥️ Device";
        }
        
        toast({
          title: `${iconDescription} ${data.HW_Status === "Connected" ? "Connected" : "Disconnected"}`,
          description: `${data.HW_Description || "Unknown device"} (ID: ${data.HW_ID})`,
          variant: data.HW_Status === "Connected" ? "default" : "destructive",
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
