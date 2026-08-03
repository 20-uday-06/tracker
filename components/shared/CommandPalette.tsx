"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, LayoutDashboard, BookOpen, RefreshCw, BarChart3, TrendingUp, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type CommandItem = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  action?: string;
  href?: string;
};

type CommandGroup = {
  group: string;
  items: CommandItem[];
};

const COMMANDS: CommandGroup[] = [
  {
    group: "Actions",
    items: [
      { id: "add-problem", label: "Add Problem", description: "Log a new problem", icon: Plus, action: "add-problem" },
    ],
  },
  {
    group: "Navigate",
    items: [
      { id: "dashboard", label: "Dashboard", description: "Overview & streak", icon: LayoutDashboard, href: "/" },
      { id: "problems", label: "Problems", description: "Problem database", icon: BookOpen, href: "/problems" },
      { id: "reattempt", label: "Reattempt", description: "Review queue", icon: RefreshCw, href: "/reattempt" },
      { id: "analytics", label: "Analytics", description: "Charts & insights", icon: BarChart3, href: "/analytics" },
      { id: "progress", label: "Progress", description: "NeetCode / Striver / CP-31", icon: TrendingUp, href: "/progress" },
    ],
  },
];

let globalOpenAddDialog: (() => void) | null = null;
export function setGlobalOpenAddDialog(fn: () => void) {
  globalOpenAddDialog = fn;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
        setSelectedIndex(0);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const allItems = COMMANDS.flatMap((g) => g.items);

  const filtered = query
    ? allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  const executeItem = useCallback(
    (item: CommandItem) => {
      if (item.action === "add-problem") {
        setOpen(false);
        setTimeout(() => {
          // Dispatch a custom event that the sidebar listens to
          window.dispatchEvent(new CustomEvent("open-add-problem"));
        }, 100);
      } else if ("href" in item && item.href) {
        router.push(item.href);
        setOpen(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) executeItem(filtered[selectedIndex]);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, filtered, selectedIndex, executeItem]);

  if (!open) return null;

  // Build grouped display
  const groupedFiltered = query
    ? [{ group: "Results", items: filtered }]
    : COMMANDS;

  let itemIndexCounter = 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="relative z-10 w-full max-w-md bg-[#111113] border border-zinc-700 rounded-xl shadow-2xl animate-slide-up overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <Search className="w-4 h-4 text-zinc-500 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none"
          />
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] text-zinc-500 bg-zinc-800 border border-zinc-700 rounded font-mono">
            ESC
          </kbd>
        </div>

        {/* Commands list */}
        <div className="py-2 max-h-72 overflow-y-auto">
          {groupedFiltered.map((group) => (
            <div key={group.group}>
              {!query && (
                <p className="px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                  {group.group}
                </p>
              )}
              {group.items.map((item) => {
                const globalIdx = itemIndexCounter++;
                const Icon = item.icon;
                const isSelected = globalIdx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => executeItem(item)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                      isSelected ? "bg-zinc-800" : "hover:bg-zinc-800/50"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-md flex items-center justify-center",
                      isSelected ? "bg-indigo-500/20" : "bg-zinc-800"
                    )}>
                      <Icon className={cn("w-3.5 h-3.5", isSelected ? "text-indigo-400" : "text-zinc-500")} />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-200">{item.label}</p>
                      <p className="text-xs text-zinc-500">{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-sm text-zinc-500 text-center">No results for &quot;{query}&quot;</p>
          )}
        </div>

        <div className="px-4 py-2 border-t border-zinc-800 flex items-center gap-3 text-[10px] text-zinc-600">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
