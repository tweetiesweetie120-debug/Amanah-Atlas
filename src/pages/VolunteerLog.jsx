import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import EmptyState from "@/components/ui/EmptyState";
import { Plus, Clock, CheckCircle2, Timer, XCircle, ClipboardList, Upload, Trash2, Award, ShieldAlert, Calendar, Download } from "lucide-react";
import { jsPDF } from "jspdf";

export default function VolunteerLog() {
  const { user } = useOutletContext();
  const { toast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ opportunity_title: "", organization_name: "", date: "", hours: "", task_description: "", notes: "" });

  useEffect(() => {
    base44.entities.VolunteerLog.filter({ user_id: user.id }, "-created_date").then(l => { setLogs(l); setLoading(false); });
  }, [user.id]);

  const totalLogged = logs.reduce((s, l) => s + (l.hours || 0), 0);
  const verified = logs.filter(l => l.status === "verified").reduce((s, l) => s + (l.hours || 0), 0);
  const pending = logs.filter(l => l.status === "pending").reduce((s, l) => s + (l.hours || 0), 0);
  const now = new Date();
  const thisMonth = logs.filter(l => {
    if (!l.date) return false;
    const d = new Date(l.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, l) => s + (l.hours || 0), 0);
  const badges = [];
  if (verified >= 25) badges.push("25 Hour Club");
  if (verified >= 50) badges.push("50 Hour Scholar");
  if (verified >= 75) badges.push("75 Hour Leader");
  if (verified >= 100) badges.push("100 Hour Champion");

  const handleCertificate = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Certificate of Service", 105, 35, { align: "center" });
    doc.setDrawColor(150, 180, 130);
    doc.setLineWidth(0.8);
    doc.line(45, 42, 165, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    doc.text(`This certifies that`, 105, 58, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(user?.full_name || "Student", 105, 70, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    doc.text(`has completed ${verified} verified volunteer service hours`, 105, 82, { align: "center" });
    doc.text(`through Amanah Atlas as of ${new Date().toLocaleDateString()}.`, 105, 92, { align: "center" });
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text("Verified record maintained by Amanah Atlas. This certificate reflects admin-verified hours only.", 105, 120, { align: "center" });
    doc.save("amanah-atlas-certificate.pdf");
  };

  const handleDelete = async (log) => {
    if (log.status === "verified") {
      await base44.entities.SentMessage.create({
        user_id: user.id, message_type: "contact", recipient_type: "admin",
        subject: `Correction request: ${log.opportunity_title}`,
        body: `Requesting review of a verified log entry (${log.hours}h on ${log.date} at ${log.organization_name}). Reason for correction: please describe. Log ID: ${log.id}`,
        related_id: log.id,
      });
      toast({ title: "Correction request sent", description: "Verified hours need admin review to change." });
      return;
    }
    await base44.entities.VolunteerLog.delete(log.id);
    setLogs(logs.filter(l => l.id !== log.id));
    toast({ title: "Entry deleted" });
  };

  const handleSubmit = async () => {
    if (!form.opportunity_title || !form.organization_name || !form.date || !form.hours) return;
    setSaving(true);
    const log = await base44.entities.VolunteerLog.create({ ...form, hours: parseFloat(form.hours), user_id: user.id });
    setLogs([log, ...logs]);
    setForm({ opportunity_title: "", organization_name: "", date: "", hours: "", task_description: "", notes: "" });
    setOpen(false);
    setSaving(false);
    toast({ title: "Hours logged!", description: "Your entry is pending verification." });
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-sage border-t-navy rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Volunteer Hours</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track and manage your service hours</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-navy hover:bg-navy/90 text-white rounded-xl">
              <Plus className="w-4 h-4 mr-1.5" /> Log Hours
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle className="font-heading">Log Volunteer Hours</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-sm mb-1 block">Opportunity Name *</Label>
                <Input className="rounded-xl" value={form.opportunity_title} onChange={e => setForm(f => ({ ...f, opportunity_title: e.target.value }))} placeholder="e.g. Library Reading Program" />
              </div>
              <div>
                <Label className="text-sm mb-1 block">Organization *</Label>
                <Input className="rounded-xl" value={form.organization_name} onChange={e => setForm(f => ({ ...f, organization_name: e.target.value }))} placeholder="e.g. Montgomery County Public Libraries" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm mb-1 block">Date *</Label>
                  <Input type="date" className="rounded-xl" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-sm mb-1 block">Hours *</Label>
                  <Input type="number" step="0.5" min="0.5" className="rounded-xl" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} placeholder="e.g. 3" />
                </div>
              </div>
              <div>
                <Label className="text-sm mb-1 block">What did you do?</Label>
                <Textarea className="rounded-xl" value={form.task_description} onChange={e => setForm(f => ({ ...f, task_description: e.target.value }))} placeholder="Brief description of your tasks" rows={3} />
              </div>
              <Button onClick={handleSubmit} disabled={saving} className="w-full bg-navy hover:bg-navy/90 text-white rounded-xl">
                {saving ? "Saving..." : "Log Hours"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-card rounded-2xl p-4 border border-border/50 text-center">
          <CheckCircle2 className="w-5 h-5 text-emerald mx-auto mb-1" />
          <p className="text-2xl font-bold">{verified}</p>
          <p className="text-xs text-muted-foreground">Verified</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border/50 text-center">
          <Timer className="w-5 h-5 text-amber mx-auto mb-1" />
          <p className="text-2xl font-bold">{pending}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border/50 text-center">
          <Clock className="w-5 h-5 text-navy mx-auto mb-1" />
          <p className="text-2xl font-bold">{totalLogged}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border/50 text-center">
          <Calendar className="w-5 h-5 text-sage mx-auto mb-1" />
          <p className="text-2xl font-bold">{thisMonth}</p>
          <p className="text-xs text-muted-foreground">This Month</p>
        </div>
      </div>

      {badges.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Award className="w-4 h-4 text-amber" />
          {badges.map(b => (
            <span key={b} className="text-xs px-2.5 py-1 rounded-full bg-amber/10 text-amber font-medium">{b}</span>
          ))}
        </div>
      )}

      {verified > 0 && (
        <div className="mb-6">
          <Button onClick={handleCertificate} variant="outline" className="rounded-xl">
            <Download className="w-4 h-4 mr-1.5" /> Download Certificate
          </Button>
        </div>
      )}

      {/* Logs */}
      {logs.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No hours logged yet" description="Start tracking your volunteer service by logging your first hours." />
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="bg-card rounded-xl p-4 border border-border/50 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{log.opportunity_title}</p>
                <p className="text-xs text-muted-foreground">{log.organization_name} · {log.date}</p>
                {log.task_description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{log.task_description}</p>}
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                <span className="text-sm font-semibold">{log.hours}h</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  log.status === "verified" ? "bg-emerald/10 text-emerald" :
                  log.status === "rejected" ? "bg-red-50 text-red-600" :
                  "bg-amber/10 text-amber"
                }`}>{log.status}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" title={log.status === "verified" ? "Request correction" : "Delete"} onClick={() => handleDelete(log)}>
                  {log.status === "verified" ? <ShieldAlert className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
