import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion } from "framer-motion";
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO, isToday, isTomorrow, isThisWeek, isThisMonth, isThisYear } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import Sidebar from '../components/Sidebar';




// Globe animation component
const GlobeBackground = () => (
  <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
    <div className="absolute w-[150vw] h-[150vw] bg-gradient-radial from-cyan-500/10 via-purple-500/10 to-transparent rounded-full animate-pulse-slow blur-3xl top-[-50%] left-[-50%]" />
    <div className="absolute w-[100vw] h-[100vw] bg-gradient-conic from-blue-800 via-indigo-600 to-purple-900 opacity-10 animate-spin-slow rounded-full blur-2xl" />
  </div>
);

const STATUS_COLORS = {
  pending: '#FFD700',
  ongoing: '#00BFFF',
  complete: '#32CD32',
  overdue: '#FF6347',
};

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [todayCount, setTodayCount] = useState(0);
  const [tomorrowCount, setTomorrowCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [monthCount, setMonthCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [incompleteCount, setIncompleteCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [userName, setUserName] = useState('');
   const [activeIndex, setActiveIndex] = useState(null);
   const navigate=useNavigate()
 useEffect(() => {
  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
    } else {
      fetchUser();   // your function to load profile data
      fetchTasks();
    }
  };
  checkUser();
}, [navigate]);


  const fetchUser = async () => {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (user) {
    // Try to fetch the user's full name from 'profiles'
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (!profileError && profile?.full_name) {
      setUserName(profile.full_name);
    } else {
      // Fallback to user's email if profile.full_name is not available
      setUserName(user.email);
    }
  } else {
    console.error("No user session found", userError);
  }
};


  const fetchTasks = async () => {
    const { data, error } = await supabase.from('tasks').select('*');

    if (!error && data) {
      setTasks(data);
      prepareStatusData(data);
      prepareWeeklyData(data);
      filterByDates(data);
      prepareComparisonData(data);
    }
  };

  const prepareStatusData = (taskList) => {
    const statusCount = {};
    taskList.forEach(task => {
      statusCount[task.status] = (statusCount[task.status] || 0) + 1;
    });

    const pieData = Object.keys(statusCount).map(key => ({
      name: key,
      value: statusCount[key]
    }));

    setStatusData(pieData);
  };

  const prepareWeeklyData = (taskList) => {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      return {
        date: format(day, 'yyyy-MM-dd'),
        count: 0,
      };
    });

    taskList.forEach(task => {
      const taskDate = task.start_date;
      const found = last7Days.find(day => format(parseISO(taskDate), 'yyyy-MM-dd') === day.date);
      if (found) found.count += 1;
    });

    setWeeklyData(last7Days.reverse());
  };

  const filterByDates = (taskList) => {
    setTodayCount(taskList.filter(task => isToday(parseISO(task.start_date))).length);
    setTomorrowCount(taskList.filter(task => isTomorrow(parseISO(task.start_date))).length);
    setWeekCount(taskList.filter(task => isThisWeek(parseISO(task.start_date), { weekStartsOn: 1 })).length);
    setMonthCount(taskList.filter(task => isThisMonth(parseISO(task.start_date))).length);
    setCompletedCount(taskList.filter(task => task.status === 'complete').length);
    setIncompleteCount(taskList.filter(task => task.status !== 'complete').length);
    setPendingCount(taskList.filter(task => task.status === 'pending').length);
  };

  const prepareComparisonData = (taskList) => {
    const timeframes = [
      { label: 'Today', filter: (date) => isToday(parseISO(date)) },
      { label: 'This Week', filter: (date) => isThisWeek(parseISO(date), { weekStartsOn: 1 }) },
      { label: 'This Month', filter: (date) => isThisMonth(parseISO(date)) },
      { label: 'This Year', filter: (date) => isThisYear(parseISO(date)) },
    ];

    const comparison = timeframes.map(tf => {
      const filtered = taskList.filter(task => tf.filter(task.start_date));
      return {
        name: tf.label,
        complete: filtered.filter(task => task.status === 'complete').length,
        incomplete: filtered.filter(task => task.status !== 'complete').length,
        pending: filtered.filter(task => task.status === 'pending').length,
      };
    });

    setComparisonData(comparison);
  };
const [sidebarOpen, setSidebarOpen] = useState(false);

// Utility to return Tailwind text colors based on label
const getColor = (label) => {
  switch (label.toLowerCase()) {
    case "pending":
      return "text-yellow-400";
    case "complete":
      return "text-green-400";
    case "incomplete":
      return "text-red-400";
    default:
      return "text-gray-300";
  }
};

