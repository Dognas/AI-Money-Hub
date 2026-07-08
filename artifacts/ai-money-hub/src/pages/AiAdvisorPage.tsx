import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import { SponsoredSlot } from "@/components/SponsoredSlot";
import { ThemeProvider, useTheme } from "@/lib/useTheme";
import { useAuth } from "@/lib/useAuth";
import { aiApi, profileApi, type AiMessage, type UserProfile } from "@/lib/api";

const SUGGESTED_PROMPTS = [
  "What's my financial health score?",
  "How can I pay off debt faster?",
  "How much do I need to retire at 55?",
  "What should I invest $500/month in?",
  "Help me build a budget plan",
  "Calculate my FIRE number",
  "How do I build an emergency fund?",
  "Should I pay off debt or invest?",
];

function MarkdownText({ text, dark }: { text: string; dark: boolean }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="font-bold text-emerald-400">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

function MessageBubble({ msg, dark }: { msg: AiMessage & { streaming?: boolean }; dark: boolean }) {
  const isAI = msg.role === "assistant";
  const lines = msg.content.split("\n").filter((l, i, arr) => !(l === "" && arr[i - 1] === ""));

  return (
    <div className={`flex gap-3 mb-5 ${isAI ? "items-start" : "items-start flex-row-reverse"}`}>
      {isAI && (
        <div className="w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center text-sm btn-gradient shadow-lg font-bold">AI</div>
      )}
      {!isAI && (
        <div className={`w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center text-sm font-bold ${dark ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-700"}`}>
          You
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isAI
          ? dark ? "bg-gray-800 text-gray-100 border border-gray-700" : "bg-white text-gray-800 border border-gray-100 shadow-sm"
          : "text-white btn-gradient"
      }`}>
        {lines.map((line, i) => {
          if (line.startsWith("## ")) {
            return <p key={i} className="font-black text-base mb-2 mt-3 first:mt-0">{line.slice(3)}</p>;
          }
          if (line.startsWith("• ") || line.startsWith("- ")) {
            return (
              <div key={i} className="flex gap-2 mb-1">
                <span className="text-emerald-400 flex-shrink-0 mt-0.5">•</span>
                <span><MarkdownText text={line.slice(2)} dark={dark} /></span>
              </div>
            );
          }
          if (line === "") return <div key={i} className="h-2" />;
          return <p key={i} className="mb-1"><MarkdownText text={line} dark={dark} /></p>;
        })}
        {(msg as any).streaming && (
          <span className="inline-flex gap-0.5 ml-1">
            <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
        )}
      </div>
    </div>
  );
}

function ProfileSnippet({ profile, dark }: { profile: UserProfile | null; dark: boolean }) {
  if (!profile || !profile.monthlyIncome) return null;
  const sr = profile.monthlyIncome > 0 && profile.monthlySavings
    ? Math.round((profile.monthlySavings / profile.monthlyIncome) * 100) : null;
  return (
    <div className={`rounded-xl border p-3 mb-4 ${dark ? "border-gray-700 bg-gray-800/50" : "border-gray-100 bg-gray-50"}`}>
      <p className="text-xs font-semibold text-emerald-500 mb-2">📊 Your Profile Context (AI sees this)</p>
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Income", value: `$${profile.monthlyIncome?.toLocaleString()}/mo` },
          { label: "Savings Rate", value: sr != null ? `${sr}%` : "—" },
          { label: "Debt", value: profile.totalDebt ? `$${profile.totalDebt?.toLocaleString()}` : "None" },
          { label: "Score", value: profile.healthScore ? `${profile.healthScore}/100` : "—" },
        ].map((m) => (
          <div key={m.label} className={`text-xs px-2 py-1 rounded-lg ${dark ? "bg-gray-700" : "bg-white border border-gray-100"}`}>
            <span className="text-gray-400">{m.label}: </span>
            <span className={`font-bold ${dark ? "text-white" : "text-gray-800"}`}>{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdvisorContent() {
  const { dark } = useTheme();
  const { user, isAuthenticated, login } = useAuth();
  const [messages, setMessages] = useState<(AiMessage & { streaming?: boolean })[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (!isAuthenticated) { setLoadingHistory(false); return; }
    Promise.all([
      aiApi.getConversation().then((c) => { if (c.messages.length) setMessages(c.messages); }),
      profileApi.get().then(setProfile).catch(() => {}),
    ]).finally(() => setLoadingHistory(false));
  }, [isAuthenticated]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;
    const userMsg: AiMessage = { role: "user", content: text.trim(), ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const placeholder: AiMessage & { streaming: boolean } = { role: "assistant", content: "", ts: Date.now(), streaming: true };
    setMessages((prev) => [...prev, placeholder]);
    setIsStreaming(true);

    await aiApi.streamChat(
      text.trim(),
      (chunk) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            updated[updated.length - 1] = { ...last, content: last.content + chunk };
          }
          return updated;
        });
      },
      () => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            const { streaming: _, ...clean } = last as AiMessage & { streaming?: boolean };
            updated[updated.length - 1] = clean;
          }
          return updated;
        });
        setIsStreaming(false);
      },
      (err) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: `Sorry, there was an error: ${err}`, ts: Date.now() };
          return updated;
        });
        setIsStreaming(false);
      }
    );
  }, [isStreaming]);

  const clearChat = async () => {
    await aiApi.clearConversation();
    setMessages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  return (
    <div className={`min-h-screen flex flex-col ${dark ? "bg-gray-950" : "bg-gradient-to-br from-slate-50 to-emerald-50/30"}`}>
      <Navbar />
      <div className="max-w-4xl mx-auto w-full flex flex-col flex-1 px-4 sm:px-6 py-6" style={{ height: "calc(100vh - 64px)" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl btn-gradient flex items-center justify-center text-white font-black text-sm shadow-lg">AI</div>
            <div>
              <h1 className={`text-xl font-black ${dark ? "text-white" : "text-gray-900"}`}>Money97 AI™</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-xs text-emerald-500 font-medium">Your Elite Financial Advisor</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && messages.length > 0 && (
              <button onClick={clearChat} className={`text-xs px-3 py-1.5 rounded-xl border transition-colors ${dark ? "border-gray-700 text-gray-400 hover:bg-gray-800" : "border-gray-200 text-gray-500 hover:bg-gray-100"}`}>
                Clear
              </button>
            )}
            <Link href="/profile" className="text-xs px-3 py-1.5 rounded-xl border text-emerald-500 border-emerald-400/30 hover:bg-emerald-400/10 transition-colors">
              My Profile
            </Link>
          </div>
        </div>

        {/* Main chat area */}
        {!isAuthenticated ? (
          <div className={`flex-1 flex flex-col items-center justify-center rounded-2xl border ${dark ? "border-gray-800 bg-gray-900/50" : "border-gray-100 bg-white"}`}>
            <div className="text-center max-w-sm px-6">
              <div className="w-16 h-16 rounded-3xl btn-gradient flex items-center justify-center text-white font-black text-xl mx-auto mb-4 shadow-xl">AI</div>
              <h2 className={`text-xl font-black mb-2 ${dark ? "text-white" : "text-gray-900"}`}>Meet Your AI Financial Advisor</h2>
              <p className={`text-sm mb-6 ${dark ? "text-gray-400" : "text-gray-500"}`}>
                Sign in to unlock personalised financial coaching with real AI. Money97 AI™ knows your profile and gives advice based on your actual numbers.
              </p>
              <button onClick={login} className="btn-gradient text-white font-bold px-8 py-3 rounded-2xl text-sm shadow-lg hover:opacity-90 transition-all">
                Sign in to Start
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Profile snippet */}
            <ProfileSnippet profile={profile} dark={dark} />

            {/* Messages */}
            <div className={`flex-1 overflow-y-auto rounded-2xl border p-4 sm:p-5 mb-4 ${dark ? "bg-gray-900/60 border-gray-800" : "bg-white/80 border-gray-100 shadow-sm"}`}>
              {loadingHistory ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-3xl btn-gradient flex items-center justify-center text-white font-black text-xl mb-4 shadow-xl">AI</div>
                  <h3 className={`text-lg font-black mb-2 ${dark ? "text-white" : "text-gray-900"}`}>
                    Hello{user?.firstName ? `, ${user.firstName}` : ""}! 👋
                  </h3>
                  <p className={`text-sm mb-6 max-w-xs ${dark ? "text-gray-400" : "text-gray-500"}`}>
                    I'm your elite AI financial advisor. Ask me anything about your finances — I give real, personalised advice based on your profile.
                  </p>
                  <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                    {SUGGESTED_PROMPTS.slice(0, 4).map((p) => (
                      <button key={p} onClick={() => send(p)}
                        className={`text-xs px-3 py-2.5 rounded-xl text-left border transition-all hover:scale-[1.02] hover:border-emerald-400/50 ${dark ? "border-gray-700 bg-gray-800 text-gray-300" : "border-gray-100 bg-gray-50 text-gray-700"}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <MessageBubble key={i} msg={msg} dark={dark} />
                  ))}
                  <div ref={endRef} />
                </>
              )}
            </div>

            {/* Suggested prompts (shown after first message) */}
            {messages.length > 0 && !isStreaming && (
              <div className="flex gap-2 flex-wrap mb-3">
                {SUGGESTED_PROMPTS.slice(4).map((p) => (
                  <button key={p} onClick={() => send(p)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${dark ? "border-gray-700 text-gray-400 hover:border-emerald-500/50 hover:text-emerald-400" : "border-gray-200 text-gray-600 hover:border-emerald-400/50 hover:text-emerald-600 bg-white"}`}>
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className={`rounded-2xl border p-3 flex-shrink-0 ${dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200 shadow-sm"}`}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
                placeholder="Ask anything about your finances... (Enter to send, Shift+Enter for new line)"
                rows={2}
                className={`w-full outline-none text-sm resize-none bg-transparent mb-2 ${dark ? "text-white placeholder-gray-500" : "text-gray-800 placeholder-gray-400"}`}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">Powered by Claude Sonnet • Context-aware</p>
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim() || isStreaming}
                  className="btn-gradient text-white font-bold text-sm px-5 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90"
                >
                  {isStreaming ? "Thinking..." : "Send →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sponsored slot: inert until confirmed Banner/Native ad script wired in */}
        <div className="mt-6">
          <SponsoredSlot adcashZoneId="11635502" />
        </div>
      </div>
    </div>
  );
}

export default function AiAdvisorPage() {
  return (
    <ThemeProvider>
      <AdvisorContent />
    </ThemeProvider>
  );
}
