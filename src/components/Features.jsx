import { motion } from "framer-motion";
import {
  CheckCircle2,
  CalendarDays,
  BarChart3,
  BrainCircuit,
  Link2,
  Target
} from "lucide-react";

const features = [
  {
    icon: <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400" />,
    title: "Advanced Task Management",
    description:
      "Create, edit, categorize, and prioritize tasks with smart filters and drag-and-drop simplicity.",
  },
  {
    icon: <CalendarDays className="w-8 h-8 sm:w-10 sm:h-10 text-pink-400" />,
    title: "Smart Calendar Integration",
    description:
      "Stay on top of your schedule by syncing tasks with Google, Outlook, and other calendar apps.",
  },
  {
    icon: <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 text-green-400" />,
    title: "Productivity Insights",
    description:
      "Visualize your progress, completion trends, and time usage with interactive charts.",
  },
  {
    icon: <BrainCircuit className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />,
    title: "AI-Powered Suggestions",
    description:
      "Get smart recommendations for prioritizing tasks based on deadlines and workload.",
  },
  {
    icon: <Link2 className="w-8 h-8 sm:w-10 sm:h-10 text-teal-400" />,
    title: "Resource & Link Manager",
    description:
      "Save important links, documents, and files right inside your tasks for quick access.",
  },
  {
    icon: <Target className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" />,
    title: "Goal Tracking",
    description:
      "Set weekly or monthly goals and measure your progress toward achieving them.",
  },
];

export default function Features() {
  return (
    <section className="bg-black text-white py-16 px-4 sm:px-6 lg:px-12 relative overflow-hidden">
      {/* Glowing background */}
      <div className="absolute top-10 left-10 w-32 h-32 sm:w-40 sm:h-40 bg-purple-700 rounded-full opacity-20 blur-2xl"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 sm:w-40 sm:h-40 bg-indigo-500 rounded-full opacity-20 blur-2xl"></div>

      <motion.div
        className="text-center mb-12 sm:mb-16 z-10 relative"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 text-transparent bg-clip-text mb-3 sm:mb-4">
          TaskAra Features
        </h2>
        <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto px-2">
          All-in-one productivity hub to manage tasks, track time, and collaborate effortlessly.
        </p>
      </motion.div>

      <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 z-10 relative">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            className="bg-[#111] border border-[#2a2a2a] rounded-xl p-5 sm:p-6 shadow-xl hover:scale-105 transition-transform duration-300"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <div className="mb-4 flex items-center">{feature.icon}</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-400 text-sm sm:text-base">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
