import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import TopNav from "@/components/layout/TopNav";

export default function AppShell() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const profiles = await base44.entities.Profile.filter({ user_id: me.id });
      if (profiles.length > 0) {
        setProfile(profiles[0]);
        if (!profiles[0].onboarding_complete && !window.location.pathname.startsWith("/onboarding")) {
          navigate("/onboarding", { replace: true });
        }
      } else {
        const newProfile = await base44.entities.Profile.create({ user_id: me.id, full_name: me.full_name, role: "student" });
        setProfile(newProfile);
        navigate("/onboarding", { replace: true });
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-sage border-t-navy rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading Amanah Atlas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav user={user} />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet context={{ user, profile, setProfile }} />
      </main>
    </div>
  );
}
