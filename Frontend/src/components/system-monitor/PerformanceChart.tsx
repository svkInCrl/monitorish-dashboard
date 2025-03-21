
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SystemMetrics } from "@/hooks/useMetrics";
import { TimePeriod } from "@/components/TimePeriodSelector";

interface PerformanceChartProps {
  data: any[];
  isLoading: boolean;
  timePeriod: TimePeriod;
}

export function PerformanceChart({
  data,
  isLoading,
  timePeriod,
}: PerformanceChartProps) {
  const getPeriodDescription = () => {
    switch(timePeriod) {
      case "live": return "the last 60 seconds (live)";
      case "day": return "the last 24 hours";
      case "week": return "the last week";
      case "month": return "the last month";
      case "year": return "the last year";
      default: return "selected period";
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Performance</CardTitle>
        <CardDescription>
          CPU and memory usage over {getPeriodDescription()}
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
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cpu"
                  name="CPU Usage"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="ram"
                  name="Memory Usage"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
