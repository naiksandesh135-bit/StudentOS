import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Briefcase,
  ShieldCheck,
  FolderKanban,
  Calendar,
  BarChart2,
  Settings,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LogOut
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const navItems = [
  { to: "/dashboard",     label: "Dashboard",         icon: Home },
  { to: "/opportunities", label: "Opportunities",       icon: Briefcase },
  { to: "/eligibility",  label: "Eligibility Checker", icon: ShieldCheck },
  { to: "/projects",     label: "Projects",            icon: FolderKanban },
  { to: "/calendar",     label: "Calendar",            icon: Calendar },
  { to: "/analytics",   label: "Analytics",            icon: BarChart2 },
  { to: "/settings",    label: "Settings",             icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate("/", { replace: true });
  }
  const location = useLocation();

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="bg-bg-base flex flex-col border-r border-border-subtle z-20"
      style={{ minHeight: "100vh" }}
    >
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-6 py-8">
        <div className="w-10 h-10 rounded-xl bg-brand-purple flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(124,58,237,0.5)]">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="whitespace-nowrap overflow-hidden"
            >
              <h1 className="text-lg font-bold text-white tracking-tight leading-tight">StudentOS</h1>
              <p className="text-xs text-slate-400 font-medium">Student Operating System</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-brand-purple text-white shadow-[0_4px_12px_rgba(124,58,237,0.3)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-bg-surface"
              }`}
            >
              <div className="flex items-center justify-center shrink-0">
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-300"}`} />
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Controls */}
      <div className="p-4 space-y-1">
        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full p-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap overflow-hidden text-sm font-medium"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex items-center gap-3 w-full p-3 rounded-xl text-slate-400 hover:text-white hover:bg-bg-surface transition-colors ${collapsed ? "justify-center" : ""}`}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
