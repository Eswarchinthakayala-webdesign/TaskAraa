// src/pages/FolderView.jsx
// -------------------------------------------------------------
// UPDATED: Robust fenced-code rendering (no [object Object]),
//          Copy-to-clipboard for code, safe language ribbons,
//          consistent Markdown preview, and small UX upgrades.
//          Built for your existing stack: React + shadcn/ui + Tailwind + Supabase.
//
// Notes:
// 1) The main fix is in <CodeBlock/>: we ensure we use the `node` AST when present
//    to extract raw text for clipboard, and we render `children` (React nodes)
//    for display so rehype-highlight's spans/classes remain intact.
// 2) ReactMarkdown can pass nested nodes; we now flatten safely for copying.
// 3) Kept your AI generation, TTS, sharing, and PDF download flows intact.
// 4) Added optional line numbers toggle (off by default).
// -------------------------------------------------------------

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Trash2,
  PlusCircle,
  ArrowLeft,
  Edit,
  Download,
  Share2,
  Volume2,
  VolumeX,
  Sparkles,
  ExternalLink,
  Square,
  ClipboardCopy,
  ClipboardCheck,
  RefreshCw,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateNoteWithGemini } from "@/lib/noteGemini";
import { downloadNotePDF } from "@/utils/NotePDF";
import "highlight.js/styles/github-dark.css";

// -------------------------------------------------------------
// Config toggles
// -------------------------------------------------------------
const CODE_BLOCK_LINE_NUMBERS = false; // set true if you want line numbers in code blocks

// -------------------------------------------------------------
// Clipboard helpers
// -------------------------------------------------------------
async function copyToClipboard(text, silent = false) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      textarea.style.pointerEvents = "none";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (!ok) throw new Error("execCommand failed");
    }
    if (!silent) toast.success("Copied to clipboard");
    return true;
  } catch (err) {
    if (!silent) toast.error("Copy failed");
    return false;
  }
}

// -------------------------------------------------------------
// Language helpers
// -------------------------------------------------------------
function extractLang(className = "") {
  const m =
    /language-([\w-]+)/i.exec(className) ||
    /lang(?:uage)?-([\w-]+)/i.exec(className);
  return m ? m[1] : "";
}

function prettyLang(lang) {
  const map = {
    js: "JavaScript",
    jsx: "JSX",
    ts: "TypeScript",
    tsx: "TSX",
    py: "Python",
    rb: "Ruby",
    rs: "Rust",
    c: "C",
    cpp: "C++",
    cxx: "C++",
    cs: "C#",
    java: "Java",
    kt: "Kotlin",
    go: "Go",
    php: "PHP",
    swift: "Swift",
    md: "Markdown",
    sh: "Shell",
    bash: "Bash",
    zsh: "Zsh",
    html: "HTML",
    css: "CSS",
    scss: "SCSS",
    less: "Less",
    json: "JSON",
    yaml: "YAML",
    yml: "YAML",
    sql: "SQL",
    dart: "Dart",
    lua: "Lua",
    hs: "Haskell",
    r: "R",
  };
  if (!lang) return "";
  return map[lang.toLowerCase()] || lang;
}

// -------------------------------------------------------------
// Safe text extraction from ReactMarkdown's node children
// -------------------------------------------------------------
function nodeToPlainText(node) {
  // node is usually an mdast/unist node (for code blocks)
  // we walk recursively and grab 'value' from text nodes
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) {
    return node.map(nodeToPlainText).join("");
  }
  // node is object
  if (node.value && typeof node.value === "string") return node.value;
  if (node.children && Array.isArray(node.children)) {
    return node.children.map(nodeToPlainText).join("");
  }
  return "";
}

// Fallback extractor for React children when node isn't available
function childrenToPlainString(children) {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) {
    // join string children and descend into React elements with props.children if present
    return children
      .map((c) => {
        if (typeof c === "string") return c;
        // React elements: try props.children
        if (c && c.props && c.props.children) {
          return childrenToPlainString(c.props.children);
        }
        return "";
      })
      .join("");
  }
  // React element
  try {
    if (children && children.props && children.props.children) {
      return childrenToPlainString(children.props.children);
    }
  } catch (e) {
    // ignore
  }
  return "";
}

