import React from "react";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";

function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-bg-base text-slate-200 font-sans selection:bg-brand-purple selection:text-white">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Render nested route content */}
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
