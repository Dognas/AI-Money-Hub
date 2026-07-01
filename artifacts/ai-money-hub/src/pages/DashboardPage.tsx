import { useState, useEffect } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import { ThemeProvider, useTheme } from "@/lib/useTheme";
import { allTools } from "@/data/calculators";
import { getRecent, getFavorites, toggleFavorite } from "@/lib/favorites";

const POPULAR = ["mortgage", "compound-interest", "take-home-pay", "salary", "youtube-money", "tiktok-money", "roi", "profit-margin"];
const TRENDING = ["tiktok-money", "youtube-money", "bitcoin-dca", "fire-number", "compound-interest", "affiliate-profit", "investment-growth", "crypto-profit"];

function ToolCard({ id, dark, onFavToggle }: { id: string; dark: boolean; onFavToggle?: () => void }) {
  const tool = allTools.find(t => t.id === id);
  if (!tool) return null;
  const [fav, setFav] = useState(() => getFavorites().includes(id));

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    const newState = toggleFavorite(id);
    setFav(newState);
    onFavToggle?.();
  };

  return (
    <Link href={`/calculator/${id}`} className={`group rounded-2xl border p-4 transition-all hover:scale-[1.02] hover:shadow-lg flex flex-col ${dark ? "bg-gray-900 border-gray-800 hover:border-emerald-500/30" : "bg-white border-gray-100 hover:border-emerald-200 shadow-sm"}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{tool.icon}</span>
        <button onClick={handleFav} className={`text-lg transition-colors hover:scale-110 ${fav ? "text-yellow-400" : "text-gray-200 dark:text-gray-700 hover:text-yellow-300"}`} aria-label="Toggle favorite">
          {fav ? "★" : "☆"}
        </button>
      </div>
      <h3 className={`font-bold text-sm mb-1 group-hover:text-emerald-500 transition-colors ${dark ? "text-white" : "text-gray-800"}`}>{tool.name}</h3>
      <p className="text-xs text-gray-500 leading-relaxed flex-1">{tool.desc}</p>
      <div className="mt-3 text-xs font-semibold text-emerald-500">Open calculator →</div>
    </Link>
  );
}

function DashboardContent() {
  const { dark } = useTheme();
  const [recent, setRecent] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setRecent(getRecent());
    setFavorites(getFavorites());
  }, []);

  const refresh = () => {
    setRecent(getRecent());
    setFavorites(getFavorites());
  };

  const recentTools = recent.map(id => allTools.find(t => t.id === id)).filter(Boolean) as typeof allTools;
  const favoriteTools = favorites.map(id => allTools.find(t => t.id === id)).filter(Boolean) as typeof allTools;

  const quickStats = [
    { label: "Total Calculators", value: `${allTools.length}+`, icon: "🧮", color: "text-emerald-500" },
    { label: "Recently Used", value: recent.length.toString(), icon: "⏱️", color: "text-blue-500" },
    { label: "Favorites", value: favorites.length.toString(), icon: "★", color: "text-yellow-400" },
    { label: "Categories", value: "8", icon: "📂", color: "text-purple-500" },
  ];

  return (
    <div className={`min-h-screen ${dark ? "bg-gray-950" : "bg-gray-50"}`}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-black ${dark ? "text-white" : "text-gray-900"}`}>📊 Your Dashboard</h1>
          <p className={`text-sm mt-1 ${dark ? "text-gray-400" : "text-gray-500"}`}>Quick access to your financial tools</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat, i) => (
            <div key={i} className={`rounded-2xl border p-4 ${dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100 shadow-sm"}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{stat.icon}</span>
                <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
              </div>
              <p className={`text-xs ${dark ? "text-gray-400" : "text-gray-500"}`}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recently Used */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-black ${dark ? "text-white" : "text-gray-900"}`}>⏱️ Recently Used</h2>
            {recentTools.length > 0 && (
              <span className="text-xs text-gray-400">{recentTools.length} tools</span>
            )}
          </div>
          {recentTools.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {recentTools.slice(0, 8).map(tool => (
                <ToolCard key={tool.id} id={tool.id} dark={dark} onFavToggle={refresh} />
              ))}
            </div>
          ) : (
            <div className={`rounded-2xl border p-8 text-center ${dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"}`}>
              <div className="text-4xl mb-3">🧮</div>
              <p className={`text-sm font-medium mb-2 ${dark ? "text-gray-300" : "text-gray-700"}`}>No recent tools yet</p>
              <p className="text-xs text-gray-500 mb-4">Start using calculators to see them here</p>
              <Link href="/" className="inline-flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-xl btn-gradient text-sm">Browse Calculators</Link>
            </div>
          )}
        </div>

        {/* Favorites */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-black ${dark ? "text-white" : "text-gray-900"}`}>★ Favorite Calculators</h2>
            {favoriteTools.length > 0 && (
              <span className="text-xs text-gray-400">{favoriteTools.length} saved</span>
            )}
          </div>
          {favoriteTools.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {favoriteTools.map(tool => (
                <ToolCard key={tool.id} id={tool.id} dark={dark} onFavToggle={refresh} />
              ))}
            </div>
          ) : (
            <div className={`rounded-2xl border p-8 text-center ${dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"}`}>
              <div className="text-4xl mb-3">☆</div>
              <p className={`text-sm font-medium mb-2 ${dark ? "text-gray-300" : "text-gray-700"}`}>No favorites yet</p>
              <p className="text-xs text-gray-500">Click the ☆ on any calculator to save it here</p>
            </div>
          )}
        </div>

        {/* Most Popular */}
        <div className="mb-8">
          <h2 className={`text-xl font-black mb-4 ${dark ? "text-white" : "text-gray-900"}`}>🏆 Most Popular</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {POPULAR.map(id => <ToolCard key={id} id={id} dark={dark} onFavToggle={refresh} />)}
          </div>
        </div>

        {/* Trending */}
        <div className="mb-8">
          <h2 className={`text-xl font-black mb-4 ${dark ? "text-white" : "text-gray-900"}`}>🔥 Trending Tools</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {TRENDING.map(id => <ToolCard key={id} id={id} dark={dark} onFavToggle={refresh} />)}
          </div>
        </div>

        {/* Quick Links */}
        <div className={`rounded-2xl border p-6 ${dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100 shadow-sm"}`}>
          <h2 className={`text-lg font-bold mb-4 ${dark ? "text-white" : "text-gray-900"}`}>Quick Links</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: "/", label: "All Calculators", icon: "🧮" },
              { href: "/market", label: "Market Data", icon: "📊" },
              { href: "/calculator/compound-interest", label: "Compound Interest", icon: "📈" },
              { href: "/calculator/mortgage", label: "Mortgage", icon: "🏡" },
            ].map(({ href, label, icon }) => (
              <Link key={href} href={href} className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all hover:scale-[1.02] ${dark ? "border-gray-700 text-gray-300 hover:border-emerald-500/30" : "border-gray-200 text-gray-700 hover:border-emerald-200"}`}>
                <span>{icon}</span>
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ThemeProvider>
      <DashboardContent />
    </ThemeProvider>
  );
}
