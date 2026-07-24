import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";
import TagPicker from "@/components/onboarding/TagPicker";
import OtherSelect from "@/components/onboarding/OtherSelect";
import { Save, Upload, Users, UserCheck } from "lucide-react";
import {
  EDUCATION_STATUSES, GRADE_OPTIONS, YEAR_OPTIONS, SKILLS, INTERESTS,
  CAREER_INTERESTS, FIELDS_OF_STUDY, INTERNSHIP_INTERESTS, DAYS, TIMES, SAFETY,
} from "@/lib/onboardingOptions";
import { canDo } from "@/lib/rateLimit";

export default function Profile() {
  const { user, profile, setProfile } = useOutletContext();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [form, setForm] = useState({
    full_name: profile?.full_name || user?.full_name || "",
    description: profile?.description || "",
    education_status: profile?.education_status || "high_school",
    grade_level: profile?.grade_level || "",
    school: profile?.school || "",
    zip_code: profile?.zip_code || "",
    travel_radius: profile?.travel_radius || 10,
    skills: profile?.skills || [],
    interests: profile?.interests || [],
    career_interests: profile?.career_interests || [],
    field_of_study: profile?.field_of_study || "",
    internship_interests: profile?.internship_interests || [],
    availability_days: profile?.availability_days || [],
    availability_times: profile?.availability_times || [],
    remote_only: profile?.remote_only || false,
    ssl_only: profile?.ssl_only || false,
    safety_preferences: profile?.safety_preferences || [],
    other_details: profile?.other_details || "",
    photo_url: profile?.photo_url || "",
    allow_messages: profile?.allow_messages || false,
    discoverable: profile?.discoverable || false,
  });

  useEffect(() => {
    const loadCounts = async () => {
      const [f1, f2] = await Promise.all([
        base44.entities.Follow.filter({ following_id: user.id }),
        base44.entities.Follow.filter({ follower_id: user.id }),
      ]);
      setFollowers(f1.length);
      setFollowing(f2.length);
    };
    loadCounts();
  }, [user.id]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set("photo_url", file_url);
    } catch { /* ignore */ }
    setUploading(false);
  };

  const handleSave = async () => {
    const rl = canDo("profile");
    if (!rl.ok) {
      toast({ title: "Please wait a moment", description: `Try again in ${rl.wait}s.`, variant: "destructive" });
      return;
    }
    setSaving(true);
    if (form.full_name && form.full_name !== user?.full_name) {
      try { await base44.auth.updateMe({ full_name: form.full_name }); } catch { /* ignore */ }
    }
    const updated = await base44.entities.Profile.update(profile.id, form);
    setProfile(updated);
    setSaving(false);
    toast({ title: "Profile updated!" });
  };

  const gradeOptions = form.education_status === "high_school" ? GRADE_OPTIONS : YEAR_OPTIONS;
  const schoolLabel = form.education_status === "high_school" ? "School" : "College / University";

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-heading text-2xl font-bold mb-6">Your Profile</h1>

      {/* Public preview */}
      <div className="bg-card rounded-2xl p-6 border border-border/50 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-navy/5 flex items-center justify-center shrink-0">
            {form.photo_url ? <Image src={form.photo_url} fittingType="fill" className="w-full h-full" alt="Profile" /> : <span className="text-navy font-heading text-xl">{(form.full_name || "S")[0]}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{form.full_name || "Your name"}</p>
            <p className="text-sm text-muted-foreground truncate">{form.description || "Add a short description"}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {followers} followers</span>
              <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> {following} following</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">{form.discoverable ? "Visible" : "Hidden"}</span>
            <Switch checked={form.discoverable} onCheckedChange={(v) => set("discoverable", v)} />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-6 border border-border/50 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-muted flex items-center justify-center shrink-0">
            {form.photo_url ? <Image src={form.photo_url} fittingType="fill" className="w-full h-full" alt="Profile" /> : <Upload className="w-5 h-5 text-muted-foreground" />}
          </div>
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-sm font-medium hover:bg-muted/80">
              <Upload className="w-4 h-4" /> {uploading ? "Uploading…" : "Change photo"}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={uploading} />
          </label>
        </div>

        <div>
          <Label className="text-sm font-medium mb-1 block">Full Name</Label>
          <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} className="rounded-xl" />
        </div>
        <div>
          <Label className="text-sm font-medium mb-1 block">Short description</Label>
          <Textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} className="rounded-xl" placeholder="A short bio about yourself" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium mb-1 block">Education Status</Label>
            <OtherSelect options={EDUCATION_STATUSES} value={form.education_status} onChange={(v) => set("education_status", v)} />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1 block">Grade / Year</Label>
            <OtherSelect options={gradeOptions} value={form.grade_level} onChange={(v) => set("grade_level", v)} placeholder="Select" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium mb-1 block">{schoolLabel}</Label>
            <Input value={form.school} onChange={(e) => set("school", e.target.value)} className="rounded-xl" />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1 block">ZIP Code</Label>
            <Input value={form.zip_code} onChange={(e) => set("zip_code", e.target.value)} className="rounded-xl" />
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium mb-1 block">Travel Radius (miles): {form.travel_radius}</Label>
          <input type="range" min="1" max="50" value={form.travel_radius} onChange={(e) => set("travel_radius", parseInt(e.target.value))} className="w-full accent-navy" />
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">Skills</Label>
          <TagPicker options={SKILLS} value={form.skills} onChange={(v) => set("skills", v)} size="sm" />
        </div>
        <div>
          <Label className="text-sm font-medium mb-2 block">Interests</Label>
          <TagPicker options={INTERESTS} value={form.interests} onChange={(v) => set("interests", v)} size="sm" />
        </div>
        <div>
          <Label className="text-sm font-medium mb-2 block">Career Interests</Label>
          <TagPicker options={CAREER_INTERESTS} value={form.career_interests} onChange={(v) => set("career_interests", v)} size="sm" />
        </div>
        <div>
          <Label className="text-sm font-medium mb-2 block">Field of Study</Label>
          <OtherSelect options={FIELDS_OF_STUDY} value={form.field_of_study} onChange={(v) => set("field_of_study", v)} placeholder="Select your field" />
        </div>
        <div>
          <Label className="text-sm font-medium mb-2 block">Internship Interests</Label>
          <TagPicker options={INTERNSHIP_INTERESTS} value={form.internship_interests} onChange={(v) => set("internship_interests", v)} size="sm" />
        </div>
        <div>
          <Label className="text-sm font-medium mb-2 block">Days Available</Label>
          <TagPicker options={DAYS} value={form.availability_days} onChange={(v) => set("availability_days", v)} size="sm" />
        </div>
        <div>
          <Label className="text-sm font-medium mb-2 block">Times Available</Label>
          <TagPicker options={TIMES} value={form.availability_times} onChange={(v) => set("availability_times", v)} size="sm" />
        </div>
        <div>
          <Label className="text-sm font-medium mb-2 block">Safety Preferences</Label>
          <TagPicker options={SAFETY} value={form.safety_preferences} onChange={(v) => set("safety_preferences", v)} size="sm" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
            <span className="text-sm font-medium">Remote only</span>
            <Switch checked={form.remote_only} onCheckedChange={(v) => set("remote_only", v)} />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
            <span className="text-sm font-medium">SSL-approved only</span>
            <Switch checked={form.ssl_only} onCheckedChange={(v) => set("ssl_only", v)} />
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium mb-1 block">Other things to include on my profile</Label>
          <Textarea rows={3} value={form.other_details} onChange={(e) => set("other_details", e.target.value)} className="rounded-xl" placeholder="Languages, certifications, awards, hobbies…" />
        </div>

        <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
          <div>
            <span className="text-sm font-medium">Allow direct messages</span>
            <p className="text-xs text-muted-foreground mt-0.5">Let other students start private conversations with you. You can report any message.</p>
          </div>
          <Switch checked={form.allow_messages} onCheckedChange={(v) => set("allow_messages", v)} />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full bg-navy hover:bg-navy/90 text-white rounded-xl">
          <Save className="w-4 h-4 mr-1.5" /> {saving ? "Saving…" : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}
