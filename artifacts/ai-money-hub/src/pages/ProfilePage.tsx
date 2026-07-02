import { useState, useEffect } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import { ThemeProvider, useTheme } from "@/lib/useTheme";
import { useAuth } from "@/lib/useAuth";
import { profileApi, type UserProfile } from "@/lib/api";

const GOALS = [
  "Save for a home", "Retire early (FIRE)", "Pay off debt",
  "Build wealth", "Emergency fund", "Start investing", "Increase income"
];
const RISK_OPTIONS = ["Conservative", "Moderate", "Aggressive"];

function Field({ label, children, dark }: { label: string; children: React.ReactNode; dark: boolean }) {
  return (
    <div>
      <label className={`block text-xs font-semibold mb-1 ${dark ? "text-gray-400" : "text-gray-600"}`}>{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, type = "text", placeholder, dark, prefix }: {
  value: string; onChange: (v: string) => void; type?: string;
  placeholder?: string; dark: boolean; prefix?: string;
}) {
  return (
    <div className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 focus-within:border-emerald-400 transition-colors ${dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
      {prefix && <span className="text-gray-400 text-sm">{prefix}</span>}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`flex-1 outline-none bg-transparent text-sm font-medium ${dark ? "text-white placeholder-gray-500" : "text-gray-800 placeholder-gray-400"}`} />
    </div>
  );
}

function ProfileContent() {
  const { dark } = useTheme();
  const { user, isAuthenticated, login, logout } = useAuth();
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    profileApi.get().then(setProfile).catch(() => {}).finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await profileApi.upsert(profile);
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const f = (key: keyof UserProfile) => ({
    value: String(profile[key] ?? ""),
    onChange: (v: string) => setProfile((p) => ({ ...p, [key]: v === "" ? null : v })),
  });
  const fNum = (key: keyof UserProfile) => ({
    value: String(profile[key] ?? ""),
    onChange: (v: string) => setProfile((p) => ({ ...p, [key]: v === "" ? null : parseFloat(v) || 0 })),
  });

  const healthScore = (() => {
    if (!profile.monthlyIncome) return null;
    let s = 50;
    const sr = profile.monthlySavings ? (profile.monthlySavings / profile.monthlyIncome) * 100 : 0;
    if (sr >= 20) s += 20; else if (sr >= 10) s += 10; else if (sr < 0) s -= 15;
    if (profile.totalDebt && profile.totalDebt > 0) { const dti = (profile.totalDebt / (profile.monthlyIncome * 12)) * 100; if (dti < 20) s += 5; else if (dti > 80) s -= 15; }
    if (profile.totalInvestments && profile.totalInvestments > 0) s += 10;
    return Math.min(100, Math.max(0, Math.round(s)));
  })();

  return (
    <div className={`min-h-screen ${dark ? "bg-gray-950" : "bg-gradient-to-br from-slate-50 to-emerald-50/30"}`}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className={`text-2xl font-black mb-1 ${dark ? "text-white" : "text-gray-900"}`}>My Financial Profile</h1>
            <p className={`text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>Your data is encrypted and used only to personalise your AI advisor</p>
          </div>
          {isAuthenticated && (
            <button onClick={logout} className={`text-xs px-3 py-1.5 rounded-xl border transition-colors ${dark ? "border-gray-700 text-gray-400 hover:bg-gray-800" : "border-gray-200 text-gray-500 hover:bg-gray-100"}`}>
              Sign Out
            </button>
          )}
        </div>

        {!isAuthenticated ? (
          <div className={`rounded-2xl border p-8 text-center ${dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100 shadow-sm"}`}>
            <div className="w-14 h-14 btn-gradient rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">👤</div>
            <h2 className={`text-lg font-black mb-2 ${dark ? "text-white" : "text-gray-900"}`}>Sign in to manage your profile</h2>
            <p className={`text-sm mb-6 ${dark ? "text-gray-400" : "text-gray-500"}`}>Your financial profile powers your personalised AI advice and progress tracking.</p>
            <button onClick={login} className="btn-gradient text-white font-bold px-8 py-3 rounded-2xl text-sm">Sign In</button>
          </div>
        ) : (
          <>
            {/* User Card */}
            <div className={`rounded-2xl border p-5 mb-6 flex items-center gap-4 ${dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100 shadow-sm"}`}>
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="Avatar" className="w-14 h-14 rounded-2xl object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-2xl btn-gradient flex items-center justify-center text-white font-black text-xl">
                  {user?.firstName?.[0] ?? "U"}
                </div>
              )}
              <div className="flex-1">
                <p className={`font-black text-base ${dark ? "text-white" : "text-gray-900"}`}>
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-sm text-gray-400">{user?.email}</p>
              </div>
              {healthScore != null && (
                <div className="text-center">
                  <p className={`text-3xl font-black ${healthScore >= 70 ? "text-emerald-500" : healthScore >= 50 ? "text-amber-500" : "text-red-500"}`}>{healthScore}</p>
                  <p className="text-xs text-gray-400">Health Score</p>
                </div>
              )}
            </div>

            {loading ? (
              <div className="text-center py-10 text-gray-400">Loading profile...</div>
            ) : (
              <div className={`rounded-2xl border overflow-hidden ${dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100 shadow-sm"}`}>
                <div className="p-5 sm:p-6 space-y-6">
                  {/* Personal */}
                  <div>
                    <h3 className={`text-sm font-black uppercase tracking-wider mb-4 ${dark ? "text-emerald-400" : "text-emerald-600"}`}>Personal Info</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <Field label="Age" dark={dark}><Input {...fNum("age")} type="number" placeholder="35" dark={dark} /></Field>
                      <Field label="Country" dark={dark}><Input {...f("country")} placeholder="United States" dark={dark} /></Field>
                      <Field label="Currency" dark={dark}><Input {...f("currency")} placeholder="USD" dark={dark} /></Field>
                    </div>
                  </div>

                  {/* Financials */}
                  <div>
                    <h3 className={`text-sm font-black uppercase tracking-wider mb-4 ${dark ? "text-emerald-400" : "text-emerald-600"}`}>Monthly Finances</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Field label="Monthly Income (after tax)" dark={dark}><Input {...fNum("monthlyIncome")} type="number" placeholder="5000" dark={dark} prefix="$" /></Field>
                      <Field label="Monthly Expenses" dark={dark}><Input {...fNum("monthlyExpenses")} type="number" placeholder="3000" dark={dark} prefix="$" /></Field>
                      <Field label="Monthly Savings/Investments" dark={dark}><Input {...fNum("monthlySavings")} type="number" placeholder="800" dark={dark} prefix="$" /></Field>
                    </div>
                  </div>

                  {/* Net Worth */}
                  <div>
                    <h3 className={`text-sm font-black uppercase tracking-wider mb-4 ${dark ? "text-emerald-400" : "text-emerald-600"}`}>Net Worth</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Field label="Total Savings / Cash" dark={dark}><Input {...fNum("totalSavings")} type="number" placeholder="20000" dark={dark} prefix="$" /></Field>
                      <Field label="Total Investments" dark={dark}><Input {...fNum("totalInvestments")} type="number" placeholder="50000" dark={dark} prefix="$" /></Field>
                      <Field label="Total Debt" dark={dark}><Input {...fNum("totalDebt")} type="number" placeholder="15000" dark={dark} prefix="$" /></Field>
                    </div>
                  </div>

                  {/* Goals */}
                  <div>
                    <h3 className={`text-sm font-black uppercase tracking-wider mb-4 ${dark ? "text-emerald-400" : "text-emerald-600"}`}>Goals & Strategy</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Field label="Target Retirement Age" dark={dark}><Input {...fNum("retirementAge")} type="number" placeholder="65" dark={dark} /></Field>
                      <Field label="Risk Tolerance" dark={dark}>
                        <select value={profile.riskTolerance ?? ""} onChange={(e) => setProfile((p) => ({ ...p, riskTolerance: e.target.value || null }))}
                          className={`w-full rounded-xl border-2 px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-emerald-400 ${dark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-800"}`}>
                          <option value="">Select...</option>
                          {RISK_OPTIONS.map((r) => <option key={r} value={r.toLowerCase()}>{r}</option>)}
                        </select>
                      </Field>
                      <Field label="Primary Goal" dark={dark}>
                        <select value={profile.financialGoal ?? ""} onChange={(e) => setProfile((p) => ({ ...p, financialGoal: e.target.value || null }))}
                          className={`w-full rounded-xl border-2 px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-emerald-400 ${dark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-800"}`}>
                          <option value="">Select...</option>
                          {GOALS.map((g) => <option key={g}>{g}</option>)}
                        </select>
                      </Field>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className={`px-5 sm:px-6 py-4 border-t ${dark ? "border-gray-800 bg-gray-900/50" : "border-gray-100 bg-gray-50"}`}>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}>🔒 Data encrypted and stored securely</p>
                    <button onClick={handleSave} disabled={saving}
                      className={`btn-gradient text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all ${saving ? "opacity-70" : "hover:opacity-90"}`}>
                      {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Profile"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Action links */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link href="/advisor" className={`rounded-xl border p-4 flex items-center gap-3 transition-all hover:scale-[1.01] ${dark ? "border-gray-800 bg-gray-900 hover:border-emerald-500/30" : "border-gray-100 bg-white hover:border-emerald-200 shadow-sm"}`}>
                <span className="text-2xl">🤖</span>
                <div><p className={`font-bold text-sm ${dark ? "text-white" : "text-gray-800"}`}>AI Advisor</p><p className="text-xs text-gray-400">Chat about your finances</p></div>
              </Link>
              <Link href="/dashboard" className={`rounded-xl border p-4 flex items-center gap-3 transition-all hover:scale-[1.01] ${dark ? "border-gray-800 bg-gray-900 hover:border-emerald-500/30" : "border-gray-100 bg-white hover:border-emerald-200 shadow-sm"}`}>
                <span className="text-2xl">📊</span>
                <div><p className={`font-bold text-sm ${dark ? "text-white" : "text-gray-800"}`}>Dashboard</p><p className="text-xs text-gray-400">View your history</p></div>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ThemeProvider>
      <ProfileContent />
    </ThemeProvider>
  );
}
