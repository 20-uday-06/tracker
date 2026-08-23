"use client";

import { useState, useEffect } from "react";
import { Eye, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

// ── Lazy-load CodeMirror (SSR incompatible, heavy bundle) ─────────────────────
const CodeMirrorEditor = dynamic(
  () => import("./CodeMirrorEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="px-3 py-2.5 min-h-[96px] flex items-center">
        <span className="text-xs text-zinc-600 italic">Loading editor...</span>
      </div>
    ),
  }
);

// ── Markdown renderer (preview mode) ─────────────────────────────────────────
function renderMarkdown(text: string): string {
  if (!text) return "<p class=\"text-zinc-600 italic text-xs\">No notes yet.</p>";
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/```(?:[a-z0-9]*)?\n([\s\S]*?)```/g, "<pre class=\"bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-300 my-2 overflow-x-auto whitespace-pre\">$1</pre>")
    .replace(/```([\s\S]*?)```/g, "<pre class=\"bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-300 my-2 overflow-x-auto whitespace-pre\">$1</pre>")
    .replace(/`([^`]+)`/g, "<code class=\"bg-zinc-900 text-zinc-300 px-1 rounded text-xs font-mono\">$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong class=\"text-zinc-100 font-semibold\">$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em class=\"text-violet-300\">$1</em>")
    .replace(/^### (.+)$/gm, "<h3 class=\"text-sm font-semibold text-zinc-200 mt-3 mb-1\">$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 class=\"text-sm font-bold text-zinc-100 mt-3 mb-1\">$1</h2>")
    .replace(/^# (.+)$/gm, "<h1 class=\"text-base font-bold text-zinc-100 mt-3 mb-1\">$1</h1>")
    .replace(/^[-*] (.+)$/gm, "<li class=\"text-xs text-zinc-300 ml-3 list-disc list-inside\">$1</li>")
    .replace(/^\d+\. (.+)$/gm, "<li class=\"text-xs text-zinc-300 ml-3 list-decimal list-inside\">$1</li>")
    .replace(/\n\n+/g, "</p><p class=\"text-xs text-zinc-400 leading-relaxed mt-2\">")
    .replace(/\n/g, "<br/>")
    .replace(/^(?!<[hlp]|<pre|<li)(.+)$/gm, (m) => m.startsWith("<") ? m : `<span class="text-xs text-zinc-400 leading-relaxed">${m}</span>`);
}

interface NotesEditorProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}

export function NotesEditor({
  value,
  onChange,
  placeholder = "# Key Insight\nWrite your notes...\n\n**Mistake**: what went wrong\n`code snippet`\n- bullet point",
  rows = 4,
}: NotesEditorProps) {
  const [mode, setMode] = useState<"write" | "preview">("write");

  return (
    <div className="rounded-lg border border-zinc-700 overflow-hidden bg-zinc-900/60">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/80">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setMode("write")}
            className={cn("flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors",
              mode === "write" ? "bg-zinc-700 text-zinc-200" : "text-zinc-500 hover:text-zinc-300"
            )}>
            <Edit3 className="w-3 h-3" /> Write
          </button>
          <button type="button" onClick={() => setMode("preview")}
            className={cn("flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors",
              mode === "preview" ? "bg-zinc-700 text-zinc-200" : "text-zinc-500 hover:text-zinc-300"
            )}>
            <Eye className="w-3 h-3" /> Preview
          </button>
        </div>
        <span className="text-[9px] text-zinc-700">
          <span className="text-indigo-500 font-bold">#</span> heading &nbsp;
          <span className="text-zinc-100 font-bold">**bold**</span> &nbsp;
          <span className="text-cyan-600 font-mono">`code`</span> &nbsp;
          <span className="text-zinc-500">- list</span>
        </span>
      </div>

      {/* Write mode */}
      {mode === "write" && (
        <CodeMirrorEditor value={value} onChange={onChange} placeholder={placeholder} rows={rows} />
      )}

      {/* Preview mode */}
      {mode === "preview" && (
        <CodeMirrorEditor value={value} readOnly={true} rows={rows} />
      )}
    </div>
  );
}

/** Read-only markdown renderer for the notes popup */
export function NotesRenderer({ text }: { text: string }) {
  if (!text) return <p className="text-zinc-600 italic text-xs px-3 py-2">No notes yet.</p>;
  return (
    <div className="rounded-lg border border-zinc-700 overflow-hidden bg-zinc-900/60">
      <CodeMirrorEditor value={text} readOnly={true} />
    </div>
  );
}
