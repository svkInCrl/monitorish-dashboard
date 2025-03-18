
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  progress?: number;
  subtitle?: string;
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  progress,
  subtitle,
  loading = false,
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-6 animate-pulse bg-muted rounded"></div>
        ) : (
          <>
            <div className="text-2xl font-bold">
              {typeof value === "number" ? value.toFixed(1) : value}
              {typeof value === "number" && "%"}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {progress !== undefined && (
              <Progress value={progress} className="h-2 mt-2" />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
