// src/components/SectionEditor.jsx
import React from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function SectionEditor({ sections, onChange }) {
  // expects `sections` as array (resume.doc.sections)
  if (!sections) return <div />;

  const updateField = (sectionId, fieldId, value, itemId = null) => {
    const next = sections.map((s) => {
      if (s.id !== sectionId) return s;
      const newS = JSON.parse(JSON.stringify(s));
      if (s.repeatable && itemId) {
        newS.items = newS.items.map((it) => {
          if (it.id !== itemId) return it;
          it.fields = it.fields.map((f) => (f.id === fieldId ? { ...f, value } : f));
          return it;
        });
      } else {
        newS.fields = newS.fields.map((f) => (f.id === fieldId ? { ...f, value } : f));
      }
      return newS;
    });
    onChange(next);
  };

  const addItem = (sectionId) => {
    const next = sections.map((s) => {
      if (s.id !== sectionId) return s;
      const newItem = { id: crypto.randomUUID(), fields: s.items?.[0]?.fields?.map(f => ({ ...f, id: crypto.randomUUID(), value: "" })) || [] };
      return { ...s, items: [...(s.items || []), newItem] };
    });
    onChange(next);
  };

  const removeItem = (sectionId, itemId) => {
    const next = sections.map((s) => (s.id !== sectionId ? s : { ...s, items: (s.items || []).filter(it => it.id !== itemId) }));
    onChange(next);
  };

  return (
    <div>
      <Accordion type="single" collapsible className="space-y-3">
        {sections.map((s) => (
          <AccordionItem key={s.id} value={s.id}>
            <AccordionTrigger>{s.title}</AccordionTrigger>
            <AccordionContent>
              {!s.repeatable && s.fields?.map((f) => (
                <div key={f.id} className="mb-3">
                  {f.multiline ? (
                    <Textarea value={f.value || ""} onChange={(e) => updateField(s.id, f.id, e.target.value)} />
                  ) : (
                    <Input value={f.value || ""} onChange={(e) => updateField(s.id, f.id, e.target.value)} />
                  )}
                </div>
              ))}

              {s.repeatable && (s.items || []).map((it) => (
                <div key={it.id} className="mb-4 border rounded p-3">
                  {it.fields.map((f) => (
                    <div key={f.id} className="mb-2">
                      {f.multiline ? (
                        <Textarea value={f.value || ""} onChange={(e) => updateField(s.id, f.id, e.target.value, it.id)} />
                      ) : (
                        <Input value={f.value || ""} onChange={(e) => updateField(s.id, f.id, e.target.value, it.id)} />
                      )}
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => removeItem(s.id, it.id)}>Remove</Button>
                  </div>
                </div>
              ))}

              {s.repeatable && <Button onClick={() => addItem(s.id)}>Add {s.title}</Button>}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
