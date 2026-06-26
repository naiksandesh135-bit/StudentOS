import React, { useState, useEffect } from "react";
import { FolderKanban, Plus, Clock, CheckSquare, MoreHorizontal, X, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ title: "", description: "", deadline: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) fetchProjects();
  }, [user]);

  async function fetchProjects() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject(e) {
    e.preventDefault();
    if (!newProject.title.trim()) return;

    try {
      setIsSubmitting(true);
      const { data, error } = await supabase
        .from('projects')
        .insert([{ 
          title: newProject.title, 
          description: newProject.description, 
          deadline: newProject.deadline || null,
          user_id: user?.id
        }])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setProjects([data[0], ...projects]);
        setIsModalOpen(false);
        setNewProject({ title: "", description: "", deadline: "" });
      }
    } catch (error) {
      console.error("Error creating project:", error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-100 flex items-center gap-3">
            <FolderKanban className="w-8 h-8 text-brand-blue" />
            Project Manager
          </h1>
          <p className="text-sm text-slate-400 mt-1">Manage your academic and side projects, track tasks and progress.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white font-medium transition-colors shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-brand-blue" />
          <p>Loading your projects...</p>
        </div>
      ) : projects.length === 0 ? (
        /* Empty State */
        <div className="glass-panel p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 flex items-center justify-center mb-4">
            <FolderKanban className="w-8 h-8 text-brand-blue" />
          </div>
          <h3 className="text-xl font-bold text-slate-200 mb-2">No projects yet</h3>
          <p className="text-slate-400 max-w-sm mb-6">Create your first project to start organizing your tasks, tracking progress, and monitoring deadlines.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-bg-surface border border-border-subtle text-slate-300 hover:text-white transition-colors"
          >
            <Plus className="w-5 h-5" /> Create Project
          </button>
        </div>
      ) : (
        /* Projects Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`} className="glass-panel p-6 flex flex-col group hover:border-slate-600 transition-colors cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded border text-brand-blue bg-brand-blue/10 border-brand-blue/20`}>
                  {project.status || 'Active'}
                </span>
                <button className="text-slate-400 hover:text-white transition-colors" onClick={(e) => e.preventDefault()}>
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="text-lg font-semibold text-slate-200 mb-2">{project.title}</h3>
              <p className="text-sm text-slate-400 mb-6 flex-1 line-clamp-2">
                {project.description || "No description provided."}
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4" />
                    <span>Tasks</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{project.deadline || "No deadline"}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                    <span>Progress</span>
                    <span>{project.progress || 0}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className={`h-full rounded-full bg-brand-blue`} 
                      style={{ width: `${project.progress || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-bg-surface border border-border-subtle rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border-subtle">
              <h2 className="text-lg font-bold text-slate-200">Create New Project</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Project Title *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. StudentOS"
                  value={newProject.title}
                  onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl bg-bg-base border border-border-subtle text-sm text-slate-200 focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Description</label>
                <textarea 
                  rows={3}
                  placeholder="Brief description of the project"
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl bg-bg-base border border-border-subtle text-sm text-slate-200 focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Deadline (Optional)</label>
                <input 
                  type="date" 
                  value={newProject.deadline}
                  onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl bg-bg-base border border-border-subtle text-sm text-slate-200 focus:outline-none focus:border-brand-blue transition-colors [color-scheme:dark]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-bg-base border border-border-subtle text-slate-300 font-medium hover:bg-bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting || !newProject.title.trim()}
                  className="flex-1 flex items-center justify-center py-2.5 rounded-xl bg-brand-blue text-white font-medium hover:bg-brand-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
