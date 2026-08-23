"use client";

import { useState, useCallback } from "react";
import { Eye, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import { createTheme } from "@uiw/codemirror-themes";

// ── Custom dark theme to match app palette ────────────────────────────────────
const dsaTheme = createTheme({
  theme: "dark",
  settings: {
    background: "transparent",
    foreground: "#d4d4d8",          // zinc-300
    caret: "#818cf8",               // indigo-400
    selection: "#6366f120",
    selectionMatch: "#6366f115",
    lineHighlight: "#ffffff05",
    gutterBackground: "transparent",
    gutterForeground: "#52525b",    // zinc-600
  },
  styles: [
    // Headings — bold + bright
    { tag: t.heading1,          color: "#f4f4f5", fontWeight: "700", fontSize: "1.05em" },
    { tag: t.heading2,          color: "#e4e4e7", fontWeight: "700" },
    { tag: t.heading3,          color: "#d4d4d8", fontWeight: "600" },
    // Bold / italic
    { tag: t.strong,            color: "#f4f4f5", fontWeight: "700" },
    { tag: t.emphasis,          color: "#c4b5fd", fontStyle: "italic" },  // violet-300
    // Code
    { tag: t.monospace,         color: "#67e8f9", fontFamily: "monospace" }, // cyan-300
    { tag: t.string,            color: "#86efac" },   // green-300
    // List markers
    { tag: t.list,              color: "#818cf8" },   // indigo-400 bullet dots
    { tag: t.quote,             color: "#a1a1aa", fontStyle: "italic" },
    // Links
    { tag: t.link,              color: "#38bdf8", textDecoration: "underline" }, // sky-400
    { tag: t.url,               color: "#38bdf8" },
    // MD punctuation (##, **, *, `)
    { tag: t.processingInstruction, color: "#6366f1" },  // indigo-500
    { tag: t.operator,          color: "#6366f1" },
    { tag: t.punctuation,       color: "#6366f1" },
    { tag: t.meta,              color: "#6366f1" },
    { tag: t.comment,           color: "#52525b", fontStyle: "italic" },
  ],
});

// ── Lazy-load CodeMirror (heavy bundle, SSR incompatible) ─────────────────────
const CodeMirror = dynamic(
  () => import("@uiw/react-codemirror").then((m) => m.default),
  { ssr: false, loading: () => <div className="h-24 animate-pulse bg-zinc-800/30 rounded" /> }
);

// Import markdown extension lazily
let mdExtension: any = null;
async function getMarkdown() {
  if (!mdExtension) {
    const { markdown } = await import("@codemirror/lang-markdown");
    mdExtension = markdown();
  }
  return mdExtension;
}

// ── Markdown renderer (preview mode) ─────────────────────────────────────────
function renderMarkdown(text: string): string {
  if (!text) return "<p class=\"text-zinc-600 italic text-xs\">No notes yet.</p>";
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/```([\s\S]*?)```/g, "<pre class=\"bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-cyan-300 my-2 overflow-x-auto whitespace-pre\">$1</pre>")
    .replace(/`([^`]+)`/g, "<code class=\"bg-zinc-900 text-cyan-300 px-1 rounded text-xs font-mono\">$1</code>")
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

// ── Editor extensions ─────────────────────────────────────────────────────────
const baseExtensions = [
  EditorView.lineWrapping,
  EditorView.theme({
    "&": { fontSize: "13px", fontFamily: "ui-monospace, 'Cascadia Code', 'Fira Code', monospace" },
    ".cm-content": { padding: "10px 12px", minHeight: "96px" },
    ".cm-line": { lineHeight: "1.7" },
    ".cm-cursor": { borderLeftColor: "#818cf8", borderLeftWidth: "2px" },
    ".cm-focused": { outline: "none" },
    ".cm-selectionBackground, ::selection": { backgroundColor: "#6366f125 !important" },
    ".cm-activeLine": { backgroundColor: "transparent" },
    ".cm-gutters": { display: "none" },
    ".cm-placeholder": { color: "#52525b", fontStyle: "italic", fontFamily: "ui-sans-serif" },
  }),
];

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
  const [extensions, setExtensions] = useState(baseExtensions);

  // Load markdown extension on first render
  const loadMd = useCallback(async () => {
    const md = await getMarkdown();
    setExtensions([...baseExtensions, md]);
  }, []);

  // Load on mount
  useState(() => { loadMd(); });

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
          <span className="text-indigo-600">#</span> heading &nbsp;
          <span className="text-zinc-100 font-bold">**bold**</span> &nbsp;
          <span className="text-cyan-600">`code`</span> &nbsp;
          <span className="text-zinc-500">- list</span>
        </span>
      </div>

      {/* Write mode — CodeMirror */}
      {mode === "write" && (
        <CodeMirror
          value={value}
          onChange={onChange}
          theme={dsaTheme}
          extensions={extensions}
          placeholder={placeholder}
          basicSetup={{
            lineNumbers: false,
            foldGutter: false,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: true,
            bracketMatching: false,
            closeBrackets: false,
            autocompletion: false,
            highlightActiveLine: false,
            highlightSelectionMatches: false,
            syntaxHighlighting: true,
          }}
          style={{ minHeight: `${rows * 24}px` }}
        />
      )}

      {/* Preview mode */}
      {mode === "preview" && (
        <div
          className="px-3 py-2.5 min-h-[96px]"
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
