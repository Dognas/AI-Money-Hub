export type FieldType = "number" | "currency" | "percent";
export type Field = { key: string; label: string; type: FieldType; default: number; min?: number; max?: number; step?: number; suffix?: string; };
export type ResultRow = { label: string; value: string; highlight?: boolean; hint?: string; };
export type ChartPoint = { label: string; value: number; interest?: number; principal?: number; contribution?: number; };
export type Calculator = { intro: string; fields: Field[]; compute: (v: Record<string, number>) => ResultRow[]; chartData?: (v: Record<string, number>) => ChartPoint[]; };

const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(isFinite(n) ? n : 0);
const usd2 = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(isFinite(n) ? n : 0);
const pct = (n: number) => `${(isFinite(n) ? n : 0).toFixed(2)}%`;
const num = (n: number, d = 0) => (isFinite(n) ? n : 0).toLocaleString("en-US", { maximumFractionDigits: d });

function monthlyPayment(principal: number, annualRate: number, years: number) {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return n ? principal / n : 0;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

function federalTax(taxable: number) {
  const brackets = [[0,0.1],[11600,0.12],[47150,0.22],[100525,0.24],[191950,0.32],[243725,0.35],[609350,0.37]];
  let tax = 0;
  for (let i = 0; i < brackets.length; i++) {
    const [floor, rate] = brackets[i];
    const ceil = i < brackets.length - 1 ? brackets[i + 1][0] : Infinity;
    if (taxable > floor) { tax += (Math.min(taxable, ceil) - floor) * rate; } else break;
  }
  return tax;
}

export const calculators: Record<string, Calculator> = {
  salary: {
    intro: "Convert your pay between annual, monthly, weekly, and hourly figures.",
    fields: [
      { key: "annual", label: "Annual Salary", type: "currency", default: 75000 },
      { key: "hoursPerWeek", label: "Hours / Week", type: "number", default: 40, suffix: "hrs" },
      { key: "weeksPerYear", label: "Weeks / Year", type: "number", default: 52, suffix: "wks" },
    ],
    compute: (v) => {
      const hours = v.hoursPerWeek * v.weeksPerYear;
      return [
        { label: "Annual", value: usd(v.annual), highlight: true },
        { label: "Monthly", value: usd(v.annual / 12) },
        { label: "Bi-Weekly", value: usd(v.annual / 26) },
        { label: "Weekly", value: usd(v.annual / v.weeksPerYear) },
        { label: "Daily (5-day)", value: usd2(v.annual / (v.weeksPerYear * 5)) },
        { label: "Hourly", value: usd2(v.annual / hours) },
      ];
    },
  },
  "hourly-to-salary": {
    intro: "Turn your hourly wage into an estimated yearly income.",
    fields: [
      { key: "rate", label: "Hourly Rate", type: "currency", default: 25 },
      { key: "hoursPerWeek", label: "Hours / Week", type: "number", default: 40, suffix: "hrs" },
      { key: "weeksPerYear", label: "Weeks / Year", type: "number", default: 52, suffix: "wks" },
    ],
    compute: (v) => {
      const annual = v.rate * v.hoursPerWeek * v.weeksPerYear;
      return [
        { label: "Annual Salary", value: usd(annual), highlight: true },
        { label: "Monthly", value: usd(annual / 12) },
        { label: "Weekly", value: usd(v.rate * v.hoursPerWeek) },
        { label: "Daily", value: usd2(v.rate * v.hoursPerWeek / 5) },
      ];
    },
  },
  "take-home-pay": {
    intro: "Estimate your net paycheck after federal tax, FICA, and state deductions.",
    fields: [
      { key: "annual", label: "Gross Annual Salary", type: "currency", default: 75000 },
      { key: "pretax", label: "Pre-tax Deductions / Year", type: "currency", default: 6000 },
      { key: "stateRate", label: "State Tax Rate", type: "percent", default: 5 },
    ],
    compute: (v) => {
      const taxable = Math.max(0, v.annual - v.pretax - 14600);
      const fed = federalTax(taxable);
      const fica = v.annual * 0.0765;
      const state = (v.annual - v.pretax) * (v.stateRate / 100);
      const net = v.annual - v.pretax - fed - fica - state;
      return [
        { label: "Net Take-Home (Year)", value: usd(net), highlight: true },
        { label: "Net Monthly", value: usd(net / 12) },
        { label: "Net Bi-Weekly", value: usd(net / 26) },
        { label: "Federal Tax", value: usd(fed) },
        { label: "FICA (SS + Medicare)", value: usd(fica) },
        { label: "State Tax", value: usd(state) },
        { label: "Effective Tax Rate", value: pct(((fed + fica + state) / v.annual) * 100) },
      ];
    },
  },
  overtime: {
    intro: "Calculate overtime pay at time-and-a-half plus your base pay.",
    fields: [
      { key: "rate", label: "Base Hourly Rate", type: "currency", default: 25 },
      { key: "regular", label: "Regular Hours", type: "number", default: 40, suffix: "hrs" },
      { key: "ot", label: "Overtime Hours", type: "number", default: 10, suffix: "hrs" },
      { key: "multiplier", label: "OT Multiplier", type: "number", default: 1.5, step: 0.5 },
    ],
    compute: (v) => {
      const base = v.rate * v.regular;
      const otPay = v.rate * v.multiplier * v.ot;
      return [
        { label: "Total Weekly Pay", value: usd2(base + otPay), highlight: true },
        { label: "Regular Pay", value: usd2(base) },
        { label: "Overtime Pay", value: usd2(otPay) },
        { label: "OT Hourly Rate", value: usd2(v.rate * v.multiplier) },
      ];
    },
  },
  raise: {
    intro: "See your new salary and the difference after a percentage raise.",
    fields: [
      { key: "current", label: "Current Salary", type: "currency", default: 75000 },
      { key: "raise", label: "Raise", type: "percent", default: 5 },
    ],
    compute: (v) => {
      const newSalary = v.current * (1 + v.raise / 100);
      return [
        { label: "New Salary", value: usd(newSalary), highlight: true },
        { label: "Annual Increase", value: usd(newSalary - v.current) },
        { label: "Monthly Increase", value: usd((newSalary - v.current) / 12) },
      ];
    },
  },
  "gross-to-net": {
    intro: "Break down gross income into estimated net take-home pay.",
    fields: [
      { key: "gross", label: "Gross Income", type: "currency", default: 6000 },
      { key: "taxRate", label: "Total Tax Rate", type: "percent", default: 25 },
    ],
    compute: (v) => {
      const tax = v.gross * (v.taxRate / 100);
      return [
        { label: "Net Income", value: usd(v.gross - tax), highlight: true },
        { label: "Total Tax", value: usd(tax) },
        { label: "Tax Rate", value: pct(v.taxRate) },
      ];
    },
  },
  "cost-of-living": {
    intro: "Find the equivalent salary needed in a city with a different cost of living.",
    fields: [
      { key: "salary", label: "Current Salary", type: "currency", default: 75000 },
      { key: "indexDiff", label: "Cost Difference", type: "percent", default: 20 },
    ],
    compute: (v) => {
      const needed = v.salary * (1 + v.indexDiff / 100);
      return [
        { label: "Equivalent Salary Needed", value: usd(needed), highlight: true },
        { label: "Extra Required", value: usd(needed - v.salary) },
      ];
    },
  },
  "annual-bonus": {
    intro: "Estimate your bonus payout and after-tax amount.",
    fields: [
      { key: "salary", label: "Base Salary", type: "currency", default: 75000 },
      { key: "bonusPct", label: "Bonus Target", type: "percent", default: 10 },
      { key: "taxRate", label: "Bonus Tax Rate", type: "percent", default: 22 },
    ],
    compute: (v) => {
      const bonus = v.salary * (v.bonusPct / 100);
      const net = bonus * (1 - v.taxRate / 100);
      return [
        { label: "Net Bonus", value: usd(net), highlight: true },
        { label: "Gross Bonus", value: usd(bonus) },
        { label: "Tax Withheld", value: usd(bonus - net) },
      ];
    },
  },
  "income-tax": {
    intro: "Estimate federal income tax using 2024 single-filer brackets.",
    fields: [
      { key: "income", label: "Annual Income", type: "currency", default: 75000 },
      { key: "deductions", label: "Deductions", type: "currency", default: 14600 },
    ],
    compute: (v) => {
      const taxable = Math.max(0, v.income - v.deductions);
      const tax = federalTax(taxable);
      return [
        { label: "Estimated Federal Tax", value: usd(tax), highlight: true },
        { label: "Taxable Income", value: usd(taxable) },
        { label: "After-Tax Income", value: usd(v.income - tax) },
        { label: "Effective Rate", value: pct((tax / v.income) * 100) },
      ];
    },
  },
  "sales-tax": {
    intro: "Add sales tax to a purchase to find the total cost.",
    fields: [
      { key: "amount", label: "Purchase Amount", type: "currency", default: 100 },
      { key: "rate", label: "Sales Tax Rate", type: "percent", default: 8.25 },
    ],
    compute: (v) => {
      const tax = v.amount * (v.rate / 100);
      return [
        { label: "Total With Tax", value: usd2(v.amount + tax), highlight: true },
        { label: "Tax Amount", value: usd2(tax) },
        { label: "Pre-Tax Amount", value: usd2(v.amount) },
      ];
    },
  },
  vat: {
    intro: "Add or remove value-added tax from a price.",
    fields: [
      { key: "amount", label: "Net Amount", type: "currency", default: 100 },
      { key: "rate", label: "VAT Rate", type: "percent", default: 20 },
    ],
    compute: (v) => {
      const vatAmt = v.amount * (v.rate / 100);
      return [
        { label: "Gross (incl. VAT)", value: usd2(v.amount + vatAmt), highlight: true },
        { label: "VAT Amount", value: usd2(vatAmt) },
        { label: "Net Amount", value: usd2(v.amount) },
      ];
    },
  },
  "capital-gains": {
    intro: "Estimate tax owed on profit from selling an asset.",
    fields: [
      { key: "buy", label: "Purchase Price", type: "currency", default: 10000 },
      { key: "sell", label: "Sale Price", type: "currency", default: 15000 },
      { key: "rate", label: "Capital Gains Rate", type: "percent", default: 15 },
    ],
    compute: (v) => {
      const gain = v.sell - v.buy;
      const tax = Math.max(0, gain) * (v.rate / 100);
      return [
        { label: "Capital Gains Tax", value: usd(tax), highlight: true },
        { label: "Total Gain", value: usd(gain) },
        { label: "Net Profit After Tax", value: usd(gain - tax) },
        { label: "Return on Investment", value: pct((gain / v.buy) * 100) },
      ];
    },
  },
  "self-employment-tax": {
    intro: "Estimate self-employment tax (15.3%) for freelancers.",
    fields: [{ key: "netProfit", label: "Net Business Profit", type: "currency", default: 60000 }],
    compute: (v) => {
      const base = v.netProfit * 0.9235;
      const seTax = base * 0.153;
      return [
        { label: "Self-Employment Tax", value: usd(seTax), highlight: true },
        { label: "Deductible Half", value: usd(seTax / 2) },
        { label: "Taxable Base", value: usd(base) },
        { label: "Net After SE Tax", value: usd(v.netProfit - seTax) },
      ];
    },
  },
  "property-tax": {
    intro: "Estimate annual property tax from your home value.",
    fields: [
      { key: "value", label: "Home Value", type: "currency", default: 400000 },
      { key: "rate", label: "Property Tax Rate", type: "percent", default: 1.1 },
    ],
    compute: (v) => {
      const tax = v.value * (v.rate / 100);
      return [
        { label: "Annual Property Tax", value: usd(tax), highlight: true },
        { label: "Monthly", value: usd(tax / 12) },
        { label: "Quarterly", value: usd(tax / 4) },
      ];
    },
  },
  "tax-refund": {
    intro: "Estimate your refund or balance due based on withholding.",
    fields: [
      { key: "income", label: "Annual Income", type: "currency", default: 75000 },
      { key: "withheld", label: "Tax Withheld", type: "currency", default: 12000 },
      { key: "deductions", label: "Deductions", type: "currency", default: 14600 },
    ],
    compute: (v) => {
      const tax = federalTax(Math.max(0, v.income - v.deductions));
      const diff = v.withheld - tax;
      return [
        { label: diff >= 0 ? "Estimated Refund" : "Balance Due", value: usd(Math.abs(diff)), highlight: true },
        { label: "Tax Owed", value: usd(tax) },
        { label: "Total Withheld", value: usd(v.withheld) },
        { label: "Effective Rate", value: pct((tax / v.income) * 100) },
      ];
    },
  },
  tip: {
    intro: "Calculate the tip and split the bill among friends.",
    fields: [
      { key: "bill", label: "Bill Amount", type: "currency", default: 80 },
      { key: "tipPct", label: "Tip", type: "percent", default: 18 },
      { key: "people", label: "Split Between", type: "number", default: 2, min: 1, suffix: "people" },
    ],
    compute: (v) => {
      const tip = v.bill * (v.tipPct / 100);
      const total = v.bill + tip;
      return [
        { label: "Per Person", value: usd2(total / Math.max(1, v.people)), highlight: true },
        { label: "Total Bill", value: usd2(total) },
        { label: "Tip Amount", value: usd2(tip) },
      ];
    },
  },
  "compound-interest": {
    intro: "See how an investment grows with compound interest over time.",
    fields: [
      { key: "principal", label: "Initial Amount", type: "currency", default: 10000 },
      { key: "rate", label: "Annual Return", type: "percent", default: 8 },
      { key: "years", label: "Years", type: "number", default: 20, suffix: "yrs" },
      { key: "monthly", label: "Monthly Contribution", type: "currency", default: 500 },
      { key: "compounds", label: "Compounds / Year", type: "number", default: 12 },
    ],
    compute: (v) => {
      const n = v.compounds;
      const r = v.rate / 100 / n;
      const periods = n * v.years;
      const fvPrincipal = v.principal * Math.pow(1 + r, periods);
      const fvContrib = r === 0 ? v.monthly * periods : v.monthly * ((Math.pow(1 + r, periods) - 1) / r);
      const total = fvPrincipal + fvContrib;
      const invested = v.principal + v.monthly * 12 * v.years;
      return [
        { label: "Final Value", value: usd(total), highlight: true },
        { label: "Total Interest Earned", value: usd(total - invested) },
        { label: "Total Invested", value: usd(invested) },
        { label: "Monthly Contribution", value: usd(v.monthly) },
      ];
    },
    chartData: (v) => {
      const n = Math.min(v.compounds, 12);
      const r = v.rate / 100 / n;
      const years = Math.min(Math.round(v.years), 50);
      return Array.from({ length: years + 1 }, (_, yr) => {
        const periods = n * yr;
        const fvP = v.principal * Math.pow(1 + r, periods);
        const fvC = r === 0 ? v.monthly * periods : v.monthly * ((Math.pow(1 + r, periods) - 1) / r);
        const total = fvP + fvC;
        const invested = v.principal + v.monthly * 12 * yr;
        return { label: `Yr ${yr}`, value: Math.round(total), interest: Math.round(total - invested), principal: Math.round(invested) };
      });
    },
  },
  roi: {
    intro: "Calculate the return on investment as a percentage.",
    fields: [
      { key: "cost", label: "Initial Investment", type: "currency", default: 5000 },
      { key: "final", label: "Final Value", type: "currency", default: 8000 },
      { key: "years", label: "Holding Period", type: "number", default: 3, suffix: "yrs" },
    ],
    compute: (v) => {
      const profit = v.final - v.cost;
      const roi = (profit / v.cost) * 100;
      const annualRoi = (Math.pow(v.final / v.cost, 1 / v.years) - 1) * 100;
      return [
        { label: "ROI", value: pct(roi), highlight: true },
        { label: "Annualized ROI", value: pct(annualRoi) },
        { label: "Net Profit", value: usd(profit) },
        { label: "Total Return", value: `${(v.final / v.cost).toFixed(2)}x` },
      ];
    },
  },
  "investment-growth": {
    intro: "Project growth combining an initial amount with monthly contributions.",
    fields: [
      { key: "principal", label: "Initial Amount", type: "currency", default: 5000 },
      { key: "monthly", label: "Monthly Contribution", type: "currency", default: 500 },
      { key: "rate", label: "Annual Return", type: "percent", default: 8 },
      { key: "years", label: "Years", type: "number", default: 20, suffix: "yrs" },
    ],
    compute: (v) => {
      const r = v.rate / 100 / 12;
      const n = v.years * 12;
      const fvP = v.principal * Math.pow(1 + r, n);
      const fvC = r === 0 ? v.monthly * n : v.monthly * ((Math.pow(1 + r, n) - 1) / r);
      const total = fvP + fvC;
      const invested = v.principal + v.monthly * n;
      return [
        { label: "Future Value", value: usd(total), highlight: true },
        { label: "Total Invested", value: usd(invested) },
        { label: "Total Growth", value: usd(total - invested) },
        { label: "Monthly Payment", value: usd(v.monthly) },
      ];
    },
    chartData: (v) => {
      const r = v.rate / 100 / 12;
      const years = Math.min(Math.round(v.years), 50);
      return Array.from({ length: years + 1 }, (_, yr) => {
        const n = yr * 12;
        const fvP = v.principal * Math.pow(1 + r, n);
        const fvC = r === 0 ? v.monthly * n : v.monthly * ((Math.pow(1 + r, n) - 1) / r);
        const total = fvP + fvC;
        const invested = v.principal + v.monthly * n;
        return { label: `Yr ${yr}`, value: Math.round(total), contribution: Math.round(invested), interest: Math.round(total - invested) };
      });
    },
  },
  dividend: {
    intro: "Estimate annual income from dividend-paying stocks.",
    fields: [
      { key: "invested", label: "Amount Invested", type: "currency", default: 50000 },
      { key: "yield", label: "Dividend Yield", type: "percent", default: 4 },
    ],
    compute: (v) => {
      const annual = v.invested * (v.yield / 100);
      return [
        { label: "Annual Dividend Income", value: usd(annual), highlight: true },
        { label: "Monthly", value: usd(annual / 12) },
        { label: "Quarterly", value: usd(annual / 4) },
        { label: "Weekly", value: usd(annual / 52) },
      ];
    },
  },
  dca: {
    intro: "Project results of investing a fixed amount on a recurring schedule.",
    fields: [
      { key: "monthly", label: "Monthly Investment", type: "currency", default: 300 },
      { key: "rate", label: "Annual Return", type: "percent", default: 8 },
      { key: "years", label: "Years", type: "number", default: 10, suffix: "yrs" },
    ],
    compute: (v) => {
      const r = v.rate / 100 / 12;
      const n = v.years * 12;
      const fv = r === 0 ? v.monthly * n : v.monthly * ((Math.pow(1 + r, n) - 1) / r);
      return [
        { label: "Future Value", value: usd(fv), highlight: true },
        { label: "Total Invested", value: usd(v.monthly * n) },
        { label: "Total Gains", value: usd(fv - v.monthly * n) },
        { label: "Monthly Investment", value: usd(v.monthly) },
      ];
    },
    chartData: (v) => {
      const r = v.rate / 100 / 12;
      const years = Math.min(Math.round(v.years), 40);
      return Array.from({ length: years + 1 }, (_, yr) => {
        const n = yr * 12;
        const fv = r === 0 ? v.monthly * n : v.monthly * ((Math.pow(1 + r, n) - 1) / r);
        return { label: `Yr ${yr}`, value: Math.round(fv), principal: Math.round(v.monthly * n), interest: Math.round(fv - v.monthly * n) };
      });
    },
  },
  "stock-return": {
    intro: "Calculate total return from buying and selling shares.",
    fields: [
      { key: "shares", label: "Number of Shares", type: "number", default: 100 },
      { key: "buy", label: "Buy Price / Share", type: "currency", default: 50 },
      { key: "sell", label: "Sell Price / Share", type: "currency", default: 75 },
    ],
    compute: (v) => {
      const cost = v.shares * v.buy;
      const proceeds = v.shares * v.sell;
      const profit = proceeds - cost;
      return [
        { label: "Total Profit", value: usd(profit), highlight: true },
        { label: "Return", value: pct((profit / cost) * 100) },
        { label: "Total Proceeds", value: usd(proceeds) },
        { label: "Cost Basis", value: usd(cost) },
      ];
    },
  },
  "401k": {
    intro: "Project 401(k) growth including employer match.",
    fields: [
      { key: "salary", label: "Annual Salary", type: "currency", default: 75000 },
      { key: "contribPct", label: "Your Contribution", type: "percent", default: 6 },
      { key: "matchPct", label: "Employer Match", type: "percent", default: 3 },
      { key: "rate", label: "Annual Return", type: "percent", default: 7 },
      { key: "years", label: "Years", type: "number", default: 30, suffix: "yrs" },
    ],
    compute: (v) => {
      const annualContrib = v.salary * (v.contribPct / 100) + v.salary * (v.matchPct / 100);
      const monthly = annualContrib / 12;
      const r = v.rate / 100 / 12;
      const n = v.years * 12;
      const fv = r === 0 ? monthly * n : monthly * ((Math.pow(1 + r, n) - 1) / r);
      return [
        { label: "401(k) Balance", value: usd(fv), highlight: true },
        { label: "Annual Contribution", value: usd(annualContrib) },
        { label: "Total Contributed", value: usd(annualContrib * v.years) },
        { label: "Investment Growth", value: usd(fv - annualContrib * v.years) },
      ];
    },
  },
  "rule-of-72": {
    intro: "Estimate how many years it takes to double your money.",
    fields: [{ key: "rate", label: "Annual Return", type: "percent", default: 8 }],
    compute: (v) => [
      { label: "Years to Double", value: `${(72 / v.rate).toFixed(1)} yrs`, highlight: true },
      { label: "Years to Triple", value: `${(114 / v.rate).toFixed(1)} yrs` },
      { label: "Years to 10x", value: `${(230 / v.rate).toFixed(1)} yrs` },
    ],
  },
  mortgage: {
    intro: "Estimate your monthly mortgage payment, total interest and full repayment.",
    fields: [
      { key: "price", label: "Home Price", type: "currency", default: 400000 },
      { key: "down", label: "Down Payment", type: "currency", default: 80000 },
      { key: "rate", label: "Interest Rate", type: "percent", default: 6.5 },
      { key: "years", label: "Loan Term", type: "number", default: 30, suffix: "yrs" },
    ],
    compute: (v) => {
      const principal = Math.max(0, v.price - v.down);
      const m = monthlyPayment(principal, v.rate, v.years);
      const total = m * v.years * 12;
      const downPct = v.price > 0 ? (v.down / v.price) * 100 : 0;
      return [
        { label: "Monthly Payment", value: usd2(m), highlight: true },
        { label: "Loan Amount", value: usd(principal) },
        { label: "Total Interest", value: usd(total - principal) },
        { label: "Total Repayment", value: usd(total) },
        { label: "Down Payment", value: pct(downPct) },
      ];
    },
    chartData: (v) => {
      const principal = Math.max(0, v.price - v.down);
      const r = v.rate / 100 / 12;
      const n = v.years * 12;
      const m = monthlyPayment(principal, v.rate, v.years);
      const points: ChartPoint[] = [];
      let balance = principal;
      let totalInterest = 0;
      for (let yr = 0; yr <= v.years; yr += 5) {
        if (yr > 0) {
          for (let mo = 0; mo < 5 * 12 && balance > 0; mo++) {
            const int = balance * r;
            totalInterest += int;
            balance -= (m - int);
          }
        }
        points.push({ label: `Yr ${yr}`, value: Math.round(Math.max(0, balance)), interest: Math.round(totalInterest) });
      }
      return points;
    },
  },
  "auto-loan": {
    intro: "Estimate the monthly payment for a car loan.",
    fields: [
      { key: "price", label: "Vehicle Price", type: "currency", default: 35000 },
      { key: "down", label: "Down Payment", type: "currency", default: 5000 },
      { key: "rate", label: "Interest Rate", type: "percent", default: 7 },
      { key: "years", label: "Term", type: "number", default: 5, suffix: "yrs" },
    ],
    compute: (v) => {
      const principal = Math.max(0, v.price - v.down);
      const m = monthlyPayment(principal, v.rate, v.years);
      return [
        { label: "Monthly Payment", value: usd2(m), highlight: true },
        { label: "Total Interest", value: usd(m * v.years * 12 - principal) },
        { label: "Total Cost", value: usd(m * v.years * 12 + v.down) },
        { label: "Loan Amount", value: usd(principal) },
      ];
    },
  },
  "personal-loan": {
    intro: "Calculate payments and total cost of a personal loan.",
    fields: [
      { key: "amount", label: "Loan Amount", type: "currency", default: 15000 },
      { key: "rate", label: "Interest Rate", type: "percent", default: 11 },
      { key: "years", label: "Term", type: "number", default: 3, suffix: "yrs" },
    ],
    compute: (v) => {
      const m = monthlyPayment(v.amount, v.rate, v.years);
      return [
        { label: "Monthly Payment", value: usd2(m), highlight: true },
        { label: "Total Interest", value: usd(m * v.years * 12 - v.amount) },
        { label: "Total Repaid", value: usd(m * v.years * 12) },
      ];
    },
  },
  "student-loan": {
    intro: "Estimate student loan repayment and total cost.",
    fields: [
      { key: "amount", label: "Loan Balance", type: "currency", default: 30000 },
      { key: "rate", label: "Interest Rate", type: "percent", default: 5.5 },
      { key: "years", label: "Repayment Term", type: "number", default: 10, suffix: "yrs" },
    ],
    compute: (v) => {
      const m = monthlyPayment(v.amount, v.rate, v.years);
      return [
        { label: "Monthly Payment", value: usd2(m), highlight: true },
        { label: "Total Interest", value: usd(m * v.years * 12 - v.amount) },
        { label: "Total Paid", value: usd(m * v.years * 12) },
      ];
    },
  },
  "credit-card-payoff": {
    intro: "See how long it takes to pay off a credit card balance.",
    fields: [
      { key: "balance", label: "Card Balance", type: "currency", default: 5000 },
      { key: "apr", label: "APR", type: "percent", default: 22 },
      { key: "payment", label: "Monthly Payment", type: "currency", default: 200 },
    ],
    compute: (v) => {
      const r = v.apr / 100 / 12;
      if (v.payment <= v.balance * r) return [{ label: "Error", value: "Payment too low to cover interest", highlight: true }];
      const months = r === 0 ? v.balance / v.payment : Math.ceil(Math.log(v.payment / (v.payment - v.balance * r)) / Math.log(1 + r));
      const totalPaid = v.payment * months;
      return [
        { label: "Months to Pay Off", value: `${months} months`, highlight: true },
        { label: "Total Interest", value: usd(totalPaid - v.balance) },
        { label: "Total Paid", value: usd(totalPaid) },
      ];
    },
  },
  "debt-payoff": {
    intro: "Calculate how long it takes to become debt-free.",
    fields: [
      { key: "debt", label: "Total Debt", type: "currency", default: 20000 },
      { key: "rate", label: "Average Interest Rate", type: "percent", default: 15 },
      { key: "payment", label: "Monthly Payment", type: "currency", default: 600 },
    ],
    compute: (v) => {
      const r = v.rate / 100 / 12;
      if (v.payment <= v.debt * r) return [{ label: "Error", value: "Payment too low", highlight: true }];
      const months = r === 0 ? v.debt / v.payment : Math.ceil(Math.log(v.payment / (v.payment - v.debt * r)) / Math.log(1 + r));
      const totalPaid = v.payment * months;
      return [
        { label: "Months to Debt-Free", value: `${months} months`, highlight: true },
        { label: "Debt-Free Date", value: `~${new Date(Date.now() + months * 30 * 86400000).toLocaleDateString("en-US", { month: "short", year: "numeric" })}` },
        { label: "Total Interest", value: usd(totalPaid - v.debt) },
        { label: "Total Paid", value: usd(totalPaid) },
      ];
    },
  },
  "loan-amortization": {
    intro: "Full amortization breakdown for any loan.",
    fields: [
      { key: "amount", label: "Loan Amount", type: "currency", default: 200000 },
      { key: "rate", label: "Interest Rate", type: "percent", default: 6 },
      { key: "years", label: "Term", type: "number", default: 30, suffix: "yrs" },
    ],
    compute: (v) => {
      const m = monthlyPayment(v.amount, v.rate, v.years);
      const total = m * v.years * 12;
      return [
        { label: "Monthly Payment", value: usd2(m), highlight: true },
        { label: "Total Interest", value: usd(total - v.amount) },
        { label: "Total Paid", value: usd(total) },
        { label: "Principal", value: usd(v.amount) },
        { label: "Interest % of Total", value: pct(((total - v.amount) / total) * 100) },
      ];
    },
  },
  refinance: {
    intro: "Compare your current loan to a refinanced option.",
    fields: [
      { key: "balance", label: "Current Loan Balance", type: "currency", default: 200000 },
      { key: "currentRate", label: "Current Rate", type: "percent", default: 7.5 },
      { key: "newRate", label: "New Rate", type: "percent", default: 6.0 },
      { key: "yearsLeft", label: "Years Remaining", type: "number", default: 25, suffix: "yrs" },
      { key: "closingCosts", label: "Closing Costs", type: "currency", default: 3000 },
    ],
    compute: (v) => {
      const mCurrent = monthlyPayment(v.balance, v.currentRate, v.yearsLeft);
      const mNew = monthlyPayment(v.balance, v.newRate, v.yearsLeft);
      const savings = mCurrent - mNew;
      const breakeven = savings > 0 ? Math.ceil(v.closingCosts / savings) : 0;
      return [
        { label: "Monthly Savings", value: usd2(savings), highlight: true },
        { label: "Breakeven", value: savings > 0 ? `${breakeven} months` : "N/A" },
        { label: "Current Payment", value: usd2(mCurrent) },
        { label: "New Payment", value: usd2(mNew) },
        { label: "Total Savings (over life)", value: usd(savings * v.yearsLeft * 12 - v.closingCosts) },
      ];
    },
  },
  "savings-goal": {
    intro: "Calculate how much to save monthly to hit your target.",
    fields: [
      { key: "goal", label: "Savings Goal", type: "currency", default: 20000 },
      { key: "current", label: "Current Savings", type: "currency", default: 2000 },
      { key: "months", label: "Months", type: "number", default: 24, suffix: "mo" },
      { key: "rate", label: "Interest Rate", type: "percent", default: 4 },
    ],
    compute: (v) => {
      const r = v.rate / 100 / 12;
      const fvCurrent = v.current * Math.pow(1 + r, v.months);
      const remaining = v.goal - fvCurrent;
      const monthly = remaining <= 0 ? 0 : r === 0 ? remaining / v.months : remaining * r / (Math.pow(1 + r, v.months) - 1);
      return [
        { label: "Monthly Savings Needed", value: usd2(monthly), highlight: true },
        { label: "Goal Amount", value: usd(v.goal) },
        { label: "Already Saved", value: usd(v.current) },
        { label: "Remaining to Save", value: usd(Math.max(0, remaining)) },
      ];
    },
  },
  "emergency-fund": {
    intro: "Calculate how much to keep in your emergency fund.",
    fields: [
      { key: "monthly", label: "Monthly Expenses", type: "currency", default: 4000 },
      { key: "months", label: "Months of Coverage", type: "number", default: 6, suffix: "mo" },
    ],
    compute: (v) => {
      const fund = v.monthly * v.months;
      return [
        { label: "Emergency Fund Target", value: usd(fund), highlight: true },
        { label: "Monthly Expenses", value: usd(v.monthly) },
        { label: "Months of Coverage", value: `${v.months} months` },
      ];
    },
  },
  "budget-50-30-20": {
    intro: "Split your income into needs, wants, and savings using the 50/30/20 rule.",
    fields: [{ key: "income", label: "Monthly After-Tax Income", type: "currency", default: 5000 }],
    compute: (v) => [
      { label: "Needs (50%)", value: usd(v.income * 0.5), highlight: true },
      { label: "Wants (30%)", value: usd(v.income * 0.3) },
      { label: "Savings/Debt (20%)", value: usd(v.income * 0.2) },
    ],
  },
  "net-worth": {
    intro: "Calculate your net worth: assets minus liabilities.",
    fields: [
      { key: "cash", label: "Cash & Savings", type: "currency", default: 15000 },
      { key: "investments", label: "Investments", type: "currency", default: 50000 },
      { key: "property", label: "Property Value", type: "currency", default: 300000 },
      { key: "other", label: "Other Assets", type: "currency", default: 5000 },
      { key: "mortgage", label: "Mortgage Balance", type: "currency", default: 200000 },
      { key: "loans", label: "Other Loans", type: "currency", default: 10000 },
      { key: "creditCards", label: "Credit Card Debt", type: "currency", default: 3000 },
    ],
    compute: (v) => {
      const assets = v.cash + v.investments + v.property + v.other;
      const liabilities = v.mortgage + v.loans + v.creditCards;
      return [
        { label: "Net Worth", value: usd(assets - liabilities), highlight: true },
        { label: "Total Assets", value: usd(assets) },
        { label: "Total Liabilities", value: usd(liabilities) },
        { label: "Debt-to-Asset Ratio", value: pct((liabilities / assets) * 100) },
      ];
    },
  },
  "fire-number": {
    intro: "Calculate how much you need to retire early (FIRE).",
    fields: [
      { key: "annual", label: "Annual Expenses", type: "currency", default: 50000 },
      { key: "swr", label: "Safe Withdrawal Rate", type: "percent", default: 4 },
    ],
    compute: (v) => {
      const fire = v.annual / (v.swr / 100);
      return [
        { label: "FIRE Number", value: usd(fire), highlight: true },
        { label: "Annual Expenses", value: usd(v.annual) },
        { label: "Monthly Expenses", value: usd(v.annual / 12) },
        { label: "25x Rule Check", value: usd(v.annual * 25), hint: "Traditional 25x multiplier" },
      ];
    },
  },
  inflation: {
    intro: "See how inflation erodes purchasing power over time.",
    fields: [
      { key: "amount", label: "Current Amount", type: "currency", default: 10000 },
      { key: "rate", label: "Inflation Rate", type: "percent", default: 3 },
      { key: "years", label: "Years", type: "number", default: 20, suffix: "yrs" },
    ],
    compute: (v) => {
      const future = v.amount * Math.pow(1 + v.rate / 100, v.years);
      const loss = future - v.amount;
      return [
        { label: `Value Needed in ${Math.round(v.years)} yrs`, value: usd(future), highlight: true },
        { label: "Purchasing Power Loss", value: usd(loss) },
        { label: "Today's Value in Future", value: usd(v.amount / Math.pow(1 + v.rate / 100, v.years)) },
      ];
    },
  },
  "savings-interest": {
    intro: "Calculate interest earned on a savings account.",
    fields: [
      { key: "principal", label: "Initial Deposit", type: "currency", default: 10000 },
      { key: "rate", label: "Annual Rate", type: "percent", default: 4.5 },
      { key: "years", label: "Years", type: "number", default: 3, suffix: "yrs" },
    ],
    compute: (v) => {
      const amount = v.principal * Math.pow(1 + v.rate / 100, v.years);
      return [
        { label: "Balance After Period", value: usd(amount), highlight: true },
        { label: "Interest Earned", value: usd(amount - v.principal) },
        { label: "Monthly Interest", value: usd((amount - v.principal) / (v.years * 12)) },
      ];
    },
  },
  "tiktok-money": {
    intro: "Estimate your TikTok earnings based on views and CPM.",
    fields: [
      { key: "views", label: "Monthly Views", type: "number", default: 1000000 },
      { key: "cpm", label: "CPM ($)", type: "currency", default: 0.025 },
    ],
    compute: (v) => {
      const monthly = (v.views / 1000) * v.cpm;
      return [
        { label: "Monthly Earnings", value: usd2(monthly), highlight: true },
        { label: "Annual Earnings", value: usd(monthly * 12) },
        { label: "Per 1M Views", value: usd2((1000000 / 1000) * v.cpm) },
        { label: "Views per $1", value: num(1 / ((v.cpm / 1000) || 0.001), 0) },
      ];
    },
  },
  "youtube-money": {
    intro: "Estimate YouTube ad revenue from your video views.",
    fields: [
      { key: "views", label: "Monthly Views", type: "number", default: 100000 },
      { key: "rpm", label: "RPM ($)", type: "currency", default: 3.5 },
    ],
    compute: (v) => {
      const monthly = (v.views / 1000) * v.rpm;
      return [
        { label: "Monthly Revenue", value: usd2(monthly), highlight: true },
        { label: "Annual Revenue", value: usd(monthly * 12) },
        { label: "Per 1M Views", value: usd2((1000000 / 1000) * v.rpm) },
        { label: "Views per $100", value: num((100 / v.rpm) * 1000, 0) },
      ];
    },
  },
  "instagram-earnings": {
    intro: "Estimate Instagram sponsored post earnings.",
    fields: [
      { key: "followers", label: "Followers", type: "number", default: 50000 },
      { key: "engRate", label: "Engagement Rate", type: "percent", default: 3 },
      { key: "posts", label: "Sponsored Posts / Month", type: "number", default: 2 },
    ],
    compute: (v) => {
      const ratePerPost = (v.followers / 1000) * 10 * (v.engRate / 3);
      return [
        { label: "Estimated Rate / Post", value: usd(ratePerPost), highlight: true },
        { label: "Monthly Income", value: usd(ratePerPost * v.posts) },
        { label: "Annual Income", value: usd(ratePerPost * v.posts * 12) },
      ];
    },
  },
  "twitch-income": {
    intro: "Estimate Twitch earnings from subscribers and bits.",
    fields: [
      { key: "subs", label: "Active Subscribers", type: "number", default: 500 },
      { key: "bitsMonth", label: "Bits Per Month", type: "number", default: 50000 },
      { key: "adHours", label: "Streaming Hours / Month", type: "number", default: 80 },
    ],
    compute: (v) => {
      const subIncome = v.subs * 2.5;
      const bitsIncome = v.bitsMonth * 0.01;
      const adIncome = v.adHours * 1.5;
      const total = subIncome + bitsIncome + adIncome;
      return [
        { label: "Monthly Income", value: usd2(total), highlight: true },
        { label: "Subscriber Revenue", value: usd2(subIncome) },
        { label: "Bits Revenue", value: usd2(bitsIncome) },
        { label: "Ad Revenue (est.)", value: usd2(adIncome) },
        { label: "Annual Income", value: usd(total * 12) },
      ];
    },
  },
  "freelance-rate": {
    intro: "Calculate your required hourly rate from your income goal.",
    fields: [
      { key: "annual", label: "Target Annual Income", type: "currency", default: 80000 },
      { key: "hoursPerWeek", label: "Billable Hours / Week", type: "number", default: 30, suffix: "hrs" },
      { key: "weeksPerYear", label: "Working Weeks / Year", type: "number", default: 48, suffix: "wks" },
      { key: "overhead", label: "Overhead & Expenses", type: "currency", default: 5000 },
    ],
    compute: (v) => {
      const totalNeeded = v.annual + v.overhead;
      const hours = v.hoursPerWeek * v.weeksPerYear;
      const hourly = hours > 0 ? totalNeeded / hours : 0;
      return [
        { label: "Required Hourly Rate", value: usd2(hourly), highlight: true },
        { label: "Daily Rate (8 hrs)", value: usd(hourly * 8) },
        { label: "Total Needed", value: usd(totalNeeded) },
        { label: "Annual Billable Hours", value: `${num(hours, 0)} hrs` },
      ];
    },
  },
  patreon: {
    intro: "Estimate your monthly Patreon income.",
    fields: [
      { key: "patrons", label: "Number of Patrons", type: "number", default: 100 },
      { key: "avgPledge", label: "Avg Monthly Pledge ($)", type: "currency", default: 10 },
      { key: "fee", label: "Platform Fee", type: "percent", default: 8 },
    ],
    compute: (v) => {
      const gross = v.patrons * v.avgPledge;
      const net = gross * (1 - v.fee / 100);
      return [
        { label: "Monthly Net Income", value: usd2(net), highlight: true },
        { label: "Gross Revenue", value: usd2(gross) },
        { label: "Platform Fee", value: usd2(gross - net) },
        { label: "Annual Income", value: usd(net * 12) },
      ];
    },
  },
  "affiliate-profit": {
    intro: "Calculate earnings from your affiliate marketing campaigns.",
    fields: [
      { key: "price", label: "Product Price", type: "currency", default: 100 },
      { key: "commission", label: "Commission Rate", type: "percent", default: 30 },
      { key: "sales", label: "Monthly Sales Volume", type: "number", default: 50 },
    ],
    compute: (v) => {
      const perSale = v.price * (v.commission / 100);
      const monthly = perSale * v.sales;
      return [
        { label: "Monthly Earnings", value: usd2(monthly), highlight: true },
        { label: "Per Sale Commission", value: usd2(perSale) },
        { label: "Annual Earnings", value: usd(monthly * 12) },
        { label: "Total Sales Volume", value: usd(v.price * v.sales) },
      ];
    },
  },
  "crypto-profit": {
    intro: "Calculate profit or loss from buying and selling cryptocurrency.",
    fields: [
      { key: "buyPrice", label: "Buy Price", type: "currency", default: 30000 },
      { key: "sellPrice", label: "Sell Price", type: "currency", default: 50000 },
      { key: "amount", label: "Amount (coins)", type: "number", default: 1, step: 0.001 },
      { key: "fee", label: "Trading Fee", type: "percent", default: 0.5 },
    ],
    compute: (v) => {
      const invested = v.buyPrice * v.amount;
      const received = v.sellPrice * v.amount;
      const fees = (invested + received) * (v.fee / 100);
      const profit = received - invested - fees;
      return [
        { label: "Net Profit", value: usd2(profit), highlight: true },
        { label: "ROI", value: pct((profit / invested) * 100) },
        { label: "Amount Invested", value: usd(invested) },
        { label: "Amount Received", value: usd(received) },
        { label: "Trading Fees", value: usd2(fees) },
      ];
    },
  },
  "staking-rewards": {
    intro: "Estimate annual staking rewards from crypto assets.",
    fields: [
      { key: "amount", label: "Staked Amount ($)", type: "currency", default: 10000 },
      { key: "apr", label: "Staking APR", type: "percent", default: 6 },
      { key: "compoundFreq", label: "Compound Frequency / Year", type: "number", default: 365 },
    ],
    compute: (v) => {
      const apy = Math.pow(1 + v.apr / 100 / v.compoundFreq, v.compoundFreq) - 1;
      const annual = v.amount * apy;
      return [
        { label: "Annual Rewards", value: usd2(annual), highlight: true },
        { label: "Effective APY", value: pct(apy * 100) },
        { label: "Monthly Rewards", value: usd2(annual / 12) },
        { label: "Daily Rewards", value: usd2(annual / 365) },
      ];
    },
  },
  "bitcoin-dca": {
    intro: "Project Bitcoin DCA results over time.",
    fields: [
      { key: "monthly", label: "Monthly Investment", type: "currency", default: 200 },
      { key: "currentPrice", label: "Current BTC Price", type: "currency", default: 60000 },
      { key: "years", label: "Years", type: "number", default: 4, suffix: "yrs" },
      { key: "targetPrice", label: "Target BTC Price", type: "currency", default: 200000 },
    ],
    compute: (v) => {
      const months = v.years * 12;
      const totalInvested = v.monthly * months;
      const coinsAcquired = v.monthly / v.currentPrice * months;
      const futureValue = coinsAcquired * v.targetPrice;
      return [
        { label: "Future Value (at target)", value: usd(futureValue), highlight: true },
        { label: "BTC Accumulated", value: `${coinsAcquired.toFixed(6)} BTC` },
        { label: "Total Invested", value: usd(totalInvested) },
        { label: "Potential ROI", value: pct(((futureValue - totalInvested) / totalInvested) * 100) },
      ];
    },
  },
  "mining-profit": {
    intro: "Estimate daily crypto mining profit after electricity costs.",
    fields: [
      { key: "hashrate", label: "Hashrate (TH/s)", type: "number", default: 100 },
      { key: "power", label: "Power Usage (W)", type: "number", default: 3000 },
      { key: "electricRate", label: "Electricity ($/kWh)", type: "currency", default: 0.1 },
      { key: "dailyRevenue", label: "Daily Revenue ($)", type: "currency", default: 15 },
    ],
    compute: (v) => {
      const dailyCost = (v.power / 1000) * 24 * v.electricRate;
      const dailyProfit = v.dailyRevenue - dailyCost;
      return [
        { label: "Daily Profit", value: usd2(dailyProfit), highlight: true },
        { label: "Monthly Profit", value: usd(dailyProfit * 30) },
        { label: "Daily Electricity Cost", value: usd2(dailyCost) },
        { label: "Daily Revenue", value: usd2(v.dailyRevenue) },
        { label: "Annual Profit", value: usd(dailyProfit * 365) },
      ];
    },
  },
  "crypto-portfolio": {
    intro: "Calculate total portfolio value from your holdings.",
    fields: [
      { key: "btc", label: "BTC Holdings", type: "number", default: 0.5, step: 0.001 },
      { key: "btcPrice", label: "BTC Price ($)", type: "currency", default: 60000 },
      { key: "eth", label: "ETH Holdings", type: "number", default: 5, step: 0.01 },
      { key: "ethPrice", label: "ETH Price ($)", type: "currency", default: 3000 },
      { key: "other", label: "Other Holdings ($)", type: "currency", default: 2000 },
    ],
    compute: (v) => {
      const btcVal = v.btc * v.btcPrice;
      const ethVal = v.eth * v.ethPrice;
      const total = btcVal + ethVal + v.other;
      return [
        { label: "Total Portfolio Value", value: usd(total), highlight: true },
        { label: "Bitcoin Value", value: usd(btcVal) },
        { label: "Ethereum Value", value: usd(ethVal) },
        { label: "Other Assets", value: usd(v.other) },
      ];
    },
  },
  "profit-margin": {
    intro: "Calculate profit margin and markup from revenue and costs.",
    fields: [
      { key: "revenue", label: "Revenue", type: "currency", default: 10000 },
      { key: "costs", label: "Total Costs", type: "currency", default: 6000 },
    ],
    compute: (v) => {
      const profit = v.revenue - v.costs;
      const margin = (profit / v.revenue) * 100;
      const markup = (profit / v.costs) * 100;
      return [
        { label: "Net Profit", value: usd(profit), highlight: true },
        { label: "Profit Margin", value: pct(margin) },
        { label: "Markup", value: pct(markup) },
        { label: "Revenue", value: usd(v.revenue) },
        { label: "Costs", value: usd(v.costs) },
      ];
    },
  },
  "break-even": {
    intro: "Find how many units you need to sell to cover your costs.",
    fields: [
      { key: "fixedCosts", label: "Fixed Costs", type: "currency", default: 10000 },
      { key: "pricePerUnit", label: "Price Per Unit", type: "currency", default: 50 },
      { key: "variableCost", label: "Variable Cost / Unit", type: "currency", default: 20 },
    ],
    compute: (v) => {
      const contribution = v.pricePerUnit - v.variableCost;
      const units = contribution > 0 ? Math.ceil(v.fixedCosts / contribution) : 0;
      return [
        { label: "Break-Even Units", value: `${num(units, 0)} units`, highlight: true },
        { label: "Break-Even Revenue", value: usd(units * v.pricePerUnit) },
        { label: "Contribution Margin", value: usd2(contribution) },
        { label: "Contribution Margin %", value: pct((contribution / v.pricePerUnit) * 100) },
      ];
    },
  },
  markup: {
    intro: "Calculate selling price from cost and desired markup.",
    fields: [
      { key: "cost", label: "Cost Price", type: "currency", default: 50 },
      { key: "markup", label: "Markup", type: "percent", default: 50 },
    ],
    compute: (v) => {
      const price = v.cost * (1 + v.markup / 100);
      const profit = price - v.cost;
      return [
        { label: "Selling Price", value: usd2(price), highlight: true },
        { label: "Profit per Unit", value: usd2(profit) },
        { label: "Profit Margin", value: pct((profit / price) * 100) },
      ];
    },
  },
  "ltv-cac": {
    intro: "Calculate customer lifetime value to acquisition cost ratio.",
    fields: [
      { key: "avgRevenue", label: "Avg Monthly Revenue / Customer", type: "currency", default: 100 },
      { key: "grossMargin", label: "Gross Margin", type: "percent", default: 70 },
      { key: "churn", label: "Monthly Churn Rate", type: "percent", default: 5 },
      { key: "cac", label: "Customer Acquisition Cost", type: "currency", default: 500 },
    ],
    compute: (v) => {
      const ltv = (v.avgRevenue * (v.grossMargin / 100)) / (v.churn / 100);
      const ratio = ltv / v.cac;
      return [
        { label: "LTV : CAC Ratio", value: `${ratio.toFixed(1)} : 1`, highlight: true },
        { label: "Customer LTV", value: usd(ltv) },
        { label: "CAC", value: usd(v.cac) },
        { label: "Payback Period", value: `${Math.ceil(v.cac / (v.avgRevenue * v.grossMargin / 100))} months` },
      ];
    },
  },
  discount: {
    intro: "Calculate final price after applying a discount.",
    fields: [
      { key: "original", label: "Original Price", type: "currency", default: 200 },
      { key: "discount", label: "Discount", type: "percent", default: 25 },
    ],
    compute: (v) => {
      const savings = v.original * (v.discount / 100);
      return [
        { label: "Final Price", value: usd2(v.original - savings), highlight: true },
        { label: "You Save", value: usd2(savings) },
        { label: "Discount Amount", value: pct(v.discount) },
      ];
    },
  },
  "invoice-total": {
    intro: "Calculate invoice total with tax and optional discount.",
    fields: [
      { key: "subtotal", label: "Subtotal", type: "currency", default: 1000 },
      { key: "taxRate", label: "Tax Rate", type: "percent", default: 8.5 },
      { key: "discount", label: "Discount", type: "percent", default: 0 },
    ],
    compute: (v) => {
      const discounted = v.subtotal * (1 - v.discount / 100);
      const tax = discounted * (v.taxRate / 100);
      return [
        { label: "Invoice Total", value: usd2(discounted + tax), highlight: true },
        { label: "Subtotal", value: usd2(v.subtotal) },
        { label: "Discount", value: usd2(v.subtotal - discounted) },
        { label: "Tax", value: usd2(tax) },
      ];
    },
  },
};
