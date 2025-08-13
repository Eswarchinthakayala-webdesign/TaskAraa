import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft } from "lucide-react";
import LoadingPage from "./LoadingPage";
import Sidebar from "../components/Sidebar";

export default function QuizDetailsPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 5;

  useEffect(() => {
    async function fetchQuizDetails() {
      setLoading(true);
      const { data, error } = await supabase
        .from("quiz_history")
        .select("*")
        .eq("id", quizId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching quiz:", error);
        setLoading(false);
        return;
      }

      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (data.created_at) {
        data.created_at = new Date(data.created_at).toLocaleString();
      }

      setQuiz(data);
      setLoading(false);
    }

    fetchQuizDetails();
  }, [quizId]);

  if (loading) {
    return <LoadingPage />;
  }

  if (notFound) {
    return (
      <div className="max-w-lg mx-auto text-center mt-20 text-white p-4">
        
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Quiz Not Found</h2>
        <p className="text-gray-400 mb-6 text-sm sm:text-base">
          We couldn’t find any quiz with this ID.
        </p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  const { topic, score, time_taken, question_count, details = [], created_at } = quiz;

  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = details.slice(indexOfFirstQuestion, indexOfLastQuestion);
  const totalPages = Math.ceil(details.length / questionsPerPage);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 pt-20 sm:pt-24 text-white">
      {/* Back button */}
      <Sidebar/>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500 text-transparent bg-clip-text">Quiz Details</h1>
      </div>

      {/* Quiz Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1b1b2b] p-4 sm:p-6 rounded-xl border border-gray-700 shadow-sm mb-8"
      >
        <h2 className="text-lg sm:text-2xl font-semibold mb-4">{topic}</h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-purple-600 text-white">
            Score: {score}/{question_count}
          </Badge>
          <Badge variant="outline" className="border-purple-500 text-purple-400">
            Time Taken: {time_taken}s
          </Badge>
          <Badge className="bg-orange-500/20 text-orange-300 border border-orange-500/40">
            {created_at}
          </Badge>
        </div>
      </motion.div>

      {/* Question List */}
      {currentQuestions.length > 0 ? (
        <div className="grid gap-4">
          {currentQuestions.map((q, idx) => {
            const isCorrect = q.isCorrect;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#1b1b2b] p-4 sm:p-6 rounded-xl border border-gray-700 shadow-sm"
              >
                {/* Question Header */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
                  <h3 className="text-base sm:text-lg font-medium leading-snug">
                    Q{q.index}: {q.question}
                  </h3>
                  <Badge
                    className={`${
                      isCorrect
                        ? "bg-green-600 text-white"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {isCorrect ? "Correct" : "Incorrect"}
                  </Badge>
                </div>

                {/* Options */}
                <div className="grid gap-2">
                  {q.options.map((option, i) => {
                    const correct = option === q.correctAnswer;
                    const selected = option === q.selectedAnswer;
                    let styles =
                      "px-3 py-2 rounded-lg border transition-colors w-full text-sm sm:text-base text-left";
                    if (correct) {
                      styles += " bg-green-600 border-green-500 text-white";
                    } else if (selected && !correct) {
                      styles += " bg-red-600 border-red-500 text-white";
                    } else {
                      styles +=
                        " bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700";
                    }
                    return (
                      <div key={i} className={styles}>
                        {option}
                        {correct && (
                          <Badge className="ml-2 bg-green-500 text-white">
                            Correct
                          </Badge>
                        )}
                        {selected && !correct && (
                          <Badge className="ml-2 bg-red-500 text-white">
                            Your Choice
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-gray-400">
          No questions found for this quiz.
        </p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap justify-center items-center gap-3 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="border-gray-700 bg-[#1b1b2b] hover:bg-gray-800 text-white"
          >
            Prev
          </Button>
          <span className="text-gray-400 text-sm sm:text-base">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="border-gray-700 bg-[#1b1b2b] hover:bg-gray-800 text-white"
          >
            Next
          </Button>
        </div>
      )}

      {/* Back Button */}
      <div className="flex justify-end mt-4">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="border-gray-700 bg-[#1b1b2b] hover:bg-gray-400 cursor-pointer text-white text-sm sm:text-base"
        >
          <ChevronLeft className="w-4 h-4 mb-[-3px]" /> Back
        </Button>
      </div>
    </div>
  );
}
