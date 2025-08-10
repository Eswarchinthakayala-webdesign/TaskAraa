import React, { useEffect, useState,useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Trash2, Sparkles, Square ,Pencil} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import Sidebar from "../components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";
import LoadingPage from './LoadingPage';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const TaskDetails = () => {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null);
    // AI Assistant states
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const typingIntervalRef = useRef(null);

  const [noteToEdit, setNoteToEdit] = useState(null);
const [editNoteData, setEditNoteData] = useState({ title: '', content: '' });
  const aiAbortRef = useRef(null);

  useEffect(() => {
    fetchTask();
    fetchNotes();
  }, [id]);

  //Edit tasks
  const handleEditNote = (note) => {
  setNoteToEdit(note.id);
  setEditNoteData({ title: note.note_title, content: note.note_content });
};

const saveEditedNote = async () => {
  if (!noteToEdit) return;

  const { error } = await supabase
    .from('task_notes')
    .update({
      note_title: editNoteData.title,
      note_content: editNoteData.content,
      updated_at: new Date()
    })
    .eq('id', noteToEdit);

  if (!error) {
    setNoteToEdit(null);
    setEditNoteData({ title: '', content: '' });
    fetchNotes();
  }
};


  const fetchTask = async () => {
    const { data } = await supabase.from('tasks').select('*').eq('id', id).single();
    setTask(data);
  };

  const fetchNotes = async () => {
    const { data } = await supabase
      .from('task_notes')
      .select('*')
      .eq('task_id', id)
      .order('created_at', { ascending: false });
    setNotes(data || []);
  };

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from('task_notes').insert([
      {
        task_id: id,
        user_id: user.id,
        note_title: newNote.title,
        note_content: newNote.content,
      },
    ]);

    if (!error) {
      setNewNote({ title: '', content: '' });
      fetchNotes();
    }

    setLoading(false);
  };

  const handleCopy = async (text, index) => {
    await navigator.clipboard.writeText(text);
    setCopiedCode(index);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const deleteNote = async () => {
    if (!noteToDelete) return;
    await supabase.from("task_notes").delete().eq("id", noteToDelete);
    setNoteToDelete(null);
    fetchNotes();
  };
   
const stopGeneration = () => {
  // Stop typing animation
  if (typingIntervalRef.current) {
    clearInterval(typingIntervalRef.current);
    typingIntervalRef.current = null;
  }

  // Abort AI request
  if (aiAbortRef.current) {
    aiAbortRef.current.abort();
    aiAbortRef.current = null;
  }

  setAiGenerating(false);
};


const runTypingEffect = (text, setFn) => {
  setFn(prev => ({ ...prev, content: "" }));
  let i = 0;
  typingIntervalRef.current = setInterval(() => {
    if (i < text.length) {
      setFn(prev => ({ ...prev, content: prev.content + text[i] }));
      i++;
    } else {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
      setAiGenerating(false);
      setAiModalOpen(false);
    }
  }, 15);
};


const generateWithAI = async () => {
  if (!aiPrompt.trim()) return;
  setAiGenerating(true);
  aiAbortRef.current = new AbortController();

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(
      `Generate a GitHub-style markdown note for: ${aiPrompt}`,
      { signal: aiAbortRef.current.signal }
    );
    const text = result.response.text();

    // ✅ if in edit mode, fill editNoteData, else fill newNote
    if (noteToEdit) {
      runTypingEffect(text, setEditNoteData);
    } else {
      runTypingEffect(text, setNewNote);
    }
  } catch (err) {
    if (err.name !== "AbortError") console.error(err);
    setAiGenerating(false);
  }
};
// Recurrence text helper function
function getRecurrenceText(recurring_type, recurrence_meta = {}) {
  if (!recurring_type || recurring_type === 'none') return null;

  switch (recurring_type) {
    case 'weekdays':
      return `Recurs: Weekdays${recurrence_meta.intervalWeeks ? ` every ${recurrence_meta.intervalWeeks} week(s)` : ''}`;
    case 'weekends':
      return `Recurs: Weekends${recurrence_meta.intervalWeeks ? ` every ${recurrence_meta.intervalWeeks} week(s)` : ''}`;
    case 'monthly':
      const day = recurrence_meta.dayOfMonth ?? '??';
      const interval = recurrence_meta.intervalMonths ?? '1';
      return `Recurs: Monthly on day ${day} every ${interval} month(s)`;
    default:
      return 'Recurs: Unknown';
  }
}


  if (!task) return <LoadingPage/>

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0E0E23] via-[#1A1A2E] to-[#0E0E23] text-white px-8 pt-20 py-10 space-y-10">
        <Sidebar/>
  {/* Task details */}
<div className="bg-[#1E1E2F] p-6 rounded-2xl shadow-xl border border-purple-600 space-y-6">

  {/* Title */}
  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500">
    {task.title}
  </h1>

  {/* Description */}
  {task.description && (
    <p className="text-gray-300 leading-relaxed">
      {task.description}
    </p>
  )}

  {/* Badges */}
  <div className="flex flex-wrap gap-3 items-center">
    {/* Priority badge */}
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide
        ${task.priority === "High" ? "bg-red-500/20 text-red-400 border border-red-500/40" :
        task.priority === "Medium" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40" :
        "bg-green-500/20 text-green-400 border border-green-500/40"}`}
    >
      Priority: {task.priority}
    </span>

    {/* Status badge */}
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide
        ${task.status === "pending" ? "bg-orange-500/20 text-orange-300 border border-orange-500/40" :
        task.status === "ongoing" ? "bg-blue-500/20 text-blue-400 border border-blue-500/40" :
        task.status === "complete" ? "bg-green-500/20 text-green-400 border border-green-500/40" :
        "bg-red-500/20 text-red-400 border border-red-500/40"}`}
    >
      Status: {task.status}
    </span>

