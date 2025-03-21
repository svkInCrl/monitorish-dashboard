
import React from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Clock } from "lucide-react";

export type TimePeriod = "live" | "day" | "week" | "month" | "year";

interface TimePeriodSelectorProps {
  value: TimePeriod;
  onChange: (value: TimePeriod) => void;
  className?: string;
}

export function TimePeriodSelector({ 
  value, 
  onChange, 
  className 
}: TimePeriodSelectorProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Clock className="h-4 w-4 text-muted-foreground" />
      <Select 
        value={value} 
        onValueChange={(value: TimePeriod) => onChange(value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select time period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="live">Live (60 seconds)</SelectItem>
          <SelectItem value="day">Last 24 Hours</SelectItem>
          <SelectItem value="week">Last Week</SelectItem>
          <SelectItem value="month">Last Month</SelectItem>
          <SelectItem value="year">Last Year</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
