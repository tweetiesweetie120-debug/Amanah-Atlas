import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import EmptyState from "@/components/ui/EmptyState";
import { GraduationCap, Sparkles, Copy, Check, Save, Loader2 } from "lucide-react";

export default function ResumeGenerator() {
  const { user } = useOutletContext();
  const { toast } = useToast();
  const [logs, setLogs] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [l, e] = await Promise.all([
        base44.entities.VolunteerLog.filter({ user_id: user.id, status: "verified" }),
        base44.entities.ResumeEntry.filter({ user_id: user.id }),
      ]);
      setLogs(l);
      setEntries(e);
      setLoading(false);
    };
    load();
  }, [user.id]);

  const generateBullet = async (log) => {
    setGenerating(log.id);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a concise, professional resume activity bullet point for a high school student's college application. 
Activity: ${log.opportunity_title} at ${log.organization_name}
Tasks: ${log.task_description || "General volunteering"}
Hours: ${log.hours} hours on ${log.date}

Write ONE resume bullet point (1-2 sentences) that highlights skills gained and impact made. Write in past tense. Make it sound impressive but genuine for a high school student.`,
      response_json_schema: {
        type: "object",
        properties: {
          bullet: { type: "string" },
          activity_description: { type: "string" },
          skills_gained: { type: "array", items: { type: "string" } }
        }
      }
    });

    const entry = await base44.entities.ResumeEntry.create({
      user_id: user.id,
      opportunity_title: log.opportunity_title,
      organization_name: log.organization_name,
      generated_bullet: result.bullet,
      activity_description: result.activity_description,
      skills_gained: result.skills_gained,
      hours: log.hours,
      date_range: log.date,
    });
    setEntries([entry, ...entries]);
    setGenerating(null);
    toast({ title: "Resume bullet generated!" });
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const handleEdit = async (entry, newBullet) => {
    const updated = await base44.entities.ResumeEntry.update(entry.id, { edited_bullet: newBullet });
    setEntries(es => es.map(e => e.id === entry.id ? updated : e));
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-sage border-t-navy rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Resume Builder</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Generate college-ready descriptions from your verified volunteer hours</p>
      </div>

      {/* Verified logs to generate from */}
      {logs.length > 0 && (
        <div className="mb-8">
          <h2 className="font-heading text-base font-semibold mb-3">Verified Service — Generate Descriptions</h2>
          <div className="space-y-2">
            {logs.filter(l => !entries.some(e => e.opportunity_title === l.opportunity_title && e.organization_name === l.organization_name)).map(log => (
              <div key={log.id} className="bg-card rounded-xl p-4 border border-border/50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{log.opportunity_title}</p>
                  <p className="text-xs text-muted-foreground">{log.organization_name} · {log.hours}h · {log.date}</p>
                </div>
                <Button onClick={() => generateBullet(log)} disabled={generating === log.id} size="sm" className="bg-navy hover:bg-navy/90 text-white rounded-xl">
                  {generating === log.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-1" /> Generate</>}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated entries */}
      {entries.length === 0 ? (
        <EmptyState 
          icon={GraduationCap} 
          title="No resume entries yet" 
          description={logs.length > 0 ? "Click 'Generate' on a verified service entry above." : "Log and get verified volunteer hours first, then come back to generate resume bullets."}
        />
      ) : (
        <div>
          <h2 className="font-heading text-base font-semibold mb-3">Your Resume Entries</h2>
          <div className="space-y-4">
            {entries.map(entry => (
              <div key={entry.id} className="bg-card rounded-2xl p-5 border border-border/50">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{entry.opportunity_title}</p>
                    <p className="text-xs text-muted-foreground">{entry.organization_name} · {entry.hours}h</p>
                  </div>
                  <button 
                    onClick={() => handleCopy(entry.edited_bullet || entry.generated_bullet, entry.id)} 
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    {copiedId === entry.id ? <Check className="w-4 h-4 text-emerald" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
                <Textarea 
                  className="rounded-xl text-sm mt-2" 
                  value={entry.edited_bullet || entry.generated_bullet} 
                  onChange={e => handleEdit(entry, e.target.value)} 
                  rows={2} 
                />
                {entry.skills_gained?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {entry.skills_gained.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded-md bg-navy/5 text-navy text-xs">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
