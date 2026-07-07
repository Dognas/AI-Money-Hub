import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import { ThemeProvider, useTheme } from "@/lib/useTheme";
import { categories, allTools, testimonials } from "@/data/calculators";

function useCounter(target: number, duration = 2000, started = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Number.parseFloat(start.toFixed(1)));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, started]);
  return count;
}

function StatCard({ value, label, suffix = "", started }: { value: number; label: string; suffix?: string; started: boolean }) {
  const count = useCounter(value, 2000, started);
  return (
    <div className="text-center px-4">
      <div className="text-3xl sm:text-4xl lg:text-5xl font-black mb-2 gradient-text">{count}{suffix}</div>
      <div className="text-gray-500 text-sm sm:text-base font-medium">{label}</div>
    </div>
  );
}

function SearchBar() {
  const { dark } = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<typeof allTools>([]);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const q = query.toLowerCase();
    setResults(allTools.filter(t =>
      t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
    ).slice(0, 6));
  }, [query]);

  return (
    <div className="relative max-w-2xl mx-auto">
      <div className={`flex items-center rounded-2xl border-2 px-5 py-4 shadow-lg transition-all duration-300 ${focused ? "border-emerald-400 shadow-emerald-100" : dark ? "glass-card glow-gold border-2" : "border-gray-200 bg-white"}`}>
        <svg className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          className={`flex-1 text-base outline-none bg-transparent ${dark ? "text-white placeholder-gray-500" : "text-gray-800 placeholder-gray-400"}`}
          placeholder="Search calculators... salary, tax, TikTok, mortgage..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 180)}
        />
        <span className={`text-xs hidden sm:block ${dark ? "text-gray-600" : "text-gray-400"}`}>120+ tools</span>
      </div>
      {results.length > 0 && focused && (
        <div className={`absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl border overflow-hidden z-30 ${dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
          {results.map((r, i) => (
            <Link key={i} href={`/calculator/${r.id}`} className={`flex items-center gap-3 px-5 py-3 transition-colors ${dark ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}>
              <span className="text-xl flex-shrink-0">{r.icon}</span>
              <div className="min-w-0">
                <div className={`text-sm font-semibold truncate ${dark ? "text-white" : "text-gray-800"}`}>{r.name}</div>
                <div className="text-xs text-gray-500 truncate">{r.desc}</div>
              </div>
              {r.badge && <span className="ml-auto text-xs text-gray-400 flex-shrink-0 hidden sm:block">{r.badge}</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function TestimonialsCarousel() {
  const { dark } = useTheme();
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % testimonials.length), 3500);
    return () => clearInterval(t);
  }, []);
  const shown = Array.from({ length: 3 }, (_, i) => testimonials[(idx + i) % testimonials.length]);
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {shown.map((t, i) => (
        <div key={`${t.name}-${i}`} className={`rounded-3xl p-6 border transition-all duration-500 ${dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-sm"}`}>
          <div className="flex mb-3">{[...Array(t.rating)].map((_, j) => <span key={j} className="text-amber-400 text-sm">★</span>)}</div>
          <p className={`text-sm leading-relaxed mb-5 ${dark ? "text-gray-300" : "text-gray-600"}`}>"{t.text}"</p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 btn-gradient">{t.avatar}</div>
            <div>
              <div className={`text-sm font-semibold ${dark ? "text-white" : "text-gray-800"}`}>{t.name}</div>
              <div className="text-xs text-gray-500">{t.location}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FloatingSymbols() {
  const symbols = ["$", "€", "£", "¥", "₿", "%", "📈", "💰", "🏦", "💎"];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {symbols.map((s, i) => (
        <div key={i} className="absolute text-2xl float-symbol" style={{ left: `${(i * 10 + 5) % 92}%`, top: `${(i * 17 + 10) % 82}%`, animationDelay: `${i * 0.6}s` }}>
          {s}
        </div>
      ))}
    </div>
  );
}

function HomeContent() {
  const { dark } = useTheme();
  const [statsStarted, setStatsStarted] = useState(false);
  const [activeCategory, setActiveCategory] = useState("income");
  const statsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsStarted(true); }, { threshold: 0.3 });
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const activeTools = categories.find(c => c.id === activeCategory)?.tools || [];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${dark ? "bg-gray-950 text-white" : "bg-white text-gray-900"}`}>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden flex items-center" style={{ minHeight: "100svh", background: dark ? "linear-gradient(135deg, #030712 0%, #0f172a 50%, #030712 100%)" : "linear-gradient(135deg, #f0fdf4 0%, #f8faff 60%, #fefce8 100%)" }}>
        <FloatingSymbols />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-32 w-full">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6 sm:mb-8 border badge-glow">
              ✨ AI-Powered Financial Intelligence
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight mb-5 sm:mb-6 tracking-tight">
              <span className={dark ? "text-white" : "text-gray-900"}>One Platform.</span>
              <br />
              <span className="gradient-text">Every Money Calculation</span>
              <br />
              <span className={dark ? "text-white" : "text-gray-900"}>You Need.</span>
            </h1>
            <p className={`text-base sm:text-lg lg:text-xl leading-relaxed mb-8 sm:mb-10 max-w-3xl mx-auto ${dark ? "text-gray-400" : "text-gray-600"}`}>
              From salary and taxes to investments, creator income, and business profits — AI Money Hub gives you real calculations instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16">
              <a href="#calculators" className="inline-flex items-center justify-center gap-2 text-white font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-base sm:text-lg transition-all hover:scale-105 hover:shadow-xl shadow-lg btn-gradient">
                🚀 Start Calculating Free
              </a>
              <Link href="/market" className={`inline-flex items-center justify-center gap-2 font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-base sm:text-lg transition-all hover:scale-105 border-2 ${dark ? "border-gray-600 text-white hover:bg-gray-800" : "border-gray-200 text-gray-800 hover:bg-gray-50"}`}>
                📊 Market Data
              </Link>
            </div>

            {/* AI Coach Banner */}
            <div className={`max-w-3xl mx-auto mb-8 rounded-2xl border-2 border-emerald-400/40 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 ${dark ? "bg-emerald-950/20" : "bg-emerald-50"}`}>
              <div className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl btn-gradient shadow-lg">🤖</div>
              <div className="flex-1 text-center sm:text-left">
                <p className={`font-black text-base ${dark ? "text-white" : "text-gray-900"}`}>New: Daily AI Financial Coach</p>
                <p className={`text-sm ${dark ? "text-gray-400" : "text-gray-600"}`}>Answer 8 quick questions → get your Financial Health Score + personalised action plan</p>
              </div>
              <Link href="/coach" className="flex-shrink-0 inline-flex items-center gap-2 text-white font-bold px-5 py-2.5 rounded-xl text-sm btn-gradient hover:opacity-90 transition-all whitespace-nowrap">
                Try AI Coach →
              </Link>
            </div>

            {/* Dashboard Preview */}
            <div className={`rounded-2xl sm:rounded-3xl border shadow-2xl overflow-hidden max-w-4xl mx-auto ${dark ? "glass-card glow-emerald" : "bg-white border-gray-200"}`}>
              <div className={`flex items-center gap-2 px-4 sm:px-5 py-3 border-b ${dark ? "border-gray-800 bg-gray-900" : "border-gray-100 bg-gray-50"}`}>
                <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400"/><div className="w-3 h-3 rounded-full bg-amber-400"/><div className="w-3 h-3 rounded-full bg-green-400"/></div>
                <span className={`text-xs ml-2 ${dark ? "text-gray-500" : "text-gray-400"}`}>ai-money-hub.com</span>
              </div>
              <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[{ label:"Monthly Salary", value:"$7,500", change:"+12%", color:"#10B981" }, { label:"Tax Savings", value:"$2,340", change:"-8%", color:"#3B82F6" }, { label:"Investments", value:"$125K", change:"+34%", color:"#8B5CF6" }, { label:"Net Worth", value:"$287K", change:"+22%", color:"#F59E0B" }].map((m, i) => (
                  <div key={i} className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 ${dark ? "bg-gray-800" : "bg-gray-50"}`}>
                    <div className="text-xs text-gray-500 mb-1 truncate">{m.label}</div>
                    <div className="text-lg sm:text-2xl font-black" style={{ color: m.color }}>{m.value}</div>
                    <div className="text-xs mt-1 font-medium" style={{ color: m.color }}>{m.change}</div>
                  </div>
                ))}
              </div>
              <div className={`px-4 sm:px-8 pb-5 flex flex-col sm:flex-row gap-2 sm:gap-0 items-start sm:items-center justify-between ${dark ? "text-gray-400" : "text-gray-500"}`}>
                <div className="text-xs">🤖 MoneyBot AI analyzing your portfolio...</div>
                <div className="flex gap-2 flex-wrap">
                  {["💼 Salary", "📈 Invest", "🏛️ Tax"].map(t => (
                    <span key={t} className={`text-xs px-3 py-1 rounded-full border ${dark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className={`py-12 sm:py-16 border-y ${dark ? "bg-gray-900 border-gray-800" : "bg-gray-50 border-gray-100"}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <StatCard value={15} suffix="M+" label="Calculations Done" started={statsStarted} />
          <StatCard value={2.5} suffix="M+" label="Users Worldwide" started={statsStarted} />
          <StatCard value={98} suffix="%" label="Satisfaction Rate" started={statsStarted} />
          <StatCard value={120} suffix="+" label="Financial Tools" started={statsStarted} />
        </div>
      </section>

      {/* Search */}
      <section className={`py-12 sm:py-16 ${dark ? "bg-gray-950" : "bg-white"}`} id="calculators">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className={`text-2xl sm:text-3xl font-black mb-2 sm:mb-3 ${dark ? "text-white" : "text-gray-900"}`}>Find Your Calculator</h2>
            <p className={`text-sm sm:text-base ${dark ? "text-gray-400" : "text-gray-500"}`}>Search from 120+ professional financial tools</p>
          </div>
          <SearchBar />
        </div>
      </section>

      {/* Calculator Categories */}
      <section className={`py-12 sm:py-16 ${dark ? "bg-gray-950" : "bg-white"}`} id="tools">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black mb-3 sm:mb-4 ${dark ? "text-white" : "text-gray-900"}`}>All Financial Calculators</h2>
            <p className={`text-sm sm:text-base lg:text-lg ${dark ? "text-gray-400" : "text-gray-500"}`}>Professional-grade tools for every financial decision</p>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6 sm:mb-8 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${activeCategory === cat.id ? "text-white shadow-lg btn-gradient" : dark ? "text-gray-400 bg-gray-800 hover:bg-gray-700" : "text-gray-600 bg-gray-100 hover:bg-gray-200"}`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {activeTools.map(tool => (
              <Link key={tool.id} href={`/calculator/${tool.id}`}
                className={`group rounded-2xl sm:rounded-3xl border p-4 sm:p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl cursor-pointer ${dark ? "bg-gray-900 border-gray-800 hover:border-emerald-500/30" : "bg-white border-gray-100 hover:border-emerald-200 shadow-sm"}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl sm:text-3xl">{tool.icon}</span>
                  {tool.badge && <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2 ${dark ? "bg-gray-800 text-gray-300" : "bg-gray-50 text-gray-600"}`}>{tool.badge}</span>}
                </div>
                <h3 className={`font-bold text-sm mb-1 group-hover:text-emerald-500 transition-colors ${dark ? "text-white" : "text-gray-800"}`}>{tool.name}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{tool.desc}</p>
                <div className="mt-3 sm:mt-4 flex items-center text-xs font-semibold text-emerald-500">Calculate now <span className="ml-1">→</span></div>
              </Link>
            ))}
          </div>

          {/* Other Categories */}
          <div className="mt-10 sm:mt-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {categories.filter(c => c.id !== activeCategory).map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`rounded-2xl sm:rounded-3xl border p-4 sm:p-6 text-left transition-all hover:scale-[1.02] hover:shadow-xl ${dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100 shadow-sm"}`}
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center text-base sm:text-xl bg-gradient-to-br ${cat.color}`}>{cat.icon}</div>
                  <h3 className={`font-bold text-sm ${dark ? "text-white" : "text-gray-800"}`}>{cat.label}</h3>
                </div>
                <p className="text-xs text-gray-500">{cat.tools.length} calculators</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Trending */}
      <section className={`py-12 sm:py-14 ${dark ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className={`text-2xl sm:text-3xl font-black text-center mb-8 sm:mb-10 ${dark ? "text-white" : "text-gray-900"}`}>🔥 Trending Tools</h2>
          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
            {allTools.filter(t => t.badge).slice(0, 14).map(tool => (
              <Link key={tool.id} href={`/calculator/${tool.id}`}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl border font-medium text-xs sm:text-sm transition-all hover:scale-105 ${dark ? "bg-gray-800 border-gray-700 text-gray-200 hover:border-emerald-500/50" : "bg-white border-gray-200 text-gray-700 hover:border-emerald-300 shadow-sm"}`}
              >
                <span>{tool.icon}</span>
                <span>{tool.name}</span>
                <span className="text-xs text-gray-400 hidden sm:inline">{tool.badge}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={`py-12 sm:py-16 ${dark ? "bg-gray-950" : "bg-white"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black mb-3 sm:mb-4 ${dark ? "text-white" : "text-gray-900"}`}>Loved by Millions</h2>
            <p className={`text-sm sm:text-base ${dark ? "text-gray-400" : "text-gray-500"}`}>Join 2.5M+ users making smarter financial decisions</p>
          </div>
          <TestimonialsCarousel />
        </div>
      </section>

      {/* CTA */}
      <section className={`py-16 sm:py-24 ${dark ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className={`text-3xl sm:text-4xl font-black mb-4 ${dark ? "text-white" : "text-gray-900"}`}>
            Start Making <span className="gradient-text">Smarter Decisions</span>
          </h2>
          <p className={`text-lg mb-8 ${dark ? "text-gray-400" : "text-gray-600"}`}>120+ professional calculators, completely free.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#calculators" className="inline-flex items-center justify-center gap-2 text-white font-bold px-8 py-4 rounded-2xl text-lg hover:scale-105 transition-all btn-gradient shadow-lg">
              🚀 Start Calculating
            </a>
            <Link href="/market" className={`inline-flex items-center justify-center gap-2 font-bold px-8 py-4 rounded-2xl text-lg hover:scale-105 transition-all border-2 ${dark ? "border-gray-600 text-white" : "border-gray-200 text-gray-800"}`}>
              📊 View Market Data
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t py-8 ${dark ? "bg-gray-950 border-gray-800" : "bg-white border-gray-100"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm btn-gradient">💰</div>
            <span className="font-black gradient-text">AI Money Hub</span>
          </div>
          <p className="text-xs text-gray-500 text-center">For educational purposes only. Not financial advice. © {new Date().getFullYear()} AI Money Hub</p>
          <div className="flex gap-4 text-xs text-gray-400">
            <Link href="/market" className="hover:text-emerald-500 transition-colors">Market Data</Link>
            <Link href="/dashboard" className="hover:text-emerald-500 transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <ThemeProvider>
      <HomeContent />
    </ThemeProvider>
  );
}
