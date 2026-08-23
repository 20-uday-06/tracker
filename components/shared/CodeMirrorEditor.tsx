"use client";

// All CodeMirror imports are isolated here so they NEVER touch SSR
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { cpp } from "@codemirror/lang-cpp";
import { tags as t } from "@lezer/highlight";
import { EditorView } from "@codemirror/view";
import { createTheme } from "@uiw/codemirror-themes";

// ── DSA-themed dark palette (VS Code style syntax highlighting) ──────────────
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
    // Markdown basics
    { tag: t.heading1,              color: "#f4f4f5", fontWeight: "700", fontSize: "1.05em" },
    { tag: t.heading2,              color: "#e4e4e7", fontWeight: "700" },
    { tag: t.heading3,              color: "#d4d4d8", fontWeight: "600" },
    { tag: t.strong,                color: "#f4f4f5", fontWeight: "700" },
    { tag: t.emphasis,              color: "#c4b5fd", fontStyle: "italic" },
    { tag: t.list,                  color: "#818cf8" },
    { tag: t.quote,                 color: "#a1a1aa", fontStyle: "italic" },
    { tag: t.link,                  color: "#38bdf8", textDecoration: "underline" },
    { tag: t.url,                   color: "#38bdf8" },
    { tag: t.processingInstruction, color: "#6366f1" },  // ## ** ` markers
    
    // Code Syntax Highlighting (VS Code One Dark inspired)
    { tag: t.keyword,               color: "#c678dd" }, // Purple for keywords (if, return, int, const)
    { tag: t.function(t.variableName), color: "#61afef" }, // Blue for function names
    { tag: t.variableName,          color: "#e06c75" }, // Red/Pink for variables
    { tag: t.propertyName,          color: "#e06c75" }, // Red/Pink for properties
    { tag: t.className,             color: "#e5c07b" }, // Yellow for classes
    { tag: t.typeName,              color: "#e5c07b" }, // Yellow for types
    { tag: t.string,                color: "#98c379" }, // Green for strings
    { tag: t.number,                color: "#d19a66" }, // Orange for numbers
    { tag: t.bool,                  color: "#d19a66" }, // Orange for booleans
    { tag: t.operator,              color: "#56b6c2" }, // Cyan for operators (+, -, =)
    { tag: t.punctuation,           color: "#abb2bf" }, // Gray for punctuation ({, }, ;)
    { tag: t.comment,               color: "#5c6370", fontStyle: "italic" }, // Dim italic for comments
    { tag: t.meta,                  color: "#61afef" }, // Includes #include, annotations
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
  onChange?: (v: string) => void;
  placeholder?: string;
  rows?: number;
  readOnly?: boolean;
}

export default function CodeMirrorEditor({ value, onChange, placeholder, rows = 4, readOnly = false }: Props) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      editable={!readOnly}
      theme={dsaTheme}
      extensions={[
        markdown({ codeLanguages: languages, defaultCodeLanguage: cpp() }), 
        EditorView.lineWrapping, 
        editorTheme
      ]}
      placeholder={placeholder}
      minHeight={`${rows * 24}px`}
      basicSetup={{
        lineNumbers:              false,
        foldGutter:               false,
        dropCursor:               false,
        allowMultipleSelections:  false,
        indentOnInput:            !readOnly,
        bracketMatching:          !readOnly,
        closeBrackets:            !readOnly,
        autocompletion:           false,
        highlightActiveLine:      false,
        highlightSelectionMatches:false,
        syntaxHighlighting:       true,
      }}
    />
  );
}
