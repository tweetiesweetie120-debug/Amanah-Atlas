import React, { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Compass, Clock, Award, GraduationCap, Heart, ArrowRight, CheckCircle2, Timer, FileText } from "lucide-react";

export default function Dashboard() {
  const { user, profile } = useOutletContext();
  const [logs, setLogs] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [l, s] = await Promise.all([
      base44.entities.VolunteerLog.filter({ user_id: user.id }, "-created_date", 5),
      base44.entities.SavedOpportunity.filter({ user_id: user.id })]
      );
      setLogs(l);
      setSaved(s);
      setLoading(false);
    };
    load();
  }, [user.id]);

  const totalLogged = logs.reduce((sum, l) => sum + (l.hours || 0), 0);
  const verifiedHours = logs.filter((l) => l.status === "verified").reduce((sum, l) => sum + (l.hours || 0), 0);
  const pendingHours = logs.filter((l) => l.status === "pending").reduce((sum, l) => sum + (l.hours || 0), 0);

  const stats = [
  { label: "Verified Hours", value: verifiedHours, icon: CheckCircle2, color: "text-emerald" },
  { label: "Pending Hours", value: pendingHours, icon: Timer, color: "text-amber" },
  { label: "Total Logged", value: totalLogged, icon: Clock, color: "text-navy" },
  { label: "Saved Opps", value: saved.length, icon: Compass, color: "text-sage" }];


  const quickLinks = [
  { label: "Find Opportunities", path: "/opportunities", icon: Compass, desc: "Discover matched volunteer work" },
  { label: "Log Hours", path: "/volunteer-log", icon: Clock, desc: "Track your service time" },
  { label: "Resume Builder", path: "/resume-generator", icon: GraduationCap, desc: "Generate college-ready descriptions" },
  { label: "Advice Corner", path: "/advice-corner", icon: Heart, desc: "Anonymous peer support" }];


  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-sage border-t-navy rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
          Assalamu Alaikum, {profile?.full_name?.split(" ")[0] || user?.full_name?.split(" ")[0] || "Sister"} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's your service dashboard for today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) =>
        <div key={s.label} className="bg-card rounded-2xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-heading text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickLinks.map((q) =>
          <Link key={q.path} to={q.path} className="group">
              <div className="bg-card rounded-2xl p-5 border border-border/50 hover:border-navy/20 hover:shadow-md transition-all duration-300 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-navy/5 flex items-center justify-center group-hover:bg-navy/10 transition-colors">
                  <q.icon className="w-5 h-5 text-navy" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">{q.label}</p>
                  <p className="text-xs text-muted-foreground">{q.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-navy transition-colors" />
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Recent Logs */}
      {logs.length > 0 &&
      <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-lg font-semibold">Recent Activity</h2>
            <Link to="/volunteer-log"><Button variant="ghost" size="sm" className="text-navy">View all</Button></Link>
          </div>
          <div className="space-y-2">
            {logs.slice(0, 3).map((log) =>
          <div key={log.id} className="bg-card rounded-xl p-4 border border-border/50 flex items-center justify-between hidden">
                <div>
                  <p className="text-sm font-medium">{log.opportunity_title}</p>
                  <p className="text-xs text-muted-foreground">{log.organization_name} · {log.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{log.hours}h</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              log.status === "verified" ? "bg-emerald/10 text-emerald" :
              log.status === "rejected" ? "bg-red-50 text-red-600" :
              "bg-amber/10 text-amber"}`
              }>{log.status}</span>
                </div>
              </div>
          )}
          </div>
        </div>
      }
    </div>);

}
