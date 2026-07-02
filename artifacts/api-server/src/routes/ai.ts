import { Router, type IRouter } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { db, aiConversationsTable, userProfilesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const SYSTEM_PROMPT = `You are Money97 AI™ — an elite, world-class AI financial advisor built into the AI Money Hub platform. You combine the expertise of a CFA (Chartered Financial Analyst), a certified financial planner, and a behavioral finance coach.

Your personality:
- Professional yet warm and encouraging
- Concise and actionable — never vague
- Numbers-driven: always back advice with specific figures
- Culturally aware of international finance (not US-only)
- Motivating: celebrate wins, reframe challenges positively

Your capabilities:
- Analyse the user's complete financial profile (provided in context)
- Give specific, personalised advice based on their real numbers
- Explain complex financial concepts in plain language
- Recommend specific calculators on the platform when relevant
- Build actionable monthly plans
- Help with: budgeting, investing, debt payoff, retirement, FIRE, tax efficiency, emergency funds

Available calculators to recommend by name:
Savings, Compound Interest, Investment Growth, Mortgage, Rent vs Buy, Down Payment, 
Retirement, 401k, FIRE Number, Social Security, Debt Payoff, Credit Card Payoff,
Debt Consolidation, Budget 50/30/20, Net Worth, Cash Flow, Emergency Fund,
DCA (Dollar-Cost Averaging), ROI, Stock Returns, Salary, Raise, Freelance Rate,
Business Profit, Break-Even, Markup, Tax (Income), Tax (Capital Gains), Tax (Self-Employment),
VAT, Tip Calculator, Savings Goal, Loan, Car Loan, Student Loan, Personal Finance Score,
Currency Converter, Inflation, Gold Returns, Bitcoin Returns

Rules:
- NEVER give generic advice. Always tie it to the user's specific numbers.
- If you don't have their profile data, ask for the one key number you need.
- Keep responses under 300 words unless a detailed breakdown is explicitly requested.
- Use markdown formatting: **bold** for key numbers, bullet points for lists, ## for section headers if needed.
- Always end with one specific next action the user can take today.`;

router.post("/ai/chat", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { message } = req.body as { message: string };
  if (!message?.trim()) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  // Load user profile for context
  const [profile] = await db
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.id, req.user.id));

  // Load or create conversation
  const [existingConv] = await db
    .select()
    .from(aiConversationsTable)
    .where(eq(aiConversationsTable.userId, req.user.id))
    .orderBy(desc(aiConversationsTable.updatedAt))
    .limit(1);

  const history = existingConv?.messages ?? [];

  // Build profile context string
  const profileCtx = profile
    ? `\n\nUser Financial Profile:
- Age: ${profile.age ?? "unknown"}
- Country: ${profile.country ?? "unknown"}
- Monthly Income: ${profile.monthlyIncome ? `$${profile.monthlyIncome.toLocaleString()}` : "unknown"}
- Monthly Expenses: ${profile.monthlyExpenses ? `$${profile.monthlyExpenses.toLocaleString()}` : "unknown"}
- Monthly Savings: ${profile.monthlySavings ? `$${profile.monthlySavings.toLocaleString()}` : "unknown"}
- Total Debt: ${profile.totalDebt ? `$${profile.totalDebt.toLocaleString()}` : "none"}
- Total Savings: ${profile.totalSavings ? `$${profile.totalSavings.toLocaleString()}` : "unknown"}
- Total Investments: ${profile.totalInvestments ? `$${profile.totalInvestments.toLocaleString()}` : "unknown"}
- Financial Goal: ${profile.financialGoal ?? "not set"}
- Risk Tolerance: ${profile.riskTolerance ?? "unknown"}
- Financial Health Score: ${profile.healthScore ?? "not calculated"}/100`
    : "\n\nUser Profile: Not yet completed.";

  // Build messages for Claude
  const chatMessages: Anthropic.MessageParam[] = [
    ...history.slice(-20).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  try {
    const client = getClient();
    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: SYSTEM_PROMPT + profileCtx,
      messages: chatMessages,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        fullResponse += event.delta.text;
        res.write(
          `data: ${JSON.stringify({ content: event.delta.text })}\n\n`,
        );
      }
    }

    // Save conversation
    const newHistory = [
      ...history,
      { role: "user" as const, content: message, ts: Date.now() },
      { role: "assistant" as const, content: fullResponse, ts: Date.now() },
    ].slice(-100); // keep last 100 messages

    if (existingConv) {
      await db
        .update(aiConversationsTable)
        .set({ messages: newHistory })
        .where(eq(aiConversationsTable.id, existingConv.id));
    } else {
      await db.insert(aiConversationsTable).values({
        userId: req.user.id,
        messages: newHistory,
      });
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "AI chat error");
    res.write(`data: ${JSON.stringify({ error: "AI service error" })}\n\n`);
    res.end();
  }
});

router.get("/ai/conversation", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [conv] = await db
    .select()
    .from(aiConversationsTable)
    .where(eq(aiConversationsTable.userId, req.user.id))
    .orderBy(desc(aiConversationsTable.updatedAt))
    .limit(1);

  res.json({
    conversationId: conv?.id ?? null,
    messages: conv?.messages ?? [],
  });
});

router.delete("/ai/conversation", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  await db
    .delete(aiConversationsTable)
    .where(eq(aiConversationsTable.userId, req.user.id));
  res.json({ success: true });
});

export default router;
