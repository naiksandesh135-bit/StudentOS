import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if variables are valid. If not, use mock client.
const useMock = !supabaseUrl || supabaseUrl === "" || !supabaseAnonKey || supabaseAnonKey === "";

if (useMock) {
  console.warn("Using StudentOS local/mock database because VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not defined.");
}

// Helper to get/set localStorage items with initial mock data
const getLocalStorage = (key, initialValue) => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initialValue));
    return initialValue;
  }
  try {
    return JSON.parse(data);
  } catch {
    return initialValue;
  }
};

const setLocalStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Initial Mock Data to populate the app immediately on first run!
const initialProfiles = [
  {
    id: "profile-1",
    user_id: "demo-user-id",
    name: "Alex Dev",
    email: "alex@example.com",
    avatar_url: "",
    bio: "Computer Science student passionate about full-stack web development and AI.",
    branch: "Computer Science",
    cgpa: 9.2,
    year: "3rd Year",
    skills: ["React", "JavaScript", "Python", "Tailwind CSS", "Node.js", "SQL"]
  }
];

const initialOpportunities = [
  {
    id: "opp-1",
    user_id: "demo-user-id",
    title: "Software Engineer Intern",
    company: "Google",
    type: "Internship",
    status: "Applied",
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
    link: "https://careers.google.com",
    created_at: new Date().toISOString(),
    details: {
      duration: "3 Months",
      stipend: "$5,000/mo",
      location: "Mountain View, CA",
      mode: "On-site",
      required_skills: "React, algorithms",
      required_cgpa: "8.5",
      allowed_branches: "CS, IT",
      eligible_years: "3rd, 4th",
      max_backlogs: "0"
    }
  },
  {
    id: "opp-2",
    user_id: "demo-user-id",
    title: "Frontend Developer",
    company: "Vercel",
    type: "Job",
    status: "Interview",
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
    link: "https://vercel.com/careers",
    created_at: new Date().toISOString(),
    details: {
      salary_package: "$120,000/yr",
      experience_required: "Freshers can apply",
      location: "Remote",
      mode: "Remote",
      required_skills: "Next.js, TypeScript",
      required_cgpa: "7.5"
    }
  },
  {
    id: "opp-3",
    user_id: "demo-user-id",
    title: "Global Hackathon 2026",
    company: "Major League Hacking",
    type: "Hackathon",
    status: "Interested",
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    link: "https://mlh.io",
    created_at: new Date().toISOString(),
    details: {
      theme: "AI for Good",
      prize_pool: "$50,000",
      team_size: "2-4 members",
      event_date: "July 15, 2026",
      mode: "Online"
    }
  }
];

const initialProjects = [
  {
    id: "proj-1",
    user_id: "demo-user-id",
    title: "StudentOS Workspace",
    description: "A comprehensive student career opportunities and project tracking dashboard.",
    deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 days from now
    progress: 75,
    status: "In Progress",
    created_at: new Date().toISOString()
  },
  {
    id: "proj-2",
    user_id: "demo-user-id",
    title: "E-Commerce AI Chatbot",
    description: "Built an intelligent chatbot assistant using Next.js and Gemini API.",
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    progress: 100,
    status: "Completed",
    created_at: new Date().toISOString()
  }
];

const initialTasks = [
  {
    id: "task-1",
    project_id: "proj-1",
    title: "Implement AuthContext and ProtectedRoute",
    is_completed: true,
    created_at: new Date().toISOString()
  },
  {
    id: "task-2",
    project_id: "proj-1",
    title: "Setup dashboard statistics cards",
    is_completed: true,
    created_at: new Date().toISOString()
  },
  {
    id: "task-3",
    project_id: "proj-1",
    title: "Connect settings to mock Supabase client",
    is_completed: true,
    created_at: new Date().toISOString()
  },
  {
    id: "task-4",
    project_id: "proj-1",
    title: "Write documentation on database migration",
    is_completed: false,
    created_at: new Date().toISOString()
  },
  {
    id: "task-5",
    project_id: "proj-2",
    title: "Design conversational UI flow",
    is_completed: true,
    created_at: new Date().toISOString()
  },
  {
    id: "task-6",
    project_id: "proj-2",
    title: "Integrate Gemini API streaming",
    is_completed: true,
    created_at: new Date().toISOString()
  }
];

