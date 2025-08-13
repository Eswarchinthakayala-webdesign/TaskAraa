import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Crown, Medal, Award, Search, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import Sidebar from "../components/Sidebar";

export default function LeaderBoard() {
  const [loading, setLoading] = useState(true);
  const [topOverall, setTopOverall] = useState([]);
  const [topByTopic, setTopByTopic] = useState({});
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  async function fetchLeaderboard() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc("get_user_quiz_performance", { uid: user.id });
      if (error) {
        console.error("Error fetching leaderboard:", error);
        return;
      }

      const sortedOverall = [...data].sort((a, b) => b.score - a.score);
      setTopOverall(sortedOverall.slice(0, 5));

      const grouped = {};
      data.forEach((quiz) => {
        if (!grouped[quiz.topic]) grouped[quiz.topic] = [];
        grouped[quiz.topic].push(quiz);
      });
      Object.keys(grouped).forEach((topic) => {
        grouped[topic] = grouped[topic]
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);
      });
      setTopByTopic(grouped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const getPriorityBadge = (priority) => {
    switch (priority?.toLowerCase()) {
      case "easy":
        return "bg-green-500/20 text-green-300 border border-green-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30";
      case "hard":
        return "bg-red-500/20 text-red-300 border border-red-500/30";
      default:
        return "bg-gray-600/20 text-gray-300 border border-gray-600/30";
    }
  };

  const rankIcons = [
    <Crown className="h-5 w-5 text-yellow-400" />,
    <Medal className="h-5 w-5 text-gray-300" />,
    <Award className="h-5 w-5 text-orange-400" />,
  ];

  const topicNames = useMemo(() => Object.keys(topByTopic), [topByTopic]);

  const suggestions = useMemo(() => {
    if (!search.trim()) return [];
    return topicNames
      .filter((t) => t.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 5);
  }, [search, topicNames]);

  const filteredTopics = useMemo(() => {
    if (!search.trim()) return topByTopic;
    return topicNames
      .filter((topic) => topic.toLowerCase().includes(search.toLowerCase()))
      .reduce((acc, topic) => {
        acc[topic] = topByTopic[topic];
        return acc;
      }, {});
  }, [search, topByTopic, topicNames]);

  const handleCardClick = (quizId) => {
    navigate(`/quiz/${quizId}`);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center text-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Loader2 className="w-10 h-10 text-purple-400" />
        </motion.div>
        <motion.p
          className="mt-3 text-sm text-purple-300 tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, duration: 1.2, repeatType: "reverse" }}
        >
          Fetching leaderboard...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 text-white">
        <Sidebar/>
      <h1 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-extrabold mb-10 text-center sm:text-left
               bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500 
               text-transparent bg-clip-text drop-shadow-lg">
        QuizLuminary
      </h1>

      {/* Top 5 Overall */}
      <section className="mb-10">
        <h2 className="text-xl sm:text-2xl md:text-2xl lg:text-2xl font-bold mb-6 border-l-4 text-purple-500 border-purple-500 pl-3">
          Top 5 Best Performances
        </h2>
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {topOverall.map((quiz, idx) => (
            <motion.div
              key={quiz.quiz_id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.07 }}
              whileHover={{
                scale: 1.00,
                boxShadow: "0 0 10px rgba(168, 85, 247, 0.6)",
              }}
              onClick={() => handleCardClick(quiz.quiz_id)}
              className="cursor-pointer rounded-2xl border border-purple-500/40 bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-gray-900/80 backdrop-blur-lg p-5 shadow-lg hover:shadow-purple-500/60 transition-all duration-300"
            >
              <Card className="bg-transparent border-none p-0">
                <CardHeader className="pb-3 flex items-center justify-between gap-3">
                  <span className="truncate text-xl sm:text-2xl md:text-2xl lg:text-2xl font-bold text-pink-400">
                    {quiz.topic}
                  </span>
                  <span className="shrink-0">
                    {rankIcons[idx] || <Award className="h-5 w-5 text-purple-400" />}
                  </span>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="py-1 rounded-lg bg-gradient-to-r from-purple-600/30 to-pink-500/30 border border-purple-500/40 text-center font-semibold text-md text-white">
                    Score: {quiz.score}/{quiz.question_count}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="border-blue-500/40 text-blue-300">
                      Time: {quiz.time_taken}s
                    </Badge>
                    <Badge className="bg-orange-500/20 text-orange-300 border border-orange-500/30">
                      {new Date(quiz.created_at).toLocaleDateString()}
                    </Badge>
                    <Badge className={`${getPriorityBadge(quiz.priority)}`}>
                      {quiz.priority}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Search Bar under Top 5 */}
      <div className="max-w-7xl mx-auto mb-10">
        <Command className="rounded border text-white border-gray-700 bg-gray-900/80 backdrop-blur-md w-full">
          <CommandInput
            placeholder="Search by topic..."
            value={search}
            onValueChange={setSearch}
            className="pl-10 text-white placeholder-gray-400"
          />
          <CommandList className="max-h-56 overflow-y-auto">
            {search.trim() && suggestions.length > 0 && (
              <CommandGroup heading="Suggestions">
                {suggestions.map((topic) => (
                  <CommandItem
                    key={topic}
                    value={topic}
                    onSelect={() => {
                      setSearch(topic);
                      const quiz = topByTopic[topic]?.[0];
                      if (quiz) navigate(`/quiz/${quiz.quiz_id}`);
                    }}
                    className="flex items-center gap-3 px-4 py-2 mb-1 rounded-lg cursor-pointer transition-all duration-200
                      bg-gradient-to-r from-purple-800/50 via-pink-800/40 to-indigo-800/50 hover:from-purple-700/60 hover:via-pink-700/50 hover:to-indigo-700/60
                      hover:shadow-lg  text-white"
                  >
                    <BookOpen className="h-5 w-5 text-black" />
                    {topic}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </div>

      {/* Top 3 Per Topic */}
      <section>
        <h2 className="text-xl sm:text-2xl md:text-2xl lg:text-2xl font-bold mb-6 text-pink-400 border-l-4 border-pink-500 pl-3">
          Top 3 in Each Topic
        </h2>

        {Object.keys(filteredTopics).map((topic) => (
          <div
            key={topic}
            className="mb-10 p-4 sm:p-5 rounded-xl bg-gray-900/60 border border-gray-700 backdrop-blur-sm"
          >
            <h3 className="text-lg sm:text-xl font-semibold mb-4 text-purple-400">Quiz Topic : {topic}</h3>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTopics[topic].map((quiz, idx) => (
                <motion.div
                  key={quiz.quiz_id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.07 }}
                  whileHover={{
                    scale: 1.0,
                    boxShadow: "0 0 10px rgba(236, 72, 153, 0.6)",
                  }}
                  onClick={() => handleCardClick(quiz.quiz_id)}
                  className="cursor-pointer rounded-2xl border border-pink-500/40 bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-gray-900/80 backdrop-blur-lg p-5 shadow-lg hover:shadow-pink-500/60 transition-all duration-300"
                >
                  <Card className="bg-transparent border-none p-0">
                    <CardHeader className="pb-3 flex items-center justify-between gap-3">
                      <span className="text-base sm:text-lg font-semibold text-yellow-300">
                        Score: {quiz.score}/{quiz.question_count}
                      </span>
                      <span className="shrink-0">
                        {rankIcons[idx] || <Award className="h-5 w-5 text-pink-400" />}
                      </span>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-blue-500/40 text-blue-300">
                        Time: {quiz.time_taken}s
                      </Badge>
                      <Badge className="bg-orange-500/20 text-orange-300 border border-orange-500/30">
                        {new Date(quiz.created_at).toLocaleDateString()}
                      </Badge>
                      <Badge className={`${getPriorityBadge(quiz.priority)}`}>
                        {quiz.priority}
                      </Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
