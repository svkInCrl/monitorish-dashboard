
import React from "react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Circle, AlertTriangle, CheckCircle } from "lucide-react";
import { HardwareDevice } from "@/types/hardware";
import { format } from "date-fns";

interface HardwareStatusTableProps {
  devices: HardwareDevice[];
  isLoading: boolean;
}

export function HardwareStatusTable({ devices, isLoading }: HardwareStatusTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hardware Status</CardTitle>
          <CardDescription>Loading hardware information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!devices || devices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hardware Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No hardware information available</AlertTitle>
            <AlertDescription>
              Unable to retrieve hardware device information.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hardware Status</CardTitle>
        <CardDescription>Current hardware devices and their status</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Device Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((device) => (
              <TableRow key={device.hw_id}>
                <TableCell>
                  <div className="flex items-center">
                    {device.hw_status === "Connected" ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <Circle className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    {device.hw_status}
                  </div>
                </TableCell>
                <TableCell>{device.hw_type}</TableCell>
                <TableCell>{device.hw_description}</TableCell>
                <TableCell>{device.hw_id}</TableCell>
                <TableCell>
                  {format(new Date(device.timestamp), "MMM d, yyyy HH:mm:ss")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
