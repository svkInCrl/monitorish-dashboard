
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LogEntry } from "@/hooks/useLogData";
import { format } from "date-fns";

interface LogListProps {
  logs: LogEntry[];
  isLoading: boolean;
}

export function LogList({ logs, isLoading }: LogListProps) {
  if (isLoading) {
    return <div className="flex justify-center py-8">Loading logs...</div>;
  }

  if (!logs || logs.length === 0) {
    return <div className="text-center py-8">No anomalous logs detected.</div>;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case "CRITICAL":
        return "destructive";
      case "ERROR":
        return "destructive";
      case "WARNING":
        return "warning";
      default:
        return "secondary";
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Timestamp</TableHead>
          <TableHead>Log ID</TableHead>
          <TableHead>PID</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Log File</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell>{format(new Date(log.timestamp), "MMM d, yyyy HH:mm:ss")}</TableCell>
            <TableCell>{log.log_id}</TableCell>
            <TableCell>{log.pid}</TableCell>
            <TableCell>
              <Badge variant={getPriorityColor(log.priority) as any}>{log.priority}</Badge>
            </TableCell>
            <TableCell className="max-w-[300px] truncate" title={log.description}>
              {log.description}
            </TableCell>
            <TableCell className="max-w-[150px] truncate" title={log.log_file}>
              {log.log_file}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
