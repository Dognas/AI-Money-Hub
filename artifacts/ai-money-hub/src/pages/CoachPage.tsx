import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import { ThemeProvider, useTheme } from "@/lib/useTheme";

/* ─── Types ─────────────────────────────────────────── */
type Goal = "save-house" | "retire-early" | "pay-debt" | "grow-wealth" | "emergency-fund" | "start-investing" | "increase-income";
type FrequencyKey = "none" | "partial" | "yes";

type Answers = {
  name: string;
  goal: Goal | "";
  income: number;
  expenses: number;
  savings: number;
  debt: number;
  hasEmergencyFund: FrequencyKey;
  investingForRetirement: FrequencyKey;
  age: number;
};

type Message = {
  role: "coach" | "user";
  text: string;
  options?: { label: string; value: string }[];
  inputType?: "text" | "number" | "currency";
  inputKey?: keyof Answers;
  isReport?: boolean;
  tools?: { id: string; name: string; icon: string; desc: string }[];
};

/* ─── Coach Logic ────────────────────────────────────── */
const GOAL_LABELS: Record<Goal, string> = {
  "save-house": "🏡 Save for a home",
  "retire-early": "🔥 Retire early (FIRE)",
  "pay-debt": "💳 Pay off debt",
  "grow-wealth": "📈 Grow my wealth",
  "emergency-fund": "🛟 Build an emergency fund",
  "start-investing": "💹 Start investing",
  "increase-income": "💰 Increase my income",
};

const GOAL_CALC: Record<Goal, { id: string; name: string; icon: string; desc: string }[]> = {
  "save-house": [
    { id: "mortgage", name: "Mortgage Calculator", icon: "🏡", desc: "See what you can afford" },
    { id: "savings-goal", name: "Savings Goal", icon: "🎯", desc: "How long to save a deposit" },
    { id: "budget-50-30-20", name: "50/30/20 Budget", icon: "📊", desc: "Free up more savings" },
  ],
  "retire-early": [
    { id: "fire-number", name: "FIRE Number", icon: "🔥", desc: "How much you need to retire" },
    { id: "compound-interest", name: "Compound Interest", icon: "🪙", desc: "Watch your money grow" },
    { id: "investment-growth", name: "Investment Growth", icon: "🌱", desc: "Project your portfolio" },
  ],
  "pay-debt": [
    { id: "debt-payoff", name: "Debt Payoff", icon: "🎯", desc: "Time to debt-free" },
    { id: "credit-card-payoff", name: "Credit Card Payoff", icon: "💳", desc: "Pay off your card" },
    { id: "budget-50-30-20", name: "50/30/20 Budget", icon: "📊", desc: "Find money for payments" },
  ],
  "grow-wealth": [
    { id: "investment-growth", name: "Investment Growth", icon: "🌱", desc: "Project your portfolio" },
    { id: "compound-interest", name: "Compound Interest", icon: "🪙", desc: "Power of compounding" },
    { id: "roi", name: "ROI Calculator", icon: "📈", desc: "Track return on investment" },
  ],
  "emergency-fund": [
    { id: "emergency-fund", name: "Emergency Fund", icon: "🛟", desc: "How much you need" },
    { id: "savings-goal", name: "Savings Goal", icon: "🎯", desc: "Plan your savings timeline" },
    { id: "budget-50-30-20", name: "50/30/20 Budget", icon: "📊", desc: "Allocate savings in budget" },
  ],
  "start-investing": [
    { id: "dca", name: "Dollar-Cost Averaging", icon: "🔁", desc: "Start with any amount" },
    { id: "compound-interest", name: "Compound Interest", icon: "🪙", desc: "See long-term growth" },
    { id: "401k", name: "401(k) Growth", icon: "🏦", desc: "Employer match calculator" },
  ],
  "increase-income": [
    { id: "freelance-rate", name: "Freelance Rate", icon: "🧑‍💻", desc: "Find your ideal hourly rate" },
    { id: "salary", name: "Salary Calculator", icon: "💵", desc: "Benchmark your pay" },
    { id: "raise", name: "Pay Raise", icon: "📈", desc: "Negotiate your raise" },
  ],
};

