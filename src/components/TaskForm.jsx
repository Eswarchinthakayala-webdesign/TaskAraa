// src/pages/TaskForm.jsx
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // your configured Supabase client
import { useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
export default function TaskForm() {
    const { user } = useUser();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    start_date: "",
    start_time: "",
    due_date: "",
    due_time: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error } = await supabase.from("tasks").insert({
      user_id: user.id,
      ...formData,
    });

    if (error) {
      alert("Error creating task: " + error.message);
    } else {
      alert("Task created successfully!");
      navigate("/tasks");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Create Task</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="title"
          placeholder="Title"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />
        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <select
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm mb-1">Start Date</label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-1">Start Time</label>
            <input
              type="time"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm mb-1">Due Date</label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-1">Due Time</label>
            <input
              type="time"
              name="due_time"
              value={formData.due_time}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-purple-600 text-white p-2 rounded hover:bg-purple-700"
        >
          Create Task
        </button>
      </form>
    </div>
  );
}
