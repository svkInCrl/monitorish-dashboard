
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  ActivitySquare, 
  ChevronLeft, 
  ChevronRight, 
  CpuIcon, 
  File,
  HardDrive, 
  LayoutDashboard, 
  MonitorIcon,
  FileText,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import threatEraseLogo from "@/logo/logo.png";

type SidebarItem = {
  name: string;
  href: string;
  icon: React.ElementType;
};

const items: SidebarItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Process Monitor",
    href: "/process",
    icon: ActivitySquare,
  },
  {
    name: "System Monitor",
    href: "/system",
    icon: MonitorIcon,
  },
  {
    name: "Software Monitor",
    href: "/software",
    icon: CpuIcon,
  },
  {
    name: "Hardware Monitor",
    href: "/hardware",
    icon: HardDrive,
  },
  {
    name: "User Activity",
    href: "/user-activity",
    icon: Users,
  },
  {
    name: "Critical Files",
    href: "/critical-files",
    icon: File,
  },
  {
    name: "Log Monitor",
    href: "/log-monitor",
    icon: FileText,
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div
      className={cn(
        "flex flex-col border-r border-border bg-sidebar backdrop-blur-xl transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-14 items-center px-4 py-2">
        {!collapsed && (
          <div className="flex items-center space-x-2 transition-opacity duration-200">
            <img src={threatEraseLogo} alt="Threat Erase Logo" className="h-6 w-6" />
            <span className="text-lg font-semibold tracking-tight">Threat Erase</span>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <nav className="flex flex-col gap-1 px-2 py-2">
            {items.map((item) => {
              const isActive = location.pathname === item.href;
              return collapsed ? (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex h-10 items-center justify-center rounded-md transition-colors hover:bg-accent",
                        isActive && "bg-accent"
                      )}
                    >
                      <item.icon className={cn(
                        "h-5 w-5",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className="sr-only">{item.name}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-md px-3 group transition-colors hover:bg-accent",
                    isActive && "bg-accent"
                  )}
                >
                  <item.icon 
                    className={cn(
                      "h-5 w-5 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )} 
                  />
                  <span 
                    className={cn(
                      "flex-1 truncate text-sm transition-colors",
                      isActive ? "font-medium text-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </div>
      <div className="p-2">
        <Button
          variant="outline"
          size="icon"
          className="w-full h-10 justify-center"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
}
