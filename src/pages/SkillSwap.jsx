import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import EmptyState from "@/components/ui/EmptyState";
import { Repeat, Plus, ArrowRightLeft, CheckCircle2, Flag } from "lucide-react";

export default function SkillSwap() {
  const { user } = useOutletContext();
  const { toast } = useToast();
  const [listings, setListings] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [reqOpen, setReqOpen] = useState(null);
  const [form, setForm] = useState({ skill_offered: "", skill_wanted: "", description: "" });
  const [reqMsg, setReqMsg] = useState("");

  const load = async () => {
    const [all, mine, inc] = await Promise.all([
      base44.entities.SkillSwap.list("-created_date"),
      base44.entities.SkillSwapRequest.filter({ requester_id: user.id }),
      base44.entities.SkillSwapRequest.filter({ listing_user_id: user.id }),
    ]);
    setListings(all);
    setMyRequests(mine);
    setIncoming(inc.filter(r => r.status === "pending"));
    setLoading(false);
  };
  useEffect(() => { load(); }, [user.id]);

  const handleCreate = async () => {
    if (!form.skill_offered || !form.skill_wanted) return;
    await base44.entities.SkillSwap.create({ user_id: user.id, ...form });
    setForm({ skill_offered: "", skill_wanted: "", description: "" });
    setOpen(false);
    load();
    toast({ title: "Listing posted" });
  };

  const handleRequest = async (listing) => {
    await base44.entities.SkillSwapRequest.create({ listing_id: listing.id, listing_user_id: listing.user_id, requester_id: user.id, message: reqMsg });
    setReqOpen(null); setReqMsg("");
    load();
    toast({ title: "Request sent" });
  };

  const handleAccept = async (req, listing) => {
    await base44.entities.SkillSwapRequest.update(req.id, { status: "accepted" });
    await base44.entities.SkillSwap.update(listing.id, { status: "accepted", partner_user_id: req.requester_id });
    setIncoming(incoming.filter(r => r.id !== req.id));
    load();
    toast({ title: "Swap accepted" });
  };

  const handleDecline = async (req) => {
    await base44.entities.SkillSwapRequest.update(req.id, { status: "declined" });
    setIncoming(incoming.filter(r => r.id !== req.id));
    toast({ title: "Request declined" });
  };

  const handleComplete = async (listing) => {
    await base44.entities.SkillSwap.update(listing.id, { status: "completed" });
    load();
    toast({ title: "Marked complete" });
  };

  const handleReport = async (listing) => {
    await base44.entities.SentMessage.create({ user_id: user.id, message_type: "feedback", recipient_type: "admin", subject: "Skill swap report", body: `Reported listing: "${listing.skill_offered} for ${listing.skill_wanted}"`, related_id: listing.id });
    toast({ title: "Reported to admins" });
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-sage border-t-navy rounded-full animate-spin" /></div>;

  const openListings = listings.filter(l => l.status === "open" && l.user_id !== user.id);
  const myListings = listings.filter(l => l.user_id === user.id);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Skill Swap</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Trade skills with peers — no money, just knowledge</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-navy hover:bg-navy/90 text-white rounded-xl"><Plus className="w-4 h-4 mr-1.5" /> New Listing</Button></DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle className="font-heading">Post a Skill Swap</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div><Label className="text-sm mb-1 block">Skill you offer *</Label><Input className="rounded-xl" value={form.skill_offered} onChange={e => setForm(f => ({ ...f, skill_offered: e.target.value }))} placeholder="e.g. Calculus help" /></div>
              <div><Label className="text-sm mb-1 block">Skill you want *</Label><Input className="rounded-xl" value={form.skill_wanted} onChange={e => setForm(f => ({ ...f, skill_wanted: e.target.value }))} placeholder="e.g. Arabic practice" /></div>
              <div><Label className="text-sm mb-1 block">Details</Label><Textarea className="rounded-xl" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Availability, format (in-person/online), etc." /></div>
              <Button onClick={handleCreate} className="w-full bg-navy hover:bg-navy/90 text-white rounded-xl">Post Listing</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {myListings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Your Listings</h2>
          <div className="space-y-3">
            {myListings.map(l => (
              <div key={l.id} className="bg-card rounded-2xl p-4 border border-border/50">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">{l.skill_offered}</span>
                    <ArrowRightLeft className="w-3 h-3 inline mx-1.5 text-muted-foreground" />
                    <span className="font-medium">{l.skill_wanted}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${l.status === "completed" ? "bg-emerald/10 text-emerald" : l.status === "accepted" ? "bg-sage/10 text-sage" : "bg-muted text-muted-foreground"}`}>{l.status}</span>
                </div>
                {l.description && <p className="text-xs text-muted-foreground mt-1">{l.description}</p>}
                {l.status === "accepted" && <Button size="sm" variant="outline" className="rounded-xl mt-3" onClick={() => handleComplete(l)}><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Complete</Button>}
              </div>
            ))}
          </div>
        </div>
      )}

      {incoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Requests for Your Listings</h2>
          <div className="space-y-3">
            {incoming.map(req => {
              const listing = listings.find(l => l.id === req.listing_id);
              return (
                <div key={req.id} className="bg-card rounded-2xl p-4 border border-border/50">
                  <p className="text-sm font-medium">{listing ? `${listing.skill_offered} ⇄ ${listing.skill_wanted}` : "Swap request"}</p>
                  {req.message && <p className="text-xs text-muted-foreground mt-1">{req.message}</p>}
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="bg-navy hover:bg-navy/90 text-white rounded-xl" onClick={() => handleAccept(req, listing)}>Accept</Button>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => handleDecline(req)}>Decline</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {openListings.length === 0 ? (
        <EmptyState icon={Repeat} title="No open swaps" description="Be the first to post a skill you can teach in exchange for one you want to learn." />
      ) : (
        <div>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Open Swaps</h2>
          <div className="space-y-3">
            {openListings.map(l => (
              <div key={l.id} className="bg-card rounded-2xl p-4 border border-border/50">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">{l.skill_offered}</span>
                    <ArrowRightLeft className="w-3 h-3 inline mx-1.5 text-muted-foreground" />
                    <span className="font-medium">{l.skill_wanted}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => handleReport(l)}><Flag className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" className="bg-navy hover:bg-navy/90 text-white rounded-xl" onClick={() => setReqOpen(l)}>Request</Button>
                  </div>
                </div>
                {l.description && <p className="text-xs text-muted-foreground mt-1">{l.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!reqOpen} onOpenChange={set => !set && setReqOpen(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle className="font-heading">Request Swap</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <Textarea className="rounded-xl" rows={3} placeholder="Introduce yourself and propose how the swap would work" value={reqMsg} onChange={e => setReqMsg(e.target.value)} />
            <Button onClick={() => handleRequest(reqOpen)} disabled={!reqMsg} className="w-full bg-navy hover:bg-navy/90 text-white rounded-xl">Send Request</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
