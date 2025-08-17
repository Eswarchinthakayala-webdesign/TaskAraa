import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

export default function TemplateCard({ template, onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.04, rotateX: 2, rotateY: -2 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      className="relative group rounded-2xl overflow-hidden bg-gradient-to-br from-[#1e1e28] to-[#15151d] 
                 border border-gray-700/60 shadow-xl"
    >
      {/* Template Thumbnail */}
      <img
        src={template.preview}
        alt={template.name}
        className="w-full h-48 object-cover"
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 
                      group-hover:opacity-100 transition-opacity flex flex-col 
                      items-center justify-center gap-3">
        <Button
          variant="secondary"
          className="bg-white/10 text-white hover:bg-white/20"
          onClick={() => alert(`Preview ${template.name}`)}
        >
          <Eye className="w-4 h-4 mr-2" /> Preview
        </Button>
        <Button
          onClick={onSelect}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Use Template
        </Button>
      </div>

      {/* Info Footer */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-100">{template.name}</h3>
        <p className="text-sm text-gray-400">{template.description}</p>
      </div>
    </motion.div>
  );
}
