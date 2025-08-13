import React from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function QuizOptions({
  options = [],
  onChoose = () => {},
  selected = null,
  disabled = false,
  correctAnswer = null,
}) {
  return (
    <div className="flex flex-col gap-3">
      {options.map((opt, idx) => {
        const isSelected = selected === opt;
        const isCorrect = correctAnswer && opt === correctAnswer;
        const showFeedback = disabled && correctAnswer;

        const baseStyles =
          "w-full justify-start text-left rounded-lg px-4 py-2 font-medium transition-colors whitespace-normal break-words leading-snug min-h-[3rem]";
        const normalStyles =
          "bg-gray-800 hover:bg-gray-700 hover:text-white text-white border border-gray-700 cursor-pointer";
        const selectedStyles =
          "bg-purple-600 hover:bg-purple-700 text-white border border-purple-500 cursor-pointer";
        const correctStyles =
          "bg-green-600 text-white border border-green-500";
        const wrongStyles =
          "bg-red-600 text-white border border-red-500";

        let styles = normalStyles;
        if (isSelected) styles = selectedStyles;
        if (showFeedback) {
          if (isCorrect) styles = correctStyles;
          else if (isSelected && !isCorrect) styles = wrongStyles;
        }

        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Button
              variant="outline"
              disabled={disabled}
              onClick={() => onChoose(opt)}
              className={`${baseStyles} ${styles}`}
            >
              {opt}
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
}

QuizOptions.propTypes = {
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChoose: PropTypes.func.isRequired,
  selected: PropTypes.string,
  disabled: PropTypes.bool,
  correctAnswer: PropTypes.string,
};