// -------------------------------------------------------------
// CodeBlock Component (robust & copy-friendly)
// -------------------------------------------------------------
import { useState as useReactState } from "react"; // local state inside CodeBlock
function CodeBlock({ inline, className, children, node, ...props }) {
  // Inline code (simple)
  if (inline) {
    // children may be array or string
    const inlineText = childrenToPlainString(children) || String(children || "");
    return (
      <code
        className="bg-[#0f1029]/80 text-purple-300 px-1 py-0.5 rounded border border-purple-900/30"
        {...props}
      >
        {inlineText}
      </code>
    );
  }

  // For block code: derive plain raw text for copy/line numbers from `node` if available,
  // otherwise fall back to children.
  const rawFromNode = node ? nodeToPlainText(node) : "";
  const rawFallback = childrenToPlainString(children);
  const raw = (rawFromNode && rawFromNode.trimEnd()) || (rawFallback && rawFallback.trimEnd()) || "";

  const lang = prettyLang(extractLang(className));
  const [copied, setCopied] = useReactState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(raw, true);
    if (ok) {
      setCopied(true);
      toast.success("Code copied");
      setTimeout(() => setCopied(false), 1500);
    } else {
      toast.error("Copy failed");
    }
  };

  // Prepare line numbers if enabled
  const lines = CODE_BLOCK_LINE_NUMBERS ? raw.split("\n") : null;

  // Display: render `children` React nodes directly (they include rehype-highlight spans)
  // This preserves highlighting DOM structure. For copy we use `raw`.
  return (
    <div className="relative group my-3">
      {/* Ribbon for language */}
      {lang ? (
        <div className="absolute left-2 top-2 z-10 text-[11px] font-medium rounded px-2 py-0.5 bg-black/40 border border-white/10 backdrop-blur text-purple-100">
          {lang}
        </div>
      ) : null}

      {/* Copy button */}
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity rounded-md border border-white/10 bg-black/40 hover:bg-black/60 backdrop-blur px-2.5 py-1 text-xs font-medium flex items-center gap-1"
        title="Copy code"
      >
        {copied ? <ClipboardCheck size={14} /> : <ClipboardCopy size={14} />}
        <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
      </button>

      {/* Render highlighted code (children). If line numbers enabled, render two-column layout. */}
      <pre
        className="prose-pre:bg-[#0f1029] prose-pre:rounded-lg prose-pre:border prose-pre:border-purple-900/30 overflow-x-auto !m-0 p-4"
        {...props}
      >
        {CODE_BLOCK_LINE_NUMBERS ? (
          <code className={`${className || ""} grid grid-cols-[auto_1fr] gap-x-3`}>
            <span aria-hidden="true" className="pr-3 text-zinc-500 text-right select-none">
              {lines.map((_, i) => (
                <span key={i} className="block leading-6">{i + 1}</span>
              ))}
            </span>
            {/* Render children with preserved markup for highlighting. Use whitespace-pre to keep formatting */}
            <span className="whitespace-pre leading-6 break-words">
              {children}
            </span>
          </code>
        ) : (
          // No line numbers: just render children so rehype-highlight markup shows
          <code className={className} style={{ whiteSpace: "pre" }}>
            {children}
          </code>
        )}
      </pre>
    </div>
  );
}

