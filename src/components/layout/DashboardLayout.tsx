
import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Navbar />
        <main className="container py-6 px-4 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