function analyzeFinances(a: Answers) {
  const savingsRate = a.income > 0 ? (a.savings / a.income) * 100 : 0;
  const expenseRatio = a.income > 0 ? (a.expenses / a.income) * 100 : 0;
  const monthsEmergency = a.expenses > 0 ? (a.savings * 3) / a.expenses : 0; // rough proxy
  const debtToIncome = a.income > 0 ? (a.debt / (a.income * 12)) * 100 : 0;

  let score = 50;
  if (savingsRate >= 20) score += 20;
  else if (savingsRate >= 10) score += 10;
  else if (savingsRate < 0) score -= 15;

  if (expenseRatio <= 70) score += 10;
  else if (expenseRatio >= 95) score -= 10;

  if (a.hasEmergencyFund === "yes") score += 10;
  else if (a.hasEmergencyFund === "partial") score += 5;

  if (a.investingForRetirement === "yes") score += 10;
  else if (a.investingForRetirement === "partial") score += 3;

  if (debtToIncome < 20) score += 5;
  else if (debtToIncome > 80) score -= 15;

  score = Math.min(100, Math.max(0, score));

  const insights: string[] = [];
  const actions: string[] = [];

  if (savingsRate < 10) {
    insights.push(`⚠️ Your savings rate is ${savingsRate.toFixed(0)}% — below the recommended 20%. Try cutting expenses by $${Math.round(a.income * 0.05).toLocaleString()}/month to reach 15%.`);
    actions.push("Use the 50/30/20 Budget tool to find savings opportunities");
  } else if (savingsRate >= 20) {
    insights.push(`✅ Excellent! Your ${savingsRate.toFixed(0)}% savings rate puts you well ahead. Keep compounding!`);
  } else {
    insights.push(`👍 Your ${savingsRate.toFixed(0)}% savings rate is decent. Pushing to 20% would significantly accelerate your goal.`);
  }

  if (expenseRatio > 90) {
    insights.push(`🔴 Your expenses consume ${expenseRatio.toFixed(0)}% of income — leaving very little margin. Reviewing your biggest spending categories is urgent.`);
  } else if (expenseRatio < 70) {
    insights.push(`✅ You're keeping expenses to ${expenseRatio.toFixed(0)}% of income — great financial discipline.`);
  }

  if (a.hasEmergencyFund === "none") {
    insights.push("🛟 You have no emergency fund. This is your most important first step — aim for 3–6 months of expenses ($" + (a.expenses * 3).toLocaleString() + "–$" + (a.expenses * 6).toLocaleString() + ").");
    actions.push("Build your emergency fund before investing");
  }

  if (a.debt > 0) {
    if (debtToIncome > 50) {
      insights.push(`💳 Your debt ($${a.debt.toLocaleString()}) is high relative to income. Focus on aggressive paydown — use the Debt Payoff calculator to find your debt-free date.`);
    } else {
      insights.push(`💡 You have $${a.debt.toLocaleString()} in debt. Consider the avalanche method (highest interest first) to minimise total cost.`);
    }
  }

  if (a.investingForRetirement === "none" && a.age < 50) {
    const yearsLeft = 65 - a.age;
    insights.push(`📈 You're not investing for retirement yet. Starting now at your age, even $${Math.round(a.income * 0.05).toLocaleString()}/month could grow to $${Math.round(a.income * 0.05 * 12 * Math.pow(1.08, yearsLeft)).toLocaleString()} by 65.`);
    actions.push("Open a 401(k) or IRA — start with even $50/month");
  }

  const goalCalcs = a.goal && GOAL_CALC[a.goal as Goal] ? GOAL_CALC[a.goal as Goal] : GOAL_CALC["grow-wealth"];

  const dailyTips = [
    "Review one monthly subscription today — cancel anything you haven't used in 3 months.",
    "Set up automatic transfers to savings on payday — pay yourself first.",
    "Check your credit report at AnnualCreditReport.com — it's free once a year.",
    "If your employer offers a 401(k) match, make sure you're contributing enough to get the full match.",
    "Calculate your net worth today. What gets measured, gets managed.",
    "The best investment is in yourself — skills that increase income compound faster than any stock.",
    "Every $1 you don't spend is worth more than $1 earned (taxes!). Frugality compounds.",
  ];
  const tip = dailyTips[new Date().getDay() % dailyTips.length];

  return { score, insights, actions, goalCalcs, tip, savingsRate, expenseRatio, debtToIncome };
}

