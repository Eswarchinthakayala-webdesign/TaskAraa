// src/data/templates.js
const templates = [
  { id: "modern-1", name: "Modern Clean", category: "Modern", thumbnail: "/templates/modern-1.png", styles: { fontFamily: "Poppins, sans-serif", color: "#0f172a", sectionTitle: "text-indigo-600 uppercase tracking-wide", fieldText: "text-gray-700" }, defaultDoc: null },
  { id: "classic-1", name: "Classic Professional", category: "Classic", thumbnail: "/templates/classic-1.png", styles: { fontFamily: "Merriweather, serif", color: "#111827", sectionTitle: "text-black", fieldText: "text-gray-800" }, defaultDoc: null },
  { id: "minimal-1", name: "Minimal Light", category: "Minimal", thumbnail: "/templates/minimal-1.png", styles: { fontFamily: "Inter, sans-serif", color: "#111827", sectionTitle: "text-gray-700", fieldText: "text-gray-700" }, defaultDoc: null },
  { id: "creative-1", name: "Creative Bold", category: "Creative", thumbnail: "/templates/creative-1.png", styles: { fontFamily: "Poppins, sans-serif", color: "#0f172a", sectionTitle: "text-pink-600", fieldText: "text-gray-800" }, defaultDoc: null },
  { id: "designer-1", name: "Designer Aesthetic", category: "Designer", thumbnail: "/templates/designer-1.png", styles: { fontFamily: "Roboto Slab, serif", color: "#0f172a", sectionTitle: "text-teal-600", fieldText: "text-slate-700" }, defaultDoc: null },
  { id: "professional-1", name: "Corporate Executive", category: "Professional", thumbnail: "/templates/professional-1.png", styles: { fontFamily: "Source Serif Pro, serif", color: "#1e293b", sectionTitle: "text-blue-700", fieldText: "text-slate-800" }, defaultDoc: null },
  // Add more template objects up to 20 as needed (duplicate variations)
];

// defaultDoc is filled at runtime from resumeSchema if null
export default templates;
