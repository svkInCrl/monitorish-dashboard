
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

export interface LogEntry {
  id: string;
  timestamp: string;
  pid: number;
  priority: string;
  description: string;
  log_file: string;
  log_id: string;
}

export interface LogFile {
  id: string;
  path: string;
  name: string;
  size_kb: number;
  last_modified: string;
  type: string;
}

export interface PathAlert {
  id: string;
  timestamp: string;
  file_name: string;
  old_path: string;
  new_path: string;
  detected_at: string;
}

// Mock data for demonstration - in a real app, these would come from API endpoints
const mockLogs: LogEntry[] = [
  {
    id: "1",
    timestamp: "2025-03-20T04:12:34Z",
    pid: 1234,
    priority: "CRITICAL",
    description: "Failed login attempt with invalid credentials",
    log_file: "/var/log/auth.log",
    log_id: "AUTH001",
  },
  {
    id: "2",
    timestamp: "2025-03-20T04:15:22Z",
    pid: 5678,
    priority: "WARNING",
    description: "Unusual network activity detected on port 4433",
    log_file: "/var/log/syslog",
    log_id: "SYS002",
  },
  {
    id: "3",
    timestamp: "2025-03-20T04:20:11Z",
    pid: 9101,
    priority: "ERROR",
    description: "File permission change on system binary",
    log_file: "/var/log/messages",
    log_id: "MSG003",
  },
];

const mockLogFiles: LogFile[] = [
  {
    id: "1",
    path: "/var/log/auth.log",
    name: "auth.log",
    size_kb: 256,
    last_modified: "2025-03-20T04:30:00Z",
    type: "system",
  },
  {
    id: "2",
    path: "/var/log/syslog",
    name: "syslog",
    size_kb: 1024,
    last_modified: "2025-03-20T04:28:00Z",
    type: "system",
  },
  {
    id: "3",
    path: "/var/log/messages",
    name: "messages",
    size_kb: 512,
    last_modified: "2025-03-20T04:15:00Z",
    type: "system",
  },
  {
    id: "4",
    path: "/var/log/secure",
    name: "secure",
    size_kb: 128,
    last_modified: "2025-03-20T04:10:00Z",
    type: "security",
  },
];

const mockPathAlerts: PathAlert[] = [
  {
    id: "1",
    timestamp: "2025-03-19T23:45:12Z",
    file_name: "auth.log",
    old_path: "/var/log/auth.log",
    new_path: "/tmp/auth.log.bak",
    detected_at: "2025-03-20T00:01:34Z",
  }
];

// In a real app, this would be fetching from an API
const fetchLogData = async () => {
  // Simulate network request
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    logs: mockLogs,
    logFiles: mockLogFiles,
    pathAlerts: mockPathAlerts,
  };
};

export function useLogData() {
  const [pathAlerts, setPathAlerts] = useState<PathAlert[]>(mockPathAlerts);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["logData"],
    queryFn: fetchLogData,
  });

  useEffect(() => {
    // Set up an interval to simulate new path alerts occasionally
    const intervalId = setInterval(() => {
      const shouldAddAlert = Math.random() > 0.9; // 10% chance
      
      if (shouldAddAlert) {
        const newAlert: PathAlert = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          file_name: "secure",
          old_path: "/var/log/secure",
          new_path: "/tmp/secure.new",
          detected_at: new Date().toISOString(),
        };
        
        setPathAlerts(prev => [newAlert, ...prev]);
        
        // Show notification
        toast({
          title: "Log File Path Changed",
          description: `${newAlert.file_name} moved from ${newAlert.old_path} to ${newAlert.new_path}`,
          variant: "destructive",
        });
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  return {
    logs: data?.logs || [],
    logFiles: data?.logFiles || [],
    pathAlerts,
    isLoading,
    refetch,
  };
}
