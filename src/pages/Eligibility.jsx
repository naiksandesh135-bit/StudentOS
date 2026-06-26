import React, { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle2, XCircle, Loader2, TrendingUp, AlertCircle, User } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

// The user profile will be fetched dynamically.

function checkEligibility(opportunity, profile) {
  // 1. Skip Hackathons and Workshops entirely
  if (["Hackathon", "Workshop"].includes(opportunity.type)) {
    return { eligible: null, matchPercent: null, reasons: [], hasRequirements: false };
  }

  const details = opportunity.details || {};
  const reasons = [];
  let passCount = 0;
  let totalChecks = 0;

  // --- CGPA Check ---
  if (details.required_cgpa) {
    totalChecks++;
    if (profile.cgpa >= parseFloat(details.required_cgpa)) {
      passCount++;
      reasons.push({ pass: true, text: `CGPA ${profile.cgpa} ≥ ${details.required_cgpa} required` });
    } else {
      reasons.push({ pass: false, text: `CGPA ${profile.cgpa} < ${details.required_cgpa} required` });
    }
  }

  // --- Branch Check ---
  if (details.allowed_branches) {
    totalChecks++;
    const requiredBranches = details.allowed_branches
      .split(",")
      .map(b => b.trim().toLowerCase());
    const isAny = requiredBranches.includes("any") || requiredBranches.includes("all");
    const branchMatch = isAny || requiredBranches.includes(profile.branch.toLowerCase());
    if (branchMatch) {
      passCount++;
      reasons.push({ pass: true, text: `Branch ${profile.branch} matches requirement` });
    } else {
      reasons.push({ pass: false, text: `Branch ${profile.branch} not in: ${details.allowed_branches}` });
    }
  }

  // --- Skills Check ---
  if (details.required_skills) {
    const requiredSkillsArr = details.required_skills.split(",").map(s => s.trim()).filter(Boolean);
    if (requiredSkillsArr.length > 0) {
      const profileSkillsLower = profile.skills.map(s => s.toLowerCase());
      requiredSkillsArr.forEach(skill => {
        totalChecks++;
        const has = profileSkillsLower.includes(skill.toLowerCase());
        if (has) {
          passCount++;
          reasons.push({ pass: true, text: `Skill "${skill}" matched` });
        } else {
          reasons.push({ pass: false, text: `Missing skill: "${skill}"` });
        }
      });
    }
  }

  // --- Year Check (eligible_years or graduation_year) ---
  const requiredYear = details.eligible_years || details.graduation_year;
  if (requiredYear) {
    totalChecks++;
    const reqYears = requiredYear
      .split(",")
      .map(y => y.trim().toLowerCase().replace("th", "").replace("rd", "").replace("nd", "").replace("st", ""));
    const profileYear = profile.year.toLowerCase().replace("th", "").replace("rd", "").replace("nd", "").replace("st", "");
    const yearMatch = requiredYear.toLowerCase().includes("any") || reqYears.includes(profileYear) || reqYears.some(y => profile.year.includes(y));
    
    if (yearMatch) {
      passCount++;
      reasons.push({ pass: true, text: `Year ${profile.year} matches requirement` });
    } else {
      reasons.push({ pass: false, text: `Year ${profile.year} not in: ${requiredYear}` });
    }
  }

  const matchPercent = totalChecks > 0 ? Math.round((passCount / totalChecks) * 100) : null;
  const eligible = totalChecks > 0 ? passCount === totalChecks : null;

  return { eligible, matchPercent, reasons, hasRequirements: totalChecks > 0 };
}

