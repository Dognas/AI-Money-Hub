import { Link, useLocation } from "wouter";
import { useTheme } from "@/lib/useTheme";

export default function Navbar() {
  const { dark, toggle } = useTheme();
  const [location] = useLocation();

  const navLinks = [
    { href: "/", label: "Calculators" },
    { href: "/market", label: "Market Data" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/coach", label: "🤖 AI Coach" },
  ];

  return (
    <nav className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors ${dark ? "bg-gray-950/95 border-gray-800" : "bg-white/95 border-gray-100"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-base sm:text-lg btn-gradient">
            💰
          </div>
          <span className="text-base sm:text-lg font-black gradient-text hidden sm:block">AI Money Hub</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                  location === href
                    ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                    : dark ? "text-gray-400 hover:text-white hover:bg-gray-800" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-base transition-colors ${dark ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-100 hover:bg-gray-200"}`}
          >
            {dark ? "☀️" : "🌙"}
          </button>

          <Link href="/#calculators" className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white px-3 sm:px-4 py-2 rounded-xl transition-all hover:opacity-90 btn-gradient">
            Start Free
          </Link>
        </div>
      </div>

      {/* Mobile nav */}
      <div className={`lg:hidden flex gap-1 px-4 pb-2 overflow-x-auto no-scrollbar`}>
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              location === href
                ? "text-white btn-gradient"
                : dark ? "text-gray-400 bg-gray-800" : "text-gray-600 bg-gray-100"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
