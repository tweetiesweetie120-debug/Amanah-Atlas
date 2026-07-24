import React, { useState, useEffect } from "react";
import { useOutletContext, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import EmptyState from "@/components/ui/EmptyState";
import { Users, UserCheck, Shield, GraduationCap, MessageSquare } from "lucide-react";
import { canDo } from "@/lib/rateLimit";

export default function Community() {
  const { user, profile, setProfile } = useOutletContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [following, setFollowing] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [all, mine, follows] = await Promise.all([
      base44.entities.Profile.filter({ discoverable: true }),
      base44.entities.Profile.filter({ user_id: user.id }),
      base44.entities.Follow.filter({ follower_id: user.id }),
    ]);
    setProfiles(all.filter(p => p.user_id !== user.id));
    setFollowing(new Set(follows.map(f => f.following_id)));
    setLoading(false);
  };
  useEffect(() => { load(); }, [user.id]);

  const toggleDiscoverable = async () => {
    const updated = await base44.entities.Profile.update(profile.id, { discoverable: !profile.discoverable });
    setProfile(updated);
    toast({ title: updated.discoverable ? "You're now discoverable" : "You're now hidden from community" });
  };

  const handleFollow = async (targetUserId) => {
    const rl = canDo("follow");
    if (!rl.ok) { toast({ title: "Please wait a moment", description: `Try again in ${rl.wait}s.`, variant: "destructive" }); return; }
    if (following.has(targetUserId)) {
      const f = await base44.entities.Follow.filter({ follower_id: user.id, following_id: targetUserId });
      if (f.length) await base44.entities.Follow.delete(f[0].id);
      setFollowing(s => { const n = new Set(s); n.delete(targetUserId); return n; });
    } else {
      await base44.entities.Follow.create({ follower_id: user.id, following_id: targetUserId });
      setFollowing(s => new Set(s).add(targetUserId));
    }
  };

  const handleMessage = (p) => {
    if (!profile?.allow_messages) { toast({ title: "Enable messages first", description: "Turn on messaging in your profile to start a conversation.", variant: "destructive" }); return; }
    if (!p.allow_messages) { toast({ title: "Messaging not available", description: "This user hasn't enabled messages.", variant: "destructive" }); return; }
    navigate(`/messages?u=${p.user_id}`);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-sage border-t-navy rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Community</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Discover like-minded students. Privacy-first — no contact info is shared.</p>
      </div>

      <div className="bg-card rounded-2xl p-4 border border-border/50 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-sage" />
          <div>
            <p className="text-sm font-medium">Community discovery</p>
            <p className="text-xs text-muted-foreground">{profile.discoverable ? "Others can see your name, grade, school, and interests." : "Hidden — opt in to be seen by peers."}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">{profile.discoverable ? "On" : "Off"}</span>
          <Switch checked={!!profile.discoverable} onCheckedChange={toggleDiscoverable} />
        </div>
      </div>

      {profiles.length === 0 ? (
        <EmptyState icon={Users} title="No discoverable students yet" description="Opt in above and invite friends — discovery is private and shows no contact info." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {profiles.map(p => (
            <div key={p.id} className="bg-card rounded-2xl p-4 border border-border/50">
              <div className="flex items-center justify-between">
                <Link to={`/community/${p.user_id}`} className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center shrink-0"><span className="text-sage font-semibold">{(p.full_name || "S")[0]}</span></div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{p.full_name || "Student"}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate"><GraduationCap className="w-3 h-3 shrink-0" /> {p.grade_level || p.education_status || "—"} · {p.school || "DMV"}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button size="sm" variant="ghost" className="rounded-xl px-2" title="Message" onClick={() => handleMessage(p)}>
                    <MessageSquare className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant={following.has(p.user_id) ? "default" : "outline"} className="rounded-xl" onClick={() => handleFollow(p.user_id)}>
                    {following.has(p.user_id) ? <><UserCheck className="w-3.5 h-3.5 mr-1" /> Following</> : "Follow"}
                  </Button>
                </div>
              </div>
              {(p.interests?.length > 0 || p.skills?.length > 0) && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {p.interests?.slice(0, 4).map(i => <span key={i} className="px-2 py-0.5 rounded-md bg-sage/10 text-sage text-xs">{i}</span>)}
                  {p.skills?.slice(0, 3).map(s => <span key={s} className="px-2 py-0.5 rounded-md bg-navy/5 text-navy text-xs">{s}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
