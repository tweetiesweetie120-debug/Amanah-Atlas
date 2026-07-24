import React, { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import EmptyState from "@/components/ui/EmptyState";
import { Plus, Mail, Send, CheckCheck, Clock, Trash2, Building2, Shield } from "lucide-react";

const TYPE_STYLES = {
  flag_post: { label: "Flagged Post", color: "bg-red-50 text-red-600" },
  flag_reply: { label: "Flagged Reply", color: "bg-red-50 text-red-600" },
  flag_message: { label: "Flagged Message", color: "bg-red-50 text-red-600" },
  contact: { label: "Contact Admin", color: "bg-sage/10 text-sage" },
  feedback: { label: "Feedback", color: "bg-amber/10 text-amber" },
  outreach: { label: "Outreach", color: "bg-navy/5 text-navy" },
};

export default function SentMessages() {
  const { user } = useOutletContext();
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ subject: "", body: "", message_type: "contact" });

  useEffect(() => {
    base44.entities.SentMessage.filter({ user_id: user.id }, "-created_date").then(m => {
      setMessages(m.filter(x => x.status !== "hidden"));
      setLoading(false);
    });
  }, [user.id]);

  const handleSend = async () => {
    if (!form.subject || !form.body) return;
    setSaving(true);
    const msg = await base44.entities.SentMessage.create({ ...form, user_id: user.id, recipient_type: "admin" });
    setMessages([msg, ...messages]);
    setForm({ subject: "", body: "", message_type: "contact" });
    setOpen(false);
    setSaving(false);
    toast({ title: "Message sent", description: "Your message has been sent to the administrators." });
  };

  const handleDelete = async (id) => {
    await base44.entities.SentMessage.update(id, { status: "hidden" });
    setMessages(messages.filter(m => m.id !== id));
    toast({ title: "Removed from your view", description: "A record is kept for safety audits." });
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-sage border-t-navy rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Sent Messages</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Outreach to organizations and notes to administrators</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-navy hover:bg-navy/90 text-white rounded-xl"><Plus className="w-4 h-4 mr-1.5" /> New Message</Button></DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle className="font-heading">Message Administrators</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div><Label className="text-sm mb-1 block">Type</Label>
                <Select value={form.message_type} onValueChange={v => setForm(f => ({ ...f, message_type: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contact">Contact Admin</SelectItem>
                    <SelectItem value="feedback">Feedback / Suggestion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-sm mb-1 block">Subject *</Label><Input className="rounded-xl" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="What's this about?" /></div>
              <div><Label className="text-sm mb-1 block">Message *</Label><Textarea className="rounded-xl" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={4} placeholder="Write your message..." /></div>
              <Button onClick={handleSend} disabled={saving} className="w-full bg-navy hover:bg-navy/90 text-white rounded-xl">{saving ? "Sending..." : "Send Message"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {messages.length === 0 ? (
        <EmptyState icon={Mail} title="No messages yet" description="Outreach emails and notes to admins will appear here." />
      ) : (
        <div className="space-y-3">
          {messages.map(msg => {
            const style = TYPE_STYLES[msg.message_type] || TYPE_STYLES.contact;
            return (
              <div key={msg.id} className="bg-card rounded-2xl p-5 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${style.color}`}>{style.label}</span>
                  <span className={`text-xs flex items-center gap-1 ${msg.status === "read" ? "text-emerald" : "text-muted-foreground"}`}>
                    {msg.status === "read" ? <><CheckCheck className="w-3 h-3" /> Read</> : <><Clock className="w-3 h-3" /> Sent</>}
                  </span>
                </div>
                <h3 className="font-medium text-sm text-foreground mb-1">{msg.subject}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{msg.body}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {msg.recipient && (
                      <span className="flex items-center gap-1">{msg.recipient_type === "organization" ? <Building2 className="w-3 h-3" /> : <Shield className="w-3 h-3" />}{msg.recipient}</span>
                    )}
                    {msg.related_opportunity_id && <Link to={`/opportunities/${msg.related_opportunity_id}`} className="text-navy hover:underline">View opportunity</Link>}
                    <span>{new Date(msg.created_date).toLocaleString()}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(msg.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
