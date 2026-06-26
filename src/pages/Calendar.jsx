import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    if (!user) return;
    async function fetchEvents() {
      try {
        setLoading(true);
        // Fetch opportunities with deadlines
        const { data: opps, error: oppsError } = await supabase
          .from("opportunities")
          .select("id, title, deadline, type")
          .eq("user_id", user?.id)
          .not("deadline", "is", null);
        
        if (oppsError) throw oppsError;

        // Fetch projects with deadlines
        const { data: projs, error: projsError } = await supabase
          .from("projects")
          .select("id, title, deadline")
          .eq("user_id", user?.id)
          .not("deadline", "is", null);

        if (projsError) throw projsError;

        // Combine and format
        const combined = [
          ...(opps || []).map(o => ({ ...o, source: "opportunity" })),
          ...(projs || []).map(p => ({ ...p, source: "project", type: "Project" }))
        ];

        setEvents(combined);
      } catch (error) {
        console.error("Error fetching calendar events:", error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, [user]);

  // Calendar Logic
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  // Generate grid cells
  const calendarCells = [];
  
  // Empty cells for days before the 1st
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null);
  }
  
  // Actual days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push(i);
  }

  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Helper to check if a specific day has events
  const getEventsForDay = (day) => {
    if (!day) return [];
    
    // Format current cell date to YYYY-MM-DD
    const cellDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return events.filter(e => e.deadline === cellDateStr);
  };

  const getEventColor = (type) => {
    switch(type) {
      case "Internship": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "Job": return "text-green-400 bg-green-500/10 border-green-500/20";
      case "Project": return "text-brand-purple bg-brand-purple/10 border-brand-purple/20";
      case "Hackathon": return "text-orange-400 bg-orange-500/10 border-orange-500/20";
      default: return "text-slate-300 bg-slate-500/10 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-slate-100 flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-brand-pink" />
            Calendar
          </h1>
          <p className="text-sm text-slate-400 mt-1">Manage your deadlines, interviews, and hackathons automatically from your data.</p>
        </div>
      </div>

      <div className="glass-panel p-6">
        {/* Calendar Controls */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-200">{monthName} {currentYear}</h2>
          <div className="flex items-center gap-2">
            <button onClick={handlePrevMonth} className="p-2 rounded-lg bg-bg-surface-hover border border-border-subtle text-slate-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={handleToday} className="px-4 py-2 rounded-lg bg-bg-surface-hover border border-border-subtle text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Today
            </button>
            <button onClick={handleNextMonth} className="p-2 rounded-lg bg-bg-surface-hover border border-border-subtle text-slate-400 hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-brand-pink" />
            <p>Loading calendar events...</p>
          </div>
        ) : (
          /* Calendar Grid */
          <div className="border border-border-subtle rounded-xl overflow-hidden">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-border-subtle bg-bg-surface-hover/50">
              {daysOfWeek.map((day) => (
                <div key={day} className="py-3 text-center text-sm font-medium text-slate-400 border-r border-border-subtle last:border-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Grid Cells */}
            <div className="grid grid-cols-7">
              {calendarCells.map((day, idx) => {
                const isToday = isCurrentMonth && day === today.getDate();
                const dayEvents = getEventsForDay(day);

                return (
                  <div key={idx} className="min-h-[70px] sm:min-h-[120px] p-1 sm:p-2 border-r border-b border-border-subtle last:border-r-0 hover:bg-bg-surface-hover/30 transition-colors flex flex-col">
                    {day ? (
                      <>
                        <div className={`w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-xs sm:text-sm font-medium mb-1 ${
                          isToday ? "bg-brand-pink text-white shadow-lg shadow-brand-pink/30" : "text-slate-300"
                        }`}>
                          {day}
                        </div>

                        {/* Events list for this day */}
                        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-0.5">
                          {dayEvents.map(evt => (
                            <div 
                              key={evt.source + evt.id} 
                              className={`px-1 py-0.5 sm:px-1.5 sm:py-1 text-[8px] sm:text-[10px] font-medium rounded border truncate cursor-pointer ${getEventColor(evt.type)} hover:brightness-125 transition-all`}
                              title={`${evt.title} (${evt.type})`}
                            >
                              {evt.title}
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-bg-surface-hover/20"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
