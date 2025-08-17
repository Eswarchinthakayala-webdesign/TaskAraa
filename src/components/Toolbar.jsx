// src/components/Toolbar.jsx
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Undo, Redo } from "lucide-react";

const FONTS = [
  { label: "Poppins", value: "Poppins, sans-serif" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Roboto", value: "Roboto, sans-serif" },
  { label: "Merriweather", value: "Merriweather, serif" },
  { label: "Georgia", value: "Georgia, serif" },
];

export default function Toolbar({ editorRef = null }) {
  useEffect(() => {
    // inject fonts
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&family=Inter:wght@300;400;600;700&family=Roboto:wght@300;400;700&family=Merriweather:wght@300;400;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    if (editorRef?.current) editorRef.current.focus();
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Select onValueChange={(v) => exec("fontName", v)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Font Family" />
        </SelectTrigger>
        <SelectContent>
          {FONTS.map((f) => (
            <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input placeholder="16px" className="w-[68px]" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); document.execCommand("fontSize", false, "5"); const selected = window.getSelection(); if (selected.rangeCount) { const span = document.createElement("span"); span.style.fontSize = e.target.value; selected.getRangeAt(0).surroundContents(span); } } }} />

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild><Button variant="ghost" onClick={() => exec("bold")}><Bold className="w-4 h-4" /></Button></TooltipTrigger>
          <TooltipContent>Bold</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild><Button variant="ghost" onClick={() => exec("italic")}><Italic className="w-4 h-4" /></Button></TooltipTrigger>
          <TooltipContent>Italic</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild><Button variant="ghost" onClick={() => exec("underline")}><Underline className="w-4 h-4" /></Button></TooltipTrigger>
          <TooltipContent>Underline</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="hidden sm:flex items-center gap-1 ml-2">
        <Button variant="ghost" onClick={() => exec("justifyLeft")}><AlignLeft className="w-4 h-4" /></Button>
        <Button variant="ghost" onClick={() => exec("justifyCenter")}><AlignCenter className="w-4 h-4" /></Button>
        <Button variant="ghost" onClick={() => exec("justifyRight")}><AlignRight className="w-4 h-4" /></Button>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <Button variant="ghost" onClick={() => exec("undo")}><Undo className="w-4 h-4" /></Button>
        <Button variant="ghost" onClick={() => exec("redo")}><Redo className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}