// Mock Client Implementation
class MockQueryBuilder {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.orderConfig = null;
    this.isSingle = false;
  }

  getData() {
    const key = `studentos_${this.table}`;
    const initial = {
      profiles: initialProfiles,
      opportunities: initialOpportunities,
      projects: initialProjects,
      tasks: initialTasks
    }[this.table] || [];
    return getLocalStorage(key, initial);
  }

  saveData(data) {
    const key = `studentos_${this.table}`;
    setLocalStorage(key, data);
  }

  select() {
    return this;
  }

  eq(column, value) {
    this.filters.push({ column, value });
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.orderConfig = { column, ascending };
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  // Terminal methods that actually execute and return Promise<{data, error}>
  async then(resolve) {
    try {
      let items = this.getData();

      // Apply filters
      for (const filter of this.filters) {
        items = items.filter(item => item[filter.column] === filter.value);
      }

      // Apply ordering
      if (this.orderConfig) {
        const { column, ascending } = this.orderConfig;
        items.sort((a, b) => {
          const valA = a[column];
          const valB = b[column];
          if (valA === valB) return 0;
          if (valA === null || valA === undefined) return 1;
          if (valB === null || valB === undefined) return -1;
          const comparison = valA < valB ? -1 : 1;
          return ascending ? comparison : -comparison;
        });
      }

      if (this.isSingle) {
        if (items.length === 0) {
          resolve({ data: null, error: { message: "Not found", code: "PGRST116" } });
          return;
        }
        resolve({ data: items[0], error: null });
        return;
      }

      resolve({ data: items, error: null });
    } catch (e) {
      resolve({ data: null, error: { message: e.message } });
    }
  }

  async insert(newItems) {
    try {
      const items = this.getData();
      const created = [];
      const parsedItems = Array.isArray(newItems) ? newItems : [newItems];

      for (const item of parsedItems) {
        const newItem = {
          id: `${this.table.slice(0, 4)}-${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString(),
          ...item
        };
        items.unshift(newItem); // Insert at beginning
        created.push(newItem);
      }

      this.saveData(items);

      const selectChain = {
        select: () => selectChain,
        single: () => Promise.resolve({ data: created[0], error: null }),
        then: (resolve) => resolve({ data: created, error: null })
      };
      return selectChain;
    } catch (e) {
      return { data: null, error: { message: e.message } };
    }
  }

  async update(updateData) {
    try {
      const items = this.getData();
      const newItems = items.map(item => {
        const matches = this.filters.every(filter => item[filter.column] === filter.value);
        if (matches) {
          return { ...item, ...updateData };
        }
        return item;
      });

      this.saveData(newItems);
      return { data: newItems, error: null };
    } catch (e) {
      return { data: null, error: { message: e.message } };
    }
  }

  async delete() {
    try {
      const items = this.getData();
      const newItems = items.filter(item => {
        return !this.filters.every(filter => item[filter.column] === filter.value);
      });

      this.saveData(newItems);
      return { data: null, error: null };
    } catch (e) {
      return { data: null, error: { message: e.message } };
    }
  }
}

const mockAuth = {
  async getSession() {
    const loggedIn = localStorage.getItem("studentos_logged_in") === "true";
    if (loggedIn) {
      const user = {
        id: "demo-user-id",
        email: "alex@example.com",
        user_metadata: {
          full_name: "Alex Dev",
          avatar_url: ""
        }
      };
      return { data: { session: { user } } };
    }
    return { data: { session: null } };
  },

  onAuthStateChange(callback) {
    const loggedIn = localStorage.getItem("studentos_logged_in") === "true";
    const user = loggedIn ? {
      id: "demo-user-id",
      email: "alex@example.com",
      user_metadata: {
        full_name: "Alex Dev",
        avatar_url: ""
      }
    } : null;

    const session = user ? { user } : null;
    
    setTimeout(() => {
      callback(loggedIn ? 'SIGNED_IN' : 'SIGNED_OUT', session);
    }, 0);

    return {
      data: {
        subscription: {
          unsubscribe() {}
        }
      }
    };
  },

  async signInWithOAuth() {
    localStorage.setItem("studentos_logged_in", "true");
    setTimeout(() => {
      window.location.reload();
    }, 500);
    return { error: null };
  },

  async signOut() {
    localStorage.removeItem("studentos_logged_in");
    setTimeout(() => {
      window.location.reload();
    }, 100);
    return { error: null };
  }
};

const mockSupabase = {
  auth: mockAuth,
  from: (table) => new MockQueryBuilder(table)
};

export const supabase = useMock
  ? mockSupabase
  : createClient(supabaseUrl, supabaseAnonKey);

