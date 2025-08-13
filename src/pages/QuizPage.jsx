import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import QuizCard from "@/components/quiz/QuizCard";
import { generateQuiz } from "@/lib/gemini";
import useQuizHistory from "@/hooks/useQuizHistory";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Trophy, RotateCw, LayoutDashboard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner"; 
import LoadingPage from "./LoadingPage";
import Sidebar from "../components/Sidebar";

export default function QuizPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Quiz config
  const [topic, setTopic] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");

  // Quiz state
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [quizFinished, setQuizFinished] = useState(false);

  const { addQuizAttempt } = useQuizHistory();

  // Dialog state
  const [startConfirmOpen, setStartConfirmOpen] = useState(false);
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false);

  // Check answers state
  const [showAnswers, setShowAnswers] = useState(false);
 //question count and priority
const [getQuestionCount, setGetQuestionCount] = useState(5);
const [getPriority, setGetPriority] = useState("medium");

  // Get logged-in user
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        navigate("/login");
      } else {
        setUser(data.user);
      }
    };
    getUser();
  }, [navigate]);

  // Start quiz handler after confirmation
  const confirmedStartQuiz = async () => {
    setStartConfirmOpen(false);
    await startQuiz();
  };

  // Start quiz
  const startQuiz = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic to start the quiz.");
      
      return;
    }
    setLoading(true);
    setCurrentIndex(0);
    setScore(0);
    setQuizFinished(false);
    setShowAnswers(false);
    setSelectedAnswers(Array(questionCount).fill(null));

    try {
      const quizData = await generateQuiz(topic, questionCount, difficulty);
      if (!quizData?.questions || quizData.questions.length === 0) {
        throw new Error("No questions were generated. Try another topic.");
      }
      setQuestions(
        quizData.questions.map((q) => ({
          question: q.question || "",
          options: q.options || [],
          correctAnswer: q.correctAnswer || "",
        }))
      );
      setGetQuestionCount(questionCount);
      setGetPriority(difficulty);
      setStartTime(Date.now());
    } catch (err) {
      console.error("Quiz generation failed:", err);
      toast.error(err.message || "Failed to generate quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Option select handler
  const handleChoose = (option) => {
    setSelectedAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currentIndex] = option;
      return newAnswers;
    });
  };

  // Update score
  useEffect(() => {
    if (questions.length === 0) return;
    let newScore = 0;
    selectedAnswers.forEach((ans, idx) => {
      if (ans === questions[idx]?.correctAnswer) newScore++;
    });
    setScore(newScore);
  }, [selectedAnswers, questions]);

  // Navigation
  const goToNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex((prev) => prev + 1);
  };
  const goToPrev = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  // Count answered/unanswered
  const unansweredCount = useMemo(
    () => selectedAnswers.filter((ans) => ans === null).length,
    [selectedAnswers]
  );
  const answeredCount = questionCount - unansweredCount;

  // Finish quiz
  const finishQuiz = async () => {
    setFinishConfirmOpen(false);
    setQuizFinished(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    if (!user) return;
    const details = questions.map((q, idx) => ({
    index: idx + 1,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    selectedAnswer: selectedAnswers[idx] || null,
    isCorrect: selectedAnswers[idx] === q.correctAnswer
  }));

    const { error } = await supabase.from("quiz_history").insert({
      user_id: user.id,
      quiz_id: crypto.randomUUID(),
      topic,
      score,
      time_taken: timeTaken,
      question_count: getQuestionCount, 
      priority: getPriority, 
      details
    });

    if (error) {
      console.error("Error saving quiz history:", error);
      toast.error("Failed to save quiz history.");
    } else {
      toast.success("Quiz saved successfully!");
      addQuizAttempt({
        topic,
        score,
        time_taken: timeTaken,
        created_at: new Date(),
        question_count: getQuestionCount,
        priority: getPriority,
         details
      });
    }
    
  };

  // Score style
  const getScoreStyle = () => {
    const percentage = (score / questions.length) * 100 || 0;
    if (percentage < 40)
      return {
        color: "text-red-500",
        border: "stroke-red-500",
        quote: "Keep going! Every master was once a beginner.",
      };
    if (percentage < 75)
      return {
        color: "text-yellow-400",
        border: "stroke-yellow-400",
        quote: "Good job! You're on the right track.",
      };
    return {
      color: "text-green-400",
      border: "stroke-green-400",
      quote: "Outstanding! You're a quiz master!",
    };
  };

  const { color, border, quote } = getScoreStyle();
  const selectClass =
    "px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition w-full sm:w-auto";




  return (
    <div className="w-full min-h-screen bg-gray-900 text-white flex flex-col px-4 sm:px-6 md:px-8 lg:px-10 pt-20 mx-auto pb-6">
      <Sidebar/>
      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 text-center bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500 bg-clip-text text-transparent">
        AI Quiz Generator
      </h1>

      {/* Quiz Settings */}
      <div className="bg-gray-900 rounded-lg p-4 sm:p-6 mb-6 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          {/* Topic Input */}
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter topic..."
            className={`${selectClass} w-full`}
            disabled={loading || questions.length > 0}
          />

          {/* Question Count Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                disabled={loading || questions.length > 0}
                className="w-full justify-between bg-gray-900 text-white border-gray-700 hover:border-indigo-500"
              >
                {questionCount} Qs
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-900 text-white border-gray-700">
              {[5, 10, 15, 20].map((num) => (
                <DropdownMenuItem
                  key={num}
                  onClick={() => setQuestionCount(num)}
                  className="hover:bg-indigo-500 hover:text-white"
                >
                  {num} Qs
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Difficulty Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                disabled={loading || questions.length > 0}
                className="w-full justify-between bg-gray-900 text-white border-gray-700 hover:border-indigo-500"
              >
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-900 text-white border-gray-700">
              {["easy", "medium", "hard"].map((level) => (
                <DropdownMenuItem
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className="hover:bg-indigo-500 hover:text-white"
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Start Quiz Button */}
          <Dialog open={startConfirmOpen} onOpenChange={setStartConfirmOpen}>
            <DialogTrigger asChild>
              <Button
                disabled={loading || questions.length > 0 || !topic.trim()}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Quiz"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-gray-900">
              <DialogHeader>
                <DialogTitle className="text-white">Start Quiz?</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Start quiz on <b>{topic}</b> with <b>{questionCount}</b> Qs at{" "}
                  <b>{difficulty}</b> difficulty?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  className="cursor-pointer hover:bg-gray-300"
                  variant="outline"
                  onClick={() => setStartConfirmOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmedStartQuiz}
                  className="bg-red-600 cursor-pointer hover:bg-red-700"
                >
                  Confirm
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Loading */}
      {loading && <LoadingPage />}

      {/* Quiz In Progress */}
      {!loading && questions.length > 0 && !quizFinished && (
        <div className="transition-all duration-300 flex flex-col flex-grow">
          <div className="w-full mb-4">
            <Progress
              value={(currentIndex / (questions.length - 1)) * 100}
              className="w-full h-2  [&>div]:bg-purple-600"
            />
            <div className="flex justify-between text-xs mt-1 text-gray-400 select-none">
              <span>progress</span>
            </div>
          </div>

          <QuizCard
            key={currentIndex}
            questionObj={questions[currentIndex]}
            index={currentIndex}
            total={questions.length}
            selected={selectedAnswers[currentIndex]}
            disabled={false}
            onChoose={handleChoose}
            onPrev={goToPrev}
            onNext={goToNext}
          />

          <div className="flex justify-end mt-4">
            {currentIndex === questions.length - 1 && (
              <Dialog open={finishConfirmOpen} onOpenChange={setFinishConfirmOpen}>
                <DialogTrigger asChild>
                  <Button
                    disabled={answeredCount === 0}
                    className="bg-green-600 cursor-pointer hover:bg-green-700"
                  >
                    Finish
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-gray-900">
                  <DialogHeader>
                    <DialogTitle className="text-white">Finish Quiz?</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Answered <b>{answeredCount}</b>, Unanswered <b>{unansweredCount}</b>.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setFinishConfirmOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={finishQuiz}
                      className="bg-green-500 hover:bg-green-600 cursor-pointer"
                    >
                      Confirm
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      )}

      {/* Quiz Finished */}
      {quizFinished && !showAnswers && (
        <div className="mt-8 bg-gray-900 p-6 rounded-xl text-center shadow-lg">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="58" stroke="gray" strokeWidth="8" fill="transparent" />
              <circle
                cx="64"
                cy="64"
                r="58"
                strokeWidth="8"
                fill="transparent"
                className={`transition-all duration-700 ease-out ${border}`}
                strokeDasharray={2 * Math.PI * 58}
                strokeDashoffset={
                  2 * Math.PI * 58 - (score / questions.length) * 2 * Math.PI * 58
                }
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${color}`}>{score}</span>
              <span className="text-sm text-gray-400">/ {questions.length}</span>
            </div>
          </div>

          <Trophy className={`w-10 h-10 mx-auto mb-3 ${color}`} />
          <h2 className="text-2xl font-bold mb-2">Quiz Finished!</h2>
          <p className="text-lg text-gray-300 mb-4">{quote}</p>

          <div className="flex justify-center gap-3 flex-wrap">
         <Button
  onClick={() => {
    setQuizFinished(false);
    setShowAnswers(false);
    setTopic("");
    setQuestions([]);
  }}
  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
>
  <RotateCw className="w-4 h-4" />
  Play Again
</Button>


            <Button
              onClick={() => navigate("/quiz-dashboard")}
              variant="outline"
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-400 text-black"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Button>
            <Button
              onClick={() => setShowAnswers(true)}
              className="bg-green-600 hover:bg-green-700 cursor-pointer"
            >
              Check Answers
            </Button>
          </div>
        </div>
      )}

      {/* Show Answers Section */}
      {quizFinished && showAnswers && (
        <div className="mt-8 bg-gray-900 p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-center">Answers Review</h2>
          {questions.map((q, idx) => {
            const isCorrect = selectedAnswers[idx] === q.correctAnswer;
            return (
              <div
                key={idx}
                className="mb-4 p-4 border border-gray-700 rounded-lg"
              >
                <p className="font-semibold mb-2">{idx + 1}. {q.question}</p>
                <p className={`mb-1 ${isCorrect ? "text-green-500" : "text-red-500"}`}>
                  Your Answer: {selectedAnswers[idx] || "Not answered"}
                </p>
                {!isCorrect && (
                  <p className="text-green-400">
                    Correct Answer: {q.correctAnswer}
                  </p>
                )}
              </div>
            );
          })}
          <div className="flex justify-center mt-4">
            <Button
              onClick={() => setShowAnswers(false)}
              className="bg-purple-600 hover:bg-purple-700 cursor-pointer"
            >
              Back to Results
            </Button>
          </div>
        </div>
      )}

      {/* No Quiz Yet */}
      {!loading && questions.length === 0 && !quizFinished && (
        <div className="mt-8 text-center text-gray-400">
          Enter a topic, select settings, and click{" "}
          <span className="font-semibold text-white">Start Quiz</span> to begin.
        </div>
      )}
    </div>
  );
}
