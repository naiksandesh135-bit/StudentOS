import React, { useState, useEffect } from "react";
import { 
  Home, Briefcase, ShieldCheck, FolderKanban, 
  TrendingUp, TrendingDown, Calendar as CalendarIcon,
  ChevronRight, Plus, CalendarPlus, Loader2
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const [opportunities, setOpportunities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();

  const firstName = (profile?.name || user?.user_metadata?.full_name || "Student").split(" ")[0];

  useEffect(() => {
    async function fetchData() {
      try {
        const [oppsResponse, projectsResponse] = await Promise.all([
          supabase.from("opportunities").select("*").eq("user_id", user?.id).order("created_at", { ascending: false }),
          supabase.from("projects").select("*").eq("user_id", user?.id).order("created_at", { ascending: false })
        ]);

        if (oppsResponse.error) throw oppsResponse.error;
        if (projectsResponse.error) throw projectsResponse.error;

        setOpportunities(oppsResponse.data || []);
        setProjects(projectsResponse.data || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  // Calculate Stats
  const totalOpportunities = opportunities.length;
  const appliedOpportunities = opportunities.filter(o => o.status === "Applied").length;
  const activeProjects = projects.filter(p => p.status !== "Completed").length;

  // Calculate upcoming deadlines (next 7 days)
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const upcomingOpps = opportunities.filter(o => {
    if (!o.deadline) return false;
    const deadlineDate = new Date(o.deadline);
    return deadlineDate >= today && deadlineDate <= nextWeek;
  }).map(o => ({ ...o, source: 'opportunity' }));

  const upcomingProjs = projects.filter(p => {
    if (!p.deadline) return false;
    const deadlineDate = new Date(p.deadline);
    return deadlineDate >= today && deadlineDate <= nextWeek;
  }).map(p => ({ ...p, source: 'project' }));

  const allUpcoming = [...upcomingOpps, ...upcomingProjs]
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3);

  // Prepare Donut Chart Data
  const statusCounts = opportunities.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {});

  const donutData = [
    { name: "Interested", value: statusCounts["Interested"] || 0, color: "#3B82F6" },
    { name: "Applied", value: statusCounts["Applied"] || 0, color: "#10B981" },
    { name: "Interview", value: statusCounts["Interview"] || 0, color: "#7C3AED" },
    { name: "Rejected", value: statusCounts["Rejected"] || 0, color: "#EC4899" },
    { name: "Selected", value: statusCounts["Selected"] || 0, color: "#F59E0B" },
  ].filter(d => d.value > 0); // Only show statuses that have data

  if (donutData.length === 0) {
     // Default data if empty so chart doesn't break
     donutData.push({ name: "No Data", value: 1, color: "#334155" });
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const getDaysLeft = (deadline) => {
    const diffTime = Math.abs(new Date(deadline) - new Date());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days left`;
  };

  if (loading) {
     return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-brand-purple" />
          <p className="text-sm">Loading your dashboard...</p>
        </div>
     );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-100 flex items-center gap-2">
            Welcome back, {firstName}! <span className="text-2xl">👋</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Here's what's happening with your career journey today.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-surface border border-border-subtle text-sm text-slate-300">
          <CalendarIcon className="w-4 h-4 text-slate-400" />
          <span>{currentDate}</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Opportunities */}
        <div className="glass-panel p-5 relative overflow-hidden group hover:border-brand-purple/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg icon-box-purple flex items-center justify-center">
                <Home className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-300">Total Opportunities</p>
            </div>
            <div className="text-slate-500 cursor-pointer">⋮</div>
          </div>
          <p className="text-[32px] font-bold text-white mb-2">{totalOpportunities}</p>
          <p className="text-xs text-brand-green flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Active tracking
          </p>
        </div>

        {/* Applied Opportunities */}
        <div className="glass-panel p-5 relative overflow-hidden group hover:border-brand-blue/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg icon-box-blue flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-300">Applied</p>
            </div>
            <div className="text-slate-500 cursor-pointer">⋮</div>
          </div>
          <p className="text-[32px] font-bold text-white mb-2">{appliedOpportunities}</p>
          <p className="text-xs text-brand-green flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Keep going!
          </p>
        </div>

        {/* Active Projects */}
        <div className="glass-panel p-5 relative overflow-hidden group hover:border-brand-green/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg icon-box-green flex items-center justify-center">
                <FolderKanban className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-300">Active Projects</p>
            </div>
            <div className="text-slate-500 cursor-pointer">⋮</div>
          </div>
          <p className="text-[32px] font-bold text-white mb-2">{activeProjects}</p>
          <p className="text-xs text-brand-green flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            In progress
          </p>
        </div>

        {/* Upcoming Deadlines */}
        <div className="glass-panel p-5 relative overflow-hidden group hover:border-brand-orange/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg icon-box-orange flex items-center justify-center">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-300">Upcoming Deadlines</p>
            </div>
            <div className="text-slate-500 cursor-pointer">⋮</div>
          </div>
          <p className="text-[32px] font-bold text-white mb-2">{allUpcoming.length}</p>
          <p className="text-xs text-brand-pink flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            In the next 7 days
          </p>
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Opportunity Status Chart */}
        <div className="glass-panel p-5 flex flex-col">
          <h3 className="text-base font-semibold text-slate-200 mb-6">Opportunity Status</h3>
          <div className="flex-1 flex items-center justify-center relative">
            <div className="w-full h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-y-3 mt-4">
            {donutData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded bg-[var(--dot-color)]" style={{"--dot-color": item.color}}></div>
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <span className="text-slate-400">
                  {item.value} {totalOpportunities > 0 && item.name !== "No Data" && <span className="text-slate-500">({Math.round((item.value / totalOpportunities) * 100)}%)</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Project Progress */}
        <div className="glass-panel p-5 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-semibold text-slate-200">Project Progress</h3>
            <Link to="/projects" className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded bg-white/5 transition-colors">View all</Link>
          </div>
          <div className="space-y-5 flex-1 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
            {projects.length === 0 ? (
               <div className="text-center text-sm text-slate-500 pt-10">No projects yet.</div>
            ) : projects.slice(0, 5).map((proj) => {
              const colors = ["bg-brand-green", "bg-brand-blue", "bg-brand-purple", "bg-brand-orange", "bg-brand-pink"];
              const color = colors[proj.id.charCodeAt(0) % colors.length]; // Deterministic color
              return (
              <div key={proj.id} className="flex items-center gap-4">
                <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 bg-white/5`}>
                  <FolderKanban className={`w-3.5 h-3.5 ${color.replace('bg-', 'text-')}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-300 mb-1.5 truncate">{proj.title}</p>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${proj.progress || 0}%` }}></div>
                  </div>
                </div>
                <div className="w-8 text-right text-xs font-medium text-slate-400">{proj.progress || 0}%</div>
              </div>
            )})}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="glass-panel p-5 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-semibold text-slate-200">Upcoming Deadlines</h3>
            <Link to="/calendar" className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded bg-white/5 transition-colors">View all</Link>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
            {allUpcoming.length === 0 ? (
               <div className="text-center text-sm text-slate-500 pt-10">No deadlines in the next 7 days.</div>
            ) : allUpcoming.map((item, idx) => (
              <div key={idx} className="flex items-center p-3 rounded-xl bg-bg-surface-hover border border-border-subtle group cursor-pointer hover:border-slate-600 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-bg-surface border border-border-subtle flex items-center justify-center shrink-0 mr-4">
                  <CalendarIcon className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.type || 'Project'}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className={`text-[11px] font-medium px-2 py-1 border rounded-md text-amber-400 border-amber-500/20 bg-amber-500/10`}>
                    {getDaysLeft(item.deadline)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Opportunities Table */}
        <div className="lg:col-span-2 glass-panel p-5 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-semibold text-slate-200">Recent Opportunities</h3>
            <div className="flex gap-2">
              <Link to="/opportunities" className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded bg-white/5 transition-colors">View all</Link>
            </div>
          </div>
          <div className="w-full overflow-x-auto flex-1">
             {opportunities.length === 0 ? (
                <div className="text-center text-sm text-slate-500 py-10">No opportunities added yet.</div>
             ) : (
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="text-xs text-slate-500 bg-bg-base/50">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-l-lg">Title</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Deadline</th>
                  <th className="px-4 py-3 font-medium rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.slice(0, 3).map((opp) => (
                <tr key={opp.id} className="border-b border-white/5 hover:bg-bg-surface-hover/50 transition-colors">
                  <td className="px-4 py-4 font-medium text-slate-200 truncate max-w-[150px]">{opp.title}</td>
                  <td className="px-4 py-4">
                    <span className="text-[11px] font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded">{opp.type}</span>
                  </td>
                  <td className="px-4 py-4 flex items-center gap-2 text-slate-300 truncate max-w-[150px]">
                    <div className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white shrink-0 uppercase">{opp.company.charAt(0)}</div>
                    {opp.company}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">{opp.deadline || "—"}</td>
                  <td className="px-4 py-4">
                    <span className={`text-[11px] font-medium px-2 py-1 rounded
                       ${opp.status === 'Interested' ? 'text-blue-400 bg-blue-500/10' : 
                         opp.status === 'Applied' ? 'text-green-400 bg-green-500/10' :
                         opp.status === 'Interview' ? 'text-violet-400 bg-violet-500/10' :
                         opp.status === 'Selected' ? 'text-amber-400 bg-amber-500/10' :
                         'text-rose-400 bg-rose-500/10'
                       }
                    `}>{opp.status}</span>
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-panel p-5">
          <h3 className="text-base font-semibold text-slate-200 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/opportunities" className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-bg-surface-hover border border-border-subtle hover:border-brand-purple hover:bg-brand-purple/5 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-brand-purple/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-brand-purple" />
              </div>
              <span className="text-xs font-medium text-slate-300 group-hover:text-white">Add Opportunity</span>
            </Link>
            <Link to="/eligibility" className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-bg-surface-hover border border-border-subtle hover:border-brand-green hover:bg-brand-green/5 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-brand-green" />
              </div>
              <span className="text-xs font-medium text-slate-300 group-hover:text-white">Check Eligibility</span>
            </Link>
            <Link to="/projects" className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-bg-surface-hover border border-border-subtle hover:border-brand-blue hover:bg-brand-blue/5 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-brand-blue/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FolderKanban className="w-6 h-6 text-brand-blue" />
              </div>
              <span className="text-xs font-medium text-slate-300 group-hover:text-white">New Project</span>
            </Link>
            <Link to="/calendar" className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-bg-surface-hover border border-border-subtle hover:border-brand-pink hover:bg-brand-pink/5 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-brand-pink/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CalendarPlus className="w-6 h-6 text-brand-pink" />
              </div>
              <span className="text-xs font-medium text-slate-300 group-hover:text-white">View Calendar</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
