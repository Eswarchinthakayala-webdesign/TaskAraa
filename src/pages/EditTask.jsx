// src/pages/EditTask.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { CalendarIcon, Clock, LayoutDashboard } from 'lucide-react';

import {
  Popover, PopoverTrigger, PopoverContent,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
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

export default function EditTask() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    start_date: null,
    start_time: '',
    due_date: null,
    due_time: '',
    duration: '',
    recurring_type: 'none',
    recurrence_meta: {},
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchTask = async () => {
      const { data, error } = await supabase.from('tasks').select('*').eq('id', id).single();
      if (data) {
        setForm({
          ...data,
          start_date: data.start_date ? new Date(data.start_date) : null,
          due_date: data.due_date ? new Date(data.due_date) : null,
          recurring_type: data.recurring_type || 'none',
          recurrence_meta: data.recurrence_meta || {},
        });
      } else {
        alert('Task not found');
        navigate('/tasks');
      }
    };
    fetchTask();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRecurrenceMetaChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      recurrence_meta: {
        ...prev.recurrence_meta,
        [key]: value,
      },
    }));
  };

  // Validate recurrence_meta fields depending on recurring_type
  const validateRecurrence = () => {
    const errs = {};

    if (form.recurring_type === 'weekdays' || form.recurring_type === 'weekends') {
      const intervalWeeks = form.recurrence_meta.intervalWeeks;
      if (intervalWeeks !== undefined && intervalWeeks !== '') {
        if (!/^\d+$/.test(intervalWeeks) || parseInt(intervalWeeks) < 1) {
          errs.intervalWeeks = 'Interval must be a positive integer';
        }
      }
    }

    if (form.recurring_type === 'monthly') {
      const dayOfMonth = form.recurrence_meta.dayOfMonth;
      const intervalMonths = form.recurrence_meta.intervalMonths;

      if (!dayOfMonth || !/^\d+$/.test(dayOfMonth) || parseInt(dayOfMonth) < 1 || parseInt(dayOfMonth) > 31) {
        errs.dayOfMonth = 'Day of month must be between 1 and 31';
      }

      if (intervalMonths !== undefined && intervalMonths !== '') {
        if (!/^\d+$/.test(intervalMonths) || parseInt(intervalMonths) < 1) {
          errs.intervalMonths = 'Interval must be a positive integer';
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateRecurrence()) return;

    const { error } = await supabase.from('tasks').update({
      ...form,
      start_date: form.start_date ? format(form.start_date, 'yyyy-MM-dd') : null,
      due_date: form.due_date ? format(form.due_date, 'yyyy-MM-dd') : null,
      recurrence_meta: form.recurrence_meta,
    }).eq('id', id);

    if (!error) {
      navigate('/tasks');
    } else {
      alert('Failed to update task: ' + error.message);
    }
  };

  const DatePicker = ({ label, date, setDate }) => (
    <div className="w-full">
      <Label className="text-sm mb-1 text-gray-300">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start bg-[#1e1e2f] text-white border-gray-700 cursor-pointer">
            {date ? format(date, 'PPP') : 'Pick a date'}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="bg-[#1e1e2f] border-gray-600 text-white p-0 w-auto">
          <Calendar mode="single" selected={date} onSelect={setDate} />
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0f1e] text-white px-6 pt-18 py-12">
      <Sidebar />
      <div className="max-w-4xl mx-auto bg-[#16162c] shadow-xl rounded-xl p-8 md:p-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500 text-transparent bg-clip-text">
            Edit Task
          </h1>
          <Button
            variant="outline"
            className="flex items-center gap-2 text-black cursor-pointer hover:bg-gray-700"
            onClick={() => navigate('/dashboard')}
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Button>
        </div>

        <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={(e) => e.preventDefault()}>
          <div className="md:col-span-2">
            <Label className="pb-3">Title</Label>
            <Input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Project Meeting"
              className="bg-[#1e1e2f] text-white"
              required
            />
          </div>

          <div className="md:col-span-2">
            <Label className="pb-3">Description</Label>
            <Textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the task"
              className="bg-[#1e1e2f] text-white"
            />
          </div>

          <div>
            <Label className="pb-3">Priority</Label>
            <Select
              value={form.priority}
              onValueChange={(val) => setForm((prev) => ({ ...prev, priority: val }))}
            >
              <SelectTrigger className="bg-[#1e1e2f] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e1e2f] text-white">
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="pb-3">Duration</Label>
            <Input
              name="duration"
              value={form.duration}
              onChange={handleChange}
              placeholder="e.g. 2h 30m"
              className="bg-[#1e1e2f] text-white"
            />
          </div>

          <DatePicker
            label="Start Date"
            date={form.start_date}
            setDate={(d) => setForm((prev) => ({ ...prev, start_date: d }))}
          />

          <div>
            <Label className="pb-3">Start Time</Label>
            <div className="relative">
              <Input
                type="time"
                name="start_time"
                value={form.start_time}
                onChange={handleChange}
                className="bg-gray-400 text-white pr-10 cursor-pointer hover:bg-gray-500"
              />
              <Clock className="absolute right-3 top-2.5 w-4 h-4 text-black" />
            </div>
          </div>

          <DatePicker
            label="Due Date"
            date={form.due_date}
            setDate={(d) => setForm((prev) => ({ ...prev, due_date: d }))}
          />

          <div>
            <Label className="pb-3">Due Time</Label>
            <div className="relative">
              <Input
                type="time"
                name="due_time"
                value={form.due_time}
                onChange={handleChange}
                className="bg-gray-400 text-white pr-10 cursor-pointer hover:bg-gray-500"
              />
              <Clock className="absolute right-3 top-2.5 w-4 h-4 text-black" />
            </div>
          </div>

          {/* Recurrence Type Selector */}
          <div className="md:col-span-2">
            <Label className="pb-2">Recurrence Type</Label>
            <Select
              value={form.recurring_type}
              onValueChange={(val) =>
                setForm((prev) => ({
                  ...prev,
                  recurring_type: val,
                  recurrence_meta: {}, // reset on type change
                }))
              }
            >
              <SelectTrigger className="bg-[#1e1e2f] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e1e2f] text-white">
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="weekdays">Weekdays</SelectItem>
                <SelectItem value="weekends">Weekends</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recurrence Meta Inputs */}

          {(form.recurring_type === 'weekdays' || form.recurring_type === 'weekends') && (
            <div className="md:col-span-2">
              <Label className="pb-2">Repeat every (weeks)</Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={form.recurrence_meta.intervalWeeks || ''}
                onChange={(e) => handleRecurrenceMetaChange('intervalWeeks', e.target.value)}
                placeholder="1"
                className="bg-[#1e1e2f] text-white"
              />
              {errors.intervalWeeks && (
                <p className="text-red-500 text-sm mt-1">{errors.intervalWeeks}</p>
              )}
              <p className="text-gray-400 text-xs mt-1">Set how often the recurrence repeats in weeks (default 1).</p>
            </div>
          )}

          {form.recurring_type === 'monthly' && (
            <>
              <div className="md:col-span-1">
                <Label className="pb-2">Day of Month (1-31)</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={form.recurrence_meta.dayOfMonth || ''}
                  onChange={(e) => handleRecurrenceMetaChange('dayOfMonth', e.target.value)}
                  placeholder="15"
                  className="bg-[#1e1e2f] text-white"
                />
                {errors.dayOfMonth && (
                  <p className="text-red-500 text-sm mt-1">{errors.dayOfMonth}</p>
                )}
              </div>

              <div className="md:col-span-1">
                <Label className="pb-2">Repeat every (months)</Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={form.recurrence_meta.intervalMonths || ''}
                  onChange={(e) => handleRecurrenceMetaChange('intervalMonths', e.target.value)}
                  placeholder="1"
                  className="bg-[#1e1e2f] text-white"
                />
                {errors.intervalMonths && (
                  <p className="text-red-500 text-sm mt-1">{errors.intervalMonths}</p>
                )}
                <p className="text-gray-400 text-xs mt-1">Set how often the recurrence repeats in months (default 1).</p>
              </div>
            </>
          )}

          <div className="md:col-span-2 flex flex-col sm:flex-row gap-4 mt-4 w-full">
            <Button
              variant="outline"
              className="w-full sm:w-1/2 bg-gray-700 hover:bg-gray-600 cursor-pointer"
              onClick={() => navigate('/tasks')}
            >
              Cancel Edit
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  className="w-full sm:w-1/2 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 text-white font-semibold  shadow-lg hover:scale-105 transition-transform cursor-pointer"
                >
                  Update Task
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent className="bg-[#1e1e2f] text-white border border-gray-700">
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Update</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to update this task?
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end w-full gap-2 sm:gap-4 px-4">
                  <AlertDialogCancel className="bg-gray-600 text-white w-full sm:w-auto">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleUpdate}
                    className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto"
                  >
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </form>
      </div>
    </div>
  );
}
