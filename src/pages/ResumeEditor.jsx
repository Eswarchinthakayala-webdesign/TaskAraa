// src/pages/ResumeEditor.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Bold,
  Italic,
  Underline,
  Undo,
  Redo,
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  GripVertical,
  Sparkles,
  Settings,
  Plus,
  Trash2,
  Loader2,
  Download,
  Link as LinkIcon,
  X,
  Printer,
  RotateCcw,
  Pencil,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { toast } from "sonner";

import { generateWithGemini } from "@/lib/geminii";
import { supabase } from "@/lib/supabaseClient";

// react-pdf for real PDF file
import { pdf } from "@react-pdf/renderer";
import ResumePDF from "@/utils/ResumePDF";

// print current preview (user can choose "Save as PDF")
import { useReactToPrint } from "react-to-print";

// NEW: dialogs + inputs for save/download prompts
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Sidebar from "../components/Sidebar";

// --------------------------- COLORS (SAFE) ---------------------------
const COLORS = {
  pageBg: "#ffffff",
  pageBorder: "rgba(0,0,0,0.10)",
  chipBg: "rgba(0,0,0,0.04)",
  chipBorder: "rgba(0,0,0,0.18)",
  bodyText: "#111827",
  faintText: "#6b7280",
  subhead: "#374151",
  divider: "rgba(0,0,0,0.12)",
  editorPanelBg: "#15151d",
  editorPanelBorder: "rgba(255,255,255,0.12)",
  appBgA: "#0e0e12",
  appBgB: "#14141a",
  appText: "#e5e7eb",
};

const SAFE_SWATCHES = [
  { v: "#111827", label: "Near Black" },
  { v: "#1f2937", label: "Gray 800" },
  { v: "#374151", label: "Gray 700" },
  { v: "#4b5563", label: "Gray 600" },
  { v: "#6b7280", label: "Gray 500" },
  { v: "#9ca3af", label: "Muted Gray" },
  { v: "#000000", label: "Black" },
  { v: "#333333", label: "Dark Gray" },
  { v: "#e11d48", label: "Rose" },
  { v: "#2563eb", label: "Blue" },
  { v: "#16a34a", label: "Green" },
  { v: "#a855f7", label: "Violet" },
  { v: "#f59e0b", label: "Amber" },
];

// --------------------------- DEFAULTS ---------------------------
const DEFAULT_FONT = "Inter";
const DEFAULT_SIZE = 13.5;
const DEFAULT_LINE = 1.5;

const defaultStyle = {
  fontFamily: DEFAULT_FONT,
  fontSize: DEFAULT_SIZE,
  lineHeight: DEFAULT_LINE,
  bold: false,
  italic: false,
  underline: false,
  align: "left",
  bullet: "none",
  headingColor: "#374151",
  textColor: "#111827",
};

const initialSections = [
  {
    id: "header",
    title: "Header",
    content:
      "Your Name\nFrontend Developer\nemail@example.com · +91-00000-00000 · City, Country · https://linkedin.com/in/your-handle · https://github.com/yourhandle · https://your-portfolio.com",
    style: {
      ...defaultStyle,
      fontSize: 17,
      lineHeight: 1.28,
      bold: true,
      align: "center",
    },
  },
  {
    id: "summary",
    title: "Professional Summary",
    content:
      "Results-driven developer with 3+ years experience building React apps. Experience with Supabase, real-time collaboration, and AI features. Passionate about performance and DX.",
    style: { ...defaultStyle },
  },
  {
    id: "experience",
    title: "Experience",
    content:
      "Company A — Frontend Developer (2022–Present)\n• Built resume builder SPA used by 50k+ users\n• Cut render time by 35% via memoization & virtualization\n• Led migration to component library\n\nCompany B — Intern (2021–2022)\n• Implemented drag-and-drop editor using dnd-kit\n• Wrote tests improving coverage by 25%",
    style: { ...defaultStyle, bullet: "dash" },
  },
  {
    id: "projects",
    title: "Projects",
    content:
      "Realtime Resume Builder\n• Collaborative resume editor with AI assistance.\n• Export to PDF and cloud sync.\n\nPortfolio Site\n• React + Vite with animations.",
    links: [
      { label: "GitHub", url: "https://github.com/yourhandle/resume-builder" },
      { label: "Live Demo", url: "https://your-portfolio.com/resume" },
    ],
    style: { ...defaultStyle, bullet: "dash" },
  },
  {
    id: "skills",
    title: "Skills",
    content:
      "React · Vite · Tailwind · shadcn/ui · Supabase · dnd-kit · react-pdf · Framer Motion",
    style: { ...defaultStyle, bullet: "chips" },
  },
];

