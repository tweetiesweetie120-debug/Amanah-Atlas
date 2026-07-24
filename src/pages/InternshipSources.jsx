import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Search, Building2 } from "lucide-react";
import { INTERNSHIP_SOURCES } from "@/lib/internshipSources";

export default function InternshipSources() {
  const [q, setQ] = useState("");

  const filtered = INTERNSHIP_SOURCES.map((group) => ({
    ...group,
    items: group.items.filter((it) => {
      if (!q) return true;
      const s = q.toLowerCase();
      return it.name.toLowerCase().includes(s) || it.description.toLowerCase().includes(s) || it.region.toLowerCase().includes(s);
    }),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Internship & Opportunity Sources</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Official hubs with direct links — no aggregators, no fake listings. Tap any source to go straight to the official page.</p>
      </div>

      <div className="relative mb-6">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <Input placeholder="Search sources…" className="rounded-xl h-11 pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {filtered.map((group) => (
        <div key={group.category} className="mb-8">
          <h2 className="font-heading text-base font-semibold mb-3">{group.category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {group.items.map((it) => (
              <div key={it.url} className="bg-card rounded-2xl p-4 border border-border/50 flex flex-col">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center shrink-0"><Building2 className="w-5 h-5 text-navy" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-snug">{it.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{it.region}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 flex-1">{it.description}</p>
                <a href={it.url} target="_blank" rel="noopener noreferrer" className="mt-3">
                  <Button variant="outline" size="sm" className="w-full rounded-xl text-xs">
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Visit official page
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">No sources match your search.</p>}
    </div>
  );
}
