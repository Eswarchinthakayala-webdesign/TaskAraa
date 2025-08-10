// src/pages/LinkManager.jsx
import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { QRCodeCanvas } from "qrcode.react";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";
import { Loader2, Link as LinkIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Sidebar from "../components/Sidebar";
import LoadingPage from "./LoadingPage";

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#12121a] border border-gray-700 p-3 rounded-lg shadow-lg max-w-xs">
        <p className="font-semibold text-purple-400 truncate">{label}</p>
        {payload.map((item, idx) => (
          <p key={idx} className="text-gray-300 text-sm">
            {item.name}:{" "}
            <span className="text-white font-medium">{item.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function LinkManager() {
  const [links, setLinks] = useState([]);
  const [filteredLinks, setFilteredLinks] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [newLink, setNewLink] = useState({
    title: "",
    url: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState(null);
  // States (add these in your main component)
const [deleteOpen, setDeleteOpen] = useState(false);
const [deleteId, setDeleteId] = useState(null);
const [deleting, setDeleting] = useState(false);
const [pageLoading, setPageLoading] = useState(true);


  useEffect(() => {
    fetchLinks();
  }, []);

async function fetchLinks() {
  setPageLoading(true); // start loader

  const { data, error } = await supabase
    .from("links")
    .select("*")
    .order("created_at", { ascending: false });

  if (!error && Array.isArray(data)) {
    setLinks(data);
    setFilteredLinks(searchValue ? filteredLinks : data);
  }

  setPageLoading(false); // stop loader
}


  async function handleLinkClick(id, url) {
    try {
      await supabase.rpc("increment_click_count", { link_id: id });
    } catch (err) {
      console.error("increment_click_count error:", err);
    } finally {
      fetchLinks();
      setTimeout(() => window.open(url, "_blank"), 180);
    }
  }

  async function addLinkToDB() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return alert("Please log in");

    if (!newLink.title.trim() || !newLink.url.trim()) {
      return alert("Title and URL are required.");
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("links").insert([
        {
          user_id: user.id,
          title: newLink.title.trim(),
          url: newLink.url.trim(),
          description: newLink.description.trim(),
        },
      ]);
      if (error) throw error;
      setNewLink({ title: "", url: "", description: "" });
      fetchLinks();
      setConfirmOpen(false);
    } catch (err) {
      console.error("Insert error:", err);
      alert("Failed to save link: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  }

  function handleFilter(value) {
    setSearchValue(value);
    const q = value.trim().toLowerCase();
    if (!q) {
      setFilteredLinks([]);
      return;
    }
    setFilteredLinks(
      links.filter((l) => (l.title || "").toLowerCase().includes(q))
    );
  }

  // Function to delete link
async function handleDeleteLink() {
  if (!deleteId) return;
  setDeleting(true);
  const { error } = await supabase.from("links").delete().eq("id", deleteId);
  setDeleting(false);
  setDeleteOpen(false);
  setDeleteId(null);
  if (!error) {
    fetchLinks(); // Refresh after delete
  } else {
    alert("Failed to delete link");
  }
}

  const clickChartData = useMemo(
    () =>
      links.map((link) => ({
        title: link.title,
        clicks: link.click_count || 0,
      })),
    [links]
  );

  const createdPerDayData = useMemo(() => {
    const counts = {};
    links.forEach((link) => {
      const d = link.created_at ? new Date(link.created_at) : new Date();
      const date = d.toLocaleDateString();
      counts[date] = (counts[date] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [links]);
   if (pageLoading) {
    return <LoadingPage />;
  }

  return (
    
    <div className="min-h-screen bg-[#0f0f1e] text-white px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <Sidebar/>
      
      <div className="max-w-7xl mx-auto">
        {/* Search Bar */}
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500 bg-clip-text text-transparent pb-4">
            Link Manager
          </h1>
        <div className="mb-6 bg-[#1b1b2b] border border-gray-700 rounded-xl p-2">
          <Command className="bg-transparent text-white font-semibold">
            <CommandInput
              placeholder="Search links by title..."
              value={searchValue}
              onValueChange={handleFilter}
              className="bg-transparent text-white placeholder-gray-400 px-3 py-2"
              spellCheck={false}
            />
            {searchValue && (
              <CommandList className="mt-2 max-h-60 overflow-auto">
                {filteredLinks.length === 0 ? (
                  <CommandEmpty className="text-gray-400 px-3 py-2">
                    No results found.
                  </CommandEmpty>
                ) : (
                  filteredLinks.map((link) => (
                    <CommandItem
                      key={link.id}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer",
                        "hover:bg-purple-600/30 data-[selected=true]:bg-purple-600 data-[selected=true]:text-white"
                      )}
                      onSelect={() => handleLinkClick(link.id, link.url)}
                    >
                      <LinkIcon
                        size={16}
                        className="text-purple-400 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {link.title}
                        </div>
                        {link.description && (
                          <div className="text-xs text-gray-400 truncate">
                            {link.description}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))
                )}
              </CommandList>
            )}
          </Command>
        </div>

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Form + Stats + Charts */}
          <div className="lg:col-span-1 space-y-6">
            {/* Form */}
            <div className="bg-[#1b1b2b] border border-gray-700 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Add New Link</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setConfirmOpen(true);
                }}
                className="space-y-3"
              >
                <Input
                  placeholder="Title"
                  value={newLink.title}
                  onChange={(e) =>
                    setNewLink((p) => ({ ...p, title: e.target.value }))
                  }
                  required
                  className="w-full bg-[#0f0f1e] text-white py-3 px-3"
                />
                <Input
                  placeholder="URL (https://...)"
                  value={newLink.url}
                  onChange={(e) =>
                    setNewLink((p) => ({ ...p, url: e.target.value }))
                  }
                  required
                  className="w-full bg-[#0f0f1e] text-white py-3 px-3"
                />
                <Input
                  placeholder="Description (optional)"
                  value={newLink.description}
                  onChange={(e) =>
                    setNewLink((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                  className="w-full bg-[#0f0f1e] text-white py-3 px-3"
                />
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 flex-1 cursor-pointer"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="animate-spin mr-2" />
                    ) : (
                      "Save Link"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setNewLink({ title: "", url: "", description: "" })
                    }
                    className="text-black border-gray-600 hover:bg-gray-800 cursor-pointer hover:text-white"
                  >
                    Clear
                  </Button>
                </div>
              </form>
            </div>

            {/* Stats */}
            <div className="flex gap-3 flex-wrap">
              <Badge className="bg-purple-700/30 text-purple-300 text-sm px-3 py-1 rounded-full">
                Total Links:{" "}
                <span className="ml-1 font-semibold text-white">
                  {links.length}
                </span>
              </Badge>
              <Badge className="bg-blue-700/30 text-blue-300 text-sm px-3 py-1 rounded-full">
                Total Clicks:{" "}
                <span className="ml-1 font-semibold text-white">
                  {links.reduce((s, l) => s + (l.click_count || 0), 0)}
                </span>
              </Badge>
            </div>

            {/* Charts */}
            <div className="space-y-6">
              <div className="bg-[#1b1b2b] border border-gray-700 rounded-xl p-5 shadow">
                <h4 className="text-lg font-semibold mb-3">Clicks per Link</h4>
                <div style={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={clickChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis
                        dataKey="title"
                        stroke="#999"
                        tick={{ fill: "#bbb", fontSize: 12 }}
                      />
                      <YAxis
                        stroke="#999"
                        tick={{ fill: "#bbb", fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="clicks"
                        fill="url(#g1)"
                        radius={[6, 6, 0, 0]}
                        name="Clicks"
                      />
                      <defs>
                        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor="#a855f7"
                            stopOpacity={0.95}
                          />
                          <stop
                            offset="100%"
                            stopColor="#6b21a8"
                            stopOpacity={0.85}
                          />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#1b1b2b] border border-gray-700 rounded-xl p-5 shadow">
                <h4 className="text-lg font-semibold mb-3">
                  Links Created Per Day
                </h4>
                <div style={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={createdPerDayData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis
                        dataKey="date"
                        stroke="#999"
                        tick={{ fill: "#bbb", fontSize: 12 }}
                      />
                      <YAxis
                        stroke="#999"
                        tick={{ fill: "#bbb", fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        name="Links Created"
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

       {/* RIGHT: Link Cards */}
<div className="lg:col-span-2">
  {links.length === 0 ? (
    <div className="flex items-center justify-center h-64 bg-[#1b1b2b] border border-gray-700 rounded-xl">
      <p className="text-gray-400 text-lg">
        No links found. Add your first link to get started!
      </p>
    </div>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-6">
      {links.map((link) => (
        <div
          key={link.id}
          className="relative bg-[#13121a] border border-gray-700 rounded-xl p-4 shadow hover:shadow-lg transition-transform transform hover:-translate-y-1"
        >
          {/* Trash Icon */}
          <button
            onClick={() => {
              setDeleteId(link.id);
              setDeleteOpen(true);
            }}
            className="absolute top-2 right-2 p-1 rounded cursor-pointer bg-red-500/20 hover:bg-red-500/40 transition-colors"
          >
            <Trash2 size={16} className="text-red-400" />
          </button>

          <div className="flex flex-col h-full">
            {/* QR + Info */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="w-full sm:w-44 h-44 flex-shrink-0 rounded-xl overflow-hidden bg-[#13121a] flex items-center justify-center p-3 mx-auto sm:mx-0">
                <QRCodeCanvas
                  value={link.url}
                  size={150}
                  bgColor="#ffffff"
                  fgColor="#1e1e2f"
                  includeMargin
                  level="H"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-md font-semibold truncate text-purple-400">{link.title}</h3>
                {link.description && (
                  <p className="text-sm text-gray-400 truncate mt-1">{link.description}</p>
                )}
                <div className="mt-2 text-sm text-gray-400">
                  Clicks:{" "}
                  <span className="text-purple-300 font-semibold">
                    {link.click_count || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto cursor-pointer"
                onClick={() => handleLinkClick(link.id, link.url)}
              >
                Visit
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full sm:w-auto text-black hover:text-white cursor-pointer border-gray-600 hover:bg-gray-800"
                onClick={() => {
                  navigator.clipboard.writeText(link.url);
                  setCopiedLinkId(link.id);
                  setTimeout(() => setCopiedLinkId(null), 1000);
                }}
              >
                {copiedLinkId === link.id ? "Copied!" : "Copy URL"}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>


{/* Delete Confirmation Dialog */}
<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
  <DialogContent className="bg-[#1e1e2f] text-white border border-gray-700">
    <DialogHeader>
      <DialogTitle>Confirm Delete</DialogTitle>
    </DialogHeader>
    <p className="text-gray-400">Are you sure you want to delete this link?</p>
    <DialogFooter>
      <Button variant="outline" onClick={() => setDeleteOpen(false)}
        className="text-black hover:text-white hover:bg-gray-700 cursor-pointer"
        >
        Cancel
      </Button>
      <Button
        className="bg-red-600 hover:bg-red-700 cursor-pointer"
        onClick={handleDeleteLink}
        disabled={deleting}
      >
        {deleting ? "Deleting..." : "Yes, Delete"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
        </div>

        {/* Confirm Save Dialog */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="bg-[#1b1b2b] border border-gray-700 rounded-xl text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Confirm Save</DialogTitle>
            </DialogHeader>
            <div className="px-4 pb-4 text-gray-400">
              Are you sure you want to save this link?
            </div>
            <DialogFooter className="flex gap-2 px-4 pb-4">
              <Button variant="outline" onClick={() => setConfirmOpen(false)}
                className="text-black hover:text-white hover:bg-gray-700 cursor-pointer"
                >
                Cancel
              </Button>
              <Button
                className="bg-purple-600 cursor-pointer hover:bg-purple-700"
                onClick={addLinkToDB}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  "Yes, Save"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
