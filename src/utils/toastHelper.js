import { toast } from "sonner";
import React from "react";

export const showToast = (type, message, duration = 2000, description = "") => {
  toast.custom(
    () =>
      React.createElement(
        "div",
        {
          className: `toast-container px-4 py-3 rounded-lg shadow-lg ${
            type === "success"
              ? "bg-green-600 border border-green-400"
              : "bg-red-600 border border-red-400"
          }`,
          style: { width: "280px" },
        },
        // Title / main message
        React.createElement(
          "div",
          { className: "mb-1 text-white text-sm font-semibold" },
          message
        ),
        // Optional description / error message
        description
          ? React.createElement(
              "div",
              { className: "mb-2 text-gray-200 text-xs" },
              description
            )
          : null,
        // Progress bar container
        React.createElement(
          "div",
          { className: "h-1 rounded-full overflow-hidden bg-gray-700" },
          React.createElement("div", {
            className: "h-full",
            style: {
              backgroundColor: type === "success" ? "#22c55e" : "#ef4444",
              animation: `shrink ${duration}ms linear forwards`,
            },
          })
        )
      ),
    { duration }
  );
};
