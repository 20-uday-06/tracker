"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Settings,
  Plus,
  Flame,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { AddProblemDialog } from "@/components/problems/AddProblemDialog";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/problems", label: "Problems", icon: BookOpen },
  { href: "/reattempt", label: "Reattempt", icon: RefreshCw },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/progress", label: "Progress", icon: TrendingUp },
];

export function Sidebar() {
  const pathname = usePathname();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <aside className="w-[220px] min-w-[220px] h-screen flex flex-col border-r border-zinc-800/60 bg-[#0a0a0c]">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-zinc-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-100 leading-none">DSA Tracker</p>
              <p className="text-[10px] text-zinc-500 mt-0.5 leading-none">Placement Prep</p>
            </div>
          </div>
        </div>

        {/* Add Problem Button */}
        <div className="px-3 pt-4 pb-2">
          <button
            onClick={() => setAddOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium hover:bg-indigo-500/15 hover:border-indigo-500/30 transition-all duration-150 group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            Add Problem
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pt-1 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-150",
                  isActive
                    ? "bg-zinc-800 text-zinc-100 font-medium"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 space-y-0.5 border-t border-zinc-800/60 pt-3">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-150",
              pathname === "/settings"
                ? "bg-zinc-800 text-zinc-100 font-medium"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            )}
          >
            <Settings className="w-4 h-4 shrink-0" />
            Settings
          </Link>
          <div className="px-3 py-2">
            <p className="text-[10px] text-zinc-600">
              Press{" "}
              <kbd className="px-1 py-0.5 rounded text-[9px] bg-zinc-800 text-zinc-400 font-mono border border-zinc-700">
                ⌘K
              </kbd>{" "}
              for commands
            </p>
          </div>
        </div>
      </aside>

      <AddProblemDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
