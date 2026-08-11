"use client";

import { useState } from "react";
import { Eye, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotesEditorProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}

/** Very lightweight markdown renderer — no dependencies */
function renderMarkdown(text: string): string {
  if (!text) return "<p class=\"text-zinc-600 italic text-xs\">No notes yet.</p>";
  return text
    // Escape HTML
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    // Code blocks (``` ```)
    .replace(/```([\s\S]*?)```/g, "<pre class=\"bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-indigo-300 my-2 overflow-x-auto whitespace-pre\">$1</pre>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code class=\"bg-zinc-900 text-indigo-300 px-1 rounded text-xs font-mono\">$1</code>")
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, "<strong class=\"text-zinc-100 font-semibold\">$1</strong>")
    // Italic
    .replace(/\*([^*]+)\*/g, "<em class=\"text-zinc-300\">$1</em>")
    // Headers
    .replace(/^### (.+)$/gm, "<h3 class=\"text-sm font-semibold text-zinc-200 mt-3 mb-1\">$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 class=\"text-sm font-bold text-zinc-100 mt-3 mb-1\">$1</h2>")
    .replace(/^# (.+)$/gm, "<h1 class=\"text-base font-bold text-zinc-100 mt-3 mb-1\">$1</h1>")
    // Bullet lists
    .replace(/^[-*] (.+)$/gm, "<li class=\"text-xs text-zinc-300 ml-3 list-disc list-inside\">$1</li>")
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, "<li class=\"text-xs text-zinc-300 ml-3 list-decimal list-inside\">$1</li>")
    // Line breaks → paragraphs
    .replace(/\n\n+/g, "</p><p class=\"text-xs text-zinc-400 leading-relaxed mt-2\">")
    .replace(/\n/g, "<br/>")
    // Wrap in paragraph
    .replace(/^(?!<[hlp]|<pre|<li)(.+)$/gm, (m) => m.startsWith("<") ? m : `<span class="text-xs text-zinc-400 leading-relaxed">${m}</span>`);
}

export function NotesEditor({ value, onChange, placeholder = "Write your learning notes, mistakes, key insights...\n\nSupports **markdown**: `code`, **bold**, lists, headers", rows = 4 }: NotesEditorProps) {
  const [mode, setMode] = useState<"write" | "preview">("write");

  return (
    <div className="rounded-lg border border-zinc-700 overflow-hidden bg-zinc-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/80">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMode("write")}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors",
              mode === "write" ? "bg-zinc-700 text-zinc-200" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Edit3 className="w-3 h-3" /> Write
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors",
              mode === "preview" ? "bg-zinc-700 text-zinc-200" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Eye className="w-3 h-3" /> Preview
          </button>
        </div>
        <span className="text-[9px] text-zinc-700">**bold** `code` # header - list</span>
      </div>

      {/* Editor area */}
      {mode === "write" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          onKeyDown={(e) => {
            // Tab → 2 spaces
            if (e.key === "Tab") {
              e.preventDefault();
              const el = e.currentTarget;
              const start = el.selectionStart;
              const end = el.selectionEnd;
              const newVal = value.substring(0, start) + "  " + value.substring(end);
              onChange(newVal);
              setTimeout(() => el.setSelectionRange(start + 2, start + 2), 0);
            }
          }}
          className="w-full px-3 py-2.5 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none resize-none font-mono leading-relaxed"
        />
      ) : (
        <div
          className="px-3 py-2.5 min-h-[100px] prose-sm"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
        />
      )}
    </div>
  );
}

/** Read-only markdown renderer for the notes popup */
export function NotesRenderer({ text }: { text: string }) {
  return (
    <div
      className="prose-sm"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
    />
  );
}
