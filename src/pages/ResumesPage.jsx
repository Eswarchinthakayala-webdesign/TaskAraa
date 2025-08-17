// src/pages/ResumesPage.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Plus, FileText, Trash2, Loader2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { toast } from "sonner";
import LoadingPage from "./LoadingPage";
import Sidebar from "../components/Sidebar";

/**
 * ============================================================================
 * Resume Template Configurations
 * Each template has a pre-defined initialDoc structure that is inserted
 * into the database when user creates a new resume from that template.
 * ============================================================================
 */
const templateConfigs = {
  modern: [
    {
      id: "header",
      title: "Header",
      content:
        "John Doe\nFull Stack Developer\njohndoe@example.com · +91-98765-43210 · Bangalore, India\nlinkedin.com/in/johndoe · github.com/johndoe",
      style: { fontFamily: "Inter", fontSize: 20, bold: true, align: "center" },
    },
    {
      id: "summary",
      title: "Summary",
      content:
        "Passionate Full Stack Developer with 3+ years of experience designing scalable web applications. Skilled in React, Node.js, and cloud services. Strong foundation in data structures and algorithms.",
      style: { align: "left" },
    },
    {
      id: "experience",
      title: "Experience",
      content:
        "Software Engineer – ABC Tech (2022-Present)\n• Developed resume builder with React & Supabase.\n• Improved API performance by 40%.\n\nIntern – XYZ Solutions (2021)\n• Built dashboards with Next.js.\n• Automated reporting pipelines saving 10+ hrs/week.",
      style: { bullet: "disc", align: "left" },
    },
    {
      id: "education",
      title: "Education",
      content:
        "B.Tech in Computer Science, Saveetha University (2018-2022)\nCGPA: 8.5/10",
      style: { align: "left" },
    },
    {
      id: "skills",
      title: "Skills",
      content:
        "Frontend: React, Next.js, TailwindCSS\nBackend: Node.js, Express, Supabase\nDatabase: PostgreSQL, MongoDB\nOther: AWS, Docker, Git",
      style: { bullet: "chips", align: "left" },
    },
    {
      id: "projects",
      title: "Projects",
      content:
        "Resume Builder – AI-powered editor with Gemini API\nE-commerce Platform – MERN app with Stripe\nPortfolio – Personal portfolio built with Next.js",
      style: { bullet: "number", align: "left" },
    },
    {
      id: "achievements",
      title: "Achievements",
      content:
        "• Certified AWS Developer\n• Winner – National Hackathon 2021\n• Published ML Research Paper (IEEE)",
      style: { bullet: "disc", align: "left" },
    },
    {
      id: "extras",
      title: "Languages & Interests",
      content: "Languages: English, Hindi\nInterests: Chess, Blogging, Teaching",
      style: { align: "left" },
    },
  ],

  classic: [
    {
      id: "header",
      title: "Header",
      content:
        "Jane Smith\nSoftware Engineer\njanesmith@example.com | +91-91234-56789 | linkedin.com/in/janesmith",
      style: { fontFamily: "Times New Roman", fontSize: 18, align: "left" },
    },
    {
      id: "summary",
      title: "Professional Summary",
      content:
        "Detail-oriented software engineer with 4+ years in backend development, APIs, and database management.",
      style: { align: "left" },
    },
    {
      id: "experience",
      title: "Experience",
      content:
        "Software Developer – FinTech Ltd (2020-Present)\n– Designed REST APIs with Node.js\n– Reduced AWS costs by 20%\n\nIntern – TechWorld (2019)\n– Migrated legacy systems to cloud",
      style: { bullet: "dash", align: "left" },
    },
    {
      id: "education",
      title: "Education",
      content: "B.Sc. IT – Delhi University (2016-2020) · GPA: 8.2/10",
      style: { align: "left" },
    },
    {
      id: "skills",
      title: "Skills",
      content: "Java · Spring Boot · PostgreSQL · Linux · Git · Docker",
      style: { bullet: "chips", align: "left" },
    },
    {
      id: "projects",
      title: "Projects",
      content:
        "Inventory Management System\nLibrary Portal\nOnline Banking Application",
      style: { bullet: "disc", align: "left" },
    },
    {
      id: "certifications",
      title: "Certifications",
      content:
        "Oracle Certified Java Programmer\nAWS Solutions Architect – Associate",
      style: { bullet: "disc", align: "left" },
    },
  ],

  elegant: [
    {
      id: "header",
      title: "Header",
      content: "Michael Johnson\nSoftware Architect\nmichaelj@example.com · linkedin.com/in/michaelj",
      style: { fontFamily: "Georgia", fontSize: 22, italic: true, align: "center" },
    },
    {
      id: "summary",
      title: "Summary",
      content:
        "Software architect with 6+ years designing cloud solutions and leading teams. Expert in AWS and microservices.",
      style: { align: "justify" },
    },
    {
      id: "experience",
      title: "Experience",
      content:
        "Lead Engineer – XYZ Corp (2020-Present)\n• Led 6 devs in cloud migration\n\nSoftware Engineer – ABC Ltd (2017-2020)\n• Built internal HR system",
      style: { bullet: "disc", align: "left" },
    },
    {
      id: "education",
      title: "Education",
      content: "M.Tech in Software Engineering – DEF University (2015-2017)",
      style: { align: "center" },
    },
    {
      id: "skills",
      title: "Core Skills",
      content: "Cloud Architecture · AWS · Microservices · Leadership",
      style: { bullet: "chips", align: "center" },
    },
    {
      id: "projects",
      title: "Key Projects",
      content: "CRM Platform\nIoT Dashboard\nBlockchain Voting System",
      style: { bullet: "number", align: "left" },
    },
    {
      id: "achievements",
      title: "Awards",
      content: "Employee of the Year (2021)\nBest Cloud Innovation Award (2020)",
      style: { bullet: "disc", align: "left" },
    },
  ],

  creative: [
    {
      id: "header",
      title: "Header",
      content: "Sarah Lee\nCreative Designer\nsarahlee@example.com · behance.net/sarahlee",
      style: { fontFamily: "Courier", fontSize: 20, bold: true, align: "center" },
    },
    {
      id: "summary",
      title: "About Me",
      content: "Creative designer with 5+ years crafting brand identities, UI, and motion graphics.",
      style: { align: "center" },
    },
    {
      id: "experience",
      title: "Work Experience",
      content:
        "Lead Designer – StudioX (2020-Present)\n• Designed branding for 20+ clients\n\nFreelancer (2017-2020)\n• Delivered 100+ projects",
      style: { bullet: "dash", align: "left" },
    },
    {
      id: "education",
      title: "Education",
      content: "B.Des in Visual Communication – Art University (2013-2017)",
      style: { align: "center" },
    },
    {
      id: "skills",
      title: "Design Tools",
      content: "Figma · Illustrator · Photoshop · After Effects · Blender",
      style: { bullet: "chips", align: "center" },
    },
    {
      id: "projects",
      title: "Portfolio",
      content: "E-commerce UI Redesign\nBrand Identity for XYZ\nMotion Graphics Ads",
      style: { bullet: "disc", align: "left" },
    },
    {
      id: "achievements",
      title: "Awards",
      content: "Behance Featured Designer\nWinner – National Design Challenge 2019",
      style: { bullet: "disc", align: "left" },
    },
  ],

minimal: [
  {
    id: "header",
    title: "Header",
    content:
      "Alex Carter\nFrontend Developer\nalex@example.com | github.com/alex | +91-99888-77665",
    style: {
      fontFamily: "Arial",
      fontSize: 18,
      align: "left",
      headingColor: "#111827",
      textColor: "#374151",
    },
  },
  {
    id: "summary",
    title: "Summary",
    content:
      "Frontend engineer with 4+ years of experience focused on simplicity, usability, and performance-driven design. Skilled in responsive UIs, accessibility standards, and modern web technologies. Strong problem solver with a passion for clean design.",
    style: { align: "left", textColor: "#111827" },
  },
  {
    id: "experience",
    title: "Experience",
    content:
      "UI Engineer – CleanWeb (2022-Present)\n• Designed and implemented reusable UI components in React.\n• Improved Lighthouse performance scores by 30%.\n\nFrontend Developer – BrightApps (2020-2022)\n• Built responsive landing pages with TailwindCSS.\n• Collaborated with designers to streamline design-to-code handoff.",
    style: { bullet: "disc", align: "left", textColor: "#111827" },
  },
  {
    id: "education",
    title: "Education",
    content:
      "B.Sc. Computer Science – Mumbai University (2016-2020)\nGraduated with Distinction · CGPA: 8.6/10",
    style: { align: "left", textColor: "#111827" },
  },
  {
    id: "skills",
    title: "Skills",
    content:
      "Frontend: React, Next.js, TailwindCSS\nAccessibility & SEO\nVersion Control: Git, GitHub\nSoft Skills: Collaboration, Communication",
    style: { bullet: "chips", align: "left", textColor: "#111827" },
  },
  {
    id: "projects",
    title: "Projects",
    content:
      "Personal Portfolio – Built with Next.js and TailwindCSS\nMinimal Blog – A lightweight markdown-based blog system",
    style: { bullet: "dash", align: "left", textColor: "#111827" },
  },
  {
    id: "extras",
    title: "Languages & Interests",
    content: "Languages: English, Spanish\nInterests: Photography, Cycling, Blogging",
    style: { align: "left", textColor: "#111827" },
  },
],

startup: [
  {
    id: "header",
    title: "Header",
    content: "Riya Sharma\nFull Stack Engineer\nriya@example.com · riya.dev",
    style: {
      fontFamily: "Poppins",
      fontSize: 20,
      bold: true,
      align: "center",
      headingColor: "#f97316",
      textColor: "#374151",
    },
  },
  {
    id: "summary",
    title: "Pitch",
    content:
      "Full Stack Engineer passionate about rapid prototyping, building MVPs, and scaling startup products. Experienced in working in high-pressure environments with limited resources and strict timelines.",
    style: { align: "center", textColor: "#f97316" },
  },
  {
    id: "experience",
    title: "Experience",
    content:
      "Software Engineer – StartupHub (2021-Present)\n• Built SaaS analytics dashboard used by 500+ startups.\n• Integrated Stripe and PayPal for global payments.\n\nIntern – LaunchPad (2020)\n• Developed MVP features for early-stage clients.\n• Optimized Firebase queries reducing costs by 25%.",
    style: { bullet: "disc", align: "left", textColor: "#111827" },
  },
  {
    id: "projects",
    title: "Startup Projects",
    content:
      "Analytics SaaS Tool – Scalable MERN stack platform\nFunding Tracker – MVP built for a fintech accelerator\nTeam Collaboration App – Real-time chat + Kanban system",
    style: { bullet: "number", align: "left", textColor: "#111827" },
  },
  {
    id: "skills",
    title: "Tech Stack",
    content:
      "Frontend: React, Next.js\nBackend: Node.js, Firebase, Supabase\nPayments: Stripe, Razorpay\nDevOps: Docker, Vercel, Netlify",
    style: { bullet: "chips", align: "center", textColor: "#111827" },
  },
  {
    id: "achievements",
    title: "Highlights",
    content:
      "Top 10 – Startup India Hackathon 2022\nLaunched 2 profitable SaaS side-projects\nMentored 3 early-stage founders on MVP development",
    style: { bullet: "disc", align: "left", textColor: "#111827" },
  },
],

academic: [
  {
    id: "header",
    title: "Header",
    content: "Dr. Ankit Verma\nResearch Scientist\nankit@university.edu",
    style: {
      fontFamily: "Times New Roman",
      fontSize: 20,
      italic: true,
      align: "center",
      headingColor: "#2563eb",
      textColor: "#1e3a8a",
    },
  },
  {
    id: "summary",
    title: "Research Interests",
    content:
      "Artificial Intelligence, Natural Language Processing, Computational Linguistics. Focused on building explainable AI systems for social impact.",
    style: { align: "center", textColor: "#1e3a8a" },
  },
  {
    id: "publications",
    title: "Publications",
    content:
      "‘Neural Approaches to NLP’ – IEEE 2021\n‘AI for Social Good’ – Springer 2020\n‘Machine Learning for Low-Resource Languages’ – ACL 2019",
    style: { bullet: "disc", align: "left", textColor: "#111827" },
  },
  {
    id: "education",
    title: "Education",
    content:
      "Ph.D. in Computer Science – IIT Delhi (2015-2020)\nM.Tech – IIT Kanpur (2013-2015)\nB.Tech – NIT Trichy (2009-2013)",
    style: { align: "left", textColor: "#111827" },
  },
  {
    id: "experience",
    title: "Teaching & Research",
    content:
      "Assistant Professor – IIIT Hyderabad (2020-Present)\n• Teaching NLP & Deep Learning courses\n• Supervising 5 PhD students\n\nResearch Intern – Microsoft Research (2018)\n• Worked on conversational AI systems",
    style: { bullet: "dash", align: "left", textColor: "#111827" },
  },
  {
    id: "achievements",
    title: "Grants & Awards",
    content:
      "DST Research Fellowship 2019\nBest Paper Award – ICML 2020\nInvited Speaker – NeurIPS Workshop 2021",
    style: { bullet: "disc", align: "left", textColor: "#111827" },
  },
],

techy: [
  {
    id: "header",
    title: "Header",
    content: "Vikram Singh\nDevOps & Cloud Engineer\nvikram@cloudpro.dev",
    style: {
      fontFamily: "Consolas",
      fontSize: 20,
      bold: true,
      align: "center",
      headingColor: "#10b981",
      textColor: "#064e3b",
    },
  },
  {
    id: "summary",
    title: "Tech Profile",
    content:
      "DevOps & Cloud Engineer with 5+ years of experience in CI/CD pipelines, infrastructure automation, and cloud-native solutions. Strong background in scaling systems for fintech and e-commerce startups.",
    style: { align: "left", textColor: "#10b981" },
  },
  {
    id: "experience",
    title: "Experience",
    content:
      "DevOps Engineer – CloudScale (2021-Present)\n• Automated Kubernetes deployments with Helm.\n• Reduced deployment time from 40 mins to 10 mins.\n\nCloud Engineer – FinTechPro (2018-2021)\n• Implemented Terraform for IaC.\n• Migrated monolith apps to microservices in AWS.",
    style: { bullet: "disc", align: "left", textColor: "#111827" },
  },
  {
    id: "skills",
    title: "Tools & Technologies",
    content:
      "Cloud: AWS, GCP, Azure\nContainers: Docker, Kubernetes\nAutomation: Terraform, Ansible\nCI/CD: GitHub Actions, Jenkins\nMonitoring: Prometheus, Grafana",
    style: { bullet: "chips", align: "center", textColor: "#10b981" },
  },
  {
    id: "projects",
    title: "Highlighted Projects",
    content:
      "Automated Cloud Infra – Provisioned multi-region AWS infra with Terraform\nCI/CD Pipelines – Built GitHub Actions pipelines for fintech systems\nK8s Migration – Migrated legacy apps to Kubernetes cluster",
    style: { bullet: "dash", align: "left", textColor: "#111827" },
  },
  {
    id: "certifications",
    title: "Certifications",
    content:
      "Certified Kubernetes Administrator (CKA)\nAWS SysOps Administrator\nHashiCorp Terraform Associate",
    style: { bullet: "disc", align: "left", textColor: "#111827" },
  },
  {
    id: "extras",
    title: "Languages & Interests",
    content: "Languages: English, Hindi\nInterests: Open-source, Blogging, Cloud Communities",
    style: { align: "left", textColor: "#111827" },
  },
],

};


