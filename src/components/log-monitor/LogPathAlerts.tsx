
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, MoveRight } from "lucide-react";
import { PathAlert } from "@/hooks/useLogData";
import { format } from "date-fns";

interface LogPathAlertsProps {
  pathAlerts: PathAlert[];
  isLoading: boolean;
}

export function LogPathAlerts({ pathAlerts, isLoading }: LogPathAlertsProps) {
  if (isLoading) {
    return <div className="flex justify-center py-8">Loading path alerts...</div>;
  }

  if (!pathAlerts || pathAlerts.length === 0) {
    return <div className="text-center py-8">No log file path changes detected.</div>;
  }

  return (
    <div className="space-y-4">
      {pathAlerts.map((alert) => (
        <Alert variant="destructive" key={alert.id}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            Path Change for {alert.file_name}
            <Badge variant="outline" className="ml-2">
              {format(new Date(alert.timestamp), "MMM d, yyyy HH:mm:ss")}
            </Badge>
          </AlertTitle>
          <AlertDescription className="mt-2">
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center">
                <span className="text-destructive-foreground/70 mr-2">From:</span> 
                <span className="font-mono text-sm">{alert.old_path}</span>
              </div>
              <div className="flex items-center">
                <MoveRight className="h-4 w-4 text-destructive-foreground/70 mr-2" />
                <span className="font-mono text-sm">{alert.new_path}</span>
              </div>
              <div className="text-xs text-destructive-foreground/70 mt-1">
                Detected at: {format(new Date(alert.detected_at), "MMM d, yyyy HH:mm:ss")}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
