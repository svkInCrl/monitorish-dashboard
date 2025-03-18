
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProcessMonitor from "./pages/ProcessMonitor";
import SystemMonitor from "./pages/SystemMonitor";
import SoftwareMonitor from "./pages/SoftwareMonitor";
import HardwareMonitor from "./pages/HardwareMonitor";
import UserActivityMonitor from "./pages/UserActivityMonitor";
import CriticalFiles from "./pages/CriticalFiles";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/process" element={<ProcessMonitor />} />
            <Route path="/system" element={<SystemMonitor />} />
            <Route path="/software" element={<SoftwareMonitor />} />
            <Route path="/hardware" element={<HardwareMonitor />} />
            <Route path="/user-activity" element={<UserActivityMonitor />} />
            <Route path="/critical-files" element={<CriticalFiles />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