/* ─── Components ─────────────────────────────────────── */
function ScoreRing({ score, dark }: { score: number; dark: boolean }) {
  const color = score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const label = score >= 70 ? "Great" : score >= 50 ? "Fair" : "Needs Work";
  const r = 40; const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="100" height="100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke={dark ? "#374151" : "#e5e7eb"} strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 1.2s ease" }} />
      </svg>
      <div className="text-center -mt-16 mb-8">
        <p className="text-3xl font-black" style={{ color }}>{score}</p>
        <p className="text-xs font-semibold" style={{ color }}>{label}</p>
      </div>
    </div>
  );
}

function CoachBubble({ message, dark, onOption, onSubmit }: {
  message: Message; dark: boolean;
  onOption?: (v: string) => void;
  onSubmit?: (key: keyof Answers, val: string) => void;
}) {
  const [inputVal, setInputVal] = useState("");

  const isCoach = message.role === "coach";

  if (message.isReport) return null; // rendered separately

  return (
    <div className={`flex gap-3 ${isCoach ? "items-start" : "items-start flex-row-reverse"} mb-4`}>
      {isCoach && (
        <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-base btn-gradient">🤖</div>
      )}
      <div className={`max-w-[80%] ${isCoach ? "" : "ml-auto"}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${isCoach
          ? dark ? "bg-gray-800 text-gray-100" : "bg-white border border-gray-100 shadow-sm text-gray-800"
          : "text-white btn-gradient"
        }`}>
          {message.text}
        </div>

        {/* Option Buttons */}
        {message.options && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.options.map(opt => (
              <button key={opt.value} onClick={() => onOption?.(opt.value)}
                className={`text-sm px-3 py-1.5 rounded-xl border font-medium transition-all hover:scale-105 ${dark ? "border-gray-600 text-gray-300 hover:border-emerald-500 hover:text-emerald-400" : "border-gray-200 text-gray-700 hover:border-emerald-400 hover:text-emerald-600 bg-white"}`}>
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Text/Number Input */}
        {message.inputType && message.inputKey && (
          <div className="mt-2 flex gap-2">
            <div className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 flex-1 focus-within:border-emerald-400 transition-colors ${dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              {message.inputType === "currency" && <span className="text-gray-400 text-sm">$</span>}
              <input
                type={message.inputType === "text" ? "text" : "number"}
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && inputVal.trim()) { onSubmit?.(message.inputKey!, inputVal); setInputVal(""); } }}
                placeholder={message.inputType === "text" ? "Type your answer..." : "Enter amount..."}
                className={`flex-1 outline-none bg-transparent text-sm font-medium ${dark ? "text-white placeholder-gray-500" : "text-gray-800 placeholder-gray-400"}`}
              />
            </div>
            <button
              onClick={() => { if (inputVal.trim()) { onSubmit?.(message.inputKey!, inputVal); setInputVal(""); } }}
              className="px-4 py-2 rounded-xl text-white text-sm font-semibold btn-gradient"
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CoachReport({ answers, dark }: { answers: Answers; dark: boolean }) {
  const analysis = analyzeFinances(answers);
  const { score, insights, goalCalcs, tip, savingsRate, expenseRatio } = analysis;
  const [activeTab, setActiveTab] = useState<"overview" | "insights" | "tools">("overview");

  return (
    <div className={`rounded-2xl border overflow-hidden ${dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100 shadow-sm"}`}>
      {/* Report Header */}
      <div className="p-5 sm:p-6 btn-gradient text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm opacity-80 mb-1">Daily Financial Health Report</p>
            <h2 className="text-xl font-black">
              {answers.name ? `${answers.name}'s` : "Your"} Financial Snapshot
            </h2>
            <p className="text-xs opacity-70 mt-1">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black">{score}</p>
            <p className="text-xs opacity-80">Health Score</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex border-b ${dark ? "border-gray-800" : "border-gray-100"}`}>
        {(["overview", "insights", "tools"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${activeTab === t ? "text-emerald-500 border-b-2 border-emerald-500" : dark ? "text-gray-400" : "text-gray-500"}`}>
            {t === "overview" ? "📊 Overview" : t === "insights" ? "💡 Insights" : "🧮 Tools"}
          </button>
        ))}
      </div>

      <div className="p-5 sm:p-6">
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Score Bar */}
            <div className="flex items-center gap-4 mb-5">
              <ScoreRing score={score} dark={dark} />
              <div className="flex-1">
                <p className={`text-sm font-semibold mb-3 ${dark ? "text-gray-300" : "text-gray-700"}`}>Financial Health Score</p>
                <div className="space-y-2">
                  <div className={`rounded-full h-2 overflow-hidden ${dark ? "bg-gray-700" : "bg-gray-100"}`}>
                    <div className="h-2 rounded-full transition-all duration-1000 btn-gradient" style={{ width: `${score}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400"><span>0 - Struggling</span><span>100 - Thriving</span></div>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Monthly Income", value: `$${answers.income.toLocaleString()}`, color: "text-emerald-500" },
                { label: "Savings Rate", value: `${savingsRate.toFixed(0)}%`, color: savingsRate >= 20 ? "text-emerald-500" : savingsRate >= 10 ? "text-amber-500" : "text-red-500" },
                { label: "Expense Ratio", value: `${expenseRatio.toFixed(0)}%`, color: expenseRatio < 70 ? "text-emerald-500" : expenseRatio < 90 ? "text-amber-500" : "text-red-500" },
                { label: "Total Debt", value: answers.debt > 0 ? `$${answers.debt.toLocaleString()}` : "Debt-free! 🎉", color: answers.debt === 0 ? "text-emerald-500" : "text-amber-500" },
              ].map((m, i) => (
                <div key={i} className={`rounded-xl p-3 ${dark ? "bg-gray-800" : "bg-gray-50"}`}>
                  <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                  <p className={`text-base font-black ${m.color}`}>{m.value}</p>
                </div>
              ))}
            </div>

            {/* Goal */}
            {answers.goal && (
              <div className={`rounded-xl p-4 border ${dark ? "border-gray-700 bg-gray-800" : "border-emerald-100 bg-emerald-50"}`}>
                <p className="text-xs text-gray-500 mb-1">Your Main Goal</p>
                <p className={`font-bold text-sm ${dark ? "text-white" : "text-gray-800"}`}>{GOAL_LABELS[answers.goal as Goal]}</p>
              </div>
            )}

            {/* Daily Tip */}
            <div className={`rounded-xl p-4 border-l-4 border-emerald-400 ${dark ? "bg-gray-800" : "bg-gray-50"}`}>
              <p className="text-xs font-semibold text-emerald-500 mb-1">💡 Today's Tip</p>
              <p className={`text-sm ${dark ? "text-gray-300" : "text-gray-700"}`}>{tip}</p>
            </div>
          </div>
        )}

        {activeTab === "insights" && (
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <div key={i} className={`rounded-xl p-4 text-sm leading-relaxed ${dark ? "bg-gray-800 text-gray-300" : "bg-gray-50 text-gray-700"}`}>
                {insight}
              </div>
            ))}

            {insights.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Answer the questions to get personalised insights.</p>
            )}
          </div>
        )}

        {activeTab === "tools" && (
          <div className="space-y-3">
            <p className={`text-sm mb-3 ${dark ? "text-gray-400" : "text-gray-600"}`}>
              Based on your goal and situation, here are the calculators to use today:
            </p>
            {goalCalcs.map((tool, i) => (
              <Link key={i} href={`/calculator/${tool.id}`}
                className={`flex items-center gap-3 rounded-xl border p-4 transition-all hover:scale-[1.01] hover:shadow-md ${dark ? "bg-gray-800 border-gray-700 hover:border-emerald-500/30" : "bg-white border-gray-100 hover:border-emerald-200"}`}>
                <span className="text-2xl flex-shrink-0">{tool.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm ${dark ? "text-white" : "text-gray-800"}`}>{tool.name}</p>
                  <p className="text-xs text-gray-500">{tool.desc}</p>
                </div>
                <span className="text-emerald-500 text-sm flex-shrink-0">Open →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Question Flow ──────────────────────────────────── */
function buildFlow(): Message[] {
  return [
    {
      role: "coach",
      text: "👋 Hello! I'm your Daily AI Financial Coach. I'll ask you a few quick questions to give you a personalised financial health report and action plan for today.\n\nFirst — what should I call you?",
      inputType: "text",
      inputKey: "name",
    },
  ];
}

function nextQuestion(step: number, answers: Partial<Answers>): Message | null {
  const steps: Message[] = [
    {
      role: "coach",
      text: `Great to meet you${answers.name ? `, ${answers.name}` : ""}! 🎯 What's your main financial goal right now?`,
      options: Object.entries(GOAL_LABELS).map(([value, label]) => ({ value, label })),
      inputKey: "goal",
    },
    {
      role: "coach",
      text: "Got it! Now let's look at your numbers. What's your monthly take-home income (after tax)?",
      inputType: "currency",
      inputKey: "income",
    },
    {
      role: "coach",
      text: "And roughly how much do you spend per month on all expenses (rent, food, transport, subscriptions, etc.)?",
      inputType: "currency",
      inputKey: "expenses",
    },
    {
      role: "coach",
      text: "How much are you saving or investing each month?",
      inputType: "currency",
      inputKey: "savings",
    },
    {
      role: "coach",
      text: "What's your total outstanding debt? (credit cards, loans, student debt — not your mortgage if it's investment property) Enter 0 if you're debt-free.",
      inputType: "currency",
      inputKey: "debt",
    },
    {
      role: "coach",
      text: "Do you have an emergency fund (3–6 months of expenses saved and accessible)?",
      options: [
        { value: "yes", label: "✅ Yes, fully funded" },
        { value: "partial", label: "🔶 Partial — working on it" },
        { value: "none", label: "❌ Not yet" },
      ],
      inputKey: "hasEmergencyFund",
    },
    {
      role: "coach",
      text: "Are you actively investing for retirement? (401k, IRA, pension, stocks, etc.)",
      options: [
        { value: "yes", label: "✅ Yes, regularly" },
        { value: "partial", label: "🔶 Occasionally / small amount" },
        { value: "none", label: "❌ Not yet" },
      ],
      inputKey: "investingForRetirement",
    },
    {
      role: "coach",
      text: "Last question — how old are you? (Helps calculate retirement timeline)",
      inputType: "number",
      inputKey: "age",
    },
  ];
  return steps[step] ?? null;
}

/* ─── Free Chat ──────────────────────────────────────── */
function freeChat(query: string, answers: Answers): string {
  const q = query.toLowerCase();
  const savingsRate = answers.income > 0 ? (answers.savings / answers.income) * 100 : 0;
  const monthsToEmergency = answers.expenses > 0 ? (answers.expenses * 6 - answers.savings) / answers.savings : 0;

  if (/(save|saving|savings rate)/i.test(q)) {
    return savingsRate >= 20
      ? `Your savings rate of ${savingsRate.toFixed(0)}% is excellent! The sweet spot is 20–30%. Keep it up and consider whether you can push to 30% for even faster progress.`
      : `Your current savings rate is ${savingsRate.toFixed(0)}%. To reach 20%, you'd need to save an extra $${Math.round(answers.income * (0.20 - savingsRate / 100)).toLocaleString()}/month. Start by cutting one expense category.`;
  }
  if (/(emergency|rainy day|fund)/i.test(q)) {
    const target = answers.expenses * 6;
    return `Your 6-month emergency fund target is $${target.toLocaleString()}. ${answers.hasEmergencyFund === "yes" ? "You've got this covered — great!" : `You're not there yet. Try automating $${Math.round(answers.income * 0.05).toLocaleString()}/month into a high-yield savings account.`}`;
  }
  if (/(invest|stock|401k|ira|retirement)/i.test(q)) {
    const yearsLeft = Math.max(1, 65 - answers.age);
    const monthly = Math.round(answers.income * 0.1);
    const projected = Math.round(monthly * 12 * ((Math.pow(1.08, yearsLeft) - 1) / 0.08));
    return `If you invest $${monthly.toLocaleString()}/month (10% of income) at a historical 8% return, you could have $${projected.toLocaleString()} in ${yearsLeft} years. Start with your employer's 401(k) to get any matching contribution — that's free money!`;
  }
  if (/(debt|loan|credit card)/i.test(q)) {
    return answers.debt > 0
      ? `You have $${answers.debt.toLocaleString()} in debt. The fastest paydown is the avalanche method: list all debts by interest rate, pay minimums on all, and throw every extra dollar at the highest rate. Use our Debt Payoff calculator to see your debt-free date.`
      : "You're debt-free — that's a huge advantage. Channel that freedom into building wealth.";
  }
  if (/(budget|spend|expenses)/i.test(q)) {
    const needs = Math.round(answers.income * 0.5);
    const wants = Math.round(answers.income * 0.3);
    const savingsTarget = Math.round(answers.income * 0.2);
    return `For your income of $${answers.income.toLocaleString()}/month, the 50/30/20 rule suggests: Needs $${needs.toLocaleString()}, Wants $${wants.toLocaleString()}, Savings/Debt $${savingsTarget.toLocaleString()}. Your current expenses are $${answers.expenses.toLocaleString()} — ${answers.expenses > needs ? `that's above the 50% threshold, meaning you might want to review fixed costs.` : `that's within the healthy range!`}`;
  }
  if (/(fire|early retirement)/i.test(q)) {
    const fireNum = answers.expenses * 12 * 25;
    return `Your FIRE number (25× annual expenses) is $${fireNum.toLocaleString()}. With your current savings of $${answers.savings.toLocaleString()}/month, it would take approximately ${Math.round(fireNum / (answers.savings * 12))} years to reach it — assuming 7% annual growth.`;
  }
  if (/(score|health|rating)/i.test(q)) {
    const { score } = analyzeFinances(answers);
    return `Your financial health score is ${score}/100. ${score >= 70 ? "You're doing great — keep optimizing." : score >= 50 ? "You're on the right track but there's room to improve. Focus on saving rate and emergency fund." : "There are some areas that need attention. Start with stabilizing expenses and building an emergency fund before investing."}`;
  }
  return `Great question! Based on your profile — $${answers.income.toLocaleString()}/month income, ${((answers.savings / answers.income) * 100).toFixed(0)}% savings rate — I'd focus on ${answers.hasEmergencyFund === "none" ? "building your emergency fund first, then investing" : answers.debt > 10000 ? "aggressively paying down debt" : "maximising investment contributions"}. What specifically would you like to know more about?`;
}

/* ─── Main Page ──────────────────────────────────────── */
function CoachContent() {
  const { dark } = useTheme();
  const [messages, setMessages] = useState<Message[]>(buildFlow());
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [questionStep, setQuestionStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const addCoachMsg = (msg: Message) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, msg]);
    }, 600 + Math.random() * 400);
  };

  const handleOption = (value: string, key: keyof Answers) => {
    const label = (messages.at(-1)?.options || []).find(o => o.value === value)?.label || value;
    setMessages(prev => [...prev, { role: "user", text: label }]);
    const updated = { ...answers, [key]: value };
    setAnswers(updated);
    advanceFlow(updated, questionStep + 1);
  };

  const handleInput = (key: keyof Answers, val: string) => {
    const parsed = (key === "income" || key === "expenses" || key === "savings" || key === "debt" || key === "age")
      ? Math.max(0, parseFloat(val) || 0) : val;
    const label = key === "name" ? val : key === "age" ? `${val} years old` : `$${parseFloat(val).toLocaleString()}`;
    setMessages(prev => [...prev, { role: "user", text: label }]);
    const updated = { ...answers, [key]: parsed };
    setAnswers(updated);
    advanceFlow(updated, questionStep + 1);
  };

  const advanceFlow = (currentAnswers: Partial<Answers>, nextStep: number) => {
    const next = nextQuestion(nextStep, currentAnswers);
    setQuestionStep(nextStep);
    if (next) {
      addCoachMsg(next);
    } else {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setMessages(prev => [...prev, {
          role: "coach",
          text: `Perfect${currentAnswers.name ? `, ${currentAnswers.name}` : ""}! I've analysed your answers. Here's your personalised financial health report 👇`,
          isReport: false,
        }]);
        setIsComplete(true);
      }, 800);
    }
  };

  const handleFreeChat = () => {
    if (!chatInput.trim() || !isComplete) return;
    const q = chatInput.trim();
    setChatInput("");
    setMessages(prev => [...prev, { role: "user", text: q }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const reply = freeChat(q, answers as Answers);
      setMessages(prev => [...prev, { role: "coach", text: reply }]);
    }, 800 + Math.random() * 400);
  };

  const handleRestart = () => {
    setMessages(buildFlow());
    setAnswers({});
    setQuestionStep(0);
    setIsComplete(false);
    setChatInput("");
  };

  // Which messages have interactive elements (only the last coach message that has input/options)
  const lastInteractiveIdx = [...messages].reverse().findIndex(m => m.role === "coach" && (m.options || m.inputType));
  const lastInteractiveFromEnd = lastInteractiveIdx >= 0 ? messages.length - 1 - lastInteractiveIdx : -1;

  return (
    <div className={`min-h-screen flex flex-col ${dark ? "bg-gray-950" : "bg-gray-50"}`}>
      <Navbar />

      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col flex-1" style={{ maxHeight: "calc(100vh - 60px)" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className={`text-2xl font-black ${dark ? "text-white" : "text-gray-900"}`}>🤖 Daily AI Coach</h1>
            <p className={`text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>Your personalised financial health check</p>
          </div>
          <button onClick={handleRestart} className={`text-xs px-3 py-1.5 rounded-xl border transition-colors font-medium ${dark ? "border-gray-700 text-gray-400 hover:bg-gray-800" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
            ↺ Start Over
          </button>
        </div>

        {/* Chat Window */}
        <div className={`flex-1 overflow-y-auto rounded-2xl border p-4 sm:p-5 mb-4 ${dark ? "bg-gray-900/50 border-gray-800" : "bg-white/80 border-gray-100"}`} style={{ minHeight: 300, maxHeight: 480 }}>
          {messages.map((msg, i) => (
            <CoachBubble
              key={i}
              message={msg}
              dark={dark}
              onOption={msg.inputKey ? (v) => handleOption(v, msg.inputKey!) : undefined}
              onSubmit={msg.inputKey ? (key, val) => handleInput(key, val) : undefined}
            />
          ))}

          {/* Remove interactivity from all but the last interactive coach message */}
          {/* (already done by only rendering options/input on last interactive msg — but let's control via index) */}

          {typing && (
            <div className="flex gap-3 items-start mb-4">
              <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-base btn-gradient">🤖</div>
              <div className={`rounded-2xl px-4 py-3 text-sm ${dark ? "bg-gray-800" : "bg-white border border-gray-100 shadow-sm"}`}>
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Report Card */}
        {isComplete && (
          <div className="mb-4">
            <CoachReport answers={answers as Answers} dark={dark} />
          </div>
        )}

        {/* Free Chat Input (only after complete) */}
        {isComplete && (
          <div className={`rounded-2xl border p-3 ${dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
            <p className="text-xs text-gray-400 mb-2 px-1">Ask me anything about your finances…</p>
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleFreeChat(); }}
                placeholder="e.g. How can I improve my score? How much to invest?"
                className={`flex-1 outline-none text-sm px-3 py-2.5 rounded-xl border-2 focus:border-emerald-400 transition-colors ${dark ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400"}`}
              />
              <button onClick={handleFreeChat} className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm btn-gradient">Send</button>
            </div>
          </div>
        )}

        {/* Suggested prompts for free chat */}
        {isComplete && (
          <div className="mt-3 flex flex-wrap gap-2">
            {["How can I improve my savings rate?", "What's my FIRE number?", "How do I start investing?", "Tell me about my debt"].map(q => (
              <button key={q} onClick={() => { setChatInput(q); }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${dark ? "border-gray-700 text-gray-400 hover:border-emerald-500 hover:text-emerald-400" : "border-gray-200 text-gray-600 hover:border-emerald-400 hover:text-emerald-500 bg-white"}`}>
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CoachPage() {
  return (
    <ThemeProvider>
      <CoachContent />
    </ThemeProvider>
  );
}
