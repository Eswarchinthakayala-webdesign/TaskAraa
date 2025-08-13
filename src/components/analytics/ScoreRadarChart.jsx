import React from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Custom tooltip styling
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1b1b2b] border border-gray-700 p-3 rounded-lg shadow-lg">
        <p className="font-semibold text-white">{payload[0].payload.topic}</p>
        <p className="text-gray-300 text-sm">
          Score: <span className="text-white font-medium">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function ScoreRadarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid stroke="#555" />
        <PolarAngleAxis dataKey="topic" tick={{ fill: "#fff" }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#fff" }} />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#8b5cf6"
          fill="#8b5cf6"
          fillOpacity={0.6}
        />
        <Tooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
