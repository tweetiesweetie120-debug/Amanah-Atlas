import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, ExternalLink, Bookmark, BookmarkCheck, Shield, Award, Users, Home, Globe, Mail, CalendarClock } from "lucide-react";
import { buildOutreachMailto, signUpUrl, moreInfoUrl, rateLimitedOutreach } from "@/lib/outreach";

const badges = [
  { key: "ssl_approved", label: "SSL", icon: Award, color: "bg-emerald/10 text-emerald" },
  { key: "youth_friendly", label: "Youth", icon: Users, color: "bg-blue-50 text-blue-600" },
  { key: "mosque_based", label: "Mosque", icon: Home, color: "bg-purple-50 text-purple-600" },
  { key: "family_safe", label: "Family Safe", icon: Shield, color: "bg-green-50 text-green-700" },
  { key: "women_led", label: "Women-led", icon: Users, color: "bg-pink-50 text-pink-600" },
  { key: "remote_allowed", label: "Remote", icon: Globe, color: "bg-indigo-50 text-indigo-600" },
];

const typeLabel = { internship: "Internship", job: "Career", ssl: "SSL", volunteer: "Volunteer", other: "Role" };

export default function OpportunityCard({ opportunity, matchReasons, isSaved, onToggleSave, user }) {
  const o = opportunity;
  const signUp = signUpUrl(o);
  const moreInfo = moreInfoUrl(o);
  const contactEmail = !!o.contact_email;
  const mailto = buildOutreachMailto(o, user?.full_name || "Student");

  return (
    <div className="bg-card rounded-2xl p-5 border border-border/50 hover:shadow-lg hover:shadow-sage/5 transition-all duration-300 group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <Link to={`/opportunities/${o.id}`}>
            <h3 className="font-heading text-base font-semibold text-foreground group-hover:text-navy transition-colors line-clamp-2">
              {o.title}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground mt-0.5">{o.organization_name}</p>
        </div>
        <button onClick={() => onToggleSave?.(o.id)} className="shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors">
          {isSaved ? <BookmarkCheck className="w-5 h-5 text-navy" /> : <Bookmark className="w-5 h-5 text-muted-foreground" />}
        </button>
      </div>

      {o.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{o.description}</p>}

      {/* Badges + type */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {o.opportunity_type && o.opportunity_type !== "volunteer" && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gold/10 text-gold">{typeLabel[o.opportunity_type] || "Role"}</span>
        )}
        {badges.filter((b) => o[b.key]).map((b) => (
          <span key={b.key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${b.color}`}>
            <b.icon className="w-3 h-3" />{b.label}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
        {o.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{o.city}, {o.state} {o.zip_code}</span>}
        {o.hours_needed && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{o.hours_needed} hours</span>}
        {o.source_name && <span className="flex items-center gap-1"><ExternalLink className="w-3 h-3" />{o.source_name}</span>}
      </div>

      {(o.skill_tags?.length > 0 || o.interest_tags?.length > 0) && (
        <div className="flex flex-wrap gap-1 mb-3">
          {o.skill_tags?.map((t) => <span key={t} className="px-2 py-0.5 rounded-md bg-navy/5 text-navy text-xs">{t}</span>)}
          {o.interest_tags?.map((t) => <span key={t} className="px-2 py-0.5 rounded-md bg-sage/10 text-sage text-xs">{t}</span>)}
          {o.career_tags?.map((t) => <span key={t} className="px-2 py-0.5 rounded-md bg-amber/10 text-amber text-xs">{t}</span>)}
        </div>
      )}

      {matchReasons?.length > 0 && (
        <div className="bg-sage/5 rounded-xl px-3 py-2 mb-3 border border-sage/10">
          <p className="text-xs text-navy font-medium">✨ Matched because: {matchReasons.join(" · ")}</p>
        </div>
      )}

      <div className="flex gap-2">
        <Link to={`/opportunities/${o.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full rounded-xl text-xs">View</Button>
        </Link>
        {signUp ? (
          <a href={signUp} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button size="sm" className="w-full rounded-xl text-xs bg-navy hover:bg-navy/90 text-white">
              <ExternalLink className="w-3.5 h-3.5 mr-1" /> Sign Up
            </Button>
          </a>
        ) : contactEmail ? (
          <a href={mailto} onClick={(e) => { if (!rateLimitedOutreach(o, user).ok) e.preventDefault(); }} className="flex-1">
            <Button size="sm" className="w-full rounded-xl text-xs bg-navy hover:bg-navy/90 text-white">
              <Mail className="w-3.5 h-3.5 mr-1" /> Email Org
            </Button>
          </a>
        ) : null}
      </div>
      {moreInfo && moreInfo !== signUp && (
        <a href={moreInfo} target="_blank" rel="noopener noreferrer" className="block mt-2">
          <Button variant="ghost" size="sm" className="w-full rounded-xl text-xs text-navy hover:bg-navy/5">
            <ExternalLink className="w-3.5 h-3.5 mr-1" /> More Info
          </Button>
        </a>
      )}
      {signUp && contactEmail && (
        <a href={mailto} onClick={(e) => { if (!rateLimitedOutreach(o, user).ok) e.preventDefault(); }} className="block mt-1">
          <Button variant="ghost" size="sm" className="w-full rounded-xl text-xs">
            <Mail className="w-3.5 h-3.5 mr-1" /> Email Org
          </Button>
        </a>
      )}
    </div>
  );
}