// --------------------------- UTILS ---------------------------
function toStyle(s = {}) {
  return {
    fontFamily: s.fontFamily || DEFAULT_FONT,
    fontSize: `${s.fontSize ?? DEFAULT_SIZE}px`,
    lineHeight: s.lineHeight ?? DEFAULT_LINE,
    color: s.textColor || COLORS.bodyText,
    textAlign: s.align || "left",
    fontWeight: s.bold ? 700 : 400,
    fontStyle: s.italic ? "italic" : "normal",
    textDecoration: s.underline ? "underline" : "none",
    whiteSpace: "pre-wrap",
  };
}

function shortenLabelFromURL(u) {
  try {
    const url = new URL(u);
    const h = url.hostname.replace("www.", "");
    if (h.includes("linkedin")) return "LinkedIn";
    if (h.includes("github")) return "GitHub";
    if (h.includes("gitlab")) return "GitLab";
    if (h.includes("twitter") || h.includes("x.com")) return "Twitter";
    if (h.includes("behance")) return "Behance";
    if (h.includes("dribbble")) return "Dribbble";
    if (h.includes("medium")) return "Medium";
    if (h.includes("dev.to")) return "Dev.to";
    if (h.includes("hashnode")) return "Hashnode";
    if (h.includes("stackoverflow")) return "StackOverflow";
    if (h.includes("vercel") || h.includes("netlify")) return "Portfolio";
    const base = h.split(".")[0];
    return base ? base[0].toUpperCase() + base.slice(1) : "Link";
  } catch {
    return "Link";
  }
}

function extractLinksFromText(text) {
  const re = /(https?:\/\/[^\s)]+)|(\bwww\.[^\s)]+)/gi;
  const out = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    const val = m[0].startsWith("http") ? m[0] : `https://${m[0]}`;
    out.push(val);
  }
  return out;
}

function stripOkLchInline(rootEl) {
  const all = rootEl.querySelectorAll("*");
  all.forEach((node) => {
    const st = node.getAttribute("style") || "";
    if (st.includes("oklch")) {
      node.setAttribute(
        "style",
        st.replace(/oklch\([^)]+\)/g, COLORS.bodyText)
      );
    }
  });
}

