"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Bot, 
  FileLock, 
  ShieldCheck, 
  ActivitySquare, 
  FileSignature, 
  AlertTriangle, 
  TerminalSquare, 
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  Plus,
import { Ghost } from "lucide-react";
import { useGhostStore } from "@/store/useGhostStore";
import { toast } from "sonner";

const NAV_ITEMS = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Agents", icon: Bot, href: "/dashboard/agents" },
  { label: "Policies", icon: FileLock, href: "/dashboard/policies" },
  { label: "Approvals", icon: ShieldCheck, href: "/dashboard/approvals", showBadge: true },
  { label: "Audit Log", icon: ActivitySquare, href: "/dashboard/audit" },
  { label: "Proof Viewer", icon: FileSignature, href: "/dashboard/proof" },
  { label: "Disputes", icon: AlertTriangle, href: "/dashboard/disputes" },
  { label: "Developer", icon: TerminalSquare, href: "/dashboard/developer" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, signOut, approvals, fetchData } = useGhostStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth/signin");
    } else {
      fetchData(); // Fetch real data from Supabase
    }
  }, [isAuthenticated, router, fetchData]);

  if (!isAuthenticated) return null;

  const pendingApprovalsCount = approvals.filter(a => a.status === "pending").length;

  const handleSignOut = () => {
    signOut();
    router.replace("/auth/signin");
  };

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden">
      {/* Mobile Header (Hidden on Desktop) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[rgba(8,8,8,0.9)] backdrop-blur-md border-b border-white/[0.06] flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <Ghost className="w-6 h-6 text-white" />
          <span className="font-medium tracking-wider">GHOST</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-white/70 hover:text-white">
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed md:relative top-0 left-0 h-full w-60 
        bg-[rgba(8,8,8,0.9)] backdrop-blur-xl border-r border-white/[0.06]
        flex flex-col z-40 transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? "translate-x-0 pt-16 md:pt-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Desktop Logo */}
        <div className="hidden md:flex h-20 items-center gap-3 px-6 border-b border-white/[0.06]">
          <Ghost className="w-7 h-7 text-white" />
          <span className="font-medium tracking-[0.15em] text-lg">GHOST</span>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group
                  ${isActive 
                    ? "bg-white/[0.06] text-white border-r-2 border-white/40 rounded-r-none" 
                    : "text-white/60 hover:bg-white/[0.03] hover:text-white/90"}
                `}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-white/50 group-hover:text-white/70"}`} />
                <span>{item.label}</span>
                {item.showBadge && pendingApprovalsCount > 0 && (
                  <span className={`
                    ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-mono
                    ${isActive ? "bg-white/20 text-white" : "bg-white/10 text-white/70"}
                  `}>
                    {pendingApprovalsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-white/[0.06]">
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{user?.name || "User"}</div>
                <div className="text-xs text-white/40 truncate">{user?.email || "user@ghost.luma"}</div>
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="p-2 text-white/40 hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pt-0 pt-16">
        {/* Top Header */}
        <header className="h-20 bg-[rgba(8,8,8,0.4)] backdrop-blur-md border-b border-white/[0.06] flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-medium capitalize">
              {pathname.split("/").pop() || "Overview"}
            </h1>
            {/* Breadcrumb would go here if nested */}
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={() => toast.info("Search coming soon", { description: "Advanced filtering will be available in v1.1" })} className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button onClick={() => toast.info("No new notifications", { description: "You are all caught up." })} className="relative p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#b8d4f0]"></span>
            </button>
            <div className="h-6 w-px bg-white/10 mx-2"></div>
            <button className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors">
              <Plus className="w-4 h-4" />
              <span>New Policy</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
