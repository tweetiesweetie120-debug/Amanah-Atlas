import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import EmptyState from "@/components/ui/EmptyState";
import { Target, Plus, Users, CheckCircle2, Calendar } from "lucide-react";

const CATEGORIES = ["Academic", "Service", "Personal growth", "College prep", "Habits", "Spiritual"];

export default function GoalExchange() {
  const { user } = useOutletContext();
  const { toast } = useToast();
  const [myGoals, setMyGoals] = useState([]);
  const [pool, setPool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ goal: "", category: "Academic" });
  const [checkin, setCheckin] = useState({});

  const load = async () => {
    const [mine, seeking] = await Promise.all([
      base44.entities.GoalExchange.filter({ user_id: user.id }, "-created_date"),
      base44.entities.GoalExchange.filter({ status: "seeking" }, "-created_date"),
    ]);
    setMyGoals(mine);
    setPool(seeking.filter(g => g.user_id !== user.id));
    setLoading(false);
  };
  useEffect(() => { load(); }, [user.id]);

  const handleCreate = async () => {
    if (!form.goal) return;
    await base44.entities.GoalExchange.create({ user_id: user.id, goal: form.goal, category: form.category });
    setForm({ goal: "", category: "Academic" });
    setOpen(false);
    load();
    toast({ title: "Goal posted — seeking a match" });
  };

  const handleMatch = async (goal) => {
    const candidates = pool.filter(g => g.goal.toLowerCase() !== goal.goal.toLowerCase());
    if (candidates.length === 0) { toast({ title: "No different-goal matches yet", description: "Check back soon." }); return; }
    const match = candidates[Math.floor(Math.random() * candidates.length)];
    await base44.entities.GoalExchange.update(goal.id, { status: "matched", matched_goal_id: match.id, matched_user_id: match.user_id });
    await base44.entities.GoalExchange.update(match.id, { status: "matched", matched_goal_id: goal.id, matched_user_id: user.id });
    load();
    toast({ title: "Matched!", description: "You're now accountability partners." });
  };

  const handleCheckin = async (goalId) => {
    const note = checkin[goalId];
    if (!note) return;
    const g = myGoals.find(x => x.id === goalId);
    await base44.entities.GoalExchange.update(goalId, {
      last_checkin_note: note,
      checkin_count: (g.checkin_count || 0) + 1,
      last_checkin_date: new Date().toISOString().slice(0, 10),
    });
    setCheckin(c => ({ ...c, [goalId]: "" }));
    load();
    toast({ title: "Check-in logged" });
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-sage border-t-navy rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Goal Exchange</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Anonymous accountability partners with different goals</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-navy hover:bg-navy/90 text-white rounded-xl"><Plus className="w-4 h-4 mr-1.5" /> New Goal</Button></DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle className="font-heading">Post a Goal</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div><Label className="text-sm mb-1 block">Goal *</Label><Input className="rounded-xl" value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))} placeholder="e.g. Finish 3 college essays by December" /></div>
              <div><Label className="text-sm mb-1 block">Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full bg-navy hover:bg-navy/90 text-white rounded-xl">Post Goal</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {myGoals.length === 0 ? (
        <EmptyState icon={Target} title="No goals yet" description="Post a goal to get matched with an accountability partner working on something different." />
      ) : (
        <div className="space-y-3">
          {myGoals.map(g => (
            <div key={g.id} className="bg-card rounded-2xl p-5 border border-border/50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-sage/10 text-sage font-medium">{g.category}</span>
                  <h3 className="font-medium mt-1">{g.goal}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {g.status === "matched" ? <span className="flex items-center gap-1 text-emerald"><Users className="w-3 h-3" /> Matched · {g.checkin_count || 0} check-ins</span> : "Seeking a match"}
                  </p>
                </div>
                {g.status === "seeking" && <Button size="sm" variant="outline" className="rounded-xl shrink-0" onClick={() => handleMatch(g)}>Find Match</Button>}
              </div>
              {g.status === "matched" && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <Label className="text-xs mb-1 block flex items-center gap-1"><Calendar className="w-3 h-3" /> Weekly check-in</Label>
                  <div className="flex gap-2">
                    <Input className="rounded-xl" placeholder="What progress did you make this week?" value={checkin[g.id] || ""} onChange={e => setCheckin(c => ({ ...c, [g.id]: e.target.value }))} />
                    <Button size="sm" className="bg-navy hover:bg-navy/90 text-white rounded-xl shrink-0" onClick={() => handleCheckin(g.id)}><CheckCircle2 className="w-4 h-4" /></Button>
                  </div>
                  {g.last_checkin_note && <p className="text-xs text-muted-foreground mt-2">Last: "{g.last_checkin_note}"</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
