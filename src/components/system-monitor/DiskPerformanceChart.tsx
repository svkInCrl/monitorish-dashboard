
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TimePeriod } from "@/components/TimePeriodSelector";

interface DiskPerformanceChartProps {
  data: any[];
  isLoading: boolean;
  timePeriod: TimePeriod;
}

export function DiskPerformanceChart({
  data,
  isLoading,
  timePeriod,
}: DiskPerformanceChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Disk Performance</CardTitle>
        <CardDescription>
          Read/write operations over {timePeriod === "day" ? "the last 24 hours" : 
                                      timePeriod === "week" ? "the last week" : 
                                      timePeriod === "month" ? "the last month" : "the last year"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center">
              <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  contentStyle={{ 
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    border: 'none'
                  }}
                  formatter={(value) => [`${value}%`]}
                />
                <Line
                  type="monotone"
                  dataKey="disk"
                  name="Disk"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
