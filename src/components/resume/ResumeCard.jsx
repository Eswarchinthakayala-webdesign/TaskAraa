import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MoreVertical, Eye, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

export default function ResumeCard({ resume, onUpdated }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
      className="relative bg-gradient-to-br from-[#202030] to-[#14141a] border border-gray-700/60 
                 rounded-2xl shadow-xl p-4 flex flex-col justify-between group"
    >
      {/* Thumbnail */}
      <div className="h-32 w-full rounded-md bg-gray-800/40 flex items-center justify-center text-gray-500 text-sm">
        Resume Preview
      </div>

      {/* Title + Time */}
      <div className="mt-3">
        <h3 className="text-lg font-semibold text-gray-100 truncate">{resume.title}</h3>
        <p className="text-xs text-gray-400">
          Updated {new Date(resume.updated_at).toLocaleDateString()}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-4">
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() => navigate(`/editor/${resume.id}`)}
        >
          <Edit className="w-4 h-4 mr-1" /> Edit
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="text-gray-400 hover:text-gray-200"
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#1c1c22] border border-gray-700 rounded-lg">
            <DropdownMenuItem
              onClick={() => alert("Preview resume")}
              className="flex items-center gap-2 text-gray-200 hover:bg-gray-700"
            >
              <Eye className="w-4 h-4" /> Preview
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate(`/editor/${resume.id}`)}
              className="flex items-center gap-2 text-gray-200 hover:bg-gray-700"
            >
              <Edit className="w-4 h-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => alert("Delete resume")}
              className="flex items-center gap-2 text-red-500 hover:bg-red-600/20"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Glow border on hover */}
      <div className="absolute inset-0 rounded-2xl border-2 border-green-500/0 group-hover:border-green-500/40 transition-colors"></div>
    </motion.div>
  );
}
