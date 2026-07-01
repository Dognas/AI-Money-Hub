export type Tool = {
  id: string; name: string; desc: string; icon: string; category: string; badge?: string;
}
export type Category = {
  id: string; label: string; icon: string; color: string; tools: Tool[];
}

const cat = (id: string, category: string, tools: Omit<Tool, "category">[]): Tool[] =>
  tools.map(t => ({ ...t, category }));

export const categories: Category[] = [
  {
    id: "income", label: "Income & Salary", icon: "💼", color: "from-emerald-400 to-teal-500",
    tools: cat("income", "Income & Salary", [
      { id: "salary", name: "Salary Calculator", desc: "Convert annual, monthly, weekly & hourly pay", icon: "💵", badge: "Popular" },
      { id: "hourly-to-salary", name: "Hourly to Salary", desc: "Turn your hourly rate into yearly income", icon: "⏱️" },
      { id: "take-home-pay", name: "Take-Home Pay", desc: "Estimate your net paycheck after deductions", icon: "🧾", badge: "Hot" },
      { id: "overtime", name: "Overtime Pay", desc: "Calculate time-and-a-half and double pay", icon: "⏰" },
      { id: "raise", name: "Pay Raise", desc: "See your new salary after a percentage raise", icon: "📈" },
      { id: "gross-to-net", name: "Gross to Net", desc: "Break down gross income into net take-home", icon: "💳" },
      { id: "cost-of-living", name: "Cost of Living", desc: "Compare salary needs across cities", icon: "🌆" },
      { id: "annual-bonus", name: "Annual Bonus", desc: "Estimate bonus payout and tax impact", icon: "🎁" },
    ]),
  },
  {
    id: "tax", label: "Taxes", icon: "🏛️", color: "from-blue-400 to-indigo-500",
    tools: cat("tax", "Taxes", [
      { id: "income-tax", name: "Income Tax", desc: "Estimate federal income tax owed", icon: "🏛️", badge: "Popular" },
      { id: "sales-tax", name: "Sales Tax", desc: "Add sales tax to any purchase amount", icon: "🛒" },
      { id: "vat", name: "VAT Calculator", desc: "Add or remove value-added tax", icon: "🌍" },
      { id: "capital-gains", name: "Capital Gains Tax", desc: "Tax on profits from selling assets", icon: "📊", badge: "Hot" },
      { id: "self-employment-tax", name: "Self-Employment Tax", desc: "Estimate SE tax for freelancers", icon: "🧑‍💻" },
      { id: "property-tax", name: "Property Tax", desc: "Annual property tax from home value", icon: "🏠" },
      { id: "tax-refund", name: "Tax Refund", desc: "Estimate your tax refund or amount due", icon: "💸" },
      { id: "tip", name: "Tip Calculator", desc: "Split the bill and calculate the tip", icon: "🍽️" },
    ]),
  },
  {
    id: "investment", label: "Investing", icon: "📈", color: "from-violet-400 to-purple-500",
    tools: cat("investment", "Investing", [
      { id: "compound-interest", name: "Compound Interest", desc: "Watch your money grow over time", icon: "🪙", badge: "Popular" },
      { id: "roi", name: "ROI Calculator", desc: "Return on investment percentage", icon: "📈" },
      { id: "investment-growth", name: "Investment Growth", desc: "Project growth with monthly contributions", icon: "🌱", badge: "Hot" },
      { id: "dividend", name: "Dividend Income", desc: "Annual income from dividend stocks", icon: "💰" },
      { id: "dca", name: "Dollar-Cost Averaging", desc: "Recurring buys over time", icon: "🔁" },
      { id: "stock-return", name: "Stock Return", desc: "Total return from buying & selling", icon: "📉" },
      { id: "401k", name: "401(k) Growth", desc: "Retirement savings with employer match", icon: "🏦" },
      { id: "rule-of-72", name: "Rule of 72", desc: "Years to double your investment", icon: "⏳" },
    ]),
  },
  {
    id: "loans", label: "Loans & Debt", icon: "🏦", color: "from-rose-400 to-red-500",
    tools: cat("loans", "Loans & Debt", [
      { id: "mortgage", name: "Mortgage Calculator", desc: "Monthly home loan payments", icon: "🏡", badge: "Popular" },
      { id: "auto-loan", name: "Auto Loan", desc: "Monthly car payment estimate", icon: "🚗" },
      { id: "personal-loan", name: "Personal Loan", desc: "Payments on a personal loan", icon: "💵" },
      { id: "student-loan", name: "Student Loan", desc: "Repayment schedule and total cost", icon: "🎓", badge: "Hot" },
      { id: "credit-card-payoff", name: "Credit Card Payoff", desc: "Time to pay off card balance", icon: "💳" },
      { id: "debt-payoff", name: "Debt Payoff", desc: "Months to become debt-free", icon: "🎯" },
      { id: "loan-amortization", name: "Loan Amortization", desc: "Full payment breakdown over time", icon: "📋" },
      { id: "refinance", name: "Refinance Savings", desc: "Compare current vs new loan", icon: "♻️" },
    ]),
  },
  {
    id: "savings", label: "Savings & Budget", icon: "🐷", color: "from-amber-400 to-orange-500",
    tools: cat("savings", "Savings & Budget", [
      { id: "savings-goal", name: "Savings Goal", desc: "Monthly savings to hit a target", icon: "🎯", badge: "Popular" },
      { id: "emergency-fund", name: "Emergency Fund", desc: "How much to keep for emergencies", icon: "🛟" },
      { id: "budget-50-30-20", name: "50/30/20 Budget", desc: "Split income into needs, wants & savings", icon: "📊", badge: "Hot" },
      { id: "net-worth", name: "Net Worth", desc: "Assets minus liabilities", icon: "💎" },
      { id: "fire-number", name: "FIRE Number", desc: "Savings needed for early retirement", icon: "🔥" },
      { id: "inflation", name: "Inflation Calculator", desc: "Future value of money with inflation", icon: "📉" },
      { id: "savings-interest", name: "Savings Interest", desc: "Interest earned on a savings account", icon: "🏦" },
    ]),
  },
  {
    id: "creator", label: "Creator Economy", icon: "🎬", color: "from-pink-400 to-rose-500",
    tools: cat("creator", "Creator Economy", [
      { id: "tiktok-money", name: "TikTok Money", desc: "Estimate earnings from views", icon: "🎵", badge: "Trending" },
      { id: "youtube-money", name: "YouTube Money", desc: "Ad revenue from video views", icon: "▶️", badge: "Popular" },
      { id: "instagram-earnings", name: "Instagram Earnings", desc: "Sponsored post rate estimate", icon: "📸" },
      { id: "twitch-income", name: "Twitch Income", desc: "Earnings from subs & bits", icon: "🎮" },
      { id: "freelance-rate", name: "Freelance Rate", desc: "Hourly rate from income goals", icon: "🧑‍💻", badge: "Hot" },
      { id: "patreon", name: "Patreon Income", desc: "Monthly income from patrons", icon: "🧡" },
      { id: "affiliate-profit", name: "Affiliate Profit", desc: "Earnings from affiliate marketing", icon: "🔗" },
    ]),
  },
  {
    id: "crypto", label: "Crypto", icon: "₿", color: "from-orange-400 to-amber-500",
    tools: cat("crypto", "Crypto", [
      { id: "crypto-profit", name: "Crypto Profit", desc: "Profit/loss from buying & selling", icon: "₿", badge: "Trending" },
      { id: "staking-rewards", name: "Staking Rewards", desc: "Annual rewards from staking", icon: "🥩" },
      { id: "bitcoin-dca", name: "Bitcoin DCA", desc: "Recurring crypto buys over time", icon: "🟠", badge: "Hot" },
      { id: "mining-profit", name: "Mining Profit", desc: "Daily profit after electricity", icon: "⛏️" },
      { id: "crypto-portfolio", name: "Portfolio Value", desc: "Total value of your holdings", icon: "💼" },
    ]),
  },
  {
    id: "business", label: "Business", icon: "🏢", color: "from-cyan-400 to-blue-500",
    tools: cat("business", "Business", [
      { id: "profit-margin", name: "Profit Margin", desc: "Margin and markup from cost & price", icon: "📈", badge: "Popular" },
      { id: "break-even", name: "Break-Even Point", desc: "Units needed to cover costs", icon: "⚖️" },
      { id: "markup", name: "Markup Calculator", desc: "Selling price from cost & markup", icon: "🏷️" },
      { id: "ltv-cac", name: "LTV : CAC Ratio", desc: "Customer value vs acquisition cost", icon: "🔄", badge: "Hot" },
      { id: "discount", name: "Discount Calculator", desc: "Final price after a discount", icon: "🔖" },
      { id: "invoice-total", name: "Invoice Total", desc: "Totals with tax and discounts", icon: "🧾" },
    ]),
  },
];

export const allTools: Tool[] = categories.flatMap(c => c.tools);

export const testimonials = [
  { name: "Sarah Chen", location: "San Francisco, USA", text: "AI Money Hub helped me figure out my freelance rate in minutes. The take-home pay calculator is scary accurate.", rating: 5, avatar: "SC" },
  { name: "James Okafor", location: "London, UK", text: "I use the mortgage and refinance tools constantly. Saved me thousands by spotting a better deal.", rating: 5, avatar: "JO" },
  { name: "Maria Garcia", location: "Madrid, Spain", text: "The creator calculators are a game changer. Finally know what to charge for sponsored posts.", rating: 5, avatar: "MG" },
  { name: "Liam Murphy", location: "Toronto, Canada", text: "Finally an app that does real calculations. The compound interest chart really showed me why I need to invest now.", rating: 5, avatar: "LM" },
  { name: "Aisha Patel", location: "Mumbai, India", text: "Clean, fast, and free. The FIRE number calculator gave me a real goal to work toward.", rating: 5, avatar: "AP" },
  { name: "Noah Williams", location: "Sydney, Australia", text: "Best collection of financial calculators I've found. The crypto profit tracker is spot on.", rating: 5, avatar: "NW" },
];
