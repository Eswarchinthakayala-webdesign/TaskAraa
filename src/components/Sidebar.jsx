import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  ListTodo,
  PlusCircle,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Filter,
  Repeat,
  Link2,
  CircleQuestionMark,
  LayoutDashboard,
  FileText,
  NotepadText,
} from "lucide-react";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: <Home size={20} /> },
    { name: "All Tasks", path: "/tasks", icon: <ListTodo size={20} /> },
    { name: "Create Task", path: "/create-task", icon: <PlusCircle size={20} /> },
    {name:"Filter Tasks",path:"/filterTasks", icon:<Filter size={20}/>} ,
     {name:"Recurring Tasks",path:"/calendar", icon:<Repeat size={20}/>} ,
     {name:"Link Saver",path:"/links", icon:<Link2 size={20}/>} ,
     {name:"Quiz Analytics",path:"/quiz-dashboard",icon:<LayoutDashboard size={20}/>},
       {name:"Quiz",path:"/quiz", icon:<CircleQuestionMark size={20}/>} ,
       {name:"Resumes",path:"/resumes",icon:<FileText size={20}/>},
       {name:"Notes",path:"/notes",icon:<NotepadText size={20}/>},
    { name: "Settings", path: "/settings", icon: <Settings size={20} /> },
  ];

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={() => setOpen((prev) => !prev)}
        className="fixed top-1/2 -translate-y-1/2 left-2 z-50 
                   bg-[#1E1E2F]/80 backdrop-blur-md border border-white/20 
                   shadow-lg p-2 rounded-full text-white hover:scale-110 transition"
        whileTap={{ scale: 0.9 }}
      >
        {open ? <PanelLeftClose className="cursor-pointer" size={20} /> : <PanelLeftOpen className="cursor-pointer" size={20} />}
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed top-1/2 left-0 -translate-y-1/2 w-56 
                       bg-[#1E1E2F]/90 backdrop-blur-md rounded-r-2xl 
                       border border-white/20 shadow-lg flex flex-col overflow-hidden z-40"
            drag
            dragMomentum={false}
            dragConstraints={{
              top: 0,
              left: 0,
              right: window.innerWidth - 224,
              bottom: window.innerHeight - 300,
            }}
            initial={{ x: -250, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -250, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-white/20 text-center text-white font-bold text-lg">
              Menu
            </div>

            {/* Menu Items */}
            <nav className="flex flex-col p-2 space-y-2">
              {menuItems.map((item, index) => {
                const isActive = location.pathname === item.path;
                return (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg text-base transition-all duration-200
                        ${isActive
                          ? "bg-white text-black font-normal shadow-md ring-2 ring-purple-400"
                          : "text-white hover:bg-white/10 font-normal"
                        }`}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
