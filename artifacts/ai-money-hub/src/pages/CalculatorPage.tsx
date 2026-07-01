import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "wouter";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import Navbar from "@/components/Navbar";
import { ThemeProvider, useTheme } from "@/lib/useTheme";
import { calculators, type Field } from "@/lib/calc-engine";
import { allTools } from "@/data/calculators";
import { trackRecent, toggleFavorite, isFavorite } from "@/lib/favorites";

function formatInput(value: number, type: Field["type"]) {
  if (type === "currency") return value.toString();
  if (type === "percent") return value.toString();
  return value.toString();
}

function FieldInput({ field, value, onChange }: { field: Field; value: number; onChange: (v: number) => void }) {
  const { dark } = useTheme();
  const [raw, setRaw] = useState(formatInput(value, field.type));

  useEffect(() => { setRaw(formatInput(value, field.type)); }, [value, field.type]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const s = e.target.value;
    setRaw(s);
    const n = parseFloat(s);
    if (!isNaN(n)) {
      const clamped = field.min !== undefined ? Math.max(field.min, n) : n;
      const clamped2 = field.max !== undefined ? Math.min(field.max, clamped) : clamped;
      onChange(clamped2);
    }
  };

  const prefix = field.type === "currency" ? "$" : field.type === "percent" ? "" : "";
  const suffix = field.type === "percent" ? "%" : field.suffix || "";

  return (
    <div>
      <label className={`block text-sm font-semibold mb-1.5 ${dark ? "text-gray-300" : "text-gray-700"}`}>{field.label}</label>
      <div className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 transition-colors focus-within:border-emerald-400 ${dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        {prefix && <span className="text-gray-400 text-sm font-medium">{prefix}</span>}
        <input
          type="number"
          value={raw}
          onChange={handleChange}
          step={field.step || (field.type === "percent" ? 0.1 : 1)}
          min={field.min}
          max={field.max}
          className={`flex-1 outline-none bg-transparent text-base font-medium ${dark ? "text-white" : "text-gray-800"}`}
        />
        {suffix && <span className="text-gray-400 text-sm font-medium">{suffix}</span>}
      </div>
    </div>
  );
}

function CalculatorContent() {
  const { dark } = useTheme();
  const params = useParams<{ id: string }>();
  const id = params.id || "";
  const calc = calculators[id];
  const tool = allTools.find(t => t.id === id);
  const [values, setValues] = useState<Record<string, number>>({});
  const [favorited, setFavorited] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (calc) {
      const defaults: Record<string, number> = {};
      calc.fields.forEach(f => { defaults[f.key] = f.default; });
      setValues(defaults);
    }
    if (id) {
      trackRecent(id);
      setFavorited(isFavorite(id));
    }
  }, [id, calc]);

  const results = calc ? calc.compute(values) : [];
  const chartData = calc?.chartData ? calc.chartData(values) : null;

  const handleReset = useCallback(() => {
    if (!calc) return;
    const defaults: Record<string, number> = {};
    calc.fields.forEach(f => { defaults[f.key] = f.default; });
    setValues(defaults);
  }, [calc]);

  const handleCopy = useCallback(() => {
    const text = results.map(r => `${r.label}: ${r.value}`).join("\n");
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }, [results]);

  const handlePrint = useCallback(() => { window.print(); }, []);

  const handleFavorite = useCallback(() => {
    const newState = toggleFavorite(id);
    setFavorited(newState);
  }, [id]);

  const category = allTools.find(t => t.id === id)?.category;
  const related = allTools.filter(t => t.category === category && t.id !== id).slice(0, 4);

  if (!calc || !tool) {
    return (
      <div className={`min-h-screen ${dark ? "bg-gray-950" : "bg-gray-50"}`}>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h1 className={`text-2xl font-black mb-2 ${dark ? "text-white" : "text-gray-900"}`}>Calculator not found</h1>
          <Link href="/" className="inline-flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-2xl btn-gradient mt-4">← Browse All Calculators</Link>
        </div>
      </div>
    );
  }

  const highlightResult = results.find(r => r.highlight);

  return (
    <div className={`min-h-screen ${dark ? "bg-gray-950" : "bg-gray-50"}`}>
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6">
          <Link href="/" className="text-emerald-500 hover:text-emerald-600">Home</Link>
          <span className="text-gray-400">/</span>
          <span className={dark ? "text-gray-300" : "text-gray-700"}>{tool.name}</span>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Calculator Panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Header */}
            <div className={`rounded-2xl border p-5 sm:p-6 ${dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100 shadow-sm"}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{tool.icon}</span>
                  <div>
                    <h1 className={`text-lg font-black ${dark ? "text-white" : "text-gray-900"}`}>{tool.name}</h1>
                    <p className="text-xs text-gray-500">{tool.category}</p>
                  </div>
                </div>
                <button onClick={handleFavorite} className={`text-xl transition-transform hover:scale-110 ${favorited ? "text-yellow-400" : "text-gray-300"}`} aria-label="Toggle favorite">
                  {favorited ? "★" : "☆"}
                </button>
              </div>
              <p className={`text-sm ${dark ? "text-gray-400" : "text-gray-600"}`}>{calc.intro}</p>
            </div>

            {/* Fields */}
            <div className={`rounded-2xl border p-5 sm:p-6 space-y-4 ${dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100 shadow-sm"}`}>
              <h2 className={`font-bold text-sm ${dark ? "text-gray-300" : "text-gray-700"}`}>Input Values</h2>
              {calc.fields.map(field => (
                <FieldInput
                  key={field.key}
                  field={field}
                  value={values[field.key] ?? field.default}
                  onChange={v => setValues(prev => ({ ...prev, [field.key]: v }))}
                />
              ))}
              <button onClick={handleReset} className={`w-full py-2 rounded-xl text-sm font-medium transition-colors border ${dark ? "border-gray-700 text-gray-400 hover:bg-gray-800" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                ↺ Reset to Defaults
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-3 space-y-4">
            {/* Highlight Result */}
            {highlightResult && (
              <div className="rounded-2xl p-5 sm:p-6 btn-gradient text-white">
                <p className="text-sm opacity-80 mb-1">{highlightResult.label}</p>
                <p className="text-4xl sm:text-5xl font-black">{highlightResult.value}</p>
              </div>
            )}

            {/* All Results */}
            <div className={`rounded-2xl border p-5 sm:p-6 ${dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100 shadow-sm"}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`font-bold ${dark ? "text-white" : "text-gray-900"}`}>Results</h2>
                <div className="flex gap-2">
                  <button onClick={handleCopy} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium ${copied ? "bg-emerald-500 text-white border-emerald-500" : dark ? "border-gray-700 text-gray-400 hover:bg-gray-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    {copied ? "✓ Copied!" : "📋 Copy"}
                  </button>
                  <button onClick={handlePrint} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium no-print ${dark ? "border-gray-700 text-gray-400 hover:bg-gray-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    🖨️ Print
                  </button>
                </div>
              </div>

              <div className="space-y-3 print-section">
                {results.map((row, i) => (
                  <div key={i} className={`flex items-center justify-between py-3 border-b last:border-0 ${dark ? "border-gray-800" : "border-gray-50"}`}>
                    <div>
                      <span className={`text-sm font-medium ${row.highlight ? "text-emerald-500" : dark ? "text-gray-300" : "text-gray-700"}`}>{row.label}</span>
                      {row.hint && <span className="block text-xs text-gray-400">{row.hint}</span>}
                    </div>
                    <span className={`text-base font-bold ${row.highlight ? "text-emerald-500" : dark ? "text-white" : "text-gray-900"}`}>{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
                💡 Results are estimates for informational purposes only. Consult a financial advisor for advice.
              </div>
            </div>

            {/* Chart */}
            {chartData && chartData.length > 1 && (
              <div className={`rounded-2xl border p-5 sm:p-6 ${dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100 shadow-sm"}`}>
                <h2 className={`font-bold mb-4 ${dark ? "text-white" : "text-gray-900"}`}>📈 Growth Chart</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                      </linearGradient>
                      <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#374151" : "#f3f4f6"} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: dark ? "#9ca3af" : "#6b7280" }} />
                    <YAxis tick={{ fontSize: 11, fill: dark ? "#9ca3af" : "#6b7280" }} tickFormatter={v => v >= 1000000 ? `$${(v/1000000).toFixed(1)}M` : v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}`} width={60} />
                    <Tooltip
                      contentStyle={{ background: dark ? "#1f2937" : "#fff", border: `1px solid ${dark ? "#374151" : "#e5e7eb"}`, borderRadius: "12px", fontSize: "12px" }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    {"principal" in (chartData[0] || {}) && <Area type="monotone" dataKey="principal" name="Invested" stroke="#3b82f6" fill="url(#colorPrincipal)" strokeWidth={2} />}
                    {"contribution" in (chartData[0] || {}) && <Area type="monotone" dataKey="contribution" name="Invested" stroke="#3b82f6" fill="url(#colorPrincipal)" strokeWidth={2} />}
                    <Area type="monotone" dataKey="value" name="Total Value" stroke="#10b981" fill="url(#colorValue)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Share Results */}
            <div className={`rounded-2xl border p-4 flex flex-wrap gap-3 ${dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100 shadow-sm"}`}>
              <span className={`text-sm font-semibold ${dark ? "text-gray-300" : "text-gray-700"}`}>Share results:</span>
              <button onClick={handleCopy} className="text-sm text-emerald-500 hover:text-emerald-600 font-medium transition-colors">📋 Copy to clipboard</button>
              <button onClick={handlePrint} className="text-sm text-emerald-500 hover:text-emerald-600 font-medium transition-colors no-print">🖨️ Print / Save PDF</button>
              <button onClick={() => { const text = `${tool.name} Results:\n` + results.map(r => `${r.label}: ${r.value}`).join("\n"); if (navigator.share) { navigator.share({ title: tool.name, text }); } }} className="text-sm text-emerald-500 hover:text-emerald-600 font-medium transition-colors">↗ Share</button>
            </div>
          </div>
        </div>

        {/* Related Calculators */}
        {related.length > 0 && (
          <div className="mt-10">
            <h3 className={`text-lg font-bold mb-4 ${dark ? "text-white" : "text-gray-900"}`}>Related Calculators</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {related.map(t => (
                <Link key={t.id} href={`/calculator/${t.id}`} className={`rounded-xl border p-4 hover:scale-[1.02] transition-all ${dark ? "bg-gray-900 border-gray-800 hover:border-emerald-500/30" : "bg-white border-gray-100 hover:border-emerald-200 shadow-sm"}`}>
                  <span className="text-xl">{t.icon}</span>
                  <p className={`text-xs font-bold mt-2 ${dark ? "text-white" : "text-gray-800"}`}>{t.name}</p>
                  <p className="text-xs text-emerald-500 mt-1">Calculate →</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CalculatorPage() {
  return (
    <ThemeProvider>
      <CalculatorContent />
    </ThemeProvider>
  );
}
