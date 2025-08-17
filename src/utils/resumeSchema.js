// src/utils/resumeSchema.js
const resumeSchema = {
  meta: {
    templateId: "modern-1",
    title: "Untitled Resume",
    fontFamily: "Poppins, sans-serif",
  },
  sections: [
    {
      id: "contact",
      title: "Contact Information",
      fields: [
        { id: "fullName", label: "Full Name", value: "Jane Doe" },
        { id: "email", label: "Email", value: "jane.doe@example.com" },
        { id: "phone", label: "Phone", value: "+1 (555) 123-4567" },
        { id: "location", label: "Location", value: "San Francisco, CA" },
      ],
    },
    {
      id: "summary",
      title: "Summary",
      fields: [
        { id: "summaryText", label: "Summary", multiline: true, value: "Product designer with 6+ years building human-centered products. Focused on strategy, UX research, and delightful interactions." },
      ],
    },
    {
      id: "experience",
      title: "Experience",
      repeatable: true,
      items: [
        {
          id: "exp-1",
          fields: [
            { id: "jobTitle", label: "Title", value: "Senior Product Designer" },
            { id: "company", label: "Company", value: "Acme Corp" },
            { id: "dates", label: "Dates", value: "2020 - Present" },
            { id: "description", label: "Description", multiline: true, value: "Led design for mobile & web experience, improved conversion by 28%." },
          ],
        },
      ],
    },
    {
      id: "education",
      title: "Education",
      repeatable: true,
      items: [
        {
          id: "edu-1",
          fields: [
            { id: "degree", label: "Degree", value: "B.Sc. Computer Science" },
            { id: "institution", label: "Institution", value: "State University" },
            { id: "dates", label: "Dates", value: "2012 - 2016" },
          ],
        },
      ],
    },
    {
      id: "skills",
      title: "Skills",
      fields: [
        { id: "skillsList", label: "Skills", value: "UX Design, Prototyping, Figma, Research, Product Strategy" },
      ],
    },
    {
      id: "projects",
      title: "Projects",
      repeatable: true,
      items: [
        {
          id: "proj-1",
          fields: [
            { id: "projectName", label: "Project Name", value: "Onboarding Revamp" },
            { id: "description", label: "Description", value: "Redesigned onboarding flow and increased retention by 15%." },
            { id: "link", label: "Link", value: "" },
          ],
        },
      ],
    },
  ],
};

export default resumeSchema;
