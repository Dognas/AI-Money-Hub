import { useState, useEffect, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Navbar from "@/components/Navbar";
import { ThemeProvider, useTheme } from "@/lib/useTheme";

type MarketItem = {
  name: string; symbol: string; price: number; change24h: number; icon: string; category: string;
};

const MOCK_INDICES = [
  { name: "S&P 500", symbol: "SPX", price: 5487.03, change24h: 0.72, icon: "📈", category: "Stock Indices" },
  { name: "Dow Jones", symbol: "DJI", price: 40345.41, change24h: 0.51, icon: "📊", category: "Stock Indices" },
  { name: "NASDAQ", symbol: "IXIC", price: 17192.53, change24h: 0.90, icon: "💹", category: "Stock Indices" },
  { name: "FTSE 100", symbol: "FTSE", price: 8273.65, change24h: -0.23, icon: "🇬🇧", category: "Stock Indices" },
  { name: "Gold", symbol: "XAU", price: 2356.80, change24h: 0.34, icon: "🥇", category: "Commodities" },
  { name: "Silver", symbol: "XAG", price: 29.45, change24h: -0.18, icon: "🥈", category: "Commodities" },
  { name: "Crude Oil", symbol: "WTI", price: 81.23, change24h: 1.12, icon: "🛢️", category: "Commodities" },
  { name: "Natural Gas", symbol: "NG", price: 2.38, change24h: -2.1, icon: "⚡", category: "Commodities" },
];

const RATES_DISPLAY = [
  { label: "US Fed Rate", value: "5.25-5.50%", change: "Unchanged", icon: "🏛️" },
  { label: "ECB Rate", value: "4.00%", change: "-0.25%", icon: "🇪🇺" },
  { label: "Bank of England", value: "5.00%", change: "Unchanged", icon: "🇬🇧" },
  { label: "US Inflation (CPI)", value: "3.3%", change: "-0.1%", icon: "📊" },
  { label: "10-Yr Treasury", value: "4.28%", change: "+0.04%", icon: "📋" },
  { label: "Unemployment Rate", value: "4.0%", change: "+0.1%", icon: "👷" },
];

function sparkData(base: number, points = 20) {
  return Array.from({ length: points }, (_, i) => ({
    t: i, v: base * (1 + (Math.sin(i * 0.7 + base) * 0.02) + (Math.random() - 0.5) * 0.015),
  }));
}

function MarketCard({ item, dark }: { item: MarketItem; dark: boolean }) {
  const pos = item.change24h >= 0;
  const spark = sparkData(item.price);
  return (
    <div className={`rounded-2xl border p-5 transition-all hover:shadow-lg ${dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100 shadow-sm"}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{item.icon}</span>
          <div>
            <p className={`font-bold text-sm ${dark ? "text-white" : "text-gray-900"}`}>{item.name}</p>
            <p className="text-xs text-gray-400">{item.symbol}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${pos ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"}`}>
          {pos ? "+" : ""}{item.change24h.toFixed(2)}%
        </span>
      </div>
      <p className={`text-2xl font-black mb-3 ${pos ? "text-emerald-500" : "text-red-500"}`}>
        ${item.price.toLocaleString("en-US", { minimumFractionDigits: item.price < 100 ? 2 : 0 })}
      </p>
      <ResponsiveContainer width="100%" height={50}>
        <LineChart data={spark}>
          <Line type="monotone" dataKey="v" stroke={pos ? "#10b981" : "#ef4444"} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const FALLBACK_PRICES: Record<string, { price: number; change: number }> = {
  bitcoin: { price: 62580, change: 1.2 },
  ethereum: { price: 3456, change: 0.8 },
  binancecoin: { price: 538, change: -0.5 },
  solana: { price: 74, change: 2.1 },
  cardano: { price: 0.45, change: 1.5 },
  ripple: { price: 0.52, change: -0.3 },
};

function CryptoCard({ id, name, symbol, icon, dark, cryptoData }: { id: string; name: string; symbol: string; icon: string; dark: boolean; cryptoData?: Record<string, { price: number; change: number }> }) {
  const data = cryptoData?.[id] || null;

  const pos = (data?.change || 0) >= 0;
  const spark = sparkData(data?.price || 100);

  return (
    <div className={`rounded-2xl border p-5 transition-all hover:shadow-lg ${dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100 shadow-sm"}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className={`font-bold text-sm ${dark ? "text-white" : "text-gray-900"}`}>{name}</p>
            <p className="text-xs text-gray-400">{symbol}</p>
          </div>
        </div>
        {data && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${pos ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"}`}>
            {pos ? "+" : ""}{data.change.toFixed(2)}%
          </span>
        )}
      </div>
      {data ? (
        <>
          <p className={`text-2xl font-black mb-3 ${pos ? "text-emerald-500" : "text-red-500"}`}>
            ${data.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <ResponsiveContainer width="100%" height={50}>
            <LineChart data={spark}>
              <Line type="monotone" dataKey="v" stroke={pos ? "#10b981" : "#ef4444"} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </>
      ) : (
        <div className="h-16 flex items-center">
          <div className="animate-pulse h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      )}
    </div>
  );
}

function ForexCard({ base, target, rate, dark }: { base: string; target: string; rate: number; dark: boolean }) {
  return (
    <div className={`flex items-center justify-between py-3 border-b last:border-0 ${dark ? "border-gray-800" : "border-gray-50"}`}>
      <div>
        <span className={`text-sm font-bold ${dark ? "text-white" : "text-gray-900"}`}>{base}/{target}</span>
      </div>
      <span className={`text-sm font-semibold text-emerald-500`}>{rate.toFixed(4)}</span>
    </div>
  );
}

function MarketContent() {
  const { dark } = useTheme();
  const [forex, setForex] = useState<Record<string, number> | null>(null);
  const [cryptoData, setCryptoData] = useState<Record<string, { price: number; change: number }> | null>(null);
  const [search, setSearch] = useState("");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "crypto" | "indices" | "forex" | "indicators">("all");

  const allCryptoIds = "bitcoin,ethereum,binancecoin,solana,cardano,ripple";

  const fetchCrypto = useCallback(async () => {
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${allCryptoIds}&vs_currencies=usd&include_24hr_change=true`);
      const data = await res.json();
      const parsed: Record<string, { price: number; change: number }> = {};
      for (const id of allCryptoIds.split(",")) {
        if (data[id]) parsed[id] = { price: data[id].usd, change: data[id].usd_24h_change || 0 };
      }
      setCryptoData(Object.keys(parsed).length ? parsed : FALLBACK_PRICES);
    } catch {
      setCryptoData(FALLBACK_PRICES);
    }
  }, []);

  const fetchForex = useCallback(async () => {
    try {
      const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
      const data = await res.json();
      setForex(data.rates);
    } catch {
      setForex({ EUR: 0.9234, GBP: 0.7891, JPY: 157.23, CAD: 1.3678, AUD: 1.5234, CHF: 0.8956, CNY: 7.2634, INR: 83.45 });
    }
  }, []);

  useEffect(() => { fetchForex(); fetchCrypto(); }, [fetchForex, fetchCrypto]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchForex(), fetchCrypto()]);
    setLastUpdate(new Date());
    setTimeout(() => setRefreshing(false), 1000);
  };

  const filteredIndices = MOCK_INDICES.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.symbol.toLowerCase().includes(search.toLowerCase()));
  const forexPairs = ["EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR", "MXN", "BRL", "SGD", "HKD"];
  const cryptos = [
    { id: "bitcoin", name: "Bitcoin", symbol: "BTC", icon: "₿" },
    { id: "ethereum", name: "Ethereum", symbol: "ETH", icon: "⟠" },
    { id: "binancecoin", name: "BNB", symbol: "BNB", icon: "🟡" },
    { id: "solana", name: "Solana", symbol: "SOL", icon: "◎" },
    { id: "cardano", name: "Cardano", symbol: "ADA", icon: "🔵" },
    { id: "ripple", name: "XRP", symbol: "XRP", icon: "💧" },
  ];

  const tabs = [
    { id: "all", label: "All Markets" },
    { id: "crypto", label: "Crypto" },
    { id: "indices", label: "Indices & Commodities" },
    { id: "forex", label: "Forex" },
    { id: "indicators", label: "Economic Indicators" },
  ] as const;

  return (
    <div className={`min-h-screen ${dark ? "bg-gray-950" : "bg-gray-50"}`}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className={`text-3xl font-black ${dark ? "text-white" : "text-gray-900"}`}>📊 Market Data</h1>
            <p className={`text-sm mt-1 ${dark ? "text-gray-400" : "text-gray-500"}`}>Live prices and economic indicators</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${dark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search markets..." className={`text-sm outline-none bg-transparent ${dark ? "text-white placeholder-gray-500" : "text-gray-800 placeholder-gray-400"}`} style={{ width: 140 }} />
            </div>
            <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-xl btn-gradient disabled:opacity-60 transition-all">
              {refreshing ? "⟳ Refreshing..." : "↻ Refresh"}
            </button>
          </div>
        </div>

        <div className={`text-xs mb-6 ${dark ? "text-gray-500" : "text-gray-400"}`}>
          Last updated: {lastUpdate.toLocaleTimeString()} · Stock indices and commodities shown are indicative
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === t.id ? "text-white btn-gradient" : dark ? "text-gray-400 bg-gray-800 hover:bg-gray-700" : "text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Crypto Section */}
        {(activeTab === "all" || activeTab === "crypto") && (
          <div className="mb-8">
            <h2 className={`text-xl font-black mb-4 ${dark ? "text-white" : "text-gray-900"}`}>₿ Cryptocurrency</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {cryptos.map(c => <CryptoCard key={c.id} {...c} dark={dark} cryptoData={cryptoData ?? undefined} />)}
            </div>
            <p className="text-xs text-gray-400">Live prices from CoinGecko API</p>
          </div>
        )}

        {/* Indices & Commodities */}
        {(activeTab === "all" || activeTab === "indices") && (
          <div className="mb-8">
            <h2 className={`text-xl font-black mb-4 ${dark ? "text-white" : "text-gray-900"}`}>📈 Indices & Commodities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredIndices.map(item => <MarketCard key={item.symbol} item={item} dark={dark} />)}
            </div>
            <p className="text-xs text-gray-400 mt-3">Indicative prices for educational purposes only</p>
          </div>
        )}

        {/* Forex */}
        {(activeTab === "all" || activeTab === "forex") && (
          <div className="mb-8">
            <h2 className={`text-xl font-black mb-4 ${dark ? "text-white" : "text-gray-900"}`}>💱 Currency Exchange Rates (vs USD)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`rounded-2xl border p-5 ${dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100 shadow-sm"}`}>
                {forex
                  ? forexPairs.slice(0, 6).filter(pair => pair.toLowerCase().includes(search.toLowerCase()) || search === "").map(pair => (
                      <ForexCard key={pair} base="USD" target={pair} rate={forex[pair] || 1} dark={dark} />
                    ))
                  : <div className="animate-pulse space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />)}</div>
                }
              </div>
              <div className={`rounded-2xl border p-5 ${dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100 shadow-sm"}`}>
                {forex
                  ? forexPairs.slice(6).filter(pair => pair.toLowerCase().includes(search.toLowerCase()) || search === "").map(pair => (
                      <ForexCard key={pair} base="USD" target={pair} rate={forex[pair] || 1} dark={dark} />
                    ))
                  : <div className="animate-pulse space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />)}</div>
                }
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">Live data from ExchangeRate-API</p>
          </div>
        )}

        {/* Economic Indicators */}
        {(activeTab === "all" || activeTab === "indicators") && (
          <div className="mb-8">
            <h2 className={`text-xl font-black mb-4 ${dark ? "text-white" : "text-gray-900"}`}>🏛️ Economic Indicators</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {RATES_DISPLAY.map((item, i) => (
                <div key={i} className={`rounded-2xl border p-5 ${dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100 shadow-sm"}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{item.icon}</span>
                    <span className={`text-sm font-semibold ${dark ? "text-gray-300" : "text-gray-700"}`}>{item.label}</span>
                  </div>
                  <p className={`text-3xl font-black gradient-text`}>{item.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.change}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">Indicative figures for educational purposes</p>
          </div>
        )}

        {/* Disclaimer */}
        <div className={`rounded-2xl border p-5 ${dark ? "bg-gray-900 border-gray-800" : "bg-amber-50 border-amber-200"}`}>
          <p className={`text-sm ${dark ? "text-gray-400" : "text-amber-800"}`}>
            <strong>Disclaimer:</strong> Market data shown is for educational and informational purposes only. Cryptocurrency prices are from the CoinGecko API. Stock indices and commodities are indicative only. Currency rates are from ExchangeRate-API. Not financial advice. Always verify with your broker.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MarketDataPage() {
  return (
    <ThemeProvider>
      <MarketContent />
    </ThemeProvider>
  );
}
