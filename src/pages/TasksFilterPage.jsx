import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import {
  format,
  isToday,
  isTomorrow,
  isThisWeek,
  isThisMonth,
} from "date-fns";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { CheckSquare, Search } from "lucide-react";
import Sidebar from "../components/Sidebar";

export default function AdvancedTaskFilter() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredTasks, setFilteredTasks] = useState([]);
  const navigate = useNavigate();
  const [searchHistory, setSearchHistory] = useState([]);
const [showHistory, setShowHistory] = useState(false);



  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase.from("tasks").select("*");
    if (!error) {
      setTasks(data || []);
      setFilteredTasks(data || []); // show all tasks by default
    }
  };
  const handleSearchSelect = (value) => {
  setSearch(value);
  setFilteredTasks(
    tasks.filter((t) =>
      t.title.toLowerCase().includes(value.toLowerCase())
    )
  );
  if (!searchHistory.includes(value)) {
    setSearchHistory((prev) => [value, ...prev].slice(0, 5)); // keep last 5
  }
};

const applyFilter = (filter) => {
  let filtered = [];

  switch (filter) {
    case "complete":
      filtered = tasks.filter((t) => t.status === "complete");
      break;

    case "pending":
      filtered = tasks.filter((t) => t.status === "pending");
      break;

    case "ongoing":
      filtered = tasks.filter((t) => t.status === "ongoing");
      break;

    case "overdue":
      filtered = tasks.filter((t) => t.status === "overdue");
      break;

    case "today":
      filtered = tasks.filter((t) =>
        t.due_date ? isToday(new Date(t.due_date)) : false
      );
      break;

    case "tomorrow":
      filtered = tasks.filter((t) =>
        t.due_date ? isTomorrow(new Date(t.due_date)) : false
      );
      break;

    case "weekly":
      filtered = tasks.filter((t) =>
        t.due_date ? isThisWeek(new Date(t.due_date)) : false
      );
      break;

    case "monthly":
      filtered = tasks.filter((t) =>
        t.due_date ? isThisMonth(new Date(t.due_date)) : false
      );
      break;

    case "all":
    default:
      setSearch(""); 
      filtered = tasks; 
      break;
  }

  setFilteredTasks(filtered);
};


  const handleSearchChange = (value) => {
    setSearch(value);
    if (value.trim() === "") {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(
        tasks.filter((t) =>
          t.title.toLowerCase().includes(value.toLowerCase())
        )
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E23] text-white px-6 pt-24 pb-10">

        <Sidebar/>
{/* Search Command */}
<div className="max-w-2xl mx-auto">
  <Command className="bg-[#1b1b2b] border border-gray-700 rounded-xl p-2 shadow-sm text-white">
  <CommandInput
    placeholder="Search tasks..."
    value={search}
    onValueChange={handleSearchChange}
    onClick={() => setShowHistory(true)}
    className="bg-transparent text-white placeholder-gray-400 px-3 py-2"
    spellCheck={false}
  />

  {showHistory && (
    <CommandList className="bg-transparent text-white mt-2 max-h-60 overflow-auto">
      {/* Previous Searches */}
      {search.trim() === "" && searchHistory.length > 0 && (
        <CommandGroup heading="Previous Searches" className="text-purple-300 px-3">
          {searchHistory.map((item, idx) => (
            <CommandItem
              key={idx}
              onSelect={() => {
                handleSearchSelect(item);
                setShowHistory(false);
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer 
                         hover:bg-purple-600/30 data-[selected=true]:bg-purple-600 data-[selected=true]:text-white"
            >
              <CheckSquare className="h-4 w-4 text-purple-400 shrink-0" />
              <span className="truncate ">{item}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      )}

      {/* Task Search Results */}
      {search.trim() !== "" && (
        <CommandGroup heading="Tasks" className="text-purple-300 px-3">
          {tasks
            .filter((t) =>
              t.title.toLowerCase().includes(search.toLowerCase())
            )
            .slice(0, 5)
            .map((task) => (
              <CommandItem
                key={task.id}
                onSelect={() => {
                  navigate(`/tasks/${task.id}`);
                  if (!searchHistory.includes(search) && search.trim() !== "") {
                    setSearchHistory((prev) => [search, ...prev].slice(0, 5));
                  }
                  setShowHistory(false);
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer 
                           hover:bg-purple-600/30 data-[selected=true]:bg-purple-600 data-[selected=true]:text-white"
              >
                <CheckSquare className="h-4 w-4 text-white shrink-0" />
                <span className="truncate">{task.title}</span>
              </CommandItem>
            ))}
        </CommandGroup>
      )}
    </CommandList>
  )}
</Command>

</div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap justify-center gap-3 mt-6">
        {[
          { label: "All", key: "all", color: "bg-white text-black cursor-pointer"},
          { label: "Complete", key: "complete", color: "bg-green-500/20 text-green-400 cursor-pointer" },
          { label: "Pending", key: "pending", color: "bg-orange-500 text-gray-300 cursor-pointer" },
          { label: "Ongoing", key: "ongoing", color: "bg-blue-500/20 text-blue-400 cursor-pointer" },
          { label: "Overdue", key: "overdue", color: "bg-red-500/20 text-red-400 cursor-pointer" },
          { label: "Today", key: "today", color: "bg-purple-500/20 text-purple-400 cursor-pointer" },
          { label: "Tomorrow", key: "tomorrow", color: "bg-pink-500/20 text-pink-400 cursor-pointer" },
          { label: "Weekly", key: "weekly", color: "bg-yellow-500/20 text-yellow-400 cursor-pointer" },
          { label: "Monthly", key: "monthly", color: "bg-indigo-500/20 text-indigo-400 cursor-pointer" },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => applyFilter(filter.key)}
            className={`px-3 py-1 rounded-full text-sm font-semibold border border-gray-600 hover:scale-105 transition ${filter.color}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            onClick={() => navigate(`/tasks/${task.id}`)}
            className="cursor-pointer bg-[#1E1E2F] p-6 rounded-2xl shadow-xl border border-purple-600 hover:border-pink-500 transition"
          >
            {/* Title */}
            <h1 className="text-lg sm:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500">
              {task.title}
            </h1>

            {/* Description */}
            {task.description && (
              <p className="mt-2 text-gray-300 line-clamp-3">
                {task.description}
              </p>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold tracking-wide
                  ${task.priority === "High"
                    ? "bg-red-500/20 text-red-400 border border-red-500/40"
                    : task.priority === "Medium"
                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40"
                    : "bg-green-500/20 text-green-400 border border-green-500/40"}`}
              >
                {task.priority}
              </span>

              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold tracking-wide
                  ${task.status === "pending"
                    ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
                    : task.status === "ongoing"
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                    : task.status === "complete"
                    ? "bg-green-500/20 text-green-400 border border-green-500/40"
                    : "bg-red-500/20 text-red-400 border border-red-500/40"}`}
              >
                {task.status}
              </span>
            </div>

            {/* Dates */}
            <div className="mt-3 text-xs text-gray-400">
              {task.due_date && task.due_time && (
                <p>
                  Due:{" "}
                  {format(new Date(task.due_date + "T" + task.due_time), "PPPp")}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <p className="text-gray-400 text-center mt-8">No tasks found.</p>
      )}
    </div>
  );
}
