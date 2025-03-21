
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { HardwareUpdate } from "@/types/hardware";
import { format } from "date-fns";

interface HardwareUpdatesFeedProps {
  updates: HardwareUpdate[];
  isConnected: boolean;
  error: string | null;
}

export function HardwareUpdatesFeed({ updates, isConnected, error }: HardwareUpdatesFeedProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Live Hardware Updates</CardTitle>
            <CardDescription>
              Real-time hardware connection status changes
            </CardDescription>
          </div>
          <Badge variant={isConnected ? "outline" : "destructive"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {updates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-8 w-8 mx-auto mb-2" />
              Waiting for hardware status updates...
            </div>
          ) : (
            updates.map((update, index) => (
              <div
                key={index}
                className="p-3 border rounded-md bg-card"
              >
                <div className="flex items-start gap-2">
                  {update.HW_Status === "Connected" ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="font-medium">{update.HW_Description}</p>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(update.timestamp), "HH:mm:ss")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{update.HW_Status}</span>
                      <span className="text-muted-foreground">ID: {update.HW_ID}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
