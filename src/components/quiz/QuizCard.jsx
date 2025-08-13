import React from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import QuizOptions from "./QuizOptions";

export default function QuizCard({
  questionObj,
  index = 0,
  total = 1,
  selected = null,
  disabled = false,
  onChoose = () => {},
  onPrev = () => {},
  onNext = () => {},
}) {
  if (!questionObj) return null;

  const { question, options, correctAnswer } = questionObj;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.24 }}
      className="bg-[#1b1b2b] p-6 rounded-xl border border-gray-700 shadow-sm"
      aria-labelledby={`q-${index}`}
      role="region"
    >
      {/* Top Bar with Navigation */}
      <div className="flex items-center justify-between mb-4">
        {/* Left Arrow */}
        <button
          onClick={onPrev}
          disabled={index === 0}
          className={`p-2 rounded-lg transition-colors ${
            index === 0
              ? "text-gray-500 cursor-not-allowed"
              : "text-gray-300 hover:bg-gray-700"
          }`}
        >
          <ArrowLeft className="w-5 h-5 cursor-pointer text-purple-400" />
        </button>

        {/* Question count */}
        <div className="text-sm text-gray-400">
          Question{" "}
          <span className="font-medium text-white">{index + 1}</span> of{" "}
          <span className="font-medium text-white">{total}</span>
        </div>

        {/* Right Arrow */}
        <button
          onClick={onNext}
          disabled={index === total - 1}
          className={`p-2 rounded-lg transition-colors ${
            index === total - 1
              ? "text-gray-500 cursor-not-allowed"
              : "text-gray-300 hover:bg-gray-700"
          }`}
        >
          <ArrowRight className="w-5 h-5 text-purple-400 cursor-pointer" />
        </button>
      </div>

      {/* Question */}
      <h2
        id={`q-${index}`}
        className="text-lg font-semibold mb-4 leading-snug text-white"
      >
        {question}
      </h2>

      {/* Options */}
      <div className="mt-2">
        <QuizOptions
          options={options}
          onChoose={onChoose}
          selected={selected}
          disabled={disabled}
          correctAnswer={correctAnswer}
        />
      </div>
    </motion.section>
  );
}

QuizCard.propTypes = {
  questionObj: PropTypes.shape({
    question: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(PropTypes.string).isRequired,
    correctAnswer: PropTypes.string.isRequired,
  }),
  index: PropTypes.number,
  total: PropTypes.number,
  selected: PropTypes.string,
  disabled: PropTypes.bool,
  onChoose: PropTypes.func,
  onPrev: PropTypes.func,
  onNext: PropTypes.func,
};
