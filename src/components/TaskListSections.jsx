import React from "react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export default function TaskListSections({ tasks }) {
  const navigate = useNavigate();

  if (!tasks.length)
    return <p className="text-gray-400 text-center py-10">No tasks found.</p>;

  const handleKeyDown = (e, id) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      navigate(`/tasks/${id}`);
    }
  };

  return (
    <div className="space-y-4">
      {tasks.map((task) => {
        const status = (task.status || "pending").toLowerCase();
        const priority = (task.priority || "low").toLowerCase();

        // Map status to badge variant
        let statusVariant = "secondary"; // default fallback
        if (status === "complete") statusVariant = "success";
        else if (status === "overdue") statusVariant = "destructive";
        else if (status === "pending") statusVariant = "pending";
        else if (status === "ongoing") statusVariant = "info";

        // Map priority to badge variant
        let priorityVariant = "default";
        if (priority === "high") priorityVariant = "destructive";
        else if (priority === "medium") priorityVariant = "warning";
        else if (priority === "low") priorityVariant = "success";

        return (
          <div
            key={task.occurrenceKey}
            onClick={() => navigate(`/tasks/${task.id}`)}
            className="bg-[#2c2c4a] rounded-xl border border-purple-700 p-5 shadow-md hover:shadow-purple-600 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
            title={`${task.title} - ${status}`}
            role="button"
            tabIndex={0}
            aria-label={`Task: ${task.title}, status: ${status}, priority: ${priority}`}
            onKeyDown={(e) => handleKeyDown(e, task.id)}
          >
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold truncate max-w-[75%]">{task.title}</h3>

              <Badge
                variant={statusVariant}
                className="text-xs font-bold"
              >
                {status}
              </Badge>
            </div>

            <p className="text-gray-300 mt-2 mb-3 truncate">{task.description || "No description"}</p>

            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
              <Badge variant={priorityVariant} className="font-semibold">
                {priority} Priority
              </Badge>

              {task.recurring_type && task.recurring_type !== "none" && (
                <Badge variant="outline" className="text-purple-400 border-purple-400">
                  Recurs: {task.recurring_type}
                </Badge>
              )}

              <div>
                <span className="font-semibold">Due: </span>
                {task.due_date ? new Date(task.due_date).toLocaleDateString() : "Not set"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
