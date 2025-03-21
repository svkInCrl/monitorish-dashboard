
import React from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  variant?: "error" | "warning";
}

export function ErrorMessage({ 
  message, 
  variant = "error" 
}: ErrorMessageProps) {
  const bgColor = variant === "error" ? "bg-red-50" : "bg-amber-50";
  const textColor = variant === "error" ? "text-red-500" : "text-amber-500";

  return (
    <div className={`p-4 ${textColor} ${bgColor} rounded-md`}>
      <AlertTriangle className="h-4 w-4 inline mr-2" />
      {message}
    </div>
  );
}
