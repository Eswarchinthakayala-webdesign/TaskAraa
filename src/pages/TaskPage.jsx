// src/pages/TasksPage.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, isBefore } from 'date-fns';
import { ArrowRight, Trash2, Pencil, Calendar as CalendarIcon } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import Sidebar from '../components/Sidebar';
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
const PRIORITY_COLORS = {
  Low: 'bg-green-500',
  Medium: 'bg-yellow-500',
  High: 'bg-red-500',
};

const STATUS_STYLES = {
  pending: 'bg-yellow-600',
  ongoing: 'bg-blue-600',
  complete: 'bg-green-600',
  overdue: 'bg-red-600',
};

function formatRecurrence(task) {
  const type = task.recurring_type || 'none';
  const meta = task.recurrence_meta || {};
  if (type === 'none') return null;

  switch (type) {
    case 'weekdays':
      return `Recurs: Weekdays${meta.intervalWeeks ? ` every ${meta.intervalWeeks} week(s)` : ''}`;
    case 'weekends':
      return `Recurs: Weekends${meta.intervalWeeks ? ` every ${meta.intervalWeeks} week(s)` : ''}`;
    case 'monthly':
      const day = meta.dayOfMonth || '??';
      const interval = meta.intervalMonths || '1';
      return `Recurs: Monthly on day ${day} every ${interval} month(s)`;
    default:
      return null;
  }
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true); // start loading

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date", { ascending: true });

      if (!error) {
        const updated = data.map(task => {
          const dueDateTime = new Date(`${task.due_date}T${task.due_time}`);
          const isOverdue = isBefore(dueDateTime, new Date()) && task.status !== "complete";
          return { ...task, status: isOverdue ? "overdue" : task.status };
        });
        setTasks(updated);
      }

      setLoading(false); // stop loading
    };

    fetchTasks();
  }, []);

  const toggleComplete = async (task) => {
    let updatedStatus;

    if (task.status === 'complete') {
      const isNowOverdue = isBefore(new Date(`${task.due_date}T${task.due_time}`), new Date());
      updatedStatus = isNowOverdue ? 'overdue' : 'pending';
    } else {
      updatedStatus = 'complete';
    }

    const { error } = await supabase
      .from('tasks')
      .update({ status: updatedStatus })
      .eq('id', task.id);

    if (!error) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: updatedStatus } : t
        )
      );
    }
  };

   const deleteTask = async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) {
      setTasks((prev) => prev.filter((task) => task.id !== id));
      toast.success("Task deleted successfully ");
    } else {
      toast.error("Failed to delete task ");
    }
  };
   if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#070720] text-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-purple-500" />
        </motion.div>
        <motion.p
          className="mt-4 text-lg font-semibold text-purple-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, duration: 1.2, repeatType: "reverse" }}
        >
          Loading your tasks...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070720] text-white px-4 pt-18 py-10 sm:px-6 lg:px-12">
      
      <Sidebar/>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4 pt-6">
        <h1 className="text-3xl sm:text-3xl md:text-4xl lg:text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500 text-transparent bg-clip-text">
            My Tasks
          </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/calendar')}
            className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-white"
            title="Go to Calendar View"
          >
            <CalendarIcon className="w-5 h-5" /> Calendar
          </Button>
          <Link to="/create-task" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white">
              Add Task
            </Button>
          </Link>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-gray-400 text-center">No tasks found. Create one to get started!</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`relative bg-[#1b1b2f] p-5 rounded-xl border border-gray-700 hover:border-purple-500 transition ${task.status === 'complete' ? 'bg-opacity-50 grayscale' : ''
                }`}
            >
              {/* Top Action Row */}
              <div className="flex justify-between items-center gap-3 mb-3">
                <div className="flex gap-3 items-center">
                  <input
                    type="checkbox"
                    className="w-5 h-5 cursor-pointer"
                    checked={task.status === 'complete'}
                    onChange={() => toggleComplete(task)}
                    title="Mark as complete"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => navigate(`/edit-task/${task.id}`)}
                    title="Edit task"
                    className="cursor-pointer"
                  >
                    <Pencil className="w-5 h-5 text-yellow-400 hover:text-yellow-300" />
                  </Button>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Trash2
                      className="w-5 h-5 text-red-500 hover:text-red-400 cursor-pointer"
                      onClick={() => setConfirmDeleteId(task.id)}
                      title="Delete task"
                    />
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#1b1b2f] text-white border border-gray-700 rounded-xl shadow-xl w-[90%] max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-400">
                        This action cannot be undone. The task will be permanently deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                      <AlertDialogCancel className="bg-gray-700 hover:bg-gray-600 text-white rounded-md px-4 py-2">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          deleteTask(confirmDeleteId);
                          setConfirmDeleteId(null);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-md px-4 py-2"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* Task Main Content */}
              <div onClick={() => navigate(`/tasks/${task.id}`)} className="cursor-pointer">
                <h2 className="text-lg font-semibold truncate mb-1">{task.title}</h2>
                <Badge className={`${STATUS_STYLES[task.status] || 'bg-gray-600'} mb-3 w-fit`}>
                  {task.status}
                </Badge>
                <p className="text-sm text-gray-400 mb-1 line-clamp-3">{task.description}</p>

                {/* Recurrence info */}
                {task.recurring_type !== 'none' && (
                  <p className="text-xs italic text-purple-300 mb-2">
                    {formatRecurrence(task)}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                  <span className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${PRIORITY_COLORS[task.priority]}`} />
                    {task.priority} Priority
                  </span>
                  <ArrowRight className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>
                    <strong>Start:</strong>{' '}
                    {format(new Date(task.start_date + 'T' + task.start_time), 'dd MMM yyyy, hh:mm a')}
                  </div>
                  <div>
                    <strong>Due:</strong>{' '}
                    {format(new Date(task.due_date + 'T' + task.due_time), 'dd MMM yyyy, hh:mm a')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
