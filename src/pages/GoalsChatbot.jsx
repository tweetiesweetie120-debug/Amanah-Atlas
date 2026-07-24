import React, { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import EmptyState from "@/components/ui/EmptyState";
import { Sparkles, Send, Trash2, Flag, ShieldAlert, Bot, User } from "lucide-react";

const SAFETY_BANNER = "This is an AI goal-coach — not a human. It won't store anything beyond your thread. For emergencies or self-harm, reach a trusted adult or 988 (Suicide & Crisis Lifeline).";
const SENSITIVE = ["suicide", "kill myself", "self-harm", "hurt myself", "abuse", "assault", "end my life", "want to die"];

export default function GoalsChatbot() {
  const { user } = useOutletContext();
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    base44.entities.ChatMessage.filter({ user_id: user.id }, "created_date").then(m => { setMessages(m); setLoading(false); });
  }, [user.id]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const buildPrompt = (history, userMsg) => {
    const convo = history.map(m => `${m.role === "user" ? "Student" : "Coach"}: ${m.content}`).join("\n");
    return `You are Amanah Atlas, a goal-coach AI for Muslim high school girls in the DMV area. You are NOT a human. You help turn goals into concrete next steps for school planning, service/volunteer planning, and college prep. You can suggest types of volunteer opportunities and help draft resume bullet points.

Rules:
- Be concise, warm, practical, and non-judgmental.
- Never pretend to be human. Never give medical, mental-health, or legal diagnoses.
- If the student mentions self-harm, abuse, harassment, or crisis, do NOT counsel them. Immediately encourage talking to a trusted adult (parent, teacher, counselor, imam) and share the 988 Suicide & Crisis Lifeline. Keep it brief and caring.
- Keep replies under 150 words unless drafting a resume bullet.

Conversation so far:
${convo}

Student: ${userMsg}
Coach:`;
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    if (SENSITIVE.some(s => userMsg.toLowerCase().includes(s))) setShowResources(true);

    const userRec = await base44.entities.ChatMessage.create({ user_id: user.id, role: "user", content: userMsg });
    const newHistory = [...messages, userRec];
    setMessages(newHistory);
    setInput("");
    setSending(true);

    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt: buildPrompt(messages, userMsg) });
      const reply = typeof res === "string" ? res : res?.response || JSON.stringify(res);
      const aiRec = await base44.entities.ChatMessage.create({ user_id: user.id, role: "assistant", content: reply });
      setMessages([...newHistory, aiRec]);
    } catch {
      toast({ title: "Couldn't get a response", description: "Please try again.", variant: "destructive" });
    }
    setSending(false);
  };

  const handleDeleteThread = async () => {
    await base44.entities.ChatMessage.deleteMany({ user_id: user.id });
    setMessages([]);
    toast({ title: "Thread deleted" });
  };

  const handleReport = async () => {
    await base44.entities.SentMessage.create({ user_id: user.id, message_type: "feedback", recipient_type: "admin", subject: "Chatbot report", body: "User reported a concern about the goals chatbot." });
    toast({ title: "Report sent to admins" });
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-sage border-t-navy rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center"><Sparkles className="w-5 h-5 text-sage" /></div>
          <div>
            <h1 className="font-heading text-xl font-bold leading-tight">Goals Coach</h1>
            <p className="text-xs text-muted-foreground">AI assistant · not a human</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={handleReport} title="Report a concern"><Flag className="w-4 h-4 text-muted-foreground" /></Button>
          <Button variant="ghost" size="icon" onClick={handleDeleteThread} title="Delete thread"><Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" /></Button>
        </div>
      </div>

      <div className="bg-amber/10 border border-amber/30 rounded-xl px-3 py-2 mb-3 flex gap-2">
        <ShieldAlert className="w-4 h-4 text-amber shrink-0 mt-0.5" />
        <p className="text-xs text-amber">{SAFETY_BANNER}</p>
      </div>

      {showResources && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3">
          <p className="text-xs text-red-700">You matter. Please reach a trusted adult now, or call/text <strong>988</strong> (Suicide & Crisis Lifeline, 24/7). If you're in immediate danger, call 911.</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 ? (
          <EmptyState icon={Sparkles} title="Share a goal to begin" description="e.g. 'I want to earn 75 SSL hours this year and build a college resume.' Your coach turns it into next steps." />
        ) : messages.map(m => (
          <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && <div className="w-7 h-7 rounded-lg bg-navy/10 flex items-center justify-center shrink-0"><Bot className="w-4 h-4 text-navy" /></div>}
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-navy text-white" : "bg-card border border-border/50"}`}>
              <p className="whitespace-pre-line leading-relaxed">{m.content}</p>
            </div>
            {m.role === "user" && <div className="w-7 h-7 rounded-lg bg-sage/20 flex items-center justify-center shrink-0"><User className="w-4 h-4 text-sage" /></div>}
          </div>
        ))}
        {sending && <div className="flex gap-2"><div className="w-7 h-7 rounded-lg bg-navy/10 flex items-center justify-center"><Bot className="w-4 h-4 text-navy animate-pulse" /></div><div className="bg-card border border-border/50 rounded-2xl px-3 py-2 text-sm text-muted-foreground">Thinking…</div></div>}
        <div ref={scrollRef} />
      </div>

      <div className="flex gap-2 mt-3">
        <Textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} rows={1} placeholder="Share a goal or ask for next steps…" className="rounded-xl resize-none" />
        <Button onClick={handleSend} disabled={sending || !input.trim()} className="bg-navy hover:bg-navy/90 text-white rounded-xl shrink-0"><Send className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}
