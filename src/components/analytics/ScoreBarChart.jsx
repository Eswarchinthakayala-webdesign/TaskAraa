import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1b1b2b] border border-gray-700 p-3 rounded-lg shadow-lg">
        <p className="font-semibold text-white">{label}</p>
        {payload.map((item, idx) => (
          <p key={idx} className="text-gray-300 text-sm">
            {item.name}:{" "}
            <span className="text-white font-medium">{item.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ScoreBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis dataKey="topic" tick={{ fill: "#fff" }} />
        <YAxis tick={{ fill: "#fff" }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="score" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