/**
 * ============================================================================
 * Template Metadata (for UI Preview Cards)
 * Instead of images, we’ll use gradient backgrounds and show
 * the template name in the middle of the card.
 * ============================================================================
 */
const templates = [
  { id: "modern", name: "Modern", gradient: "bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" },
  { id: "classic", name: "Classic", gradient: "bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500" },
  { id: "elegant", name: "Elegant", gradient: "bg-gradient-to-br from-gray-500 via-slate-600 to-black" },
  { id: "creative", name: "Creative", gradient: "bg-gradient-to-br from-pink-500 via-fuchsia-600 to-purple-700" },
  { id: "minimal", name: "Minimal", gradient: "bg-gradient-to-br from-gray-200 via-gray-400 to-gray-600" },
  { id: "startup", name: "Startup", gradient: "bg-gradient-to-br from-orange-400 via-pink-500 to-red-600" },
  { id: "academic", name: "Academic", gradient: "bg-gradient-to-br from-blue-400 via-indigo-600 to-purple-800" },
  { id: "techy", name: "Techy", gradient: "bg-gradient-to-br from-emerald-400 via-green-600 to-teal-800" },

];

/**
 * ============================================================================
 * ResumesPage Component
 * ============================================================================
 */
export default function ResumesPage() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  // ---------------------------------------------------------------------------
  // Fetch resumes on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    fetchResumes();
  }, []);

  async function fetchResumes() {
    setLoading(true);
    const { data, error } = await supabase
      .from("resumes")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      toast.error("Error loading resumes", { description: error.message });
    } else {
      setResumes(data || []);
    }
    setLoading(false);
  }

  // ---------------------------------------------------------------------------
  // Create a blank resume
  // ---------------------------------------------------------------------------
  async function createResume() {
    const initialDoc = [
      {
        id: "header",
        title: "Header",
        content:
          "Your Name\nRole / Title\nemail@example.com · +91-00000-00000 · City, Country · linkedin.com/in/you",
        style: {
          fontFamily: "Inter",
          fontSize: 18,
          lineHeight: 1.2,
          bold: true,
          align: "center",
          bullet: "none",
        },
      },
    ];

    const user = (await supabase.auth.getUser()).data.user;

    const { data, error } = await supabase
      .from("resumes")
      .insert([{ doc: initialDoc, title: "Untitled Resume", user_id: user.id }])
      .select()
      .single();

    if (error) {
      toast.error("Error creating resume", { description: error.message });
    } else {
      toast.success("New resume created");
      navigate(`/resume/${data.id}/edit`);
    }
  }

  // ---------------------------------------------------------------------------
  // Create resume from template
  // ---------------------------------------------------------------------------
  async function createResumeFromTemplate(templateId) {
    const initialDoc = templateConfigs[templateId] || [];
    const user = (await supabase.auth.getUser()).data.user;

    const { data, error } = await supabase
      .from("resumes")
      .insert([{ doc: initialDoc, title: `${templateId} Resume`, user_id: user.id }])
      .select()
      .single();

    if (error) {
      toast.error("Error creating resume", { description: error.message });
    } else {
      toast.success(`${templateId} resume created`);
      navigate(`/resume/${data.id}/edit`);
    }
  }

  // ---------------------------------------------------------------------------
  // Delete resume
  // ---------------------------------------------------------------------------
  async function deleteResume(id) {
    setDeletingId(id);
    const { error } = await supabase.from("resumes").delete().eq("id", id);

    if (error) {
      toast.error("Error deleting resume", { description: error.message });
    } else {
      toast.success("Resume deleted");
      setResumes((prev) => prev.filter((r) => r.id !== id));
    }
    setDeletingId(null);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen p-10 pt-20 bg-[#070720] text-gray-100">

      <Sidebar/>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex justify-between items-center mb-8 flex-wrap gap-4"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">
            Your Resumes
          </h1>
          <Button
            onClick={createResume}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Resume
          </Button>
        </motion.div>

        {/* User Resumes */}
        <h2 className="text-xl font-semibold mb-4 text-purple-400">
          Saved Resumes
        </h2>
        {loading ? (
          <LoadingPage />
        ) : resumes.length === 0 ? (
          <p className="text-gray-400">No resumes created yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {resumes.map((resume) => (
              <motion.div
                key={resume.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-[#1b1b2f] border border-gray-700 hover:border-gray-600 transition rounded-xl overflow-hidden">
                  <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle className="truncate text-purple-400">
                      {resume.title}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="hover:bg-purple-400 text-gray-200 hover:text-black cursor-pointer"
                          size="icon"
                        >
                          <FileText className="w-4 h-4 hover:bg-purple-400 hover:text-black" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#1b1b24] border cursor-pointer border-gray-700 text-gray-200 text-center">
                        <DropdownMenuItem
                          onClick={() =>
                            navigate(`/resume/${resume.id}/edit`)
                          }
                          className="cursor-pointer text-yellow-400"
                        >
                          <Pencil className="w-4 h-4 mr-2 text-yellow-400" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteResume(resume.id)}
                          disabled={deletingId === resume.id}
                          className="text-red-400 cursor-pointer"
                        >
                          {deletingId === resume.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-2 text-red-400 hover:text-red-600" />
                          )}
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent
                    className="cursor-pointer"
                    onClick={() => navigate(`/resume/${resume.id}/edit`)}
                  >
                    <div className="h-40 bg-purple-300 rounded-lg flex items-center justify-center text-black">
                      Preview
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Templates */}
        <h2 className="text-xl font-semibold mt-12 mb-4 text-pink-600">
          Templates
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map((t) => (
            <motion.div
              key={t.id}
              whileHover={{ scale: 1.02 }}
              className="cursor-pointer"
              onClick={() => createResumeFromTemplate(t.id)}
            >
              <Card className="bg-[#1b1b2f] border border-gray-700 hover:border-gray-600 transition rounded-xl overflow-hidden">
                <CardContent className="p-0">
                  <div
                    className={`h-48 ${t.gradient} flex items-center justify-center`}
                  >
                    <span className="text-white text-xl font-bold drop-shadow-lg">
                      {t.name}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
