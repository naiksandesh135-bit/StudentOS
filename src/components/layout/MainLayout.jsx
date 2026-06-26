import { useState } from "react";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import { Outlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

function MainLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg-base text-slate-200 font-sans selection:bg-brand-purple selection:text-white">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer (Sidebar) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black"
            />
            {/* Sidebar container */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="relative flex flex-col w-80 max-w-[85vw] bg-bg-base border-r border-border-subtle h-full"
            >
              <Sidebar onClose={() => setMobileMenuOpen(false)} isMobile={true} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <TopNav onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 min-w-0">
          {/* Render nested route content */}
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
