
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TimePeriod } from "@/components/TimePeriodSelector";

interface NetworkActivityChartProps {
  data: any[];
  isLoading: boolean;
  timePeriod: TimePeriod;
}

export function NetworkActivityChart({
  data,
  isLoading,
  timePeriod,
}: NetworkActivityChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Network Activity</CardTitle>
        <CardDescription>
          Network throughput over {timePeriod === "day" ? "the last 24 hours" : 
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
                  formatter={(value) => [`${value}KB/s`]}
                />
                <Line
                  type="monotone"
                  dataKey="network"
                  name="Network"
                  stroke="#10B981"
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
