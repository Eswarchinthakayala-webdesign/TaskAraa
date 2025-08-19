// src/pages/NotesDashboard.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// Icons (lucide-react)
import {
  PlusCircle,
  Folder as FolderIcon,
  RefreshCw,
  Edit,
  Trash2,
  ChevronDown,
  Search,
  Info,
  Pin,
  PinOff,
  ArrowUpWideNarrow,
  ArrowDownNarrowWide,
  Menu
} from "lucide-react";

// Recharts
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";
import Sidebar from "../components/Sidebar";

/* ------------------------------ Utilities ------------------------------ */

function ymd(dateLike) {
  const d = new Date(dateLike);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function aggregateByDate(rows) {
  const map = new Map();
  for (const r of rows) {
    const k = ymd(r.created_at || r.date);
    map.set(k, (map.get(k) || 0) + 1);
  }
  return [...map.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#16162a]/95 backdrop-blur border border-purple-700/50 text-white text-xs p-2 rounded-md shadow-lg">
      <div className="font-medium">{label}</div>
      <div className="opacity-90">Count: {payload[0].value}</div>
    </div>
  );
};

const GlassBadge = ({ children, tone = "purple", className = "" }) => {
  const toneMap = {
    purple:
      "bg-gradient-to-br from-purple-600/15 to-fuchsia-600/15 text-purple-200 border border-purple-400/20",
    blue:
      "bg-gradient-to-br from-indigo-600/15 to-cyan-600/15 text-indigo-100 border border-indigo-400/20",
    green:
      "bg-gradient-to-br from-emerald-600/15 to-lime-600/15 text-emerald-100 border border-emerald-400/20",
    red: "bg-gradient-to-br from-rose-600/15 to-red-600/15 text-rose-100 border border-rose-400/20",
    gray:
      "bg-gradient-to-br from-zinc-600/10 to-slate-600/10 text-zinc-200 border border-zinc-400/20",
    yellow:
      "bg-gradient-to-br from-amber-600/15 to-yellow-600/15 text-amber-100 border border-amber-400/20",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium backdrop-blur-sm ${toneMap[tone]} ${className}`}
    >
      {children}
    </span>
  );
};

const Skeleton = ({ className = "" }) => (
  <div
    className={`animate-pulse rounded-lg bg-gradient-to-r from-[#1a1a30] via-[#1e1e35] to-[#1a1a30] ${className}`}
  />
);

const EmptyState = ({ title, subtitle, action }) => {
  return (
    <div className="w-full rounded-xl border border-purple-900/40 bg-[#0d0d1f]/60 p-10 text-center backdrop-blur">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-700/20 ring-1 ring-purple-600/40">
        <Info size={20} className="text-purple-200" />
      </div>
      <h3 className="text-lg font-semibold text-purple-100">{title}</h3>
      <p className="mt-1 text-sm text-purple-200/70">{subtitle}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
};

/* ------------------------------ Component ------------------------------ */

export default function NotesDashboard() {
  const navigate = useNavigate();

  // Core data
  const [userId, setUserId] = useState(null);
  const [folders, setFolders] = useState([]); // {id, name, created_at}
  const [notes, setNotes] = useState([]); // {id, title, folder_id, is_pinned, created_at, updated_at}

  // UI state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create folder
  const [newFolderName, setNewFolderName] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Edit folder
  const [editOpen, setEditOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [editName, setEditName] = useState("");

  // Filters & sort
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("created_desc"); // created_desc | created_asc | name_asc | name_desc

  // Tabs
  const [tab, setTab] = useState("overview"); // overview | folders

  /* --------------------------- Initial Bootstrap --------------------------- */

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        toast.error("Please sign in to view your notes.");
        setLoading(false);
        return;
      }
      const uid = data.user.id;
      setUserId(uid);

      await ensureProfile(uid, data.user);
      await Promise.all([fetchFolders(uid), fetchNotes(uid)]);

      setLoading(false);
    })();
  }, []);

  // Ensure a profile row exists
  async function ensureProfile(uid, user) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", uid)
      .single();

    // Ignore error if it's row-not-found (PGRST116)
    if (error && error.code !== "PGRST116") {
      console.error("Profile check failed:", error);
      return;
    }
    if (!data) {
      const { error: insErr } = await supabase.from("profiles").insert([
        {
          id: uid,
          full_name: user?.user_metadata?.full_name || user?.email,
          avatar_url: user?.user_metadata?.avatar_url || null,
        },
      ]);
      if (insErr) {
        console.error("Profile creation failed:", insErr);
      }
    }
  }

  /* ------------------------------- Fetchers ------------------------------- */

  const fetchFolders = useCallback(async (uid = userId) => {
    if (!uid) return;
    const { data, error } = await supabase
      .from("folders")
      .select("id,name,created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load folders.");
      return;
    }
    setFolders(data || []);
  }, [userId]);

  const fetchNotes = useCallback(async (uid = userId) => {
    if (!uid) return;
    const { data, error } = await supabase
      .from("notes")
      .select("id,title,folder_id,is_pinned,created_at,updated_at")
      .eq("user_id", uid)
      .order("updated_at", { ascending: false });

    if (error) {
      toast.error("Failed to load notes.");
      return;
    }
    setNotes(data || []);
  }, [userId]);

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([fetchFolders(), fetchNotes()]);
    setRefreshing(false);
  };

  /* ---------------------------- Derived Memos ---------------------------- */

  const noteCountByFolder = useMemo(() => {
    const m = new Map();
    for (const n of notes) {
      m.set(n.folder_id, (m.get(n.folder_id) || 0) + 1);
    }
    return m;
  }, [notes]);

  const pinnedNotes = useMemo(() => notes.filter((n) => n.is_pinned), [notes]);

  const foldersTrend = useMemo(() => aggregateByDate(folders), [folders]);
  const notesTrend = useMemo(() => aggregateByDate(notes), [notes]);

  const filteredSortedFolders = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = !q
      ? folders.slice()
      : folders.filter((f) => f.name.toLowerCase().includes(q));

    switch (sortKey) {
      case "name_asc":
        arr.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name_desc":
        arr.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "created_asc":
        arr.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        break;
      case "created_desc":
      default:
        arr.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        break;
    }
    return arr;
  }, [folders, query, sortKey]);

  /* ------------------------------ Mutations ------------------------------ */

  async function createFolder() {
    if (!newFolderName.trim()) {
      toast.error("Folder name is required.");
      return;
    }
    if (!userId) return;
    setCreating(true);
    const { error } = await supabase
      .from("folders")
      .insert([{ user_id: userId, name: newFolderName.trim() }]);
    setCreating(false);

    if (error) {
      toast.error("Could not create folder.");
      return;
    }
    toast.success("Folder created 🎉");
    setNewFolderName("");
    setCreateOpen(false);
    fetchFolders();
  }

  function openEditFolder(f) {
    setEditingFolder(f);
    setEditName(f.name);
    setEditOpen(true);
  }

  async function saveFolderEdit() {
    if (!editingFolder) return;
    const name = editName.trim();
    if (!name) {
      toast.error("Folder name cannot be empty.");
      return;
    }
    const { error } = await supabase
      .from("folders")
      .update({ name })
      .eq("id", editingFolder.id)
      .eq("user_id", userId);

    if (error) {
      toast.error("Failed to update folder.");
      return;
    }
    toast.success("Folder updated ✏️");
    setEditOpen(false);
    setEditingFolder(null);
    fetchFolders();
  }

  async function deleteFolder(folderId) {
    const { error } = await supabase
      .from("folders")
      .delete()
      .eq("id", folderId)
      .eq("user_id", userId);

    if (error) {
      toast.error("Failed to delete folder.");
      return;
    }
    toast.success("Folder deleted 🗑️");
    fetchFolders();
    fetchNotes();
  }

  async function togglePin(note, flag) {
    const { error } = await supabase
      .from("notes")
      .update({ is_pinned: flag })
      .eq("id", note.id)
      .eq("user_id", userId);

    if (error) {
      toast.error("Failed to update pin.");
      return;
    }
    fetchNotes();
  }

  /* --------------------------------- UI --------------------------------- */

  return (
    <div className="relative pt-20 min-h-screen w-full overflow-x-hidden bg-[#070720] text-white">
      {/* Background accents */}
      <Sidebar/>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-24 -right-24 h-[420px] w-[420px] rounded-full bg-purple-600/30 blur-[120px]" />
        <div className="absolute bottom-0 left-[-120px] h-[320px] w-[320px] rounded-full bg-fuchsia-600/20 blur-[110px]" />
      </div>

      {/* Top bar */}
     <header className="sticky top-0 z-30 border-b border-purple-900/40 bg-[#0b0b24]/60 backdrop-blur">
  <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:flex-nowrap">
    
    {/* Left Section */}
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600/20 to-fuchsia-600/20 ring-1 ring-purple-600/40">
        <FolderIcon size={18} className="text-purple-300" />
      </div>
      <h1 className="text-lg md:text-xl font-semibold tracking-tight text-purple-200">
        Notes Dashboard
      </h1>
      <GlassBadge tone="purple" className="ml-1 hidden sm:flex">
        Private
      </GlassBadge>
    </div>

    {/* Right Section (Desktop & Tablet) */}
    <div className="hidden sm:flex items-center gap-2 flex-wrap">
      {/* Filters */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="border-purple-700/40 text-purple-500 hover:text-white cursor-pointer hover:bg-purple-900/20"
          >
            <Search size={16} className="mr-2" />
            Filters
            <ChevronDown size={16} className="ml-1" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-80 border border-purple-800 bg-[#11112b] text-white"
          align="end"
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs text-purple-200/70">Search folders</label>
              <Input
                className="mt-1 bg-[#0b0b24] border-purple-800 placeholder:text-purple-300/40"
                placeholder="Type folder name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-purple-200/70">Sort by</label>
              <div className="mt-1">
                <Select value={sortKey} onValueChange={setSortKey}>
                  <SelectTrigger className="bg-[#0b0b24] border-purple-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-purple-800 bg-[#11112b] text-white">
                    <SelectItem value="created_desc">
                      <div className="flex items-center gap-2">
                        <ArrowDownNarrowWide size={14} />
                        Newest first
                      </div>
                    </SelectItem>
                    <SelectItem value="created_asc">
                      <div className="flex items-center gap-2">
                        <ArrowUpWideNarrow size={14} />
                        Oldest first
                      </div>
                    </SelectItem>
                    <SelectItem value="name_asc">Name A→Z</SelectItem>
                    <SelectItem value="name_desc">Name Z→A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Refresh */}
      <Button
        variant="outline"
        className="border-purple-700/40 text-purple-500 hover:text-white cursor-pointer hover:bg-purple-900/20"
        onClick={refreshAll}
        disabled={refreshing}
        title="Refresh data"
      >
        <RefreshCw size={16} className={`mr-2 ${refreshing ? "animate-spin" : ""}`} />
        Refresh
      </Button>

      {/* New Folder */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-br from-purple-600 to-fuchsia-600 shadow-lg transition hover:brightness-110 cursor-pointer">
            <PlusCircle size={18} className="mr-2" />
            New Folder
          </Button>
        </DialogTrigger>
        <DialogContent className="border border-purple-800 bg-[#121232] text-white">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription className="text-purple-200/70">
              Give your folder a clear, memorable name. You can rename it later.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 flex gap-2">
            <Input
              className="bg-[#0b0b24] border-purple-800 placeholder:text-purple-300/40"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
            <Button
              onClick={createFolder}
              disabled={creating}
              className="bg-gradient-to-br from-purple-600 to-fuchsia-600 hover:brightness-110"
            >
              {creating ? "Creating..." : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>

    {/* Mobile Menu (Hamburger) */}
    <div className="flex sm:hidden">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="border-purple-700/40 cursor-pointer text-purple-400 hover:text-white hover:bg-purple-900/20"
          >
            <Menu size={18} />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-56 border border-purple-800 bg-[#11112b] text-white"
          align="end"
        >
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              className="justify-start text-purple-300 hover:text-white cursor-pointer hover:bg-purple-900/30"
              onClick={refreshAll}
            >
              <RefreshCw size={16} className="mr-2" /> Refresh
            </Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="justify-start cursor-pointer bg-gradient-to-br from-purple-600 to-fuchsia-600 hover:brightness-110">
                  <PlusCircle size={16} className="mr-2" /> New Folder
                </Button>
              </DialogTrigger>
              <DialogContent className="border border-purple-800 bg-[#121232] text-white">
                {/* Same as above */}
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              className="justify-start text-purple-300 hover:text-white cursor-pointer hover:bg-purple-900/30"
            >
              <Search size={16} className="mr-2" /> Filters
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  </div>
</header>


      {/* Main content */}
      <main className="mx-auto max-w-7xl px-5 py-6">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-6 bg-purple-400  ">
            <TabsTrigger value="overview" className="cursor-pointer">Overview</TabsTrigger>
            <TabsTrigger value="folders" className="cursor-pointer">Folders</TabsTrigger>
          </TabsList>

          {/* ----------------------------- OVERVIEW ----------------------------- */}
          <TabsContent value="overview">
            {loading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Skeleton className="h-[300px]" />
                <Skeleton className="h-[300px]" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card className="border-purple-900/40 bg-gradient-to-b from-[#0d0d1f] to-[#1a1a32]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-200">
                      <FolderIcon size={18} className="text-purple-300" />
                      Folder Creation Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={foldersTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#33384a" />
                        <XAxis dataKey="date" stroke="#a3a3a3" />
                        <YAxis stroke="#a3a3a3" allowDecimals={false} />
                        <ReTooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#a855f7"
                          strokeWidth={2}
                          dot
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-purple-900/40 bg-gradient-to-b from-[#0d0d1f] to-[#1a1a32]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-200">
                      Notes Created (Scatter)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" stroke="#33384a" />
                        <XAxis dataKey="date" stroke="#a3a3a3" />
                        <YAxis
                          dataKey="count"
                          stroke="#a3a3a3"
                          allowDecimals={false}
                        />
                        <ReTooltip content={<CustomTooltip />} />
                        <Scatter data={notesTrend} fill="#22c55e" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            <Separator className="my-8 bg-purple-900/40" />

            {/* Pinned Notes */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-purple-200">
                  Pinned Notes
                </h2>
                <GlassBadge tone="gray">
                  {pinnedNotes.length} pinned
                </GlassBadge>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Skeleton className="h-28" />
                  <Skeleton className="h-28" />
                </div>
              ) : pinnedNotes.length === 0 ? (
                <EmptyState
                  title="No pinned notes yet"
                  subtitle="Pin notes you frequently revisit. They'll show up here."
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <AnimatePresence>
                    {pinnedNotes.map((note) => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card className="group border-purple-900/40 bg-gradient-to-b from-[#0e0e26] to-[#161635] shadow-md">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div
                                className="cursor-pointer"
                                onClick={() => navigate(`/note/${note.id}`)}
                              >
                                <div className="flex items-center gap-2">
                                  <GlassBadge tone="yellow">
                                    Last edit:
                                    {new Date(
                                      note.updated_at || note.created_at
                                    ).toLocaleString(undefined, {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                    })}
                                  </GlassBadge>
                                </div>
                                <h3 className="mt-2 line-clamp-1 text-[15px] text-white font-semibold">
                                  {note.title || "Untitled note"}
                                </h3>
                              </div>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => togglePin(note, false)}
                                      className="opacity-80 transition cursor-pointer hover:bg-black  hover:opacity-100"
                                    >
                                      <PinOff size={16} className="text-amber-300 hover:" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Unpin</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </section>

            {/* -------------------- RECENT NOTES (PIN / UNPIN UI ADDED) -------------------- */}
            <Separator className="my-8 bg-purple-900/40" />

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-purple-200">
                  Recent Notes
                </h2>
                <GlassBadge tone="gray">
                  {notes.length} total
                </GlassBadge>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Skeleton className="h-28" />
                  <Skeleton className="h-28" />
                </div>
              ) : notes.length === 0 ? (
                <EmptyState
                  title="No notes yet"
                  subtitle="Create your first note to get started."
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <AnimatePresence>
                    {notes.slice(0, 8).map((note) => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                      >
                        <Card className="group border-purple-900/40 bg-gradient-to-b from-[#0e0e26] to-[#161635] shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div
                                className="min-w-0 cursor-pointer"
                                onClick={() => navigate(`/note/${note.id}`)}
                              >
                                <div className="flex items-center gap-2">
                                  <GlassBadge tone="purple">
                                    {note.title ? note.title : "Untitled"}
                                  </GlassBadge>
                                </div>

                                <div className="mt-2">
                                  <p className="text-sm text-purple-200/70 line-clamp-2">
                                    Last update:{" "}
                                    {new Date(
                                      note.updated_at || note.created_at
                                    ).toLocaleString(undefined, {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                    })}
                                  </p>
                                </div>
                              </div>

                              <div className="ml-2 flex shrink-0 items-center gap-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => togglePin(note, !note.is_pinned)}
                                        className="h-8 w-8 opacity-80 hover:opacity-100 hover:bg-black cursor-pointer"
                                      >
                                        {note.is_pinned ? (
                                          <PinOff size={16} className="text-amber-300" />
                                        ) : (
                                          <Pin size={16} className="text-emerald-300" />
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {note.is_pinned ? "Unpin note" : "Pin note"}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </section>

            {/* end recent notes */}

          </TabsContent>

          {/* ----------------------------- FOLDERS ------------------------------ */}
          <TabsContent value="folders">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search folders..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-[260px] bg-[#0b0b24] border-purple-900/40 placeholder:text-purple-300/40"
                />
                <Select value={sortKey} onValueChange={setSortKey}>
                  <SelectTrigger className="w-[180px] bg-[#0b0b24] border-purple-900/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-purple-800 bg-[#11112b] text-white cursor-pointer">
                    <SelectItem value="created_desc" className="cursor-pointer">Newest first</SelectItem>
                    <SelectItem value="created_asc" className="cursor-pointer">Oldest first</SelectItem>
                    <SelectItem value="name_asc" className="cursor-pointer">Name A→Z</SelectItem>
                    <SelectItem value="name_desc" className="cursor-pointer">Name Z→A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : filteredSortedFolders.length === 0 ? (
              <EmptyState
                title="No folders found"
                subtitle="Create a new folder or adjust your search filters."
                action={
                  <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-br from-purple-600 to-fuchsia-600 hover:brightness-110">
                        <PlusCircle size={16} className="mr-2" />
                        New Folder
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border border-purple-800 bg-[#121232] text-white">
                      <DialogHeader>
                        <DialogTitle>Create New Folder</DialogTitle>
                        <DialogDescription className="text-purple-200/70">
                          Name your folder to organize your notes.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-3 flex gap-2">
                        <Input
                          className="bg-[#0b0b24] border-purple-800 placeholder:text-purple-300/40"
                          placeholder="Folder name"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                        />
                        <Button
                          onClick={createFolder}
                          disabled={creating}
                          className="bg-gradient-to-br from-purple-600 to-fuchsia-600 hover:brightness-110"
                        >
                          {creating ? "Creating..." : "Create"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                }
              />
            ) : (
              <ScrollArea className="h-auto">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  <AnimatePresence>
                    {filteredSortedFolders.map((f) => (
                      <motion.div
                        key={f.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                      >
                        <Card className="group border-purple-900/40 bg-gradient-to-b from-[#0e0e26] to-[#1a1a32] shadow-md transition hover:-translate-y-0.5 hover:shadow-purple-900/30">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              {/* Left: name + badges */}
                              <div
                                className="min-w-0 cursor-pointer"
                                onClick={() => navigate(`/folder/${f.id}`)}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600/20 to-fuchsia-600/20 ring-1 ring-purple-600/40">
                                    <FolderIcon
                                      size={16}
                                      className="text-purple-300"
                                    />
                                  </div>
                                  <h3 className="line-clamp-1 text-white hover:text-purple-500 font-semibold">
                                    {f.name}
                                  </h3>
                                </div>

                                <div className="mt-2 flex flex-wrap gap-2">
                                  <GlassBadge tone="purple">
                                    {(noteCountByFolder.get(f.id) || 0) +
                                      " Notes"}
                                  </GlassBadge>

                                  <GlassBadge tone="blue">
                                    {new Date(f.created_at).toLocaleString(
                                      undefined,
                                      {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                      }
                                    )}
                                  </GlassBadge>
                                </div>
                              </div>

                              {/* Right: actions */}
                              <div className="ml-2 flex shrink-0 items-center gap-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEditFolder(f)}
                                        className="h-8 w-8 opacity-80 hover:bg-black cursor-pointer hover:opacity-100"
                                      >
                                        <Edit
                                          size={16}
                                          className="text-indigo-300"
                                        />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit name</TooltipContent>
                                  </Tooltip>

                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 opacity-80 hover:bg-black cursor-pointer hover:opacity-100"
                                      >
                                        <Trash2
                                          size={16}
                                          className="text-rose-300"
                                        />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="border border-purple-800 bg-[#121232] text-white">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Delete folder?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will permanently delete the folder
                                          and all notes inside it. This action
                                          cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-rose-600 hover:bg-rose-700"
                                          onClick={() => deleteFolder(f.id)}
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </TooltipProvider>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* --------------------------- Edit Folder Modal -------------------------- */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="border border-purple-800 bg-[#121232] text-white">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription className="text-purple-200/70">
              Update the name of your folder.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex gap-2">
            <Input
              className="bg-[#0b0b24] border-purple-800"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Folder name"
            />
            <Button
              onClick={saveFolderEdit}
              className="bg-gradient-to-br from-purple-600 to-fuchsia-600 hover:brightness-110"
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
