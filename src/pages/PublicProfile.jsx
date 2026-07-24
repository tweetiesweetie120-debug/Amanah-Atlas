import React, { useState, useEffect } from "react";
import { useParams, useOutletContext, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import EmptyState from "@/components/ui/EmptyState";
import { ArrowLeft, UserCheck, GraduationCap, MapPin, Award, Briefcase, MessageSquare } from "lucide-react";
import { EDUCATION_STATUSES } from "@/lib/onboardingOptions";

const statusLabel = (v) => EDUCATION_STATUSES.find((s) => s.value === v)?.label || v || "";

function Chip({ children, cls }) {
  return <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${cls}`}>{children}</span>;
}

export default function PublicProfile() {
  const { userId } = useParams();
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [profiles, myFollow, followerRows, followingRows] = await Promise.all([
          base44.entities.Profile.filter({ user_id: userId }),
          base44.entities.Follow.filter({ follower_id: user.id, following_id: userId }),
          base44.entities.Follow.filter({ following_id: userId }),
          base44.entities.Follow.filter({ follower_id: userId }),
        ]);
        const p = profiles[0] || null;
        setProfile(p);
        setIsFollowing(myFollow.length > 0);
        setFollowers(followerRows.length);
        setFollowingCount(followingRows.length);
        if (p?.discoverable) {
          try {
            const apps = await base44.entities.Application.filter({ user_id: userId });
            setApplications(apps.filter((a) => a.status === "applied" || a.status === "accepted"));
          } catch { setApplications([]); }
        }
      } catch { /* profile not accessible */ }
      setLoading(false);
    };
    load();
  }, [userId, user.id]);

  const handleFollow = async () => {
    if (isFollowing) {
      const f = await base44.entities.Follow.filter({ follower_id: user.id, following_id: userId });
      if (f.length) await base44.entities.Follow.delete(f[0].id);
      setIsFollowing(false);
      setFollowers((c) => Math.max(c - 1, 0));
    } else {
      await base44.entities.Follow.create({ follower_id: user.id, following_id: userId });
      setIsFollowing(true);
      setFollowers((c) => c + 1);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-sage border-t-navy rounded-full animate-spin" /></div>;
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link to="/community"><Button variant="ghost" size="sm" className="mb-4 text-muted-foreground -ml-2"><ArrowLeft className="w-4 h-4 mr-1" /> Back to Community</Button></Link>
        <div className="bg-card rounded-2xl p-6 border border-border/50 text-center">
          <div className="w-16 h-16 rounded-2xl bg-navy/5 flex items-center justify-center mx-auto mb-3"><UserCheck className="w-7 h-7 text-muted-foreground" /></div>
          <h1 className="font-heading text-lg font-semibold">This profile is private</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-4">This student has chosen not to show their full profile. You can still follow or message them.</p>
          <div className="flex justify-center gap-2">
            <Button size="sm" variant={isFollowing ? "default" : "outline"} className="rounded-xl" onClick={handleFollow}>{isFollowing ? <><UserCheck className="w-3.5 h-3.5 mr-1" /> Following</> : "Follow"}</Button>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => navigate(`/messages?u=${userId}`)}><MessageSquare className="w-3.5 h-3.5 mr-1" /> Message</Button>
          </div>
        </div>
      </div>
    );
  }

  const visible = profile.discoverable;

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/community">
        <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground -ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Community
        </Button>
      </Link>

      <div className="bg-card rounded-2xl p-6 border border-border/50">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-navy/5 flex items-center justify-center shrink-0">
            {profile.photo_url ? <Image src={profile.photo_url} fittingType="fill" className="w-full h-full" alt="Profile" /> : <span className="text-navy font-heading text-2xl">{(profile.full_name || "S")[0]}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-xl font-bold text-foreground">{profile.full_name || "Student"}</h1>
            {visible && profile.description && <p className="text-sm text-muted-foreground mt-1">{profile.description}</p>}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> {followers} followers</span>
              <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> {followingCount} following</span>
            </div>
          </div>
          {userId !== user.id && (
            <div className="flex items-center gap-1.5 shrink-0">
              <Button size="sm" variant="outline" className="rounded-xl" onClick={() => navigate(`/messages?u=${userId}`)}><MessageSquare className="w-3.5 h-3.5 mr-1" /> Message</Button>
              <Button size="sm" variant={isFollowing ? "default" : "outline"} className="rounded-xl" onClick={handleFollow}>
                {isFollowing ? <><UserCheck className="w-3.5 h-3.5 mr-1" /> Following</> : "Follow"}
              </Button>
            </div>
          )}
        </div>

        {!visible ? (
          <div className="mt-6 p-4 bg-muted/50 rounded-xl text-center">
            <p className="text-sm text-muted-foreground">This profile is private. Only limited info is shown here. You can still follow to support them.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {profile.education_status && <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4" /> {statusLabel(profile.education_status)}{profile.grade_level ? ` · ${profile.grade_level}` : ""}</span>}
              {profile.school && <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4" /> {profile.school}</span>}
              {profile.zip_code && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {profile.zip_code}</span>}
            </div>

            {profile.field_of_study && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Field of Study</h3>
                <Chip cls="bg-navy/5 text-navy">{profile.field_of_study}</Chip>
              </div>
            )}

            {profile.skills?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Skills</h3>
                <div className="flex flex-wrap gap-1.5">{profile.skills.map((s) => <Chip key={s} cls="bg-navy/5 text-navy">{s}</Chip>)}</div>
              </div>
            )}
            {profile.interests?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Interests</h3>
                <div className="flex flex-wrap gap-1.5">{profile.interests.map((i) => <Chip key={i} cls="bg-sage/10 text-sage">{i}</Chip>)}</div>
              </div>
            )}
            {profile.career_interests?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Career Interests</h3>
                <div className="flex flex-wrap gap-1.5">{profile.career_interests.map((c) => <Chip key={c} cls="bg-amber/10 text-amber">{c}</Chip>)}</div>
              </div>
            )}
            {profile.internship_interests?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Internship Interests</h3>
                <div className="flex flex-wrap gap-1.5">{profile.internship_interests.map((c) => <Chip key={c} cls="bg-indigo-50 text-indigo-600">{c}</Chip>)}</div>
              </div>
            )}
            {profile.other_details && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">More about me</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{profile.other_details}</p>
              </div>
            )}
            {profile.badges?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Badges</h3>
                <div className="flex flex-wrap gap-1.5">{profile.badges.map((b) => <Chip key={b} cls="bg-amber/10 text-amber"><Award className="w-3 h-3 inline mr-1" />{b}</Chip>)}</div>
              </div>
            )}
            {applications.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Selected Opportunities</h3>
                <div className="space-y-1.5">
                  {applications.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 text-sm">
                      <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium">{a.opportunity_title}</span>
                      <span className="text-muted-foreground">· {a.organization_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