// --------------------------- Sortable Item ---------------------------
function SortableCard({
  section,
  onChange,
  onGemini,
  onDelete,
  onOpenSettings,
  loading,
  onAddProjectLink,
  onRemoveProjectLink,
  selected,
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: section.id,
    });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const isProjects = section.title.toLowerCase().includes("project");
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-xl p-4 shadow-md border ${
        selected ? "ring-2 ring-offset-0 ring-[rgba(34,197,94,0.45)]" : ""
      }`}
    >
      <div
        style={{
          backgroundColor: `#1b1b2f`,
          borderColor: `#757575`,
          borderWidth: 1,
          borderStyle: "solid",
          borderRadius: 12,
          padding: 16,
        }}
      >
        {/* drag handle */}
        <button
          {...attributes}
          {...listeners}
          title="Drag section"
          aria-label="Drag section"
          style={{
            position: "absolute",
            left: -8,
            top: 12,
            color: COLORS.appText,
            opacity: 0.7,
            padding: 4,
            borderRadius: 6,
            background: "transparent",
            cursor: "grab",
          }}
        >
          <GripVertical size={18} />
        </button>

        {/* Editable Title */}
        <div className="flex items-center   justify-between mb-3 gap-2">
          <input
            value={section.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Section title"
            style={{
              flex: 1,
              color: COLORS.appText,
              fontWeight: 600,
              fontSize: 16,
              background: "transparent",
              border: "1px solid transparent",
              borderRadius: 8,
              padding: "6px 8px",
              outline: "none",
            }}
          />
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={onGemini}
              disabled={loading}
              title="Generate with AI"
              className="gap-1 text-green-500 cursor-pointer hover:bg-green-500 hover:text-black"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{loading ? "..." : "AI"}</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="text-red-400 cursor-pointer hover:bg-red-400 hover:text-white">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#1b1b2f] text-white">
                <DropdownMenuLabel>Section</DropdownMenuLabel>
                <DropdownMenuItem onClick={onOpenSettings} className="text-yellow-400 hover:bg-gray-600 cursor-pointer">
                  <Pencil className="w-4 h-4 mr-2 text-yellow-400" /> Edit style
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-red-500 hover:bg-gray-600 cursor-pointer ">
                  <Trash2 className="w-4 h-4 mr-2 text-red-400" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* textarea */}
        <textarea
          value={section.content}
          onChange={(e) => onChange({ content: e.target.value })}
          rows={section.style?.bullet === "chips" ? 3 : 6}
          placeholder={loading ? "Generating…" : "Type here..."}
          style={{
            ...toStyle(section.style || {}),
            width: "100%",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            padding: 12,
            outline: "none",
            color: COLORS.appText,
          }}
          disabled={loading}
        />

        {/* projects link saver */}
        {isProjects && (
          <div style={{ marginTop: 12 }}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
              <input
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                placeholder="Link label (GitHub, Live Demo)"
                className="flex-1 min-w-0 bg-transparent text-white border rounded-lg px-3 py-2 text-sm 
               focus:outline-none focus:ring-2 focus:ring-blue-500"
               
              />
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 min-w-0 bg-transparent text-white border rounded-lg px-3 py-2 text-sm 
               focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (!linkLabel || !linkUrl) {
                    toast.error("Please enter both label and URL");
                    return;
                  }
                  onAddProjectLink({ label: linkLabel, url: linkUrl });
                  setLinkLabel("");
                  setLinkUrl("");
                }}
                className="shrink-0 bg-purple-500 text-black hover:bg-purple-600 cursor-pointer"
              >
                <LinkIcon className="w-4 h-4" /> Add
              </Button>
            </div>

            {Array.isArray(section.links) && section.links.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {section.links.map((l, i) => (
                  <span
                    key={i}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "3px 8px",
                      borderRadius: 999,
                      backgroundColor: `#121212`,
                      border: `1px solid ${COLORS.chipBorder}`,
                      color: COLORS.appText,
                      fontSize: 12,
                    }}
                  >
                    {l.label}
                    <button
                      onClick={() => onRemoveProjectLink(i)}
                      title="Remove"
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#ef4444",
                        display: "inline-flex",
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// --------------------------- Main ---------------------------
export default function ResumeEditor() {
  const [sections, setSections] = useState(initialSections);
  const [selectedId, setSelectedId] = useState(initialSections[0].id);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );
  const previewRef = useRef(null); // for on-screen preview (Option 4 print)
  const printA4Ref = useRef(null); // inner A4 area to print

  // Save title dialog
  const [resumeTitle, setResumeTitle] = useState("");
  const [showTitleDialog, setShowTitleDialog] = useState(false);

  // NEW: Download filename dialog
  const [downloadName, setDownloadName] = useState("My_Resume");
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);

  const { id: resumeId } = useParams();
  const navigate = useNavigate();

  // AI context (kept minimal)
  const [aiContext] = useState({ role: "Frontend Developer", years: 3 });

  // PRINT HANDLER (Option 4)
  const handlePrint = useReactToPrint({
    content: () => printA4Ref.current,
    documentTitle: "resume",
    onBeforeGetContent: () => {
      if (printA4Ref.current) stripOkLchInline(printA4Ref.current);
    },
  });

  // load existing resume if editing
  useEffect(() => {
    async function load() {
      if (!resumeId) return;
      try {
        const { data, error } = await supabase
          .from("resumes")
          .select("doc, title")
          .eq("id", resumeId)
          .single();
        if (error) throw error;
        if (data?.title) {
          setResumeTitle(data.title);
          setDownloadName(`${data.title.replace(/\s+/g, "_")}.pdf`);
        }
        if (data?.doc) {
          let parsed = data.doc;
          if (typeof parsed === "string") {
            try {
              parsed = JSON.parse(parsed);
            } catch {
              parsed = [];
            }
          }
          if (!Array.isArray(parsed)) parsed = [];
          parsed = parsed.map((s) => ({
            ...s,
            style: {
              headingColor:
                s?.style?.headingColor || defaultStyle.headingColor,
              textColor: s?.style?.textColor || defaultStyle.textColor,
              fontFamily: s?.style?.fontFamily || defaultStyle.fontFamily,
              fontSize: s?.style?.fontSize ?? defaultStyle.fontSize,
              lineHeight: s?.style?.lineHeight ?? defaultStyle.lineHeight,
              bold: !!s?.style?.bold,
              italic: !!s?.style?.italic,
              underline: !!s?.style?.underline,
              align: s?.style?.align || defaultStyle.align,
              bullet: s?.style?.bullet || defaultStyle.bullet,
            },
            links: Array.isArray(s.links) ? s.links : [],
          }));
          setSections(parsed);
          setSelectedId(parsed[0]?.id || null);
        }
      } catch (err) {
        toast.error("Failed to load resume: " + (err.message || err));
      }
    }
    load();
  }, [resumeId]);

  // selection
  const selected = useMemo(
    () => sections.find((s) => s.id === selectedId) || sections[0],
    [sections, selectedId]
  );

  // helpers
  const commit = (next) => {
    setUndoStack((s) => [...s, sections]);
    setRedoStack([]);
    setSections(next);
  };

  function onDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    commit(arrayMove(sections, oldIndex, newIndex));
  }

  function updateSection(id, patch) {
    const next = sections.map((s) =>
      s.id === id
        ? { ...s, ...patch, style: { ...(s.style || {}), ...(patch.style || {}) } }
        : s
    );
    commit(next);
  }

  function deleteSection(id) {
    const next = sections.filter((s) => s.id !== id);
    commit(next);
    toast.success("Section removed. You can undo.");
  }

  function addSection() {
    const n = {
      id: "custom-" + Math.random().toString(36).slice(2, 8),
      title: "Custom Section",
      content: "Start typing...",
      style: { ...defaultStyle },
      links: [],
    };
    commit([...sections, n]);
    setSelectedId(n.id);
  }

  function addProjectLink(sectionId, link) {
    const next = sections.map((s) =>
      s.id === sectionId ? { ...s, links: [...(s.links || []), link] } : s
    );
    commit(next);
  }
  function removeProjectLink(sectionId, index) {
    const next = sections.map((s) =>
      s.id === sectionId
        ? { ...s, links: (s.links || []).filter((_, i) => i !== index) }
        : s
    );
    commit(next);
  }

  function undo() {
    if (!undoStack.length) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setRedoStack((r) => [sections, ...r]);
    setSections(prev);
  }
  function redo() {
    if (!redoStack.length) return;
    const next = redoStack[0];
    setRedoStack((r) => r.slice(1));
    setUndoStack((s) => [...s, sections]);
    setSections(next);
  }

  function applyToSelected(stylePatch) {
    if (!selected) return;
    updateSection(selected.id, {
      style: { ...(selected.style || {}), ...stylePatch },
    });
  }

  function resetSelectedStyle() {
    if (!selected) return;
    updateSection(selected.id, { style: { ...defaultStyle } });
    toast.success("Style reset for selected section");
  }

  async function handleGemini(section) {
    try {
      setLoadingId(section.id);
      const sectionType = section.title.toLowerCase().includes("experience")
        ? "experience"
        : section.title.toLowerCase().includes("summary")
        ? "summary"
        : section.title.toLowerCase().includes("skill")
        ? "skills"
        : "custom";

      const content = await generateWithGemini({
        sectionType,
        userInput: section.content,
        context: aiContext,
      });

      const cleaned = content
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/^\s*[\*\-•]\s?/gm, "• ")
        .trim();

      updateSection(section.id, { content: cleaned });
      toast.success("AI content updated");
    } catch (err) {
      toast.error("AI content generation failed");
    } finally {
      setLoadingId(null);
    }
  }

  // --------------------------- DOWNLOAD PDF (react-pdf) ---------------------------
  const downloadWithReactPDF = useCallback(
    async (filename = "resume.pdf") => {
      try {
        const safeName = filename.toLowerCase().endsWith(".pdf")
          ? filename
          : `${filename}.pdf`;
        const doc = <ResumePDF sections={sections} />;
        const blob = await pdf(doc).toBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = safeName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success("Resume downloaded as PDF");
      } catch (err) {
        toast.error("Failed to generate PDF: " + (err?.message || err));
      }
    },
    [sections]
  );

  // --------------------------- SAVE ---------------------------
  async function saveResume() {
    if (!resumeId && !resumeTitle) {
      setShowTitleDialog(true); // ask for title if new
      return;
    }
    confirmSave();
  }

  async function confirmSave() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (!resumeId) {
        const { data, error } = await supabase
          .from("resumes")
          .insert([
            {
              doc: sections,
              title: resumeTitle || "Untitled Resume",
              user_id: user.id,
            },
          ])
          .select()
          .single();
        if (error) throw error;
        navigate(`/resume/${data.id}/edit`);
        toast.success("New resume created");
        setShowTitleDialog(false);
        return;
      }

      const { error } = await supabase
        .from("resumes")
        .update({
          doc: sections,
          title: resumeTitle || "Untitled Resume",
          updated_at: new Date().toISOString(),
        })
        .eq("id", resumeId)
        .eq("user_id", user.id);
      if (error) throw error;

      toast.success("Resume saved");
      setShowTitleDialog(false);
    } catch (err) {
      toast.error("Failed to save: " + (err.message || err));
    }
  }

  // --------------------------- PREVIEW RENDERERS ---------------------------
  function renderContentPreview(section) {
    const { bullet } = section.style || {};
    const lines = section.content.split("\n").filter((l) => l.trim().length);

    const isHeader =
      section.id === "header" ||
      section.title.toLowerCase().includes("header");
    if (isHeader) {
      const linesAll = section.content.split("\n").filter(Boolean);
      const name = linesAll[0] || "Your Name";
      const role = linesAll[1] || "";
      const rest = linesAll.slice(2).join(" · ");
      const urls = extractLinksFromText(rest);
      const textWithoutUrls = rest.replace(
        /(https?:\/\/[^\s)]+)|(\bwww\.[^\s)]+)/gi,
        ""
      );

      return (
        <div style={{ display: "grid", gap: 8, textAlign: "center" }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: section?.style?.textColor || COLORS.bodyText,
              letterSpacing: "0.02em",
            }}
          >
            {name}
          </div>
          {role ? (
            <div
              style={{
                fontSize: 14,
                color: section?.style?.headingColor || COLORS.subhead,
                fontWeight: 600,
              }}
            >
              {role}
            </div>
          ) : null}
          {textWithoutUrls.trim() ? (
            <div
              style={{
                color: section?.style?.textColor || COLORS.bodyText,
                whiteSpace: "pre-wrap",
                fontSize: 12.5,
              }}
            >
              {textWithoutUrls.trim()}
            </div>
          ) : null}
          {urls.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                justifyContent: "center",
              }}
            >
              {urls.map((u, i) => (
                <a
                  key={i}
                  href={u}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: "3px 10px",
                    borderRadius: 999,
                    backgroundColor: COLORS.chipBg,
                    border: `1px solid ${COLORS.chipBorder}`,
                    color: COLORS.bodyText,
                    fontSize: 12,
                    textDecoration: "none",
                  }}
                >
                  {shortenLabelFromURL(u)}
                </a>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (bullet === "none") {
      return (
        <p
          style={{
            color: section?.style?.textColor || COLORS.bodyText,
            whiteSpace: "pre-wrap",
          }}
        >
          {section.content}
        </p>
      );
    }

    if (bullet === "chips") {
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {lines.map((l, i) => (
            <span
              key={i}
              style={{
                padding: "3px 8px",
                borderRadius: 999,
                backgroundColor: COLORS.chipBg,
                border: `1px solid ${COLORS.chipBorder}`,
                color: section?.style?.textColor || COLORS.bodyText,
                fontSize: 12,
              }}
            >
              {l.replace(/^•\s?/, "")}
            </span>
          ))}
        </div>
      );
    }

    const Tag = bullet === "number" ? "ol" : "ul";
    const listStyleType =
      bullet === "disc" ? "disc" : bullet === "dash" ? '"–  "' : "decimal";

    return (
      <Tag
        style={{
          paddingLeft: 20,
          color: section?.style?.textColor || COLORS.bodyText,
          listStyleType,
        }}
      >
        {lines.map((l, i) => (
          <li key={i} style={{ marginBottom: 4 }}>
            {l.replace(/^•\s?/, "")}
          </li>
        ))}
      </Tag>
    );
  }

  function SectionPreview({ section }) {
    return (
      <div
        style={{
          paddingBottom: 16,
          marginBottom: 16,
          borderBottom: `1px solid ${COLORS.divider}`,
        }}
      >
        <div
          style={{
            color: section?.style?.headingColor || COLORS.subhead,
            fontSize: 11.5,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            marginBottom: 8,
            fontWeight: 700,
          }}
        >
          {section.title}
        </div>
        <div style={toStyle(section.style || {})}>
          {renderContentPreview(section)}
        </div>

        {Array.isArray(section.links) && section.links.length > 0 && (
          <div
            style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}
          >
            {section.links.map((l, i) => (
              <a
                key={i}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: "4px 8px",
                  borderRadius: 999,
                  backgroundColor: COLORS.chipBg,
                  border: `1px solid ${COLORS.chipBorder}`,
                  color: COLORS.bodyText,
                  fontSize: 12,
                  textDecoration: "none",
                }}
              >
                {l.label}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --------------------------- RENDER ---------------------------
  return (
    <div
      className="min-h-screen bg-[#070720] pt-12 sm:pt-16 px-4 sm:px-6 py-6 mx-auto max-w-7xl"
      style={{
  
        color: COLORS.appText,
      }}
    >
      <Sidebar/>
      
      {/* Modern page heading */}
      <div className="pt-6 max-w-7xl bg-[#070720] mx-auto mb-6">
        <motion.h1
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-2xl sm:text-3xl font-bold"
          style={{
            background:
              "linear-gradient(90deg, #e5e7eb, #a855f7, #60a5fa, #34d399)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          FluxResume — AI-Powered Resume Builder
        </motion.h1>
        <p className="text-sm opacity-80">
          Craft clean, scannable resumes. Reorder, restyle, and export as PDF.
        </p>
      </div>

      {/* Toolbar */}
      <motion.div
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="sticky top-18 sm:top-19 md:top-18 lg:top-22 z-30 mb-6 bg-[#1b1b2f] rounded-2xl shadow-xl overflow-x-auto"
        style={{
          border: `1px solid ${COLORS.editorPanelBorder}`,
          backdropFilter: "blur(6px)",
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3 min-w-max sm:min-w-0 flex-wrap">
          {/* Font */}
          <Select
            value={selected?.style?.fontFamily || DEFAULT_FONT}
            onValueChange={(v) => applyToSelected({ fontFamily: v })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Font" />
            </SelectTrigger>
            <SelectContent className="bg-[#1b1b2f] text-white cursor-pointer">
              <SelectItem value="Inter">Inter</SelectItem>
              <SelectItem value="Manrope">Manrope</SelectItem>
              <SelectItem value="IBM Plex Sans">IBM Plex Sans</SelectItem>
              <SelectItem value="Source Sans 3">Source Sans 3</SelectItem>
               <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Poppins">Poppins</SelectItem>
                 <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Consolas">Consolas</SelectItem>
                  
            </SelectContent>
          </Select>

          {/* Size */}
          <Select
            value={String(selected?.style?.fontSize ?? DEFAULT_SIZE)}
            onValueChange={(v) => applyToSelected({ fontSize: Number(v) })}
          >
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent className="bg-[#1b1b2f] text-white">
              {[12, 13, 13.5, 14, 15, 16, 17, 18].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}px
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Line height */}
          <Select
            value={String(selected?.style?.lineHeight ?? DEFAULT_LINE)}
            onValueChange={(v) => applyToSelected({ lineHeight: Number(v) })}
          >
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Line" />
            </SelectTrigger>
            <SelectContent className="bg-[#1b1b2f] text-white">
              {[1.28, 1.35, 1.5, 1.62, 1.75].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Heading Color */}
          <Select
            value={selected?.style?.headingColor || COLORS.subhead}
            onValueChange={(v) => applyToSelected({ headingColor: v })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Heading Color" />
            </SelectTrigger>
            <SelectContent className="bg-[#1b1b2f] text-white">
              {SAFE_SWATCHES.map((c) => (
                <SelectItem key={c.v} value={c.v}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Text Color */}
          <Select
            value={selected?.style?.textColor || COLORS.bodyText}
            onValueChange={(v) => applyToSelected({ textColor: v })}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Text Color" />
            </SelectTrigger>
            <SelectContent className="bg-[#1b1b2f] text-white">
              {SAFE_SWATCHES.map((c) => (
                <SelectItem key={c.v} value={c.v}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div
            className="h-6 w-px mx-1"
            style={{ background: COLORS.editorPanelBorder }}
          />

          {/* B I U */}
          <Toggle
            pressed={!!selected?.style?.bold}
            onPressedChange={(p) => applyToSelected({ bold: p })}
            className="data-[state=on]:opacity-80 cursor-pointer hover:bg-purple-500 hover:text-black"
            aria-label="Bold"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </Toggle>
          <Toggle
            pressed={!!selected?.style?.italic}
            onPressedChange={(p) => applyToSelected({ italic: p })}
            className="data-[state=on]:opacity-80 cursor-pointer hover:bg-purple-500 hover:text-black"
            aria-label="Italic"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </Toggle>
          <Toggle
            pressed={!!selected?.style?.underline}
            onPressedChange={(p) => applyToSelected({ underline: p })}
            className="data-[state=on]:opacity-80 cursor-pointer hover:bg-purple-500 hover:text-black"
            aria-label="Underline"
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </Toggle>

          <div
            className="h-6 w-px mx-1"
            style={{ background: COLORS.editorPanelBorder }}
          />

          {/* Align */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => applyToSelected({ align: "left" })}
            title="Align left"
            className="cursor-pointer hover:bg-purple-500 hover:text-black"
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => applyToSelected({ align: "center" })}
            title="Align center"
            className="cursor-pointer hover:bg-purple-500 hover:text-black"
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => applyToSelected({ align: "right" })}
            title="Align right"
            className="cursor-pointer hover:bg-purple-500 hover:text-black"
          >
            <AlignRight className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => applyToSelected({ align: "justify" })}
            title="Justify"
            className="cursor-pointer hover:bg-purple-500 hover:text-black"
          >
            <AlignJustify className="w-4 h-4" />
          </Button>

          <div
            className="h-6 w-px mx-1"
            style={{ background: COLORS.editorPanelBorder }}
          />

          {/* Bullets */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 cursor-pointer hover:bg-purple-500 hover:text-black">
                <List className="w-4 h-4" />
                Bullets
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => applyToSelected({ bullet: "none" })}>
                None
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyToSelected({ bullet: "disc" })}>
                • Disc
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyToSelected({ bullet: "dash" })}>
                – Dash
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyToSelected({ bullet: "number" })}>
                <ListOrdered className="w-4 h-4 mr-2" /> Numbered
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyToSelected({ bullet: "chips" })}>
                Chips
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={resetSelectedStyle}
              title="Reset style"
              className="gap-1 cursor-pointer bg-purple-400 text-gray-800 hover:bg-purple-500 hover:text-black"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={undo}
              disabled={!undoStack.length}
              title="Undo"
              className="bg-purple-400 text-gray-800 hover:bg-purple-500 hover:text-black cursor-pointer"
            >
              <Undo className="w-4 h-4 mr-1" />
              Undo
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={redo}
              disabled={!redoStack.length}
              title="Redo"
              className="bg-purple-400 text-gray-800 hover:bg-purple-500 hover:text-black cursor-pointer"
            >
              <Redo className="w-4 h-4 mr-1" />
              Redo
            </Button>
            <Button size="sm" onClick={addSection} title="Add section" className="gap-1 bg-green-400 text-black hover:bg-green-600 cursor-pointer">
              <Plus className="w-4 h-4" /> Add Section
            </Button>

            {/* Print (Option 4) */}
            <Button
              size="sm"
              onClick={handlePrint}
              title="Print / Save as PDF"
              className="gap-1 bg-blue-500 text-black hover:bg-blue-600 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print
            </Button>

            {/* Download (Option 2) — open filename prompt */}
            <Button
              size="sm"
              onClick={() => {
                // seed with existing title if present
                const base =
                  (resumeTitle && resumeTitle.trim().replace(/\s+/g, "_")) ||
                  "My_Resume";
                setDownloadName(`${base}.pdf`);
                setShowDownloadDialog(true);
              }}
              title="Download PDF"
              className="gap-1 bg-green-500 text-black hover:bg-green-600 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download
            </Button>

            <Button size="sm" onClick={saveResume} title="Save to Cloud"
             className="bg-purple-500 cursor-pointer text-black hover:bg-purple-600"
            >
              Save
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start  mx-auto">
        {/* Left: Sortable editor cards */}
        <motion.div
          layout
          initial={{ x: -16, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="space-y-6"
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {sections.map((sec) => (
                <div key={sec.id} onClick={() => setSelectedId(sec.id)}>
                  <SortableCard
                    section={sec}
                    onChange={(patch) => updateSection(sec.id, patch)}
                    onGemini={() => handleGemini(sec)}
                    onDelete={() => deleteSection(sec.id)}
                    onOpenSettings={() => setSelectedId(sec.id)}
                    loading={loadingId === sec.id}
                    onAddProjectLink={(link) => addProjectLink(sec.id, link)}
                    onRemoveProjectLink={(i) => removeProjectLink(sec.id, i)}
                    selected={selectedId === sec.id}
                  />
                </div>
              ))}
            </SortableContext>
          </DndContext>
        </motion.div>

        {/* Right: Live Preview */}
        <motion.div
          initial={{ x: 16, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl p-6 shadow-2xl"
          style={{
            backgroundColor: `#1b1b2f`,
            border: `1px solid ${COLORS.editorPanelBorder}`,
            backdropFilter: "blur(4px)",
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ color: COLORS.appText, fontWeight: 600, fontSize: 18 }}>
              Live Preview
            </h2>
            <p style={{ color: COLORS.appText, opacity: 0.75, fontSize: 13 }}>
              Updates instantly as you type. Use <b>Print</b> to save this preview as PDF.
            </p>
          </div>

          {/* A4 page */}
          <div
            ref={previewRef}
            className="mx-auto"
            style={{
              width: 794, // ~ A4 @ 96dpi
              minHeight: 1123,
              maxWidth: "100%",
              border: `1px solid ${COLORS.pageBorder}`,
              backgroundColor: COLORS.pageBg,
              borderRadius: 12,
              padding: 40,
              color: COLORS.bodyText,
            }}
          >
            {/* Printable region only */}
            <div ref={printA4Ref}>
              {sections.map((s) => (
                <SectionPreview key={s.id} section={s} />
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* SAVE: Title Dialog */}
      <Dialog open={showTitleDialog} onOpenChange={setShowTitleDialog}>
        <DialogContent className="bg-[#1b1b2f]">
          <DialogHeader>
            <DialogTitle className="text-white">Name your resume</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="resume-title" className="text-gray-300">Resume title</Label>
            <Input
              id="resume-title"
              value={resumeTitle}
              onChange={(e) => setResumeTitle(e.target.value)}
              placeholder="e.g., Frontend_Engineer_2025"
              className="text-white"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowTitleDialog(false)}
              className="bg-white cursor-pointer"
              >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!resumeTitle.trim()) {
                  toast.error("Please enter a title");
                  return;
                }
                confirmSave();
              }}
              className="bg-green-500 cursor-pointer hover:bg-green-600"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DOWNLOAD: Filename Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="bg-[#1b1b2f]">
          <DialogHeader>
            <DialogTitle className="text-white">Download PDF</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="download-name" className="text-gray-300">File name</Label>
            <Input
              id="download-name"
              value={downloadName}
              onChange={(e) => setDownloadName(e.target.value)}
              placeholder="My_Resume.pdf"
              className="text-white"
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowDownloadDialog(false)}
              className="bg-white cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const name = (downloadName || "My_Resume").trim();
                if (!name) {
                  toast.error("Please enter a file name");
                  return;
                }
                setShowDownloadDialog(false);
                downloadWithReactPDF(name);
              }}
              className="bg-green-500 cursor-pointer hover:bg-green-600"
            >
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