// -------------------------------------------------------------
// MarkdownRenderer (shared across preview, AI tab, card snippet)
// -------------------------------------------------------------
function MarkdownRenderer({ content, clamp = false }) {
  const components = useMemo(
    () => ({
      code: CodeBlock,
      p: ({ node, children, ...props }) => (
        <p {...props} className={`${props.className || ""} !mb-3`}>
          {children}
        </p>
      ),
      pre: ({ node, children, ...props }) => (
        <div className="my-3">
          <pre {...props} className={`${props.className || ""} !m-0`}>
            {children}
          </pre>
        </div>
      ),
      ul: ({ node, children, ...props }) => (
        <ul {...props} className={`${props.className || ""} list-disc pl-6 my-3`}>
          {children}
        </ul>
      ),
      ol: ({ node, children, ...props }) => (
        <ol {...props} className={`${props.className || ""} list-decimal pl-6 my-3`}>
          {children}
        </ol>
      ),
      h1: ({ node, children, ...props }) => (
        <h1 {...props} className="text-2xl font-bold mt-4 mb-2">
          {children}
        </h1>
      ),
      h2: ({ node, children, ...props }) => (
        <h2 {...props} className="text-xl font-semibold mt-4 mb-2">
          {children}
        </h2>
      ),
      h3: ({ node, children, ...props }) => (
        <h3 {...props} className="text-lg font-semibold mt-3 mb-2">
          {children}
        </h3>
      ),
      blockquote: ({ node, children, ...props }) => (
        <blockquote
          {...props}
          className="border-l-4 border-purple-900/40 pl-4 py-1 my-3 bg-black/20 rounded-r"
        >
          {children}
        </blockquote>
      ),
      table: ({ node, children, ...props }) => (
        <div className="w-full overflow-x-auto my-3 rounded-lg border border-zinc-800">
          <table {...props} className="min-w-full">{children}</table>
        </div>
      ),
      th: ({ node, children, ...props }) => (
        <th {...props} className="px-3 py-2 text-left bg-zinc-900/60 border-b border-zinc-800">
          {children}
        </th>
      ),
      td: ({ node, children, ...props }) => (
        <td {...props} className="px-3 py-2 border-b border-zinc-800">{children}</td>
      ),
      a: ({ node, href, children, ...props }) => (
        <a {...props} href={href} target="_blank" rel="noreferrer" className="text-purple-300 hover:underline">
          {children}
        </a>
      ),
    }),
    []
  );

  return (
    <div
      className={[
        "prose prose-invert max-w-none",
        "prose-pre:bg-[#0f1029] prose-pre:rounded-lg prose-pre:border prose-pre:border-purple-900/30",
        "prose-code:text-purple-300",
        clamp ? "line-clamp-4" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
}

// -------------------------------------------------------------
// Small Utility Components
// -------------------------------------------------------------
function EmptyState({ onCreate, onReload }) {
  return (
    <div className="border border-dashed border-zinc-700/60 rounded-2xl p-8 text-center bg-[#101028]/40">
      <h3 className="text-lg font-semibold text-purple-300">No notes yet</h3>
      <p className="text-sm text-zinc-400 mt-1">Create your first note or reload if you think something is missing.</p>
      <div className="flex items-center justify-center gap-2 mt-4">
        <Button onClick={onCreate} className="gap-2">
          <PlusCircle size={16} /> New Note
        </Button>
        <Button onClick={onReload} variant="secondary" className="gap-2">
          <RefreshCw size={16} /> Reload
        </Button>
      </div>
    </div>
  );
}

function LoadingHeader() {
  return (
    <div className="h-6 w-48 bg-zinc-800/60 rounded animate-pulse" />
  );
}

function NoteSkeleton() {
  return (
    <Card className="bg-[#1b1b2f] border-zinc-700/60 rounded-xl">
      <CardContent className="p-4">
        <div className="h-4 w-40 bg-zinc-800/60 rounded mb-2 animate-pulse" />
        <div className="h-3 w-24 bg-zinc-800/60 rounded mb-4 animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-zinc-800/60 rounded animate-pulse" />
          <div className="h-3 w-5/6 bg-zinc-800/60 rounded animate-pulse" />
          <div className="h-3 w-4/6 bg-zinc-800/60 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

// -------------------------------------------------------------
// NoteCard extracted for clarity
// -------------------------------------------------------------
function NoteCard({ note, onOpen, onEdit, onDelete, onReadToggle, isSpeaking, onDownload, onShare }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }}>
      <Card className="bg-[#1b1b2f] border-zinc-700/60 hover:border-purple-700/50 transition relative group rounded-xl">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex justify-between items-start gap-3">
            <div>
              <button onClick={onOpen} className="text-lg font-semibold text-purple-400 hover:underline flex items-center gap-1">
                {note.title}
                <ExternalLink size={14} className="opacity-60" />
              </button>
              <p className="text-xs text-gray-400 mb-2">
                Updated {new Date(note.updated_at || note.created_at).toLocaleString()}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
              <Button variant="ghost" size="icon" className="hover:bg-black cursor-pointer" onClick={onEdit} title="Edit">
                <Edit size={16} className="text-blue-400" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onReadToggle}
                title={isSpeaking ? "Stop reading" : "Read"}
                className="hover:bg-black cursor-pointer"
              >
                {isSpeaking ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} className="text-green-400" />}
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-black cursor-pointer" onClick={onDownload} title="Download PDF">
                <Download size={16} className="text-yellow-400" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-black cursor-pointer" onClick={onShare} title="Share">
                <Share2 size={16} className="text-purple-400" />
              </Button>

              {/* Delete confirmation */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="hover:bg-black cursor-pointer" size="icon" title="Delete">
                    <Trash2 size={16} className="text-red-400" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#1b1b2f] text-white border border-zinc-700/60">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Note?</AlertDialogTitle>
                  </AlertDialogHeader>
                  <p className="text-gray-400">Are you sure you want to delete this note? This action cannot be undone.</p>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="text-black cursor-pointer">Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-red-600 hover:bg-red-700 cursor-pointer " onClick={onDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Markdown Preview (card snippet with code copy) */}
          <div className="mt-2 bg-purple-500/50 rounded-2xl pl-3">
            <MarkdownRenderer content={note.content || ""} clamp  />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// -------------------------------------------------------------
// Main Page: FolderView
// -------------------------------------------------------------
export default function FolderView() {
  const { id } = useParams(); // folder id
  const navigate = useNavigate();

  const [folder, setFolder] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [speakingNoteId, setSpeakingNoteId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const generationRef = useRef(null);

  const [filter, setFilter] = useState("");

  // Fetch folder & notes
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      await Promise.all([fetchFolder(), fetchNotes()]);
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
      stopReading();
      if (generationRef.current) {
        clearInterval(generationRef.current);
        generationRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchFolder = async () => {
    const { data, error } = await supabase.from("folders").select("*").eq("id", id).single();
    if (error) toast.error("Error loading folder");
    else setFolder(data);
  };

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("folder_id", id)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) toast.error("Error loading notes");
    else setNotes(data || []);
  };

  const resetDialog = () => {
    setEditingNote(null);
    setNewNoteTitle("");
    setNewNoteContent("");
    setAiPrompt("");
    setIsGenerating(false);
    if (generationRef.current) {
      clearInterval(generationRef.current);
      generationRef.current = null;
    }
  };

  const openCreateDialog = () => {
    setEditingNote(null);
    setNewNoteTitle("");
    setNewNoteContent("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (note) => {
    setEditingNote(note);
    setNewNoteTitle(note.title || "");
    setNewNoteContent(note.content || "");
    setIsDialogOpen(true);
  };

  const createNote = async () => {
    if (!newNoteTitle.trim()) return toast.error("Please enter a note title");
    const { data: user } = await supabase.auth.getUser();
    const userId = user?.user?.id;

    const insert = {
      folder_id: id,
      user_id: userId,
      title: newNoteTitle,
      content: newNoteContent,
    };

    const optimistic = { ...insert, id: `temp-${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    setNotes((prev) => [optimistic, ...prev]);

    const { data, error } = await supabase.from("notes").insert([insert]).select();
    if (error) {
      toast.error("Could not create note");
      // rollback optimistic
      setNotes((prev) => prev.filter((n) => n.id !== optimistic.id));
    } else {
      toast.success("Note created 🎉");
      // replace optimistic with real
      setNotes((prev) => [data[0], ...prev.filter((n) => n.id !== optimistic.id)]);
      resetDialog();
      setIsDialogOpen(false);
    }
  };

  const saveEdit = async () => {
    if (!editingNote) return;
    const patch = {
      title: newNoteTitle,
      content: newNoteContent,
      updated_at: new Date(),
    };

    // optimistic update
    setNotes((prev) => prev.map((n) => (n.id === editingNote.id ? { ...n, ...patch } : n)));

    const { error } = await supabase.from("notes").update({
      title: newNoteTitle,
      content: newNoteContent,
      updated_at: new Date(),
    }).eq("id", editingNote.id);

    if (error) {
      toast.error("Could not update note");
      fetchNotes(); // fallback to server state
    } else {
      toast.success("Note updated ✏️");
      resetDialog();
      setIsDialogOpen(false);
    }
  };

  const deleteNote = async (noteId) => {
    // optimistic
    const prev = notes;
    setNotes((curr) => curr.filter((n) => n.id !== noteId));

    const { error } = await supabase.from("notes").delete().eq("id", noteId);
    if (error) {
      toast.error("Failed to delete note");
      setNotes(prev); // rollback
    } else {
      toast.success("Note deleted 🗑️");
    }
  };

  // AI Generation with streaming + stop
  const generateWithGemini = async () => {
    if (!aiPrompt.trim()) return toast.error("Enter a prompt first");
    setIsGenerating(true);
    try {
      const content = await generateNoteWithGemini(aiPrompt);
      // stream into the content box
      setNewNoteContent("");
      let i = 0;
      generationRef.current = setInterval(() => {
        setNewNoteContent((prev) => prev + content.charAt(i));
        i++;
        if (i >= content.length) {
          clearInterval(generationRef.current);
          generationRef.current = null;
          setIsGenerating(false);
          toast.success("AI draft ready 🤖");
        }
      }, 16);
    } catch (e) {
      setIsGenerating(false);
      toast.error("Gemini failed to generate");
    }
  };

  const stopGeneration = () => {
    if (generationRef.current) {
      clearInterval(generationRef.current);
      generationRef.current = null;
      setIsGenerating(false);
      toast.success("Stopped AI generation ⏹️");
    }
  };

  // TTS
  const readNote = (noteId, text) => {
    if (!window.speechSynthesis) return toast.error("TTS not supported");
    if (speakingNoteId === noteId) {
      stopReading();
      return;
    }
    stopReading();
    const plainText = (text || "").replace(/[#_*>\-`]/g, "");
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = "en-US";
    utterance.onend = () => setSpeakingNoteId(null);
    window.speechSynthesis.speak(utterance);
    setSpeakingNoteId(noteId);
  };

  const stopReading = () => {
    try {
      window.speechSynthesis?.cancel();
    } catch {}
    setSpeakingNoteId(null);
  };

  // PDF Download
  const downloadNote = async (note) => {
    try {
      await downloadNotePDF(note);
      toast.success("PDF downloaded 📥");
    } catch (err) {
      console.error(err);
      toast.error("PDF export failed");
    }
  };

  // Share note
  const shareNote = useCallback(async (note) => {
    try {
      const url = `${window.location.origin}/note/${note.id}`;
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        await navigator.share({ title: note.title, text: note.title, url });
        return;
      }
      await copyToClipboard(url, true);
      toast.success("Share link copied");
    } catch {
      toast.error("Share failed");
    }
  }, []);

  // Derived filtered notes
  const filteredNotes = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => (n.title || "").toLowerCase().includes(q) || (n.content || "").toLowerCase().includes(q));
  }, [filter, notes]);

  // UI
  return (
    <div className="p-6 pt-20 bg-[#070720] min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate("/notes")}>
            <ArrowLeft size={18} />
          </Button>
          <div className="min-h-[24px] flex items-center">
            {folder ? (
              <h1 className="text-2xl font-bold text-purple-400 tracking-tight">{folder.name}</h1>
            ) : (
              <LoadingHeader />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search notes..."
              className="bg-[#121232] border-zinc-700 pl-9"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          </div>

          {/* Create/Edit Note Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 cursor-pointer border-1 border-purple-600" onClick={openCreateDialog}>
                <PlusCircle size={18} /> New Note
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1b1b2f] text-white max-w-3xl max-h-[85vh] overflow-y-auto border border-zinc-700/50 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">{editingNote ? "Edit Note" : "Create New Note"}</DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="normal" className="mt-3">
                <TabsList className="grid grid-cols-3 w-full rounded-xl bg-[#0f1029] p-1">
                  <TabsTrigger value="normal" className="data-[state=active]:bg-[#1f2040] data-[state=active]:text-purple-300 cursor-pointer text-gray-400 rounded-lg transition">
                    Normal
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="data-[state=active]:bg-[#1f2040] data-[state=active]:text-purple-300 cursor-pointer text-gray-400 rounded-lg transition">
                    AI Generation
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="data-[state=active]:bg-[#1f2040] data-[state=active]:text-purple-300 cursor-pointer text-gray-400 rounded-lg transition">
                    Preview
                  </TabsTrigger>
                </TabsList>

                {/* Normal Tab */}
                <TabsContent value="normal" className="mt-4 space-y-3">
                  <Input
                    className="bg-[#121232] border-zinc-700 focus-visible:ring-purple-400"
                    placeholder="Note title (e.g., Hello World in Java)"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                  />
                  <Textarea
                    className="bg-[#121232] border-zinc-700 focus-visible:ring-purple-600 max-h-[45vh] min-h-[180px] overflow-y-auto"
                    placeholder="Write your note in Markdown..."
                    rows={10}
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                  />
                </TabsContent>

                {/* AI Generation Tab */}
                <TabsContent value="ai" className="mt-4 space-y-3">
                  <div className="grid gap-2">
                    <Input
                      className="bg-[#121232] border-zinc-700 focus-visible:ring-purple-600"
                      placeholder="Prompt (e.g., Explain Java Hello World with steps & code)"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                    />
                    <div className="relative p-3 rounded-xl bg-gradient-to-b from-[#121233] to-[#0a0a22] border border-purple-700/30 shadow-[0_0_0_1px_rgba(168,85,247,0.15)]">
                      {/* Markdown live output with copy on fenced code */}
                      {newNoteContent ? (
                        <MarkdownRenderer content={newNoteContent} />
                      ) : (
                        <p className="text-zinc-400">{isGenerating ? "✨ Generating AI draft..." : "Generated output will appear here."}</p>
                      )}

                      <div className="mt-3 flex items-center gap-2">
                        {isGenerating ? (
                          <Button onClick={stopGeneration} variant="destructive">
                            <Square size={16} className="mr-2" /> Stop
                          </Button>
                        ) : (
                          <Button onClick={generateWithGemini} variant="secondary" className="bg-purple-700 hover:bg-purple-500 cursor-pointer">
                            <Sparkles size={16} className="mr-2" /> Generate with AI
                          </Button>
                        )}
                        <span className="text-xs text-purple-400/60">Tip: Title should be specific (e.g., “Prime Number in Java”)</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Preview Tab */}
                <TabsContent value="preview" className="mt-4">
                  <div className="bg-[#121232]/60 border border-zinc-800 rounded-xl p-4 max-h-[60vh] overflow-y-auto">
                    <MarkdownRenderer content={newNoteContent} />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Footer */}
              <div className="flex justify-end mt-4 gap-2 ">
                {editingNote ? (
                  <Button onClick={saveEdit} className="bg-gradient-to-br from-purple-600/15 to-fuchsia-600/15 text-purple-200 border border-purple-400/20 cursor-pointer">Save Changes</Button>
                ) : (
                  <Button onClick={createNote} className="bg-gradient-to-br from-purple-600/15 to-fuchsia-600/15 text-purple-200 border border-purple-400/20 cursor-pointer">Create</Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Notes List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <NoteSkeleton key={i} />
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <EmptyState onCreate={openCreateDialog} onReload={fetchNotes} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onOpen={() => navigate(`/note/${note.id}`)}
              onEdit={() => openEditDialog(note)}
              onDelete={() => deleteNote(note.id)}
              onReadToggle={() => readNote(note.id, note.content || "This note is empty.")}
              isSpeaking={speakingNoteId === note.id}
              onDownload={() => downloadNote(note)}
              onShare={() => shareNote(note)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