{/* Recurrence badge */}
{task.recurring_type && task.recurring_type !== 'none' && (
  <span className="px-3 py-1 rounded-full text-xs font-semibold tracking-wide text-purple-400 border border-purple-400 bg-purple-500/20">
    {getRecurrenceText(task.recurring_type, task.recurrence_meta)}
  </span>
)}

  </div>

  {/* Timeline section */}
  <div className="bg-[#151526] p-4 rounded-xl border border-gray-700">
    <div className="grid gap-4 sm:grid-cols-2 text-sm text-gray-400">
      <div>
        <span className="block font-semibold text-indigo-300">Start</span>
        {task.start_date && task.start_time ? (
          <span>{format(new Date(task.start_date + "T" + task.start_time), "PPPp")}</span>
        ) : (
          <span className="italic text-gray-500">Not set</span>
        )}
      </div>
      <div>
        <span className="block font-semibold text-green-300">Due</span>
        {task.due_date && task.due_time ? (
          <span>{format(new Date(task.due_date + "T" + task.due_time), "PPPp")}</span>
        ) : (
          <span className="italic text-gray-500">Not set</span>
        )}
      </div>
      <div>
        <span className="block font-semibold text-purple-300">Duration</span>
        {task.duration ? (
          <span>{task.duration}</span>
        ) : (
          <span className="italic text-gray-500">Not calculated</span>
        )}
      </div>
      <div>
        <span className="block font-semibold text-pink-300">Created</span>
        <span>{format(new Date(task.created_at), "PPPp")}</span>
      </div>
    </div>
  </div>

