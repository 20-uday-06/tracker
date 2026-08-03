"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Trash2, AlertTriangle, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SOURCE_LABELS } from "@/lib/types";
import type { DailyTarget } from "@/lib/types";

const SOURCES = ["NeetCode150", "StriverSDE", "CP31", "Reattempt"];

export default function SettingsPage() {
  const qc = useQueryClient();
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const { data: currentTargets = [] } = useQuery<DailyTarget[]>({
    queryKey: ["targets"],
    queryFn: () => fetch("/api/targets").then((r) => r.json()),
    onSuccess: (data: DailyTarget[]) => {
      const t: Record<string, string> = {};
      for (const item of data) t[item.source] = String(item.count);
      setTargets(t);
    },
  } as any);

  const handleSaveTargets = async () => {
    setSaving(true);
    for (const [source, countStr] of Object.entries(targets)) {
      if (!countStr) continue;
      await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, count: parseInt(countStr) }),
      });
    }
    qc.invalidateQueries({ queryKey: ["targets"] });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = async () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    setResetting(true);
    await fetch("/api/reset", { method: "POST" });
    qc.invalidateQueries();
    setResetting(false);
    setConfirmReset(false);
    alert("All data cleared. You can now seed fresh demo data or start tracking.");
  };

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="max-w-[700px] mx-auto px-6 py-8 space-y-8">
        <h1 className="text-xl font-semibold text-zinc-100">Settings</h1>

        {/* Daily Targets */}
        <section className="bg-[#111113] border border-zinc-800 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-100">Daily Problem Targets</h2>
            <p className="text-xs text-zinc-500 mt-1">Set daily problem targets per source. These drive the progress bars on your Dashboard.</p>
          </div>
          <div className="px-5 py-4 space-y-4">
            {SOURCES.map((src) => {
              const currentTarget = currentTargets.find((t) => t.source === src);
              return (
                <div key={src} className="flex items-center gap-4">
                  <label className="w-32 text-sm text-zinc-300">{SOURCE_LABELS[src] || src}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={targets[src] ?? (currentTarget ? currentTarget.count : "")}
                      onChange={(e) => setTargets((t) => ({ ...t, [src]: e.target.value }))}
                      placeholder="0"
                      className="w-20 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 text-center font-mono-num"
                    />
                    <span className="text-sm text-zinc-500">problems</span>
                    {currentTarget && (
                      <span className="text-xs text-zinc-600">({currentTarget.count} current)</span>
                    )}
                  </div>
                </div>
              );
            })}
            <button
              onClick={handleSaveTargets}
              disabled={saving}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all mt-2",
                saved ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-indigo-600 text-white hover:bg-indigo-500"
              )}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? "Saved!" : "Save Targets"}
            </button>
          </div>
        </section>

        {/* Streak Configuration */}
        <section className="bg-[#111113] border border-zinc-800 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-100">Streak Criteria</h2>
            <p className="text-xs text-zinc-500 mt-1">A day is active if you log at least 1 problem OR 30 minutes of focus time.</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs text-zinc-600">Streak configuration is fixed at: <span className="text-zinc-400">≥1 problem logged OR ≥30 min focus time</span>. This ensures your streak reflects genuine work.</p>
          </div>
        </section>

        {/* Deployment Info */}
        <section className="bg-[#111113] border border-zinc-800 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-100">Deployment</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="text-xs text-zinc-500">This app is configured for <span className="text-zinc-300">Vercel + Neon PostgreSQL</span>.</p>
            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-4 space-y-2">
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Setup Steps</p>
              <ol className="space-y-1.5 text-xs text-zinc-500">
                <li>1. Create a free database at <a href="https://neon.tech" target="_blank" className="text-indigo-400 hover:text-indigo-300">neon.tech</a></li>
                <li>2. Copy the connection string to <code className="text-zinc-300 bg-zinc-800 px-1 rounded">.env</code></li>
                <li>3. Run <code className="text-zinc-300 bg-zinc-800 px-1 rounded">npm run db:migrate</code> to create tables</li>
                <li>4. Run <code className="text-zinc-300 bg-zinc-800 px-1 rounded">npm run db:seed</code> for demo data</li>
                <li>5. Add <code className="text-zinc-300 bg-zinc-800 px-1 rounded">DATABASE_URL</code> + <code className="text-zinc-300 bg-zinc-800 px-1 rounded">DIRECT_URL</code> to Vercel env vars</li>
                <li>6. Deploy via <code className="text-zinc-300 bg-zinc-800 px-1 rounded">vercel --prod</code> or GitHub integration</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-[#111113] border border-red-900/30 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-red-900/30">
            <h2 className="text-sm font-semibold text-red-400">Danger Zone</h2>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs text-zinc-500 mb-4">
              Clear all data — problems, attempts, sessions, and targets. This cannot be undone.
            </p>
            <button
              onClick={handleReset}
              disabled={resetting}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border transition-all",
                confirmReset
                  ? "bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20"
                  : "border-zinc-700 text-zinc-400 hover:border-red-500/40 hover:text-red-400"
              )}
            >
              {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {confirmReset ? "Click again to confirm" : "Clear All Data"}
            </button>
            {confirmReset && (
              <p className="text-xs text-red-400/70 mt-2">This will permanently delete everything. There is no undo.</p>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
