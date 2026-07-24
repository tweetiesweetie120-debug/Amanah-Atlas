import React, { useState, useEffect } from "react";
import { useParams, useOutletContext, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, MapPin, Clock, Calendar, ExternalLink, Shield, Award, Users, Home, Globe, Bookmark, BookmarkCheck, Send, Mail, MessageSquare, CalendarClock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { buildOutreachMailto, signUpUrl, moreInfoUrl, rateLimitedOutreach } from "@/lib/outreach";
import { canDo } from "@/lib/rateLimit";

const typeLabel = { internship: "Internship", job: "Career", ssl: "SSL", volunteer: "Volunteer", other: "Role" };

function DateRow({ label, value, unavailable }) {
  return (
    <div className="flex items-center justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
      <span className="text-muted-foreground flex items-center gap-1.5"><CalendarClock className="w-3.5 h-3.5" /> {label}</span>
      <span className={value ? "font-medium text-foreground" : "text-muted-foreground/70 italic"}>{value || (unavailable ? "Date unavailable" : "—")}</span>
    </div>
  );
}

export default function OpportunityDetail() {
  const { id } = useParams();
  const { user } = useOutletContext();
  const { toast } = useToast();
  const [opp, setOpp] = useState(null);
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminSending, setAdminSending] = useState(false);
  const [adminForm, setAdminForm] = useState({ subject: "", body: "" });

  useEffect(() => {
    const load = async () => {
      const [o, s, a] = await Promise.all([
        base44.entities.Opportunity.get(id),
        base44.entities.SavedOpportunity.filter({ user_id: user.id, opportunity_id: id }),
        base44.entities.Application.filter({ user_id: user.id, opportunity_id: id }),
      ]);
      setOpp(o);
      setSaved(s.length > 0);
      setApplied(a.length > 0);
      setAdminForm({ subject: `Question about: ${o.title}`, body: "" });
      setLoading(false);
    };
    load();
  }, [id, user.id]);

  const handleSave = async () => {
    if (saved) {
      const s = await base44.entities.SavedOpportunity.filter({ user_id: user.id, opportunity_id: id });
      if (s.length > 0) await base44.entities.SavedOpportunity.delete(s[0].id);
      setSaved(false);
    } else {
      await base44.entities.SavedOpportunity.create({ user_id: user.id, opportunity_id: id });
      setSaved(true);
    }
  };

  const handleApply = async () => {
    await base44.entities.Application.create({ user_id: user.id, opportunity_id: id, opportunity_title: opp.title, organization_name: opp.organization_name });
    setApplied(true);
    toast({ title: "Interest recorded", description: "Saved to your tracked opportunities." });
  };

  const handleMessageAdmin = async () => {
    if (!adminForm.subject || !adminForm.body) return;
    const rl = canDo("outreach");
    if (!rl.ok) { toast({ title: "Please wait a moment", description: `Try again in ${rl.wait}s.`, variant: "destructive" }); return; }
    setAdminSending(true);
    await base44.entities.SentMessage.create({
      user_id: user.id,
      message_type: "contact",
      recipient_type: "admin",
      recipient: "Amanah Atlas Admin",
      subject: adminForm.subject,
      body: adminForm.body,
      related_opportunity_id: id,
    });
    setAdminSending(false);
    setAdminOpen(false);
    setAdminForm({ subject: `Question about: ${opp.title}`, body: "" });
    toast({ title: "Message sent to admin", description: "Your question is recorded in Sent Messages." });
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-sage border-t-navy rounded-full animate-spin" /></div>;
  if (!opp) return <div className="text-center py-20"><p className="text-muted-foreground">Opportunity not found.</p></div>;

  const signUp = signUpUrl(opp);
  const moreInfo = moreInfoUrl(opp);
  const contactEmail = !!opp.contact_email;
  const mailto = buildOutreachMailto(opp, user?.full_name || "Student");

  const badgeList = [
    opp.ssl_approved && { label: "SSL Approved", icon: Award, color: "bg-emerald/10 text-emerald" },
    opp.youth_friendly && { label: "Youth-friendly", icon: Users, color: "bg-blue-50 text-blue-600" },
    opp.mosque_based && { label: "Mosque-based", icon: Home, color: "bg-purple-50 text-purple-600" },
    opp.family_safe && { label: "Family Safe", icon: Shield, color: "bg-green-50 text-green-700" },
    opp.women_led && { label: "Women-led", icon: Users, color: "bg-pink-50 text-pink-600" },
    opp.remote_allowed && { label: "Remote OK", icon: Globe, color: "bg-indigo-50 text-indigo-600" },
  ].filter(Boolean);

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/opportunities">
        <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground -ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to opportunities
        </Button>
      </Link>

      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap gap-2 mb-3">
            {opp.opportunity_type && opp.opportunity_type !== "volunteer" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gold/10 text-gold">{typeLabel[opp.opportunity_type]}</span>
            )}
            {opp.paid_or_unpaid && opp.paid_or_unpaid !== "unknown" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-sage/10 text-sage capitalize">{opp.paid_or_unpaid}</span>
            )}
            {badgeList.map((b) => (
              <span key={b.label} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${b.color}`}>
                <b.icon className="w-3.5 h-3.5" /> {b.label}
              </span>
            ))}
          </div>

          <h1 className="font-heading text-2xl font-bold text-foreground mb-1">{opp.title}</h1>
          <p className="text-muted-foreground">{opp.organization_name}</p>

          <div className="grid grid-cols-2 gap-3 mt-6">
            {opp.city && <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="w-4 h-4" /> {opp.city}, {opp.state} {opp.zip_code}</div>}
            {opp.remote_allowed && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Globe className="w-4 h-4" /> Remote</div>}
            {!opp.remote_allowed && opp.in_person_allowed && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Home className="w-4 h-4" /> In-person</div>}
            {opp.hours_needed && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="w-4 h-4" /> {opp.hours_needed} hours</div>}
          </div>

          {/* Dates */}
          <div className="mt-6 bg-muted/40 rounded-2xl p-4">
            <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Dates</h3>
            {opp.rolling_ongoing && <p className="text-sm font-medium text-emerald mb-2">Rolling / Ongoing</p>}
            <DateRow label="Application opens" value={opp.application_open} unavailable />
            <DateRow label="Application deadline" value={opp.application_deadline} unavailable />
            <DateRow label="Start date" value={opp.date_start} unavailable />
            <DateRow label="End date" value={opp.date_end} unavailable />
          </div>

          {opp.eligibility && (
            <div className="mt-4">
              <h3 className="font-medium text-sm mb-1">Eligibility</h3>
              <p className="text-sm text-muted-foreground">{opp.eligibility}</p>
            </div>
          )}

          {opp.description && (
            <div className="mt-6">
              <h3 className="font-medium text-sm mb-2">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{opp.description}</p>
            </div>
          )}

          {(opp.skill_tags?.length > 0 || opp.interest_tags?.length > 0 || opp.career_tags?.length > 0 || opp.field_of_study_tags?.length > 0) && (
            <div className="mt-6">
              <h3 className="font-medium text-sm mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {opp.skill_tags?.map((t) => <span key={`s-${t}`} className="px-2.5 py-1 rounded-lg bg-navy/5 text-navy text-xs font-medium">{t}</span>)}
                {opp.interest_tags?.map((t) => <span key={`i-${t}`} className="px-2.5 py-1 rounded-lg bg-sage/10 text-sage text-xs font-medium">{t}</span>)}
                {opp.career_tags?.map((t) => <span key={`c-${t}`} className="px-2.5 py-1 rounded-lg bg-amber/10 text-amber text-xs font-medium">{t}</span>)}
                {opp.field_of_study_tags?.map((t) => <span key={`f-${t}`} className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-medium">{t}</span>)}
              </div>
            </div>
          )}

          {opp.education_levels?.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium text-sm mb-1">Good for</h3>
              <p className="text-sm text-muted-foreground">{opp.education_levels.map((l) => typeLabel[l] || l).join(", ")}</p>
            </div>
          )}

          {opp.age_min && (
            <div className="mt-4">
              <h3 className="font-medium text-sm mb-1">Age Range</h3>
              <p className="text-sm text-muted-foreground">{opp.age_min} – {opp.age_max} years old</p>
            </div>
          )}

          {opp.source_name && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Source:</span>
              <span className="font-medium">{opp.source_name}</span>
            </div>
          )}
        </div>

        <div className="border-t border-border/50 p-6 space-y-3">
          <div className="flex gap-3">
            <Button onClick={handleSave} variant="outline" className="rounded-xl shrink-0">
              {saved ? <BookmarkCheck className="w-4 h-4 mr-1.5" /> : <Bookmark className="w-4 h-4 mr-1.5" />}
              {saved ? "Saved" : "Save"}
            </Button>
            {signUp ? (
              <a href={signUp} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button className="w-full rounded-xl bg-navy hover:bg-navy/90 text-white">
                  <ExternalLink className="w-4 h-4 mr-1.5" /> Sign Up / Apply
                </Button>
              </a>
            ) : (
              <Button onClick={() => setAdminOpen(true)} className="flex-1 rounded-xl bg-navy hover:bg-navy/90 text-white">
                <MessageSquare className="w-4 h-4 mr-1.5" /> Message Admin
              </Button>
            )}
          </div>
          <div className="flex gap-3 flex-wrap">
            {moreInfo && moreInfo !== signUp && (
              <a href={moreInfo} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[140px]">
                <Button variant="outline" className="w-full rounded-xl">
                  <ExternalLink className="w-4 h-4 mr-1.5" /> More Info
                </Button>
              </a>
            )}
            {signUp && (
              <Button onClick={() => setAdminOpen(true)} variant="outline" className="rounded-xl flex-1 min-w-[140px]">
                <MessageSquare className="w-4 h-4 mr-1.5" /> Message Admin
              </Button>
            )}
            {contactEmail && (
              <a href={mailto} onClick={(e) => { if (!rateLimitedOutreach(opp, user).ok) e.preventDefault(); }} className="flex-1 min-w-[140px]">
                <Button variant="outline" className="w-full rounded-xl">
                  <Mail className="w-4 h-4 mr-1.5" /> Email Organizer
                </Button>
              </a>
            )}
            {!signUp && !contactEmail && !moreInfo && (
              <Button onClick={handleApply} disabled={applied} variant="outline" className="rounded-xl flex-1">
                <Send className="w-4 h-4 mr-1.5" /> {applied ? "Interest Recorded" : "I'm Interested"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={adminOpen} onOpenChange={setAdminOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle className="font-heading">Message Admin about this opportunity</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label className="text-sm mb-1 block">Subject</Label><Input className="rounded-xl" value={adminForm.subject} onChange={(e) => setAdminForm((f) => ({ ...f, subject: e.target.value }))} /></div>
            <div><Label className="text-sm mb-1 block">Your question</Label><Textarea rows={4} className="rounded-xl" value={adminForm.body} onChange={(e) => setAdminForm((f) => ({ ...f, body: e.target.value }))} placeholder="Ask a follow-up question about this opportunity…" /></div>
            <Button onClick={handleMessageAdmin} disabled={adminSending || !adminForm.body} className="w-full bg-navy hover:bg-navy/90 text-white rounded-xl">{adminSending ? "Sending…" : "Send to Admin"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