</div>

    {/* Add note */}
      <div className="bg-[#1E1E2F] p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-pink-400 mb-4">Add Note</h2>
        <form onSubmit={handleNoteSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Note Title"
            value={newNote.title}
            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            className="w-full p-2 rounded bg-[#2A2A3D] text-white"
            required
          />
          <textarea
            placeholder="Write your note in Markdown..."
            value={newNote.content}
            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
            className="w-full h-32 p-2 rounded bg-[#2A2A3D] text-white"
            required
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-400 cursor-pointer rounded hover:bg-purple-300 hover:text-black"
            >
              {loading ? 'Saving...' : 'Add Note'}
            </button>
            <button
              type="button"
              onClick={() => setAiModalOpen(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-1"
            >
              <Sparkles className="w-4 h-4" /> AI Assistant
            </button>
          </div>
        </form>
        {/* AI Modal */}
         {/* AI Modal */}
        <AnimatePresence>
          {aiModalOpen && (
            <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="bg-[#1E1E2F] border border-purple-600 p-6 rounded-xl shadow-xl w-full max-w-md"
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                <h2 className="text-lg font-semibold text-purple-300 mb-3">🤖 AI Note Assistant</h2>
                <textarea
                  rows={3}
                  className="w-full p-3 bg-[#151526] border border-gray-700 rounded-lg text-sm text-gray-200 focus:ring-2 focus:ring-purple-500"
                  placeholder="What do you want to create?"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
               <div className="flex justify-end gap-2 mt-4">
  <button
    onClick={() => setAiModalOpen(false)}
    className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white text-sm rounded-lg"
  >
    Cancel
  </button>

  <button
    onClick={aiGenerating ? stopGeneration : generateWithAI}
    disabled={aiGenerating && false} // keep clickable for stop
    className={`px-4 py-2 rounded-lg flex items-center gap-2 text-white text-sm transition
      ${aiGenerating
        ? 'bg-red-600 hover:bg-red-700'
        : 'bg-purple-600 hover:bg-purple-700'}`}
  >
    {aiGenerating ? (
      <>
        <span className="animate-pulse">Generating...</span>
        <Square size={16} />
      </>
    ) : (
      <>
        Generate
        <Sparkles size={16} />
      </>
    )}
  </button>
</div>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
   

        {/* Markdown Preview */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2 text-indigo-400">Live Preview</h3>
          <div className="prose prose-invert max-w-none bg-[#111827] p-4 rounded">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const code = String(children).trim();
                  const index = 999; 
                  return !inline && match ? (
                    <div className="relative group">
                      <button
                        onClick={() => handleCopy(code, index)}
                        className={`absolute top-2 right-2 p-1 rounded transition ${
                          copiedCode === index
                            ? 'text-green-400'
                            : 'text-gray-400 hover:text-white'
                        }`}
                        title={copiedCode === index ? 'Copied' : 'Copy'}
                      >
                        {copiedCode === index ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                      <SyntaxHighlighter language={match[1]} style={oneDark}>
                        {code}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code className="bg-gray-800 px-1 py-0.5 rounded">{code}</code>
                  );
                },
              }}
            >
              {newNote.content || '_Nothing to preview yet_'}
            </ReactMarkdown>
          </div>
        </div>
      </div>

     {/* Notes list */}
<div>
        <h2 className="text-xl font-bold text-green-400 mb-4">All Notes</h2>
        {notes.length === 0 ? (
          <p className="text-gray-400">No notes yet.</p>
        ) : (
          notes.map((note, i) => (
            <div key={note.id} className="bg-[#1E1E2F] p-4 rounded-xl mb-4 relative">
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  onClick={() => {
                    setNoteToEdit(note.id);
                    setEditNoteData({ title: note.note_title, content: note.note_content });
                  }}
                  className="text-gray-400 hover:text-yellow-400 cursor-pointer hover:bg-white"
                  title="Edit Note"
                >
                  <Pencil className="w-5 h-5 text-yellow-400 hover:text-yellow-300" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      onClick={() => setNoteToDelete(note.id)}
                      className="text-gray-400 hover:text-red-500 cursor-pointer"
                      title="Delete Note"
                    >
                      <Trash2 size={18} className="cursor-pointer" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#0E0E23]">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Delete Note?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the note.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={deleteNote}
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {noteToEdit === note.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    className="w-full p-2 bg-[#2A2A3D] rounded text-white"
                    value={editNoteData.title}
                    onChange={(e) => setEditNoteData({ ...editNoteData, title: e.target.value })}
                  />
                  <textarea
                    className="w-full h-24 p-2 bg-[#2A2A3D] rounded text-white"
                    value={editNoteData.content}
                    onChange={(e) => setEditNoteData({ ...editNoteData, content: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        const { error } = await supabase
                          .from('task_notes')
                          .update({
                            note_title: editNoteData.title,
                            note_content: editNoteData.content,
                            updated_at: new Date()
                          })
                          .eq('id', noteToEdit);
                        if (!error) {
                          setNoteToEdit(null);
                          setEditNoteData({ title: '', content: '' });
                          fetchNotes();
                        }
                      }}
                      className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setAiModalOpen(true)}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded flex items-center gap-1"
                    >
                      <Sparkles size={14} /> Update with AI
                    </button>
                    <button
                      onClick={() => setNoteToEdit(null)}
                      className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-pink-300 mb-2">{note.note_title}</h3>
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ inline, className, children }) {
                          const match = /language-(\w+)/.exec(className || '');
                          const code = String(children).trim();
                          return !inline && match ? (
                            <div className="relative group">
                              <button
                                onClick={() => handleCopy(code, i)}
                                className={`absolute top-2 right-8 p-1 rounded transition ${
                                  copiedCode === i
                                    ? 'text-green-400'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                                title={copiedCode === i ? 'Copied' : 'Copy'}
                              >
                                {copiedCode === i ? <Check size={16} /> : <Copy size={16} />}
                              </button>
                              <SyntaxHighlighter language={match[1]} style={oneDark}>
                                {code}
                              </SyntaxHighlighter>
                            </div>
                          ) : (
                            <code className="bg-gray-800 px-1 py-0.5 rounded">{code}</code>
                          );
                        },
                      }}
                    >
                      {note.note_content}
                    </ReactMarkdown>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {format(new Date(note.created_at), 'PPP p')}
                  </p>
                </>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default TaskDetails;
