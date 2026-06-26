import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../../hooks/useTheme";
import { Moon, Sun, Bell, Search, ChevronDown, LogOut, Settings, Mail, X, Calendar, Briefcase, FolderKanban } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

// ── Click-outside hook ────────────────────────────────────────────────────────
function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

// ── Days until deadline helper ────────────────────────────────────────────────
function getDaysUntil(dateStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

export default function TopNav() {
  const { theme, toggleTheme } = useTheme();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem("readNotifIds") || "[]"); }
    catch { return []; }
  });

  const profileRef = useRef(null);
  const notifRef   = useRef(null);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ opps: [], projs: [] });
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useClickOutside(profileRef, () => setProfileOpen(false));
  useClickOutside(notifRef,   () => setNotifOpen(false));
  useClickOutside(searchContainerRef, () => setIsSearchOpen(false));

  // ── Keyboard shortcut (Cmd+K) ───────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Search logic (debounced) ────────────────────────────────────────────────
  useEffect(() => {
    if (!user || searchQuery.trim().length < 2) {
      setSearchResults({ opps: [], projs: [] });
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      const q = `%${searchQuery.trim()}%`;
      const [oppsRes, projsRes] = await Promise.all([
        supabase.from("opportunities")
          .select("id, title, company, type")
          .eq("user_id", user.id)
          .ilike("title", q)
          .limit(5),
        supabase.from("projects")
          .select("id, title")
          .eq("user_id", user.id)
          .ilike("title", q)
          .limit(5)
      ]);
      setSearchResults({
        opps: oppsRes.data || [],
        projs: projsRes.data || []
      });
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, user]);

  // ── Fetch real notifications (upcoming deadlines) ─────────────────────────
  useEffect(() => {
    if (!user) return;
    async function fetchNotifications() {
      const today = new Date().toISOString().split("T")[0];
      const in14  = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];

      const [oppsRes, projsRes] = await Promise.all([
        supabase.from("opportunities").select("id, title, deadline, type")
          .eq("user_id", user.id).not("deadline", "is", null)
          .gte("deadline", today).lte("deadline", in14),
        supabase.from("projects").select("id, title, deadline")
          .eq("user_id", user.id).not("deadline", "is", null)
          .gte("deadline", today).lte("deadline", in14),
      ]);

      const opps = (oppsRes.data || []).map(o => ({
        id: `opp-${o.id}`,
        icon: o.type === "Hackathon" ? "🏆" : o.type === "Scholarship" ? "🎓" : "💼",
        title: o.title,
        desc: `${o.type} deadline in ${getDaysUntil(o.deadline)} day${getDaysUntil(o.deadline) !== 1 ? "s" : ""}`,
        days: getDaysUntil(o.deadline),
        type: "opportunity",
      }));

      const projs = (projsRes.data || []).map(p => ({
        id: `proj-${p.id}`,
        icon: "📁",
        title: p.title,
        desc: `Project deadline in ${getDaysUntil(p.deadline)} day${getDaysUntil(p.deadline) !== 1 ? "s" : ""}`,
        days: getDaysUntil(p.deadline),
        type: "project",
      }));

      // Sort by days remaining (soonest first)
      const all = [...opps, ...projs].sort((a, b) => a.days - b.days);
      setNotifications(all);
    }
    fetchNotifications();
  }, [user]);

  const unread = notifications.filter(n => !readIds.includes(n.id));
  const unreadCount = unread.length;

  function markAllRead() {
    const allIds = notifications.map(n => n.id);
    setReadIds(allIds);
    localStorage.setItem("readNotifIds", JSON.stringify(allIds));
  }

  // ── User info ───────────────────────────────────────────────────────────────
  const displayName = profile?.name
    || user?.user_metadata?.full_name
    || user?.email?.split("@")[0]
    || "Student";

  const email = profile?.email || user?.email || "";
  const bio   = profile?.bio   || "No bio added yet.";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null;
  const initials = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  async function handleLogout() {
    setProfileOpen(false);
    await signOut();
    navigate("/", { replace: true });
  }

  // Urgency color for notification
  function urgencyColor(days) {
    if (days <= 2) return "text-red-400";
    if (days <= 5) return "text-amber-400";
    return "text-brand-green";
  }

  return (
    <header className="flex items-center justify-between px-8 py-5 relative">

      {/* Search Bar */}
      <div ref={searchContainerRef} className="relative flex-1 max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
          onFocus={() => setIsSearchOpen(true)}
          placeholder="Search opportunities, projects..."
          className="w-full pl-12 pr-12 py-3 rounded-xl bg-bg-surface border border-transparent text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-border-subtle focus:bg-bg-surface-hover transition-all duration-200"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center px-1.5 py-1 rounded text-[10px] font-bold text-slate-400 bg-bg-base border border-border-subtle pointer-events-none">
          ⌘K
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && searchQuery.trim().length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-bg-surface border border-border-subtle rounded-2xl shadow-2xl z-50 overflow-hidden max-h-96 overflow-y-auto">
            {searchResults.opps.length === 0 && searchResults.projs.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                No results found for "{searchQuery}"
              </div>
            ) : (
              <div className="py-2">
                {searchResults.opps.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Opportunities</div>
                    {searchResults.opps.map(opp => (
                      <button
                        key={opp.id}
                        onClick={() => { setIsSearchOpen(false); navigate("/opportunities"); }}
                        className="w-full flex flex-col px-4 py-2 hover:bg-bg-surface-hover text-left transition-colors"
                      >
                        <span className="text-sm font-medium text-slate-200 truncate">{opp.title}</span>
                        <span className="text-xs text-slate-500 truncate">{opp.company} • {opp.type}</span>
                      </button>
                    ))}
                  </div>
                )}
                
                {searchResults.projs.length > 0 && (
                  <div className={searchResults.opps.length > 0 ? "border-t border-border-subtle mt-2 pt-2" : ""}>
                    <div className="px-4 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Projects</div>
                    {searchResults.projs.map(proj => (
                      <button
                        key={proj.id}
                        onClick={() => { setIsSearchOpen(false); navigate(`/projects/${proj.id}`); }}
                        className="w-full flex items-center px-4 py-2 hover:bg-bg-surface-hover text-left transition-colors"
                      >
                        <span className="text-sm font-medium text-slate-200 truncate">{proj.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 ml-4">

        {/* ── Notifications Bell ─────────────────────────────────────────── */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }}
            className="relative w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-bg-surface transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-pink text-[9px] text-white font-bold flex items-center justify-center shadow-[0_0_10px_rgba(236,72,153,0.5)]">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 bg-bg-surface border border-border-subtle rounded-2xl shadow-2xl z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
                <h3 className="text-sm font-semibold text-slate-200">
                  Upcoming Deadlines
                  {unreadCount > 0 && (
                    <span className="ml-2 text-[10px] bg-brand-pink/20 text-brand-pink px-1.5 py-0.5 rounded-full font-medium">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
                <button onClick={() => setNotifOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* List */}
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                    <Calendar className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-sm">No upcoming deadlines</p>
                    <p className="text-xs mt-1 opacity-60">in the next 14 days</p>
                  </div>
                ) : (
                  notifications.map(n => {
                    const isUnread = !readIds.includes(n.id);
                    return (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 px-4 py-3.5 hover:bg-bg-surface-hover transition-colors border-b border-border-subtle/50 last:border-0 ${isUnread ? "bg-brand-purple/5" : ""}`}
                      >
                        <span className="text-xl shrink-0 mt-0.5">{n.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm font-medium truncate ${isUnread ? "text-slate-100" : "text-slate-400"}`}>
                              {n.title}
                            </p>
                            {isUnread && <span className="w-2 h-2 rounded-full bg-brand-purple shrink-0" />}
                          </div>
                          <p className={`text-xs mt-0.5 font-medium ${urgencyColor(n.days)}`}>{n.desc}</p>
                          <p className="text-[10px] text-slate-600 mt-0.5 capitalize">{n.type}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-2.5 border-t border-border-subtle flex items-center justify-between">
                  <button
                    onClick={markAllRead}
                    disabled={unreadCount === 0}
                    className="text-xs text-brand-purple hover:text-brand-purple/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                  >
                    ✓ Mark all as read
                  </button>
                  <button
                    onClick={() => { setNotifOpen(false); navigate("/calendar"); }}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    View calendar →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Theme Toggle ───────────────────────────────────────────────── */}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-bg-surface transition-colors"
        >
          {theme === "dark"
            ? <Moon className="w-5 h-5" />
            : <Sun className="w-5 h-5 text-amber-400" />}
        </button>

        {/* ── Profile Dropdown ───────────────────────────────────────────── */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}
            className="flex items-center gap-3 pl-4 border-l border-border-subtle cursor-pointer hover:bg-bg-surface-hover px-3 py-2 rounded-xl transition-colors"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-slate-700">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-brand-purple flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{initials}</span>
                </div>
              )}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-[13px] font-semibold text-slate-100 leading-tight">{displayName}</p>
              <p className="text-[11px] text-slate-400">Student</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 hidden lg:block transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Profile Dropdown Panel */}
          {profileOpen && (
            <div className="absolute right-0 top-14 w-72 bg-bg-surface border border-border-subtle rounded-2xl shadow-2xl z-50 overflow-hidden">
              {/* User Card */}
              <div className="px-5 py-4 border-b border-border-subtle">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-700 shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-brand-purple flex items-center justify-center">
                        <span className="text-base font-bold text-white">{initials}</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-100 truncate">{displayName}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 truncate mt-0.5">
                      <Mail className="w-3 h-3 shrink-0" /> {email}
                    </p>
                  </div>
                </div>
                {/* Bio */}
                <p className="text-xs text-slate-400 bg-bg-surface-hover rounded-lg px-3 py-2 leading-relaxed italic">
                  "{bio}"
                </p>
                {/* Profile chips */}
                {(profile?.branch || profile?.cgpa || profile?.year) && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.branch && <span className="text-[10px] px-2 py-0.5 rounded bg-brand-purple/10 text-brand-purple border border-brand-purple/20">{profile.branch}</span>}
                    {profile.year   && <span className="text-[10px] px-2 py-0.5 rounded bg-brand-blue/10 text-blue-400 border border-blue-500/20">{profile.year} Year</span>}
                    {profile.cgpa   && <span className="text-[10px] px-2 py-0.5 rounded bg-brand-green/10 text-brand-green border border-brand-green/20">CGPA {profile.cgpa}</span>}
                  </div>
                )}
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <button
                  onClick={() => { setProfileOpen(false); navigate("/settings"); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-bg-surface-hover transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Settings & Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
