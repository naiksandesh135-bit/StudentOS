import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  GraduationCap, Briefcase, FolderKanban, ShieldCheck,
  BarChart2, ArrowRight, Play, Star, Zap, Users, Calendar,
  ChevronRight, ChevronDown
} from "lucide-react";

// ── Animated counter hook ────────────────────────────────────────────────────
function useCounter(target, duration = 2000) {
  const [count, setCount] = React.useState(0);
  const started = useRef(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

// ── Stat counter component ───────────────────────────────────────────────────
function StatCounter({ value, label, suffix = "+", icon: Icon, color }) {
  const { count, ref } = useCounter(value);
  return (
    <div ref={ref} className="flex items-center gap-4">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <div>
        <p className="text-3xl font-extrabold text-white tabular-nums">
          {count.toLocaleString()}{suffix}
        </p>
        <p className="text-sm text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, color, delay }) {
  return (
    <div
      className="group glass-landing-card p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-default"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-base font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar({ onLogin }) {
  const [scrolled, setScrolled] = React.useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-[#0b0b14]/95 backdrop-blur-xl border-b border-white/5 shadow-xl" : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-purple flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.5)]">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold text-white tracking-tight">StudentOS</span>
            <p className="text-[10px] text-slate-400 leading-none">Student Operating System</p>
          </div>
        </div>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Features",     id: "features" },
            { label: "How It Works", id: "how-it-works" },
            { label: "FAQ",          id: "faq" },
          ].map(({ label, id }) => (
            <a key={id} href={`#${id}`}
              className="text-sm text-slate-400 hover:text-white transition-colors duration-200">
              {label}
            </a>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onLogin}
            className="px-5 py-2 rounded-xl text-sm font-medium text-slate-300 border border-white/10 hover:border-white/20 hover:text-white hover:bg-white/5 transition-all duration-200"
          >
            Login
          </button>
          <button
            onClick={onLogin}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-brand-purple hover:bg-brand-purple/90 shadow-[0_4px_20px_rgba(124,58,237,0.4)] hover:shadow-[0_4px_25px_rgba(124,58,237,0.6)] transition-all duration-200"
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}

// ── FAQ Accordion ─────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "Is StudentOS free to use?",
    a: "Yes! StudentOS is completely free. Sign in with your Google account and start tracking opportunities, projects, and deadlines right away — no credit card required."
  },
  {
    q: "How does the Eligibility Checker work?",
    a: "When you fill in your profile (CGPA, branch, year, skills), the Eligibility Checker automatically compares your details against the requirements of each opportunity you've saved and tells you if you're eligible or not."
  },
  {
    q: "Can I use StudentOS on my phone?",
    a: "StudentOS is a responsive web app that works on any modern browser, including mobile. Just open it in your phone's browser and you're good to go."
  },
  {
    q: "Is my data private and secure?",
    a: "Absolutely. Your data is stored securely using Supabase with Row-Level Security — meaning only you can see your own opportunities, projects, and profile. No other student can access your data."
  },
  {
    q: "Can I track different types of opportunities?",
    a: "Yes! StudentOS supports Internships, Jobs, Hackathons, Workshops, and Scholarships — each with their own specific fields like stipend, prize pool, team size, and eligibility criteria."
  },
  {
    q: "How do deadline notifications work?",
    a: "StudentOS automatically reads the deadlines you set for your opportunities and projects and shows them in the notification bell icon. Any deadline within the next 14 days appears as an alert so you never miss one."
  },
];

function FAQItem({ q, a, isOpen, onClick }) {
  return (
    <div
      className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? "border-brand-purple/40 bg-brand-purple/5" : "border-white/5 bg-white/2 hover:border-white/10"}`}
    >
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className={`text-sm font-semibold ${isOpen ? "text-white" : "text-slate-300"}`}>{q}</span>
        <ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-brand-purple" : "text-slate-500"}`} />
      </button>
      {isOpen && (
        <div className="px-6 pb-5">
          <p className="text-sm text-slate-400 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

function FAQSection() {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <section id="faq" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-brand-purple uppercase tracking-widest mb-3">FAQ</p>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white">Frequently asked questions</h2>
          <p className="text-slate-400 mt-3">Everything you need to know about StudentOS</p>
        </div>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <FAQItem
              key={i}
              q={item.q}
              a={item.a}
              isOpen={openIdx === i}
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Main Landing Page ─────────────────────────────────────────────────────────
export default function Landing() {
  const { signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  const handleLogin = () => signInWithGoogle();

  const features = [
    {
      icon: Briefcase, title: "Opportunity Hub", color: "bg-brand-purple/20 border border-brand-purple/30",
      desc: "Track internships, jobs, hackathons, scholarships and more — all in one place.", delay: 0
    },
    {
      icon: FolderKanban, title: "Project Manager", color: "bg-emerald-500/20 border border-emerald-500/30",
      desc: "Plan, organize and track your projects from start to finish with ease.", delay: 100
    },
    {
      icon: ShieldCheck, title: "Eligibility Checker", color: "bg-amber-500/20 border border-amber-500/30",
      desc: "Find opportunities you're eligible for based on your profile automatically.", delay: 200
    },
    {
      icon: BarChart2, title: "Analytics Dashboard", color: "bg-blue-500/20 border border-blue-500/30",
      desc: "Get insights and monitor your progress over time with smart analytics.", delay: 300
    },
  ];

  const stats = [
    { value: 500, label: "Opportunities Tracked", icon: Briefcase, suffix: "+", color: "bg-brand-purple/80" },
    { value: 100, label: "Projects Managed",      icon: FolderKanban, suffix: "+", color: "bg-emerald-500/80" },
    { value: 1000, label: "Deadlines Monitored",  icon: Calendar, suffix: "+", color: "bg-amber-500/80" },
    { value: 1000, label: "Happy Students",        icon: Users, suffix: "+", color: "bg-blue-500/80" },
  ];

  const avatarColors = ["bg-purple-500", "bg-pink-500", "bg-blue-500", "bg-green-500", "bg-amber-500"];
  const initials = ["SN", "RK", "PM", "AJ", "VS"];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b14] text-white overflow-x-hidden">

      {/* Background gradient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-purple/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-brand-pink/5 rounded-full blur-[100px]" />
      </div>

      <Navbar onLogin={handleLogin} />

      {/* ── Hero Section ──────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left — Copy */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-purple/10 border border-brand-purple/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-brand-purple animate-pulse" />
              <span className="text-xs font-semibold text-brand-purple tracking-wide">All-in-One Platform for Students</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6">
              <span className="text-white">Organize.</span>{" "}
              <span className="text-white">Track.</span>
              <br />
              <span className="text-brand-purple drop-shadow-[0_0_30px_rgba(124,58,237,0.5)]">Achieve.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-lg">
              StudentOS helps you manage opportunities, projects, deadlines and skills — everything you need to build your future.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <button
                onClick={handleLogin}
                id="get-started-hero"
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-white bg-brand-purple hover:bg-brand-purple/90 shadow-[0_4px_30px_rgba(124,58,237,0.5)] hover:shadow-[0_4px_40px_rgba(124,58,237,0.7)] transition-all duration-200 text-sm"
              >
                <Zap className="w-4 h-4" />
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#features"
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-medium text-slate-300 border border-white/10 hover:border-white/20 hover:text-white hover:bg-white/5 transition-all duration-200 text-sm"
              >
                <Play className="w-4 h-4" />
                Watch Demo
              </a>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {initials.map((ini, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full ${avatarColors[i]} flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#0b0b14]`}
                  >
                    {ini}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <span className="text-sm text-slate-400">Join <span className="text-white font-semibold">1,000+</span> students already organizing their career journey</span>
              </div>
            </div>
          </div>

          {/* Right — App Preview */}
          <div className="relative hidden lg:block">
            <div className="relative">
              {/* Glow behind the mockup */}
              <div className="absolute inset-0 bg-brand-purple/20 rounded-3xl blur-3xl scale-95" />
              {/* Browser-style frame */}
              <div className="relative rounded-2xl border border-white/10 overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
                {/* Browser bar */}
                <div className="bg-[#1a1a2e] px-4 py-3 flex items-center gap-2 border-b border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex-1 mx-4 bg-[#0f0f1a] rounded-md px-3 py-1 text-[11px] text-slate-500 text-center">
                    localhost:5173/dashboard
                  </div>
                </div>
                {/* Dashboard screenshot */}
                <img
                  src="/dashboard-preview.png"
                  alt="StudentOS Dashboard Preview"
                  className="w-full object-cover"
                  onError={(e) => {
                    // Fallback: show a stylized placeholder
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
                {/* Fallback placeholder */}
                <div
                  className="hidden w-full h-64 bg-[#0f0f1a] items-center justify-center text-slate-600 text-sm"
                  style={{ display: "none" }}
                >
                  <div className="text-center">
                    <BarChart2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>Dashboard Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Features Section ──────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-brand-purple uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white">
              Everything you need to stay ahead
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map(f => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── Stats Section ─────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-3xl border border-white/5 bg-white/2 backdrop-blur-sm p-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {stats.map(s => <StatCounter key={s.label} {...s} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works Section ──────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-brand-purple uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white">Get started in 3 simple steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-10 left-[calc(16.7%+1rem)] right-[calc(16.7%+1rem)] h-px bg-gradient-to-r from-brand-purple/20 via-brand-purple/60 to-brand-purple/20" />
            {[
              {
                step: "01", icon: "🔑", title: "Sign in with Google",
                desc: "One click login with your Google account. No passwords, no forms. Just tap and you're in."
              },
              {
                step: "02", icon: "📝", title: "Set up your profile",
                desc: "Add your branch, CGPA, skills and year. StudentOS uses this to automatically match you with eligible opportunities."
              },
              {
                step: "03", icon: "🚀", title: "Start tracking",
                desc: "Save internships, hackathons, jobs. Track projects, monitor deadlines, check eligibility — all in one dashboard."
              },
            ].map((s, i) => (
              <div key={i} className="relative flex flex-col items-center text-center p-8 rounded-2xl border border-white/5 bg-white/2 hover:border-brand-purple/30 hover:bg-brand-purple/5 transition-all duration-300 group">
                <div className="w-16 h-16 rounded-2xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform duration-300">
                  {s.icon}
                </div>
                <span className="absolute top-4 right-4 text-[11px] font-black text-brand-purple/40 tracking-widest">{s.step}</span>
                <h3 className="text-lg font-bold text-white mb-3">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ Section ───────────────────────────────────────────────── */}
      <FAQSection />


      {/* ── CTA Banner ────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-white mb-4">
            Ready to organize your <span className="text-brand-purple">student life</span>?
          </h2>
          <p className="text-slate-400 mb-8 text-lg">
            Join thousands of students already using StudentOS to track their opportunities and build their future.
          </p>
          <button
            onClick={handleLogin}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white bg-brand-purple hover:bg-brand-purple/90 shadow-[0_8px_40px_rgba(124,58,237,0.5)] hover:shadow-[0_8px_50px_rgba(124,58,237,0.7)] transition-all duration-200 text-base"
          >
            <GraduationCap className="w-5 h-5" />
            Get Started Free with Google
            <ChevronRight className="w-5 h-5" />
          </button>
          <p className="text-xs text-slate-600 mt-4">No credit card required · Free forever</p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-purple flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white">StudentOS</span>
          </div>
          <p className="text-xs text-slate-600">© 2026 StudentOS. Built for students, by students.</p>
        </div>
      </footer>

    </div>
  );
}
