"use client";

import { useState } from "react";
import { Eye, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

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

// ── Markdown Preview Component ───────────────────────────────────────────────
function MarkdownPreview({ text }: { text: string }) {
  if (!text) return <p className="text-zinc-600 italic text-xs px-3 py-2">No notes yet.</p>;

  return (
    <div className="px-3 py-2.5 min-h-[96px] prose prose-sm prose-invert max-w-none prose-pre:p-0 prose-pre:bg-transparent prose-pre:my-2 prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:text-sm prose-headings:text-zinc-100 prose-a:text-indigo-400 prose-strong:text-zinc-100">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            // Default to cpp if no language specified and it's a block
            const lang = match ? match[1] : (inline ? "" : "cpp");
            
            return !inline ? (
              <SyntaxHighlighter
                {...props}
                style={vscDarkPlus as any}
                language={lang}
                PreTag="div"
                className="rounded-md border border-zinc-700/60 !m-0 !bg-[#1e1e1e]"
                customStyle={{ padding: "0.75rem", fontSize: "0.85em", background: "#1e1e1e" }}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code {...props} className="bg-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded text-xs font-mono">
                {children}
              </code>
            );
          }
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
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
        <MarkdownPreview text={value} />
      )}
    </div>
  );
}

/** Read-only markdown renderer for the notes popup */
export function NotesRenderer({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-zinc-700 overflow-hidden bg-zinc-900/60">
      <MarkdownPreview text={text} />
    </div>
  );
}
