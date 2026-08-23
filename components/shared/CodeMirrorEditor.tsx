"use client";

// All CodeMirror imports are isolated here so they NEVER touch SSR
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { tags as t } from "@lezer/highlight";
import { EditorView } from "@codemirror/view";
import { createTheme } from "@uiw/codemirror-themes";

// ── DSA-themed dark palette ────────────────────────────────────────────────────
const dsaTheme = createTheme({
  theme: "dark",
  settings: {
    background: "transparent",
    foreground: "#d4d4d8",
    caret: "#818cf8",
    selection: "#6366f120",
    selectionMatch: "#6366f115",
    lineHighlight: "#ffffff04",
    gutterBackground: "transparent",
    gutterForeground: "#52525b",
  },
  styles: [
    { tag: t.heading1,              color: "#f4f4f5", fontWeight: "700", fontSize: "1.05em" },
    { tag: t.heading2,              color: "#e4e4e7", fontWeight: "700" },
    { tag: t.heading3,              color: "#d4d4d8", fontWeight: "600" },
    { tag: t.strong,                color: "#f4f4f5", fontWeight: "700" },
    { tag: t.emphasis,              color: "#c4b5fd", fontStyle: "italic" },   // violet italic
    { tag: t.monospace,             color: "#67e8f9", fontFamily: "monospace" }, // cyan code
    { tag: t.string,                color: "#86efac" },                         // green strings
    { tag: t.list,                  color: "#818cf8" },                         // indigo bullets
    { tag: t.quote,                 color: "#a1a1aa", fontStyle: "italic" },
    { tag: t.link,                  color: "#38bdf8", textDecoration: "underline" },
    { tag: t.url,                   color: "#38bdf8" },
    { tag: t.processingInstruction, color: "#6366f1" },  // ## ** ` markers
    { tag: t.operator,              color: "#6366f1" },
    { tag: t.punctuation,           color: "#6366f1" },
    { tag: t.meta,                  color: "#6366f1" },
    { tag: t.comment,               color: "#52525b", fontStyle: "italic" },
  ],
});

const editorTheme = EditorView.theme({
  "&":                    { fontSize: "13px", fontFamily: "ui-monospace, 'Cascadia Code', 'Fira Code', monospace" },
  ".cm-content":          { padding: "10px 12px" },
  ".cm-line":             { lineHeight: "1.7" },
  ".cm-cursor":           { borderLeftColor: "#818cf8", borderLeftWidth: "2px" },
  ".cm-focused":          { outline: "none" },
  ".cm-activeLine":       { backgroundColor: "transparent" },
  ".cm-gutters":          { display: "none" },
  ".cm-placeholder":      { color: "#52525b", fontStyle: "italic", fontFamily: "ui-sans-serif, sans-serif" },
});

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}

export default function CodeMirrorEditor({ value, onChange, placeholder, rows = 4 }: Props) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      theme={dsaTheme}
      extensions={[markdown(), EditorView.lineWrapping, editorTheme]}
      placeholder={placeholder}
      minHeight={`${rows * 24}px`}
      basicSetup={{
        lineNumbers:              false,
        foldGutter:               false,
        dropCursor:               false,
        allowMultipleSelections:  false,
        indentOnInput:            true,
        bracketMatching:          false,
        closeBrackets:            false,
        autocompletion:           false,
        highlightActiveLine:      false,
        highlightSelectionMatches:false,
        syntaxHighlighting:       true,
      }}
    />
  );
}