// Custom Tooltip for BarChart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1b1b2b] border border-gray-700 p-3 rounded-lg shadow-lg">
        <p className={`font-semibold capitalize text-purple-500`}>
          {label}
        </p>
        {payload.map((item, idx) => (
          <p key={idx} className={`text-gray-300 text-sm ${getColor(item.name)}`}>
            {item.name}:{" "}
            <span className="text-white font-medium">{item.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};






  return (

    
    <div className="relative min-h-screen bg-gray-950 text-white p-6 pl-8 overflow-hidden pt-20">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
     
      
      <motion.div
        className="absolute bottom-[-8rem] right-[-8rem] w-[20rem] h-[20rem] md:w-[25rem] md:h-[25rem] bg-pink-500 rounded-full opacity-30 blur-3xl"
        animate={{ x: [0, -120, 120, 0], y: [0, -120, 120, 0] }}
        transition={{ repeat: Infinity, duration: 25, ease: "easeInOut" }}
      />
    
       <motion.div
        className="absolute top-[-8rem] left-[-8rem] w-[25rem] h-[25rem] md:w-[30rem] md:h-[30rem] bg-purple-900 rounded-full opacity-40 blur-3xl"
        animate={{
          x: [0, 80, -80, 0],
          y: [0, 60, -60, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          repeat: Infinity,
          duration: 20,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-[-10rem] right-[-8rem] w-[22rem] h-[22rem] md:w-[26rem] md:h-[26rem] bg-purple-900 rounded-full opacity-40 blur-3xl"
        animate={{
          x: [0, -80, 80, 0],
          y: [0, -60, 60, 0],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          repeat: Infinity,
          duration: 22,
          ease: "easeInOut",
        }}
      />

      {/* Blob 2 - top-right, moves right to left */}
      <motion.div
        className="absolute top-[-10rem] right-[-8rem] w-[22rem] h-[22rem] md:w-[26rem] md:h-[26rem] bg-purple-900 rounded-full opacity-40 blur-3xl"
        animate={{
          x: [0, -80, 80, 0],
          y: [0, -60, 60, 0],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          repeat: Infinity,
          duration: 22,
          ease: "easeInOut",
        }}
      />

      {/* Blob 3 - center, pulsing glow */}
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[18rem] h-[18rem] md:w-[22rem] md:h-[22rem] bg-gray-800 rounded-full blur-2xl"
        animate={{
          opacity: [0.2, 0.6, 0.2],
          scale: [1, 1.1, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 16,
          ease: "easeInOut",
        }}
      />

      {/* Blob 4 - bottom-left */}
      <motion.div
        className="absolute bottom-[-10rem] left-[-10rem] w-[20rem] h-[20rem] md:w-[25rem] md:h-[25rem] bg-fuchsia-900 rounded-full opacity-40 blur-3xl"
        animate={{
          x: [0, 60, -60, 0],
          y: [0, -60, 60, 0],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          repeat: Infinity,
          duration: 26,
          ease: "easeInOut",
        }}
      />

      {/* Blob 5 - bottom-right */}
      <motion.div
        className="absolute bottom-[-8rem] right-[-8rem] w-[22rem] h-[22rem] md:w-[28rem] md:h-[28rem] bg-blue-900 rounded-full opacity-30 blur-3xl"
        animate={{
          x: [0, -100, 100, 0],
          y: [0, 80, -80, 0],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          repeat: Infinity,
          duration: 24,
          ease: "easeInOut",
        }}
      />

      {/* Blob 6 - bottom-center */}
      <motion.div
        className="absolute bottom-[-6rem] left-1/2 transform -translate-x-1/2 w-[16rem] h-[16rem] md:w-[20rem] md:h-[20rem] bg-emerald-900 rounded-full opacity-20 blur-2xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          repeat: Infinity,
          duration: 18,
          ease: "easeInOut",
        }}
      />
      
<div className="mb-8 flex flex-col max-w-7xl mx-auto  md:flex-row items-start md:items-center justify-between gap-4 w-full">
  <h1 className="text-2xl sm:text-3xl md:text-3xl font-bold text-center md:text-left bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-purple-400 to-pink-500 w-full md:w-auto">
    Welcome, {userName || 'User'} 👋
  </h1>

  <div className="w-full z-10 md:w-auto">
    <Button
      asChild
      className="w-full md:w-auto px-4 py-2 text-sm md:text-base bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition duration-200 shadow-md cursor-pointer"
    >
      <Link to="/tasks">Go to Tasks</Link>
    </Button>
  </div>
</div>


      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 sm:grid-cols-2 gap-4 mb-6">
        <Card className="border bg-gray-900 border-gray-600">
          <CardHeader><CardTitle className="text-white">Today's Tasks</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-gray-400">{todayCount}</CardContent>
        </Card>
        <Card className="border bg-gray-900 border-gray-600">
          <CardHeader><CardTitle className="text-white">Tomorrow's Tasks</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-gray-400">{tomorrowCount}</CardContent>
        </Card>
        <Card className="border bg-gray-900 border-gray-600  hover:text-purple-400 ">
          <CardHeader><CardTitle className="text-white ">This Week</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-gray-400 ">{weekCount}</CardContent>
        </Card>
        <Card className="border bg-gray-900 border-gray-600">
          <CardHeader><CardTitle className="text-white">This Month</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-gray-400">{monthCount}</CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3  gap-4 mb-6">
        <Card className="border bg-gray-800 shadow-green-500 border-green-600">
          <CardHeader><CardTitle className="text-green-400">Completed Tasks</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-green-500">{completedCount}</CardContent>
        </Card>
        <Card className="border bg-gray-800 shadow-red-600 border-red-600">
          <CardHeader><CardTitle className="text-red-400">Incomplete Tasks</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold  text-red-500">{incompleteCount}</CardContent>
        </Card>
        <Card className="border bg-gray-800 shadow-yellow-800 border-yellow-600">
          <CardHeader><CardTitle className="text-yellow-400">Pending Tasks</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-yellow-500">{pendingCount}</CardContent>
        </Card>
      </div>

      {/* Charts */}
      {/* ... (No change needed here unless you want different colors or styling for charts) */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white/5 p-4 rounded-xl shadow-lg border-purple-500 border">
          <h2 className="text-xl mb-4">Task Status Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={100} label>
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || "#8884d8"} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/5 p-4 rounded-xl shadow-lg border-purple-500 border">
          <h2 className="text-xl mb-4">Tasks Created (Last 7 Days)</h2>
           <ResponsiveContainer width="100%" height={250}>
        <BarChart data={weeklyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis
            dataKey="date"
            stroke="#999"
            tick={{ fill: "#bbb", fontSize: 12 }}
          />
          <YAxis
            allowDecimals={false}
            stroke="#999"
            tick={{ fill: "#bbb", fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#6b21a8" stopOpacity={0.85} />
            </linearGradient>
            <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c084fc" stopOpacity={1} />
              <stop offset="100%" stopColor="#9333ea" stopOpacity={0.9} />
            </linearGradient>
          </defs>
          <Bar
            dataKey="count"
            radius={[8, 8, 0, 0]}
            name="Tasks"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {weeklyData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  activeIndex === index
                    ? "url(#barGradientHover)"
                    : "url(#barGradient)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
        </div>
      </div>

      {/* Comparison Line Chart */}
      <div className="bg-white/5 p-6 rounded-xl shadow-lg mb-10 border-gray-500 border">
        <h2 className="text-xl font-semibold mb-4">Task Comparison (Day, Week, Month, Year)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={<CustomTooltip/>} />
            <Legend />
            <Line type="monotone" dataKey="complete" stroke="#32CD32" name="Complete" />
            <Line type="monotone" dataKey="incomplete" stroke="#FF6347" name="Incomplete" />
            <Line type="monotone" dataKey="pending" stroke="#FFD700" name="Pending" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Task Table */}
     <div className="relative z-10 bg-white/5 p-6 rounded-xl shadow-xl">
  <h2 className="text-2xl mb-4 font-semibold">All Tasks</h2>
  <div className="overflow-auto max-h-[300px]">
    <table className="min-w-full text-left text-sm">
      <thead>
        <tr className="text-gray-300 border-b border-gray-700">
          <th className="p-2">Title</th>
          <th className="p-2">Status</th>
          <th className="p-2">Priority</th>
          <th className="p-2">Start</th>
          <th className="p-2">Due</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map(task => (
          <tr
            key={task.id}
            className="border-b cursor-pointer border-gray-700 hover:bg-white/10 transition"
          >
            <td className="p-2">{task.title}</td>
            <td className="p-2">{task.status}</td>
            <td className="p-2">{task.priority}</td>
            <td className="p-2">{task.start_date}</td>
            <td className="p-2">{task.due_date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

    </div>
  );
};

export default Dashboard;
