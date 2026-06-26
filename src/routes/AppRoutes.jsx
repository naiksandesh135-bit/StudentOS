import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import ProtectedRoute from "./ProtectedRoute";
import Landing from "../pages/Landing";
import Dashboard from "../pages/Dashboard";
import Opportunities from "../pages/Opportunities";
import Eligibility from "../pages/Eligibility";
import Projects from "../pages/Projects";
import ProjectDetails from "../pages/ProjectDetails";
import Calendar from "../pages/Calendar";
import Analytics from "../pages/Analytics";
import Settings from "../pages/Settings";

function AppRoutes() {
  return (
    <Routes>
      {/* Public Route — Landing Page */}
      <Route path="/" element={<Landing />} />

      {/* Protected Routes — require login, wrapped in MainLayout (sidebar + topnav) */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                <Route path="dashboard"        element={<Dashboard />} />
                <Route path="opportunities"    element={<Opportunities />} />
                <Route path="eligibility"      element={<Eligibility />} />
                <Route path="projects"         element={<Projects />} />
                <Route path="projects/:id"     element={<ProjectDetails />} />
                <Route path="calendar"         element={<Calendar />} />
                <Route path="analytics"        element={<Analytics />} />
                <Route path="settings"         element={<Settings />} />
                {/* Catch-all redirect to dashboard */}
                <Route path="*"               element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;

