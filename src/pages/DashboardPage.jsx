import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Play, Trophy } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
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
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { toast } from "sonner";
import LoadingPage from "./LoadingPage";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#252538] border border-gray-700 p-2 rounded-md shadow-md">
        <p className="text-white font-semibold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage2() {
  const [quizHistory, setQuizHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();
      setFullName(profile?.full_name || "User");

      const { data, error } = await supabase
        .from("quiz_history")
        .select("id,quiz_id, topic, score, time_taken, created_at, question_count, priority")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!error) {
        setQuizHistory(data || []);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const deleteQuiz = async (quizId) => {
    await supabase.from("quiz_history").delete().eq("id", quizId);
    setQuizHistory((prev) => prev.filter((quiz) => quiz.id !== quizId));
    toast.success("Quiz deleted successfully!");
  };

  const clearAllQuizzes = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    await supabase.from("quiz_history").delete().eq("user_id", userId);
    setQuizHistory([]);
  };

  const scoreOverTime = quizHistory
    .slice()
    .reverse()
    .map((quiz, idx) => ({
      name: `Quiz ${idx + 1}`,
      score: quiz.score,
      topic: quiz.topic,
      priority: quiz.priority,
    }));

  const scoreByTopic = Object.values(
    quizHistory.reduce((acc, quiz) => {
      if (!acc[quiz.topic]) {
        acc[quiz.topic] = { topic: quiz.topic, total: 0, count: 0 };
      }
      acc[quiz.topic].total += quiz.score;
      acc[quiz.topic].count += 1;
      return acc;
    }, {})
  ).map((item) => ({
    topic: item.topic,
    avgScore: Math.round(item.total / item.count),
  }));

  const priorityPerformance = Object.values(
    quizHistory.reduce((acc, quiz) => {
      if (!acc[quiz.priority]) {
        acc[quiz.priority] = { priority: quiz.priority, total: 0, count: 0 };
      }
      acc[quiz.priority].total += quiz.score;
      acc[quiz.priority].count += 1;
      return acc;
    }, {})
  ).map((item) => ({
    priority: item.priority,
    avgScore: Math.round(item.total / item.count),
  }));

  const timeVsScore = quizHistory.map((quiz) => ({
    time_taken: quiz.time_taken,
    score: quiz.score,
    topic: quiz.topic,
  }));

  const topicAttempts = Object.values(
    quizHistory.reduce((acc, quiz) => {
      if (!acc[quiz.topic]) acc[quiz.topic] = 0;
      acc[quiz.topic] += 1;
      return acc;
    }, {})
  ).map((count, i, arr) => ({
    topic: Object.keys(
      quizHistory.reduce((a, q) => {
        if (!a[q.topic]) a[q.topic] = 0;
        return a;
      }, {})
    )[i],
    value: count,
  }));

  const scoreDistribution = [0, 20, 40, 60, 80, 100].map((range, i) => {
    const min = range;
    const max = range + 20;
    const count = quizHistory.filter(
      (q) => q.score >= min && q.score < max
    ).length;
    return {
      range: `${min}-${max}%`,
      count,
    };
  });

  const COLORS = ["#82ca9d", "#8884d8", "#ffc658", "#ff7f50", "#fffff", "#ffbb28"];

  return (
    <div className="max-w-7xl mx-auto bg-gray-950 p-4 pt-24 space-y-6">
      <Sidebar />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 w-full">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center sm:justify-start gap-2 flex-wrap text-center sm:text-left px-2 sm:px-0"
        >
          <h1 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-400 drop-shadow-md max-w-full">
            Hi {fullName}, let’s dive into your quiz insights.
          </h1>
        </motion.div>
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto px-2 sm:px-0">
          <Button
            onClick={() => navigate("/quiz")}
            className="bg-green-600 hover:bg-green-700 flex items-center cursor-pointer gap-1 px-3 py-2 text-sm sm:text-base"
          >
            <Play className="w-4 h-4" /> Take Quiz
          </Button>
          <Button
            onClick={() => navigate("/leaderboard")}
            className="bg-purple-500 hover:bg-purple-600 cursor-pointer text-black flex items-center gap-1 px-3 py-2 text-sm sm:text-base"
          >
            <Trophy className="w-4 h-4" /> QuizLuminary
          </Button>
        </div>
      </div>

      {loading ? (
       <LoadingPage/>
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart Components */}
            {/* Score Over Time */}
            <Card className="bg-[#1c1c2e] border border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Score Over Time</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer>
                  <LineChart data={scoreOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="name" stroke="#ccc" />
                    <YAxis stroke="#ccc" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Score by Topic */}
            <Card className="bg-[#1c1c2e] border border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Score by Topic</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer>
                  <BarChart data={scoreByTopic}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="topic" stroke="#ccc" />
                    <YAxis stroke="#ccc" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="avgScore" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Priority vs Performance */}
            <Card className="bg-[#1c1c2e] border border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Priority vs Performance</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer>
                  <BarChart data={priorityPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="priority" stroke="#ccc" />
                    <YAxis stroke="#ccc" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="avgScore" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Time Taken vs Score */}
            <Card className="bg-[#1c1c2e] border border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Time Taken vs Score</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer>
                  <LineChart data={timeVsScore}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="time_taken" stroke="#ccc" />
                    <YAxis stroke="#ccc" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#ff7f50" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Topic-wise Attempts */}
            <Card className="bg-[#1c1c2e] border border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Topic-wise Attempts</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer>
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Pie data={topicAttempts} dataKey="value" nameKey="topic" outerRadius={100}>
                      {topicAttempts.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Score Distribution */}
            <Card className="bg-[#1c1c2e] border border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Score Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer>
                  <BarChart data={scoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="range" stroke="#ccc" />
                    <YAxis stroke="#ccc" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="count" fill="#00c49f" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Quizzes */}
          <div className="flex justify-between items-center mt-6">
            <h2 className="text-purple-400 text-xl font-bold">Recent Quizzes</h2>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700 cursor-pointer">
                  Clear All Quizzes
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gray-900 text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will delete all quizzes permanently.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="hover:bg-gray-400 cursor-pointer text-black border-gray-500 border">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={clearAllQuizzes}
                    className="bg-red-500 hover:bg-red-700 cursor-pointer border border-black"
                  >
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <Card className="bg-[#1c1c2e] border border-gray-700 mt-4">
            <CardContent className="space-y-3 mt-4">
              {quizHistory.length === 0 ? (
                <p className="text-gray-400">No recent quiz attempts.</p>
              ) : (
                quizHistory.map((quiz) => (
  <motion.div
    key={quiz.id}
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col p-3 bg-[#252538] hover:bg-gray-700 rounded-lg border border-gray-700 gap-3 transition-all cursor-pointer"
  >
    {/* Top Row: Title + Delete */}
    <div className="flex justify-between items-start">
      <div>
        <p className="text-lg font-semibold text-white">{quiz.topic}</p>
        <p className="text-sm text-gray-400">
          {new Date(quiz.created_at).toLocaleString()} | {quiz.question_count} Qs
        </p>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer hover:bg-gray-600 p-1"
          >
            <Trash2 className="text-red-500 w-5 h-5" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-gray-900 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this quiz?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-black cursor-pointer hover:bg-gray-400">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteQuiz(quiz.id)}
              className="bg-red-500 hover:bg-red-700 cursor-pointer border border-black"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>

    {/* Badges */}
    <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
      <Badge
        className={`${
          quiz.priority === "hard"
            ? "bg-red-600/20 text-red-600 border border-red-600/40"
            : quiz.priority === "medium"
            ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
            : "bg-blue-500/20 text-blue-400 border border-blue-500/40"
        }`}
      >
        {quiz.priority}
      </Badge>
      <Badge variant="outline" className="text-green-400 border-green-400">
        {quiz.score} pts
      </Badge>
      <Badge
        variant="secondary"
        className="bg-purple-500/20 text-purple-300 border border-purple-500/40"
      >
        {quiz.time_taken}s
      </Badge>
    </div>

    {/* Bottom Row: View Details */}
    <div className="flex justify-end">
      <Badge
        onClick={() => navigate(`/quiz/${quiz.id}`)}
        className="bg-green-600/20 text-green-500 border border-green-600/40 cursor-pointer"
      >
        View Details
      </Badge>
    </div>
  </motion.div>
))
     )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