function MatchBar({ percent }) {
  const color =
    percent >= 80 ? "bg-brand-green" :
    percent >= 50 ? "bg-brand-orange" :
    "bg-brand-pink";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${percent}%` }} />
      </div>
      <span className={`text-sm font-bold tabular-nums ${percent >= 80 ? "text-brand-green" : percent >= 50 ? "text-brand-orange" : "text-brand-pink"}`}>
        {percent}%
      </span>
    </div>
  );
}

export default function Eligibility() {
  const [opportunities, setOpportunities] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("eligible");
  const [expandedId, setExpandedId] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // 1. Fetch Opportunities for this user
        const { data: oppData, error: oppError } = await supabase
          .from("opportunities")
          .select("id, title, company, type, details")
          .eq("user_id", user?.id)
          .order("created_at", { ascending: false });
        if (oppError) throw oppError;
        setOpportunities(oppData || []);

        // 2. Fetch Profile for this user
        const { data: profData, error: profError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user?.id)
          .single();
        if (profError) throw profError;
        setProfile(profData);

      } catch (err) {
        console.error("Fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  // Evaluate each opportunity
  const evaluated = (opportunities && profile) ? opportunities.map(opp => ({
    ...opp,
    ...checkEligibility(opp, profile),
  })) : [];

  const withRequirements = evaluated.filter(o => o.hasRequirements);
  const eligible = withRequirements.filter(o => o.eligible === true);
  const notEligible = withRequirements.filter(o => o.eligible === false);
  const noRequirements = evaluated.filter(o => !o.hasRequirements);

  const displayed = activeTab === "eligible" ? eligible : notEligible;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-slate-100 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-brand-green" />
          Eligibility Checker
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Automatically compare your profile against opportunity requirements.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Student Profile Card (Left) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-panel p-5">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border-subtle">
              <div className="w-12 h-12 rounded-xl bg-brand-purple/20 flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-brand-purple" />
              </div>
              <div>
                <h3 className="font-bold text-slate-200 text-base">{profile?.name || "Student"}</h3>
                <p className="text-xs text-slate-400">Student Profile</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Branch</span>
                <span className="font-semibold text-slate-200">{profile?.branch || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">CGPA</span>
                <span className="font-semibold text-brand-green">{profile?.cgpa || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Year</span>
                <span className="font-semibold text-slate-200">{profile?.year || "N/A"}</span>
              </div>
              <div className="pt-2 border-t border-border-subtle">
                <span className="text-slate-400 text-xs mb-2 block">Skills</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile?.skills?.map(skill => (
                    <span key={skill} className="text-[11px] font-medium px-2 py-1 rounded-lg bg-brand-purple/10 border border-brand-purple/20 text-brand-purple/90">
                      {skill}
                    </span>
                  ))}
                  {(!profile?.skills || profile.skills.length === 0) && (
                     <span className="text-xs text-slate-500 italic">No skills listed.</span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-600 mt-4 italic text-center">
              Configure your profile in Settings.
            </p>
          </div>

          {/* Summary Stats */}
          <div className="glass-panel p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Summary</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Total Opportunities</span>
              <span className="font-bold text-slate-200">{opportunities.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">With Requirements</span>
              <span className="font-bold text-slate-200">{withRequirements.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-brand-green">✓ Eligible</span>
              <span className="font-bold text-brand-green">{eligible.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-brand-pink">✗ Not Eligible</span>
              <span className="font-bold text-brand-pink">{notEligible.length}</span>
            </div>
          </div>
        </div>

        {/* Results (Right) */}
        <div className="lg:col-span-3 glass-panel p-5">
          {/* Tabs */}
          <div className="flex border-b border-border-subtle mb-5">
            <button
              onClick={() => setActiveTab("eligible")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "eligible"
                  ? "border-brand-green text-brand-green"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Eligible ({eligible.length})
            </button>
            <button
              onClick={() => setActiveTab("not-eligible")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "not-eligible"
                  ? "border-brand-pink text-brand-pink"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <XCircle className="w-4 h-4" />
              Not Eligible ({notEligible.length})
            </button>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-brand-green" />
              <p className="text-sm">Checking eligibility...</p>
            </div>
          ) : withRequirements.length === 0 ? (
            /* No opportunities with requirements */
            <div className="flex flex-col items-center justify-center h-64 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                <AlertCircle className="w-7 h-7 text-slate-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-200 mb-2">No requirements found</h3>
              <p className="text-slate-400 text-sm max-w-sm">
                Go to <strong className="text-slate-300">Opportunity Hub</strong> and add opportunities with eligibility requirements (CGPA, Branch, Skills) to check your match here.
              </p>
            </div>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              {activeTab === "eligible"
                ? <p>You are not eligible for any saved opportunities yet.</p>
                : <p>You are eligible for all saved opportunities! 🎉</p>
              }
            </div>
          ) : (
            <div className="space-y-3">
              {displayed.map(opp => (
                <div key={opp.id}
                  className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                    opp.eligible
                      ? "border-brand-green/20 bg-brand-green/5 hover:border-brand-green/40"
                      : "border-brand-pink/20 bg-brand-pink/5 hover:border-brand-pink/40"
                  }`}
                >
                  {/* Card Header */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === opp.id ? null : opp.id)}
                  >
                    {opp.eligible
                      ? <CheckCircle2 className="w-6 h-6 text-brand-green shrink-0" />
                      : <XCircle className="w-6 h-6 text-brand-pink shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-slate-200 leading-tight">{opp.title}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">{opp.type}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{opp.company}</p>
                      {opp.matchPercent !== null && (
                        <div className="mt-2 w-full max-w-xs">
                          <MatchBar percent={opp.matchPercent} />
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-slate-500 text-xs">
                      {expandedId === opp.id ? "▲ Hide" : "▼ Details"}
                    </div>
                  </div>

                  {/* Expandable Reasons */}
                  {expandedId === opp.id && (
                    <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Breakdown</p>
                      {opp.reasons.map((r, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          {r.pass
                            ? <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                            : <XCircle className="w-4 h-4 text-brand-pink shrink-0 mt-0.5" />
                          }
                          <span className={r.pass ? "text-slate-300" : "text-slate-400"}>{r.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* No-requirements notice at bottom */}
          {!loading && noRequirements.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border-subtle flex items-center gap-2 text-xs text-slate-500">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {noRequirements.length} saved {noRequirements.length === 1 ? "opportunity has" : "opportunities have"} no requirements set — they are skipped in this checker.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
