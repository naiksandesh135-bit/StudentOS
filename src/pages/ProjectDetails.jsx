import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, CheckCircle2, Circle, Loader2, Calendar, FolderKanban } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function ProjectDetails() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // New task input state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);

  useEffect(() => {
    fetchProjectAndTasks();
  }, [id]);

  async function fetchProjectAndTasks() {
    try {
      setLoading(true);
      
      // Fetch Project
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();
        
      if (projectError) throw projectError;
      setProject(projectData);

      // Fetch Tasks
      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: true });

      if (taskError) throw taskError;
      setTasks(taskData || []);

    } catch (error) {
      console.error("Error fetching details:", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTask(e) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      setIsAddingTask(true);
      const { data, error } = await supabase
        .from("tasks")
        .insert([{ project_id: id, title: newTaskTitle }])
        .select();

      if (error) throw error;
      
      if (data && data.length > 0) {
        const updatedTasks = [...tasks, data[0]];
        setTasks(updatedTasks);
        setNewTaskTitle("");
        
        // Update project progress
        updateProjectProgress(updatedTasks);
      }
    } catch (error) {
      console.error("Error adding task:", error.message);
    } finally {
      setIsAddingTask(false);
    }
  }

  async function handleToggleTask(taskId, currentStatus) {
    try {
      // Optimistic update
      const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, is_completed: !currentStatus } : t);
      setTasks(updatedTasks);

      const { error } = await supabase
        .from("tasks")
        .update({ is_completed: !currentStatus })
        .eq("id", taskId);

      if (error) throw error;

      // Update project progress
      updateProjectProgress(updatedTasks);
      
    } catch (error) {
      console.error("Error toggling task:", error.message);
      // Revert on error
      fetchProjectAndTasks();
    }
  }

  async function updateProjectProgress(currentTasks) {
    if (currentTasks.length === 0) return;
    
    const completedTasks = currentTasks.filter(t => t.is_completed).length;
    const progress = Math.round((completedTasks / currentTasks.length) * 100);

    try {
      const { error } = await supabase
        .from("projects")
        .update({ progress })
        .eq("id", id);
        
      if (error) throw error;
      
      setProject(prev => ({ ...prev, progress }));
    } catch (error) {
      console.error("Error updating progress:", error.message);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-brand-blue" />
        <p>Loading project details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-200">Project Not Found</h2>
        <Link to="/projects" className="text-brand-blue hover:underline mt-4 inline-block">Back to Projects</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div>
        <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-bold text-slate-100">{project.title}</h1>
            <p className="text-slate-400 mt-2 max-w-2xl">{project.description || "No description provided."}</p>
          </div>
          <div className="flex gap-3">
            {project.deadline && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-surface border border-border-subtle text-sm text-slate-300">
                <Calendar className="w-4 h-4 text-brand-orange" />
                {project.deadline}
              </div>
            )}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-blue/10 border border-brand-blue/20 text-sm font-medium text-brand-blue">
              <FolderKanban className="w-4 h-4" />
              {project.status || 'Active'}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="glass-panel p-6">
        <div className="flex justify-between items-end mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Overall Progress</h3>
            <p className="text-xs text-slate-400 mt-1">
              {tasks.filter(t => t.is_completed).length} of {tasks.length} tasks completed
            </p>
          </div>
          <span className="text-2xl font-bold text-brand-blue">{project.progress || 0}%</span>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
          <div 
            className="h-full rounded-full bg-brand-blue transition-all duration-500 ease-in-out" 
            style={{ width: `${project.progress || 0}%` }}
          ></div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-slate-200 mb-6">Tasks</h2>
        
        {/* Add Task Form */}
        <form onSubmit={handleAddTask} className="flex gap-3 mb-8">
          <input
            type="text"
            placeholder="What needs to be done?"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl bg-bg-base border border-border-subtle text-sm text-slate-200 focus:outline-none focus:border-brand-blue transition-colors"
          />
          <button 
            type="submit"
            disabled={isAddingTask || !newTaskTitle.trim()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAddingTask ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            Add Task
          </button>
        </form>

        {/* Task List */}
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-border-subtle rounded-xl text-slate-500">
              No tasks added yet. Add one above!
            </div>
          ) : (
            tasks.map(task => (
              <div 
                key={task.id} 
                onClick={() => handleToggleTask(task.id, task.is_completed)}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                  task.is_completed 
                    ? "bg-bg-surface/30 border-transparent" 
                    : "bg-bg-surface-hover border-border-subtle hover:border-brand-blue/50"
                }`}
              >
                <button className="flex-shrink-0 focus:outline-none">
                  {task.is_completed ? (
                    <CheckCircle2 className="w-6 h-6 text-brand-green" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-500" />
                  )}
                </button>
                <span className={`text-base font-medium flex-1 transition-all ${
                  task.is_completed ? "text-slate-500 line-through" : "text-slate-200"
                }`}>
                  {task.title}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
