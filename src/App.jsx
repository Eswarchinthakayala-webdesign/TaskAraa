// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";

// Pages
import Home from "./pages/Home";
import Features from "./components/Features";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AuthCallback from "@/pages/AuthCallback";
import TaskForm from "./components/TaskForm";
import ScrollToTop from "./components/ScrollToTop";
import TaskCreate from "./pages/TaskCreate";
import TaskDetails from "./pages/TaskDetails";
import TasksPage from "./pages/TaskPage";
import EditTask from '@/pages/EditTask';
import TasksFilterPage from "./pages/TasksFilterPage";
import RecurringTasksPage from "@/pages/RecurringTasksPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import LinkManager from "./pages/LinkManager";
import { Toaster } from "sonner";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="relative min-h-screen bg-black text-foreground custom-scrollbar">
        <Navbar />
        <main className="relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<Features />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
           <Route path="/auth/callback" element={<AuthCallback />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <TasksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-task"
              element={
                <ProtectedRoute>
                  <TaskCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks/:id"
              element={
                <ProtectedRoute>
                  <TaskDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-task/:id"
              element={
                <ProtectedRoute>
                  <EditTask />
                </ProtectedRoute>
              }
            />
            <Route
              path="filterTasks"
              element={
                <ProtectedRoute>
                  <TasksFilterPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <RecurringTasksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/links"
              element={
                <ProtectedRoute>
                  <LinkManager />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>

     
      <Toaster
        position="top-right"
        richColors
      toastOptions={{
          duration: 3000, // 3s
          className: "text-white rounded-lg shadow-lg overflow-hidden",
        }}
      />
    </Router>
  );
}

export default App;
