import React, { useState, useEffect } from "react";
import { BarChart2, Download, TrendingUp, Loader2 } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell
} from "recharts";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function Analytics() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchOpportunities() {
      try {
        const { data, error } = await supabase
          .from("opportunities")
          .select("created_at, status")
          .eq("user_id", user?.id)
          .order("created_at", { ascending: true });
          
        if (error) throw error;
        setOpportunities(data || []);
      } catch (err) {
        console.error("Fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchOpportunities();
  }, [user]);

  // 1. Process "Applications Over Time" data
  // We will group by month (e.g., "Jan", "Feb")
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  // Create a map to hold counts per month. 
  // To keep it simple, we just look at the month string of the last 6 months, or just all months present.
  const appCountsByMonth = {};
  opportunities.forEach(opp => {
    const date = new Date(opp.created_at);
    const monthStr = monthNames[date.getMonth()];
    appCountsByMonth[monthStr] = (appCountsByMonth[monthStr] || 0) + 1;
  });

  // Convert map to array format expected by Recharts
  // Let's ensure we at least show the months that have data, in chronological order of the year.
  // A robust way is to just map over the keys that exist.
  const applicationData = Object.keys(appCountsByMonth).map(month => ({
    month,
    applications: appCountsByMonth[month]
  }));

  // If no data yet, provide a dummy empty state so the chart doesn't break
  if (applicationData.length === 0) {
    applicationData.push({ month: monthNames[new Date().getMonth()], applications: 0 });
  }

  // 2. Process "Application Funnel" data
  // Our funnel stages: Saved (All) -> Applied -> Interview -> Selected
  const totalSaved = opportunities.length;
  const appliedCount = opportunities.filter(o => ["Applied", "Interview", "Selected", "Rejected"].includes(o.status)).length;
  const interviewCount = opportunities.filter(o => ["Interview", "Selected", "Rejected"].includes(o.status)).length; // Assuming if interviewed, it might be selected/rejected later
  const selectedCount = opportunities.filter(o => o.status === "Selected").length;

  const successRateData = [
    { stage: "Saved", count: totalSaved },
    { stage: "Applied", count: appliedCount },
    { stage: "Interview", count: interviewCount },
    { stage: "Offer", count: selectedCount },
  ];

  // Calculate generic trend (e.g., comparing last month to this month)
  let trendPercent = 0;
  if (applicationData.length >= 2) {
    const lastMonth = applicationData[applicationData.length - 2].applications;
    const thisMonth = applicationData[applicationData.length - 1].applications;
    if (lastMonth > 0) {
      trendPercent = Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
    } else if (thisMonth > 0) {
      trendPercent = 100;
    }
  }

  if (loading) {
     return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-brand-orange" />
          <p className="text-sm">Loading analytics...</p>
        </div>
     );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-100 flex items-center gap-3">
            <BarChart2 className="w-8 h-8 text-brand-orange" />
            Analytics Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">Track your application success rates and profile growth over time.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-surface-hover border border-border-subtle text-slate-300 hover:text-white transition-colors">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications Over Time */}
        <div className="glass-panel p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-200">Opportunities Saved Over Time</h3>
              <p className="text-sm text-slate-400">Total opportunities added per month</p>
            </div>
            {trendPercent > 0 && (
              <div className="px-3 py-1 bg-brand-green/10 text-brand-green border border-brand-green/20 rounded text-xs font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +{trendPercent}%
              </div>
            )}
          </div>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={applicationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="month" stroke="#64748B" tick={{fill: '#64748B', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748B" tick={{fill: '#64748B', fontSize: 12}} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151C2C', borderColor: '#1E293B', borderRadius: '8px' }}
                  itemStyle={{ color: '#F8FAFC' }}
                />
                <Line type="monotone" dataKey="applications" stroke="#F59E0B" strokeWidth={3} dot={{r: 4, fill: '#F59E0B'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel Conversion */}
        <div className="glass-panel p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-200">Application Funnel</h3>
            <p className="text-sm text-slate-400">Conversion rate across your hiring stages</p>
          </div>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={successRateData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                <XAxis type="number" stroke="#64748B" tick={{fill: '#64748B', fontSize: 12}} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="stage" type="category" stroke="#64748B" tick={{fill: '#64748B', fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151C2C', borderColor: '#1E293B', borderRadius: '8px' }}
                  itemStyle={{ color: '#F8FAFC' }}
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={32}>
                  {successRateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === successRateData.length - 1 ? '#10B981' : '#3B82F6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
