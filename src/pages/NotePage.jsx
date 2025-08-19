// src/pages/NotePage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { generateNoteWithGemini } from "@/lib/noteGemini";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

import {
  ArrowLeft,
  Save,
  Trash2,
  Download,
  Volume2,
  Wand2,
  Loader2,
  BookOpen,
  Edit3,
  MoreHorizontal,
  Flame,
  Play,
  Pause,
  RotateCcw,
  Wind,
} from "lucide-react";

import { downloadNotePDF } from "@/utils/NotePDF";

/**
 * Debounce helper
 */
const debounce = (fn, ms = 600) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

export default function NotePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const previewRef = useRef(null);

  const [note, setNote] = useState({
    id,
    title: "",
    content: "",
    folder_id: null,
    created_at: null,
    updated_at: null,
  });
  const [folderName, setFolderName] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const [speaking, setSpeaking] = useState(false);
  const [mode, setMode] = useState("study"); // study | edit

  // Timer states
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Daily streak
  const [streak, setStreak] = useState(0);

  /**
   * Effects
   */
  useEffect(() => {
    fetchNote();
    return () => window.speechSynthesis.cancel();
  }, [id]);

  useEffect(() => {
    let interval;
    if (isRunning && mode === "study") {
      interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, mode]);

  useEffect(() => {
    // Load daily streak from localStorage
    const today = new Date().toDateString();
    const lastDay = localStorage.getItem("lastStudyDay");
    const streakCount = parseInt(localStorage.getItem("studyStreak")) || 0;

    if (lastDay === today) {
      setStreak(streakCount);
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastDay === yesterday.toDateString()) {
        localStorage.setItem("studyStreak", streakCount + 1);
        setStreak(streakCount + 1);
      } else {
        localStorage.setItem("studyStreak", 1);
        setStreak(1);
      }
      localStorage.setItem("lastStudyDay", today);
    }
  }, []);

  /**
   * Fetch note + folder name
   */
  const fetchNote = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("id", id)
      .single();
    setLoading(false);

    if (error) {
      console.error(error);
      toast.error("Failed to load note");
      return;
    }
    setNote(data);

    if (data.folder_id) {
      const { data: folder, error: fErr } = await supabase
        .from("folders")
        .select("name")
        .eq("id", data.folder_id)
        .single();
      if (!fErr && folder) setFolderName(folder.name);
    }
  };

  /**
   * Save logic
   */
  const doSave = async (payload) => {
    setSaving(true);
    const { error } = await supabase
      .from("notes")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id);
    setSaving(false);

    if (error) {
      console.error(error);
      toast.error("Save failed");
    } else {
      setNote((n) => ({
        ...n,
        ...payload,
        updated_at: new Date().toISOString(),
      }));
      toast.success("Saved");
    }
  };

  const autosave = useMemo(
    () =>
      debounce(async (newContent) => {
        await doSave({ content: newContent });
      }, 800),
    [id]
  );

  const handleTitleChange = (v) => setNote((n) => ({ ...n, title: v }));
  const handleContentChange = (v) => {
    setNote((n) => ({ ...n, content: v }));
    autosave(v);
  };
  const handleManualSave = async () =>
    doSave({ title: note.title, content: note.content });

  /**
   * Delete
   */
  const handleDelete = async () => {
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) {
      toast.error("Delete failed");
      return;
    }
    toast.success("Note deleted");
    setOpenDelete(false);
    navigate(`/folder/${note.folder_id}`);
  };

  /**
   * TTS
   */
  const handleSpeak = () => {
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(
        `${note.title}\n\n${stripMd(note.content)}`
      );
      utter.onend = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utter);
      toast.message("Reading note aloud…");
    } catch {
      toast.error("Speech not supported");
    }
  };

  const handleStopSpeak = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  /**
   * AI generation
   */
  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      toast.info("Enter a prompt");
      return;
    }
    setAiBusy(true);
    try {
      const md = await generateNoteWithGemini(
        `Write structured MARKDOWN notes with title, headings, bullets, and a TL;DR. Topic: ${aiPrompt}`
      );
      const newContent = `${note.content ? note.content + "\n\n" : ""}${md}`;
      setNote((n) => ({ ...n, content: newContent }));
      await doSave({ content: newContent });
      toast.success("AI content added");
      setAiOpen(false);
      setAiPrompt("");
    } catch (err) {
      console.error(err);
      toast.error("AI generation failed");
    } finally {
      setAiBusy(false);
    }
  };

  /**
   * Timer controls
   */
  const startTimer = () => setIsRunning(true);
  const pauseTimer = () => setIsRunning(false);
  const resetTimer = () => {
    setSeconds(0);
    setIsRunning(false);
  };

  /**
   * PDF
   */
  const handleDownloadPDF = () => downloadNotePDF(note);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin mr-2 opacity-70" />
        <span className="opacity-70">Loading note…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-[#0b0b24] text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-purple-900/40 bg-[#0b0b24]/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Left */}
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  navigate(note.folder_id ? `/folder/${note.folder_id}` : "/notes")
                }
                className="text-purple-300 hover:bg-purple-400 cursor-pointer  hover:text-white"
                aria-label="Back"
              >
                <ArrowLeft />
              </Button>
              <div className="min-w-0">
                <Input
                  value={note.title || ""}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Untitled note"
                  className="bg-transparent border-none text-lg font-semibold text-purple-200 focus-visible:ring-0 placeholder:text-purple-300/70"
                />
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge className="bg-purple-900/40 border border-purple-800 text-purple-200 text-xs">
                    {folderName || "No folder"}
                  </Badge>
                  <div className="text-xs text-purple-300/60 truncate">
                    {note.updated_at
                      ? `Updated ${new Date(note.updated_at).toLocaleString()}`
                      : note.created_at
                      ? `Created ${new Date(note.created_at).toLocaleString()}`
                      : ""}
                  </div>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              {/* Streak only visible lg+ */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-600/10 text-orange-300">
                <Flame className="w-4 h-4" />
                <span className="text-sm font-medium">{streak} day streak</span>
              </div>

              {/* Full actions lg+ */}
              <div className="hidden lg:flex items-center gap-1">
                <Button
                  variant="outline"
                  className="border-purple-700/30 text-purple-500 cursor-pointer"
                  onClick={() => setMode((m) => (m === "study" ? "edit" : "study"))}

                >
                  {mode === "study" ? (
                    <>
                      <Edit3 /> Edit
                    </>
                  ) : (
                    <>
                      <BookOpen  /> Study
                    </>
                  )}
                </Button>

                {mode === "study" && (
                  <>
                    <div className="px-3 py-1 rounded-lg bg-purple-900/30 text-sm text-purple-300 border border-purple-800 font-mono">
                      {formatTime(seconds)}
                    </div>
                    {!isRunning ? (
                      <Button variant="ghost" size="icon" onClick={startTimer} className="text-green-400 cursor-pointer hover:bg-purple-400">
                        <Play />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" onClick={pauseTimer} className="text-yellow-400 cursor-pointer hover:bg-purple-400">
                        <Pause />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={resetTimer} className="text-red-400 cursor-pointer hover:bg-purple-400">
                      <RotateCcw />
                    </Button>
                  </>
                )}

                {mode === "edit" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleManualSave}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="animate-spin" /> : <Save />}
                  </Button>
                )}

                <Button variant="ghost" size="icon" onClick={handleDownloadPDF}
                className="cursor-pointer hover:bg-purple-400"
                >
                  <Download />
                </Button>

                <Button variant="ghost" size="icon" onClick={speaking ? handleStopSpeak : handleSpeak}
                className="cursor-pointer hover:bg-purple-400"
                >
                  <Volume2 className={speaking ? "text-green-400" : ""} />
                </Button>

                <Dialog open={aiOpen} onOpenChange={setAiOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Wand2 />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#11112b] border border-purple-800">
                    <DialogHeader>
                      <DialogTitle>AI Note Generator</DialogTitle>
                      <DialogDescription>Generate structured notes using Gemini AI.</DialogDescription>
                    </DialogHeader>
                    <Textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Explain React hooks..."
                      className="bg-[#0b0b24] border-purple-800"
                    />
                    <DialogFooter>
                      <Button
                        onClick={handleGenerateAI}
                        disabled={aiBusy}
                        className="bg-gradient-to-br from-purple-600 to-fuchsia-600 hover:brightness-110"
                      >
                        {aiBusy ? <Loader2 className="animate-spin mr-2" /> : null}
                        {aiBusy ? "Generating…" : "Generate"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
                  <AlertDialogContent className="bg-[#11112b] border border-purple-800">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this note?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                  <Button variant="ghost" size="icon" onClick={() => setOpenDelete(true)}>
                    <Trash2 />
                  </Button>
                </AlertDialog>
              </div>

              {/* Dropdown for md/sm */}
              <div className="lg:hidden">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 bg-[#0d0d24] border border-purple-800">
                    <div className="flex flex-col gap-2 p-2">
                      <Button  size="sm"  className="bg-purple-500 cursor-pointer hover:bg-purple-400" onClick={() => setMode((m) => (m === "study" ? "edit" : "study"))}>
                        {mode === "study" ? "Switch to Edit" : "Switch to Study"}
                      </Button>

                      {mode === "study" && (
                        <div className="flex flex-col gap-2">
                          <div className="px-3 py-1 rounded-lg bg-purple-900/30 text-sm text-purple-300 border border-purple-800 font-mono text-center">
                            {formatTime(seconds)}
                          </div>
                          {!isRunning ? (
                            <Button size="sm"  className="bg-purple-500 cursor-pointer hover:bg-purple-400" onClick={startTimer}>Start</Button>
                          ) : (
                            <Button size="sm"  className="bg-amber-500 cursor-pointer hover:bg-amber-400" onClick={pauseTimer}>Pause</Button>
                          )}
                          <Button size="sm" variant="ghost"  onClick={resetTimer} className="bg-purple-500 text-white hover:text-white hover:bg-purple-400 cursor-pointer"><RotateCcw/> Reset </Button>
                        </div>
                      )}

                      <Button size="sm" className="bg-purple-500 cursor-pointer hover:bg-purple-400" onClick={handleDownloadPDF}><Download/> Export PDF</Button>
                      <Button size="sm" onClick={speaking ? handleStopSpeak : handleSpeak} className="cursor-pointer bg-purple-500 hover:bg-purple-400">
                        <Volume2 className={speaking ? "text-green-400" : ""} /> {speaking?"Listening....":"Read Out"}
                      </Button>
                      <Button size="sm"  onClick={() => setAiOpen(true)} className="cursor-pointer hover:bg-purple-400 bg-purple-500"><Wand2/>AI</Button>
                      <Button size="sm" variant="destructive" onClick={() => setOpenDelete(true)} className="cursor-pointer"><Trash2/> Delete</Button>
                      <div className="flex items-center gap-2 px-2 py-1 text-orange-300 text-sm">
                        <Flame className="w-4 h-4" /> {streak} day streak
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 p-4 md:p-6">
        {mode === "edit" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            {/* Editor */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col">
              <Card className="bg-[#11112b] border-purple-800 flex-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-purple-200">Editor</CardTitle>
                </CardHeader>
                <Separator className="bg-purple-800" />
                <CardContent className="flex-1">
                  <Textarea
                    value={note.content || ""}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="Start writing in markdown..."
                    rows={18}
                    className="bg-transparent text-white placeholder:text-purple-300/60 min-h-[300px] h-full"
                  />
                </CardContent>
                <div className="flex items-center justify-between p-3 border-t border-purple-900/20">
                  <div className="text-xs text-purple-200/60">Autosave enabled</div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handleManualSave} disabled={saving} className="bg-gradient-to-br from-purple-600 to-fuchsia-600">
                      {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                      Save
                    </Button>
                    <Button className="bg-amber-500 cursor-pointer hover:bg-amber-600" variant="ghost" size="sm" onClick={() => setMode("study")}>
                      Switch to Study
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Preview */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col">
              <Card className="bg-[#11112b] border-purple-800 flex-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-purple-200">Preview</CardTitle>
                </CardHeader>
                <Separator className="bg-purple-800" />
                <CardContent ref={previewRef} className="prose prose-invert max-w-none p-4 overflow-auto text-zinc-100 min-h-[300px]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                    {note.content || ""}
                  </ReactMarkdown>
                </CardContent>
                <div className="flex items-center justify-between p-3 border-t border-purple-900/20">
                  <div className="text-xs text-purple-200/60">Rendered Markdown</div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handleDownloadPDF}><Download/></Button>
                    <Button variant="ghost" size="sm" onClick={() => setMode("study")}>Study Mode</Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        ) : (
          // STUDY MODE
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-[#11112b] border-purple-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-purple-200 text-lg">{note.title || "Untitled"}</CardTitle>
                    <div className="text-xs text-purple-300/60 mt-1">
                      {folderName ? `${folderName} • ` : ""}
                      {note.updated_at ? `Updated ${new Date(note.updated_at).toLocaleString()}` : note.created_at ? `Created ${new Date(note.created_at).toLocaleString()}` : ""}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-900/20 border border-purple-800 font-mono text-purple-200">
                      {formatTime(seconds)}
                    </div>

                    {!isRunning ? (
                      <Button size="sm" className="bg-gradient-to-br from-purple-600 to-fuchsia-600" onClick={() => { startTimer(); }}>
                        <Play className="mr-2" /> Start
                      </Button>
                    ) : (
                      <Button size="sm" className="bg-amber-500/80" onClick={() => pauseTimer()}>
                        <Pause className="mr-2" /> Pause
                      </Button>
                    )}

                    <Button variant="ghost" size="sm" className="bg-green-500 cursor-pointer hover:bg-green-700" onClick={() => resetTimer()}>Reset</Button>

                    <Button variant="outline" size="sm"  onClick={() => setMode("edit")} className="border-purple-700/30 bg-gray-200 text-purple-500 cursor-pointer">
                      Edit
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <Separator className="bg-purple-800" />
              <CardContent className="prose prose-invert max-w-none p-6 text-zinc-100">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {note.content || ""}
                </ReactMarkdown>
              </CardContent>

              <div className="flex items-center justify-between p-4 border-t border-purple-900/20">
                <div className="flex items-center gap-3">
                  <Badge className="bg-purple-900/20 border border-purple-800 text-purple-200">Streak: {streak}</Badge>
                  <div className="text-sm text-purple-300/70">Timer: <span className="font-mono">{formatTime(seconds)}</span></div>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" className="cursor-pointer bg-purple-500 text-black hover:bg-purple-400" onClick={handleDownloadPDF}><Download/></Button>
                  <Button variant="ghost" size="sm" className="cursor-pointer bg-purple-500 hover:bg-purple-400" onClick={speaking ? handleStopSpeak : handleSpeak}>
                    <Volume2 className={speaking ? "text-green-400" : ""} />
                  </Button>
                  <Dialog open={aiOpen} onOpenChange={setAiOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="bg-purple-500 cursor-pointer hover:bg-purple-400" size="sm">
                         <Wand2 />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#11112b] border border-purple-800">
                      <DialogHeader>
                        <DialogTitle className="text-white">AI Note Generator</DialogTitle>
                        <DialogDescription>Generate structured notes using Gemini AI.</DialogDescription>
                      </DialogHeader>
                      <Textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Explain React hooks..." className="bg-[#0b0b24] border-purple-800" />
                      <DialogFooter>
                        <Button onClick={handleGenerateAI} disabled={aiBusy} className="bg-gradient-to-br from-purple-600 to-fuchsia-600">
                          {aiBusy ? <Loader2 className="animate-spin mr-2" /> : null}
                          {aiBusy ? "Generating…" : "Generate"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/**
 * Utilities
 */

function stripMd(md = "") {
  return md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/[#>*_~\-]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function formatTime(seconds = 0) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((x) => String(x).padStart(2, "0")).join(":");
}
