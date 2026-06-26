import React, { useState, useEffect } from "react";
import { Settings as SettingsIcon, User, Bell, Shield, Save, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const { user, refreshProfile } = useAuth();
  
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    bio: "",
    branch: "",
    cgpa: "",
    year: "",
    skills: "" // we will store as comma separated string in state, convert to array for db
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user?.id)
          .single();
          
        if (error) {
           if (error.code === 'PGRST116') {
              console.warn("Profile not found. Please run the SQL command to insert 'demo-user'.");
           } else {
              throw error;
           }
        }
        
        if (data) {
          setProfile({
            name: data.name || "",
            email: data.email || "",
            bio: data.bio || "",
            branch: data.branch || "",
            cgpa: data.cgpa || "",
            year: data.year || "",
            skills: data.skills ? data.skills.join(", ") : ""
          });
        }
      } catch (err) {
        console.error("Error fetching profile:", err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    
    try {
      // Parse skills string back into an array
      const skillsArray = profile.skills
        ? profile.skills.split(",").map(s => s.trim()).filter(Boolean)
        : [];
        
      const { error } = await supabase
        .from("profiles")
        .update({
          name: profile.name,
          email: profile.email,
          bio: profile.bio,
          branch: profile.branch,
          cgpa: profile.cgpa ? parseFloat(profile.cgpa) : null,
          year: profile.year,
          skills: skillsArray
        })
        .eq("user_id", user?.id);
        
      if (error) throw error;
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await refreshProfile(); // update the name/avatar in topnav
    } catch (err) {
      console.error("Error updating profile:", err.message);
      alert("Failed to save profile. Make sure you ran the SQL command to create the profiles table.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
     return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-slate-500" />
          <p className="text-sm">Loading settings...</p>
        </div>
     );
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-20">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-slate-100 flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-slate-400" />
          Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">Manage your account preferences and application settings.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 space-y-1 shrink-0">
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === "profile" ? "bg-bg-surface border border-border-subtle text-white" : "text-slate-400 hover:text-slate-200 hover:bg-bg-surface/50"
            }`}
          >
            <User className="w-4 h-4" /> Profile
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === "notifications" ? "bg-bg-surface border border-border-subtle text-white" : "text-slate-400 hover:text-slate-200 hover:bg-bg-surface/50"
            }`}
          >
            <Bell className="w-4 h-4" /> Notifications
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === "security" ? "bg-bg-surface border border-border-subtle text-white" : "text-slate-400 hover:text-slate-200 hover:bg-bg-surface/50"
            }`}
          >
            <Shield className="w-4 h-4" /> Security
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 glass-panel p-6">
          {activeTab === "profile" && (
            <div className="space-y-8">
              
              {/* Basic Info Section */}
              <div className="space-y-4">
                 <div>
                   <h3 className="text-lg font-semibold text-slate-200">Public Profile</h3>
                   <p className="text-sm text-slate-400">Basic information about you.</p>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="col-span-2">
                     <label className="block text-sm font-medium text-slate-400 mb-1.5">Full Name</label>
                     <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-bg-surface-hover border border-border-subtle text-sm text-slate-200 focus:outline-none focus:border-brand-purple transition-colors" />
                   </div>
                   <div className="col-span-2">
                     <label className="block text-sm font-medium text-slate-400 mb-1.5">Email Address</label>
                     <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-bg-surface-hover border border-border-subtle text-sm text-slate-200 focus:outline-none focus:border-brand-purple transition-colors" />
                   </div>
                   <div className="col-span-2">
                     <label className="block text-sm font-medium text-slate-400 mb-1.5">Bio</label>
                     <textarea rows={3} value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-bg-surface-hover border border-border-subtle text-sm text-slate-200 focus:outline-none focus:border-brand-purple transition-colors"></textarea>
                   </div>
                 </div>
              </div>

              <div className="border-t border-border-subtle pt-6"></div>

              {/* Eligibility Criteria Section */}
              <div className="space-y-4">
                 <div>
                   <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                     Eligibility Criteria
                     <span className="text-[10px] uppercase tracking-wider font-bold bg-brand-green/10 text-brand-green px-2 py-0.5 rounded border border-brand-green/20">Crucial</span>
                   </h3>
                   <p className="text-sm text-slate-400">This data powers the Eligibility Checker engine to automatically match you with opportunities.</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-slate-400 mb-1.5">Branch</label>
                     <input type="text" value={profile.branch} placeholder="e.g. CSE" onChange={e => setProfile({...profile, branch: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-bg-surface-hover border border-border-subtle text-sm text-slate-200 focus:outline-none focus:border-brand-green transition-colors" />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-400 mb-1.5">Current Year</label>
                     <input type="text" value={profile.year} placeholder="e.g. 3rd" onChange={e => setProfile({...profile, year: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-bg-surface-hover border border-border-subtle text-sm text-slate-200 focus:outline-none focus:border-brand-green transition-colors" />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-400 mb-1.5">CGPA</label>
                     <input type="number" step="0.01" min="0" max="10" value={profile.cgpa} placeholder="e.g. 8.75" onChange={e => setProfile({...profile, cgpa: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-bg-surface-hover border border-border-subtle text-sm text-slate-200 focus:outline-none focus:border-brand-green transition-colors" />
                   </div>
                   <div className="col-span-2">
                     <label className="block text-sm font-medium text-slate-400 mb-1.5">Your Skills (Comma Separated)</label>
                     <input type="text" value={profile.skills} placeholder="e.g. React, Node.js, Python" onChange={e => setProfile({...profile, skills: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-bg-surface-hover border border-border-subtle text-sm text-slate-200 focus:outline-none focus:border-brand-green transition-colors" />
                   </div>
                 </div>
              </div>

              {/* Save Actions */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-border-subtle">
                {saveSuccess && (
                  <span className="text-sm font-medium text-brand-green flex items-center gap-1.5 animate-in fade-in slide-in-from-right-4">
                    <CheckCircle2 className="w-4 h-4" /> Saved successfully
                  </span>
                )}
                <button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-purple hover:bg-brand-purple/90 text-white font-medium transition-colors shadow-[0_4px_12px_rgba(124,58,237,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-200">Notification Preferences</h3>
                <p className="text-sm text-slate-400">Manage how you receive alerts and updates.</p>
              </div>
              <div className="space-y-4">
                {[
                  { title: "Upcoming Deadlines", desc: "Receive alerts 24 hours before a deadline." },
                  { title: "Application Status Updates", desc: "Get notified when a company updates your application." },
                  { title: "New Opportunities", desc: "Weekly digest of new internships matching your skills." }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-border-subtle bg-bg-surface-hover">
                    <div>
                      <p className="font-medium text-slate-200">{item.title}</p>
                      <p className="text-sm text-slate-400">{item.desc}</p>
                    </div>
                    {/* Dummy Toggle */}
                    <div className="w-10 h-6 bg-brand-green rounded-full relative cursor-pointer opacity-50">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 italic mt-4">Note: Notification settings will be active in a future release.</p>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-200">Security & Privacy</h3>
                <p className="text-sm text-slate-400">Update your password and secure your account.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Current Password</label>
                  <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl bg-bg-surface-hover border border-border-subtle text-sm text-slate-200 focus:outline-none focus:border-brand-purple transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">New Password</label>
                  <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl bg-bg-surface-hover border border-border-subtle text-sm text-slate-200 focus:outline-none focus:border-brand-purple transition-colors" />
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-border-subtle">
                <button className="px-6 py-2.5 rounded-xl bg-bg-surface-hover border border-border-subtle text-white font-medium hover:bg-slate-700 transition-colors opacity-50 cursor-not-allowed">
                  Update Password
                </button>
              </div>
              <p className="text-xs text-slate-500 italic text-right">Requires authentication implementation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
