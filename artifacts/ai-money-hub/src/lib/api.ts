const BASE = "/api";

export async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...opts?.headers },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export type ApiUser = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
};

export type UserProfile = {
  id: string;
  age?: number | null;
  country?: string | null;
  currency?: string | null;
  monthlyIncome?: number | null;
  monthlyExpenses?: number | null;
  monthlySavings?: number | null;
  totalDebt?: number | null;
  totalSavings?: number | null;
  totalInvestments?: number | null;
  retirementAge?: number | null;
  riskTolerance?: string | null;
  financialGoal?: string | null;
  healthScore?: number | null;
};

export type CalcHistoryItem = {
  id: number;
  userId: string;
  calcId: string;
  calcName: string;
  inputs: Record<string, unknown>;
  results: Record<string, unknown>;
  isFavorite: string;
  createdAt: string;
};

export type AiMessage = { role: "user" | "assistant"; content: string; ts: number };

export const authApi = {
  getUser: () => apiFetch<{ user: ApiUser | null }>("/auth/user"),
  login: () => { window.location.href = "/api/login?returnTo=/"; },
  logout: () => { window.location.href = "/api/logout"; },
};

export const profileApi = {
  get: () => apiFetch<UserProfile>("/profile"),
  upsert: (data: Partial<UserProfile>) =>
    apiFetch<UserProfile>("/profile", { method: "PUT", body: JSON.stringify(data) }),
};

export const historyApi = {
  list: (limit = 50) => apiFetch<CalcHistoryItem[]>(`/calc-history?limit=${limit}`),
  save: (data: { calcId: string; calcName: string; inputs: Record<string, unknown>; results: Record<string, unknown> }) =>
    apiFetch<CalcHistoryItem>("/calc-history", { method: "POST", body: JSON.stringify(data) }),
};

export const aiApi = {
  getConversation: () => apiFetch<{ conversationId: number | null; messages: AiMessage[] }>("/ai/conversation"),
  clearConversation: () => apiFetch<{ success: true }>("/ai/conversation", { method: "DELETE" }),
  streamChat: async (
    message: string,
    onChunk: (text: string) => void,
    onDone: () => void,
    onError: (err: string) => void
  ) => {
    const res = await fetch(`${BASE}/ai/chat`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!res.ok || !res.body) {
      onError("Failed to connect to AI");
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const data = JSON.parse(line.slice(6));
          if (data.content) onChunk(data.content);
          if (data.done) onDone();
          if (data.error) onError(data.error);
        } catch {}
      }
    }
  },
};
