import React, { useState, useEffect } from "react";
import { Search, Filter, Plus, Briefcase, Loader2, X, ExternalLink, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

const STATUS_OPTIONS = ["Interested", "Applied", "Interview", "Selected", "Rejected"];
const TYPE_OPTIONS = ["Internship", "Job", "Hackathon", "Workshop", "Scholarship"]; // Fellowship removed

const statusColor = (status) => {
  switch (status) {
    case "Interested": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    case "Applied":    return "text-green-400 bg-green-500/10 border-green-500/20";
    case "Interview":  return "text-violet-400 bg-violet-500/10 border-violet-500/20";
    case "Selected":   return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    case "Rejected":   return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    default:           return "text-slate-400 bg-slate-500/10 border-slate-500/20";
  }
};

const typeColor = (type) => {
  switch (type) {
    case "Internship":  return "text-blue-300";
    case "Job":         return "text-green-300";
    case "Hackathon":   return "text-orange-300";
    case "Workshop":    return "text-cyan-300";
    case "Scholarship": return "text-pink-300";
    default:            return "text-slate-300";
  }
};

const defaultForm = {
  // Base fields
  title: "", company: "", type: "Internship",
  deadline: "", link: "", status: "Interested",
  // Details
  duration: "", stipend: "", location: "", mode: "Remote", start_date: "", required_skills: "",
  salary_package: "", experience_required: "", job_type: "Full-time",
  theme: "", prize_pool: "", team_size: "", event_date: "", problem_statement_link: "",
  speaker: "", topic: "", certificate_available: "No", registration_fee: "",
  amount: "", renewable: "No", documents_required: "", scholarship_category: "",
  // Eligibility
  required_cgpa: "", allowed_branches: "", eligible_years: "", max_backlogs: "", gender_restriction: "", graduation_year: "", location_restriction: "", max_family_income: "", category_restriction: "", state_restriction: "", age_limit: ""
};

// Helper for rendering inputs
const Field = ({ form, setForm, label, name, type = "text", placeholder = "", options = [] }) => {
  if (type === "select") {
    return (
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
        <select value={form[name]} onChange={e => setForm({...form, [name]: e.target.value})}
          className="w-full px-4 py-2.5 rounded-xl bg-bg-base border border-border-subtle text-sm text-slate-200 focus:outline-none focus:border-brand-purple transition-colors appearance-none cursor-pointer">
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
      </div>
    );
  }
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      <input type={type} placeholder={placeholder} value={form[name]} onChange={e => setForm({...form, [name]: e.target.value})}
        className="w-full px-4 py-2.5 rounded-xl bg-bg-base border border-border-subtle text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-purple transition-colors" />
    </div>
  );
};

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => { if (user) fetchOpportunities(); }, [user]);

  async function fetchOpportunities() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setOpportunities(data || []);
    } catch (err) {
      console.error("Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.company.trim()) return;
    setIsSubmitting(true);
    try {
      // Build details JSONB object based on type
      let details = {};
      
      if (form.type === "Internship") {
        details = {
          duration: form.duration, stipend: form.stipend, location: form.location, mode: form.mode, start_date: form.start_date, required_skills: form.required_skills,
          required_cgpa: form.required_cgpa, allowed_branches: form.allowed_branches, eligible_years: form.eligible_years, max_backlogs: form.max_backlogs, gender_restriction: form.gender_restriction
        };
      } else if (form.type === "Job") {
        details = {
          salary_package: form.salary_package, experience_required: form.experience_required, location: form.location, mode: form.mode, job_type: form.job_type, required_skills: form.required_skills,
          required_cgpa: form.required_cgpa, allowed_branches: form.allowed_branches, graduation_year: form.graduation_year, max_backlogs: form.max_backlogs, location_restriction: form.location_restriction
        };
      } else if (form.type === "Hackathon") {
        details = {
          theme: form.theme, prize_pool: form.prize_pool, team_size: form.team_size, event_date: form.event_date, mode: form.mode, duration: form.duration, problem_statement_link: form.problem_statement_link
        };
      } else if (form.type === "Workshop") {
        details = {
          speaker: form.speaker, topic: form.topic, duration: form.duration, mode: form.mode, certificate_available: form.certificate_available, registration_fee: form.registration_fee
        };
      } else if (form.type === "Scholarship") {
        details = {
          amount: form.amount, renewable: form.renewable, documents_required: form.documents_required, scholarship_category: form.scholarship_category,
          required_cgpa: form.required_cgpa, max_family_income: form.max_family_income, allowed_branches: form.allowed_branches, eligible_years: form.eligible_years, gender_restriction: form.gender_restriction, category_restriction: form.category_restriction, state_restriction: form.state_restriction, age_limit: form.age_limit
        };
      }

      // Cleanup empty values from details
      Object.keys(details).forEach(key => {
        if (details[key] === "" || details[key] === null) delete details[key];
      });

      const { data, error } = await supabase
        .from("opportunities")
        .insert([{ 
          title: form.title,
          company: form.company,
          type: form.type,
          status: form.status,
          deadline: form.deadline || null,
          link: form.link || null,
          details: details,
          user_id: user?.id
        }])
        .select();
      if (error) throw error;
      setOpportunities(prev => [data[0], ...prev]);
      setIsModalOpen(false);
      setForm(defaultForm);
    } catch (err) {
      console.error("Add error:", err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusChange(id, newStatus) {
    setOpportunities(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    const { error } = await supabase.from("opportunities").update({ status: newStatus }).eq("id", id);
    if (error) { console.error(error.message); fetchOpportunities(); }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this opportunity?")) return;
    setOpportunities(prev => prev.filter(o => o.id !== id));
    const { error } = await supabase.from("opportunities").delete().eq("id", id);
    if (error) { console.error(error.message); fetchOpportunities(); }
  }

  const filtered = opportunities.filter(o => {
    const q = searchQuery.toLowerCase();
    const matchSearch = o.title.toLowerCase().includes(q) || o.company.toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getLabelsForType = (type) => {
    switch(type) {
      case "Hackathon": return { title: "Hackathon Name", company: "Organizer" };
      case "Workshop": return { title: "Workshop Name", company: "Organizer" };
      case "Scholarship": return { title: "Scholarship Name", company: "Provider" };
      default: return { title: "Role Title", company: "Company" };
    }
  };

  const labels = getLabelsForType(form.type);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-100 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-brand-purple" />
            Opportunity Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1">Save and track your internships, hackathons, and more — in one place.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-purple hover:bg-brand-purple/90 text-white font-medium transition-colors shadow-[0_4px_12px_rgba(124,58,237,0.3)]"
        >
          <Plus className="w-5 h-5" /> Add Opportunity
        </button>
      </div>

      {/* Search & Filters */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search role or company..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-surface-hover border border-border-subtle text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand-purple transition-colors"
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          {["All", ...STATUS_OPTIONS].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === s
                  ? "bg-brand-purple text-white border-brand-purple"
                  : "bg-bg-surface-hover border-border-subtle text-slate-400 hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table / States */}
      <div className="glass-panel overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-80 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-brand-purple" />
            <p className="text-sm">Loading opportunities...</p>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-brand-purple/10 flex items-center justify-center mb-4">
              <Briefcase className="w-8 h-8 text-brand-purple" />
            </div>
            <h3 className="text-xl font-bold text-slate-200 mb-2">No opportunities saved yet</h3>
            <p className="text-slate-400 text-sm max-w-sm mb-6">
              Stop losing track of internships and hackathons. Save your first opportunity now.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bg-surface border border-border-subtle text-slate-300 hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" /> Save First Opportunity
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-slate-500">
            <p>No results match your search or filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="text-xs text-slate-500 bg-bg-base/60 border-b border-border-subtle">
                <tr>
                  <th className="px-6 py-4 font-medium">Role / Name</th>
                  <th className="px-6 py-4 font-medium">Company / Organizer</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Deadline</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(opp => (
                  <tr key={opp.id} className="border-b border-white/5 hover:bg-bg-surface-hover/40 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">
                      <div className="flex items-center gap-2">
                        {opp.title}
                        {opp.link && (
                          <a href={opp.link} target="_blank" rel="noreferrer" title="Open link" className="text-slate-500 hover:text-brand-purple transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">
                          {opp.company.charAt(0)}
                        </div>
                        {opp.company}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-medium px-2 py-1 rounded border border-slate-700 bg-slate-800/50 ${typeColor(opp.type)}`}>
                        {opp.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{opp.deadline || "—"}</td>
                    <td className="px-6 py-4">
                      <select
                        value={opp.status}
                        onChange={e => handleStatusChange(opp.id, e.target.value)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded border appearance-none cursor-pointer focus:outline-none transition-colors ${statusColor(opp.status)}`}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s} className="bg-bg-surface text-slate-200">{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                         onClick={() => {
                            alert("Opportunity Details JSON: \n" + JSON.stringify(opp.details || {}, null, 2));
                         }}
                         className="p-1.5 rounded-lg text-slate-500 hover:text-brand-purple hover:bg-brand-purple/10 transition-colors mr-2"
                         title="View Details"
                      >
                         <Search className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(opp.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Opportunity Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-bg-surface border border-border-subtle rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle shrink-0">
              <h2 className="text-lg font-bold text-slate-200">Save Opportunity</h2>
              <button onClick={() => { setIsModalOpen(false); setForm(defaultForm); }} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
              
              {/* Top Level Selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Type</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-base border border-border-subtle text-sm text-slate-200 focus:outline-none focus:border-brand-purple transition-colors appearance-none cursor-pointer">
                    {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-base border border-border-subtle text-sm text-slate-200 focus:outline-none focus:border-brand-purple transition-colors appearance-none cursor-pointer">
                    {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Basic Info */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Basic Info</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">{labels.title} *</label>
                    <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl bg-bg-base border border-border-subtle text-sm text-slate-200 focus:outline-none focus:border-brand-purple transition-colors" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">{labels.company} *</label>
                    <input type="text" required value={form.company} onChange={e => setForm({...form, company: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl bg-bg-base border border-border-subtle text-sm text-slate-200 focus:outline-none focus:border-brand-purple transition-colors" />
                  </div>
                  <Field form={form} setForm={setForm} label="Deadline / Date" name="deadline" type="date" />
                  <Field form={form} setForm={setForm} label="Link / Website" name="link" type="url" placeholder="https://..." />
                </div>
              </div>

              {/* Dynamic Details */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Specific Details</p>
                <div className="grid grid-cols-2 gap-4">
                  {form.type === "Internship" && (
                    <>
                      <Field form={form} setForm={setForm} label="Duration" name="duration" placeholder="e.g. 3 Months" />
                      <Field form={form} setForm={setForm} label="Stipend" name="stipend" placeholder="e.g. $1000/mo" />
                      <Field form={form} setForm={setForm} label="Location" name="location" placeholder="e.g. New York, NY" />
                      <Field form={form} setForm={setForm} label="Mode" name="mode" type="select" options={["Remote", "Hybrid", "Onsite"]} />
                      <Field form={form} setForm={setForm} label="Start Date" name="start_date" type="date" />
                      <Field form={form} setForm={setForm} label="Required Skills" name="required_skills" placeholder="Comma separated" />
                    </>
                  )}
                  {form.type === "Job" && (
                    <>
                      <Field form={form} setForm={setForm} label="Salary Package" name="salary_package" placeholder="e.g. $120k/yr" />
                      <Field form={form} setForm={setForm} label="Experience Required" name="experience_required" placeholder="e.g. 2+ Years" />
                      <Field form={form} setForm={setForm} label="Location" name="location" placeholder="e.g. San Francisco, CA" />
                      <Field form={form} setForm={setForm} label="Mode" name="mode" type="select" options={["Remote", "Hybrid", "Onsite"]} />
                      <Field form={form} setForm={setForm} label="Job Type" name="job_type" type="select" options={["Full-time", "Part-time", "Contract"]} />
                      <Field form={form} setForm={setForm} label="Required Skills" name="required_skills" placeholder="Comma separated" />
                    </>
                  )}
                  {form.type === "Hackathon" && (
                    <>
                      <Field form={form} setForm={setForm} label="Theme" name="theme" placeholder="e.g. AI & Web3" />
                      <Field form={form} setForm={setForm} label="Prize Pool" name="prize_pool" placeholder="e.g. $10,000" />
                      <Field form={form} setForm={setForm} label="Team Size" name="team_size" placeholder="e.g. 1-4 Members" />
                      <Field form={form} setForm={setForm} label="Event Date" name="event_date" type="date" />
                      <Field form={form} setForm={setForm} label="Mode" name="mode" type="select" options={["Online", "Offline"]} />
                      <Field form={form} setForm={setForm} label="Duration" name="duration" placeholder="e.g. 48 Hours" />
                      <Field form={form} setForm={setForm} label="Problem Statement Link" name="problem_statement_link" type="url" />
                    </>
                  )}
                  {form.type === "Workshop" && (
                    <>
                      <Field form={form} setForm={setForm} label="Speaker" name="speaker" placeholder="e.g. John Doe" />
                      <Field form={form} setForm={setForm} label="Topic" name="topic" placeholder="e.g. Advanced React Patterns" />
                      <Field form={form} setForm={setForm} label="Duration" name="duration" placeholder="e.g. 2 Hours" />
                      <Field form={form} setForm={setForm} label="Mode" name="mode" type="select" options={["Online", "Offline"]} />
                      <Field form={form} setForm={setForm} label="Certificate Available" name="certificate_available" type="select" options={["Yes", "No"]} />
                      <Field form={form} setForm={setForm} label="Registration Fee" name="registration_fee" placeholder="e.g. Free or $20" />
                    </>
                  )}
                  {form.type === "Scholarship" && (
                    <>
                      <Field form={form} setForm={setForm} label="Amount" name="amount" placeholder="e.g. $5,000" />
                      <Field form={form} setForm={setForm} label="Renewable" name="renewable" type="select" options={["Yes", "No"]} />
                      <Field form={form} setForm={setForm} label="Documents Required" name="documents_required" placeholder="Comma separated" />
                      <Field form={form} setForm={setForm} label="Scholarship Category" name="scholarship_category" placeholder="e.g. Merit-based" />
                    </>
                  )}
                </div>
              </div>

              {/* Dynamic Eligibility */}
              {["Internship", "Job", "Scholarship"].includes(form.type) && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Eligibility Criteria</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Field form={form} setForm={setForm} label="Min. CGPA" name="required_cgpa" type="number" placeholder="e.g. 8.0" />
                    <Field form={form} setForm={setForm} label="Allowed Branches" name="allowed_branches" placeholder="e.g. CSE, IT" />
                    {form.type !== "Job" && <Field form={form} setForm={setForm} label="Eligible Years" name="eligible_years" placeholder="e.g. 3rd, 4th" />}
                    <Field form={form} setForm={setForm} label="Max Backlogs Allowed" name="max_backlogs" type="number" placeholder="e.g. 0" />
                    
                    {form.type === "Job" && (
                      <>
                        <Field form={form} setForm={setForm} label="Graduation Year" name="graduation_year" placeholder="e.g. 2024, 2025" />
                        <Field form={form} setForm={setForm} label="Location Restriction" name="location_restriction" placeholder="e.g. US Citizens Only" />
                      </>
                    )}
                    
                    {["Internship", "Scholarship"].includes(form.type) && (
                      <Field form={form} setForm={setForm} label="Gender Restriction" name="gender_restriction" placeholder="e.g. Female Only" />
                    )}

                    {form.type === "Scholarship" && (
                      <>
                        <Field form={form} setForm={setForm} label="Max Family Income" name="max_family_income" placeholder="e.g. $50,000/yr" />
                        <Field form={form} setForm={setForm} label="Category Restriction" name="category_restriction" placeholder="e.g. Underrepresented Minorities" />
                        <Field form={form} setForm={setForm} label="State Restriction" name="state_restriction" placeholder="e.g. California Residents" />
                        <Field form={form} setForm={setForm} label="Age Limit" name="age_limit" type="number" placeholder="e.g. 25" />
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-border-subtle shrink-0">
                <button type="button" onClick={() => { setIsModalOpen(false); setForm(defaultForm); }}
                  className="flex-1 py-2.5 rounded-xl border border-border-subtle text-slate-300 font-medium hover:bg-bg-surface-hover transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting || !form.title.trim() || !form.company.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-purple hover:bg-brand-purple/90 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Opportunity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
