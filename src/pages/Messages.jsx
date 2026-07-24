import React, { useState, useEffect, useRef } from "react";
import { useOutletContext, useNavigate, useSearchParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import EmptyState from "@/components/ui/EmptyState";
import { Image } from "@/components/ui/image";
import { ArrowLeft, Send, MessagesSquare, Flag, ShieldAlert } from "lucide-react";
import { checkContent } from "@/lib/moderation";
import { canDo } from "@/lib/rateLimit";

// Canonical conversation id helper: find an existing conversation between two users.
function otherParticipant(conv, meId) {
  return conv.participant_a_id === meId ? conv.participant_b_id : conv.participant_a_id;
}

export default function Messages() {
  const { user, profile } = useOutletContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [otherProfile, setOtherProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const targetUserId = params.get("u");

  useEffect(() => {
    const load = async () => {
      try {
        const convs = await base44.entities.Conversation.list("-last_message_at");
        setConversations(convs);
        if (targetUserId && targetUserId !== user.id) {
          await openOrCreateWith(targetUserId, convs);
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  useEffect(() => {
    if (!activeConv) return;
    const loadThread = async () => {
      const msgs = await base44.entities.DirectMessage.filter({ conversation_id: activeConv.id }, "created_date");
      setMessages(msgs);
      const otherId = otherParticipant(activeConv, user.id);
      try {
        const p = await base44.entities.Profile.filter({ user_id: otherId });
        setOtherProfile(p[0] || null);
      } catch { setOtherProfile(null); }
    };
    loadThread();
  }, [activeConv, user.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openOrCreateWith = async (otherId, convs) => {
    let conv = convs.find((c) => otherParticipant(c, user.id) === otherId);
    if (!conv) {
      // Opt-in check: both users must allow messages.
      let otherP;
      try { const r = await base44.entities.Profile.filter({ user_id: otherId }); otherP = r[0]; } catch { otherP = null; }
      if (!profile?.allow_messages) {
        toast({ title: "Enable messages first", description: "Turn on messaging in your profile to start a conversation.", variant: "destructive" });
        return;
      }
      if (!otherP?.allow_messages) {
        toast({ title: "Messaging not available", description: "This user hasn't enabled messages.", variant: "destructive" });
        return;
      }
      const a = [user.id, otherId].sort()[0];
      const b = [user.id, otherId].sort()[1];
      conv = await base44.entities.Conversation.create({ participant_a_id: a, participant_b_id: b, last_message_at: new Date().toISOString() });
      setConversations((c) => [conv, ...c]);
    }
    setActiveConv(conv);
    setParams({}, { replace: true });
  };

  const handleSend = async () => {
    if (!text.trim() || !activeConv) return;
    const check = checkContent(text);
    if (check.blocked) { toast({ title: "Message blocked", description: check.reason, variant: "destructive" }); return; }
    const rl = canDo("message");
    if (!rl.ok) { toast({ title: "Please wait a moment", description: `Try again in ${rl.wait}s.`, variant: "destructive" }); return; }
    setSending(true);
    const otherId = otherParticipant(activeConv, user.id);
    const msg = await base44.entities.DirectMessage.create({ conversation_id: activeConv.id, sender_id: user.id, recipient_id: otherId, body: text });
    await base44.entities.Conversation.update(activeConv.id, { last_message_at: new Date().toISOString() });
    setMessages((m) => [...m, msg]);
    setText("");
    setSending(false);
  };

  const handleReport = async (msg) => {
    const rl = canDo("flag");
    if (!rl.ok) { toast({ title: "Please wait a moment", description: `Try again in ${rl.wait}s.`, variant: "destructive" }); return; }
    await base44.entities.DirectMessage.update(msg.id, { reported: true });
    await base44.entities.SentMessage.create({
      user_id: user.id,
      message_type: "flag_message",
      subject: "Reported direct message",
      body: `A direct message was reported for review.\n\nContent: ${msg.body}`,
      related_id: msg.id,
      related_opportunity_id: null,
    });
    setMessages((m) => m.map((x) => (x.id === msg.id ? { ...x, reported: true } : x)));
    toast({ title: "Reported to admins", description: "Thank you — our team will review this message." });
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-sage border-t-navy rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Messages</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Private, opt-in conversations. Report anything that feels unsafe.</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {profile?.allow_messages ? <span className="px-2 py-1 rounded-full bg-sage/10 text-sage font-medium">Messages on</span> : <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">Messages off</span>}
        </div>
      </div>

      {!profile?.allow_messages && (
        <div className="bg-amber/10 rounded-2xl p-4 mb-4 flex items-start gap-3 border border-amber/20">
          <ShieldAlert className="w-5 h-5 text-amber shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Messaging is turned off</p>
            <p className="text-muted-foreground mt-0.5">Enable “Allow messages” in your <Link to="/profile" className="text-navy underline">profile</Link> to start private conversations with students you follow.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
        {/* Conversation list */}
        <div className={`${activeConv ? "hidden md:block" : "block"}`}>
          {conversations.length === 0 ? (
            <EmptyState icon={MessagesSquare} title="No conversations yet" description="Tap “Message” on a community profile to start a private thread." />
          ) : (
            <div className="space-y-2">
              {conversations.map((c) => {
                const oId = otherParticipant(c, user.id);
                return (
                  <button key={c.id} onClick={() => { setActiveConv(c); }} className={`w-full text-left p-3 rounded-xl border transition-all ${activeConv?.id === c.id ? "bg-navy text-white border-navy" : "bg-card border-border/50 hover:border-navy/30"}`}>
                    <span className="text-sm font-medium">Student</span>
                    <span className="block text-xs opacity-70">{oId === user.id ? "You" : "Tap to open"}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Thread */}
        <div className={`${activeConv ? "block" : "hidden md:block"}`}>
          {!activeConv ? (
            <div className="hidden md:flex items-center justify-center h-64 text-sm text-muted-foreground">Select a conversation</div>
          ) : (
            <div className="bg-card rounded-2xl border border-border/50 flex flex-col h-[60vh]">
              <div className="flex items-center gap-3 p-4 border-b border-border/50">
                <button onClick={() => setActiveConv(null)} className="md:hidden text-muted-foreground"><ArrowLeft className="w-4 h-4" /></button>
                <div className="w-9 h-9 rounded-full bg-sage/20 flex items-center justify-center shrink-0">
                  <span className="text-sage font-semibold text-sm">{(otherProfile?.full_name || "S")[0]}</span>
                </div>
                <div>
                  <p className="font-medium text-sm">{otherProfile?.full_name || "Student"}</p>
                  <p className="text-xs text-muted-foreground">{otherProfile?.school || "DMV"}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No messages yet. Say salaam 👋</p>}
                {messages.map((m) => {
                  const mine = m.sender_id === user.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-navy text-white" : "bg-muted text-foreground"}`}>
                        <p className="whitespace-pre-line break-words">{m.body}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] ${mine ? "text-white/60" : "text-muted-foreground"}`}>{new Date(m.created_date).toLocaleString([], { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}</span>
                          {!mine && (
                            <button onClick={() => handleReport(m)} disabled={m.reported} className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-0.5">
                              <Flag className="w-2.5 h-2.5" /> {m.reported ? "Reported" : "Report"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="p-3 border-t border-border/50 flex gap-2">
                <Textarea rows={1} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Type a message…" className="rounded-xl flex-1 resize-none" />
                <Button onClick={handleSend} disabled={sending || !text.trim()} className="bg-navy hover:bg-navy/90 text-white rounded-xl shrink-0"><Send className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
