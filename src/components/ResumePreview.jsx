// src/components/ResumePreview.jsx
import React, { forwardRef } from "react";
import { Button } from "@/components/ui/button";

const Section = ({ section }) => {
  if (section.repeatable) {
    return (
      <div className="mb-4">
        {section.items?.map((it) => (
          <div key={it.id} className="mb-3">
            {it.fields.map((f) => f.value ? <div key={f.id} className="text-sm mb-1">{f.value}</div> : null)}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="mb-4">
      {section.fields?.map((f) => f.value ? <div key={f.id} className="text-sm mb-1">{f.value}</div> : null)}
    </div>
  );
};

const ResumePreview = forwardRef(function ResumePreview({ doc, templateStyles }, ref) {
  const meta = doc?.meta || {};
  const fontFamily = meta.fontFamily || (templateStyles?.fontFamily) || "Poppins, sans-serif";
  return (
    <div ref={ref} className="mx-auto max-w-[820px] bg-white rounded-lg shadow p-8" style={{ fontFamily, color: templateStyles?.color || "#111827" }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{doc?.sections?.[0]?.fields?.find(f=>f.id==="fullName")?.value || "Your Name"}</h1>
        <div className="text-sm text-gray-500">{doc?.sections?.[0]?.fields?.find(f=>f.id==="email")?.value}</div>
      </div>

      {doc?.sections?.slice(1).map((s) => (
        <section key={s.id} className="mb-6">
          <h3 className="text-sm font-semibold mb-2">{s.title}</h3>
          <Section section={s} />
        </section>
      ))}
    </div>
  );
});

export default ResumePreview;
