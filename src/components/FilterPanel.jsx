import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { X, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const FILTER_TOGGLES = [
  { key: "ssl_approved", label: "SSL-approved only" },
  { key: "internship", label: "Internships" },
  { key: "remote_allowed", label: "Remote only" },
  { key: "local", label: "Local (in-person)" },
  { key: "career", label: "Career roles" },
  { key: "no_transportation", label: "No transportation needed" },
  { key: "women_led", label: "Women-led" },
  { key: "mosque_based", label: "Mosque-based" },
  { key: "youth_friendly", label: "Youth-friendly" },
  { key: "under_18", label: "Under 18 friendly" },
  { key: "family_safe", label: "Family-safe" },
  { key: "weekend_only", label: "Weekends only" },
  { key: "after_school", label: "After-school" },
  { key: "evening_only", label: "Evening-only" },
  { key: "open_now", label: "Open now" },
];

function FilterContent({ filters, setFilters, onClear }) {
  const toggleFilter = (key) => setFilters((f) => ({ ...f, [key]: !f[key] }));

  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium mb-2 block">Search</label>
        <Input placeholder="Search opportunities…" className="rounded-xl h-10" value={filters.search || ""} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">ZIP Code</label>
        <Input placeholder="e.g. 20878" className="rounded-xl h-10" value={filters.zip || ""} onChange={(e) => setFilters((f) => ({ ...f, zip: e.target.value }))} />
      </div>
      <div className="space-y-3">
        <label className="text-sm font-medium block">Filters</label>
        {FILTER_TOGGLES.map((ft) => (
          <div key={ft.key} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
            <span className="text-sm">{ft.label}</span>
            <Switch checked={!!filters[ft.key]} onCheckedChange={() => toggleFilter(ft.key)} />
          </div>
        ))}
      </div>
      <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground w-full">
        <X className="w-3 h-3 mr-1" /> Clear all filters
      </Button>
    </div>
  );
}

export function DesktopFilterPanel({ filters, setFilters }) {
  const onClear = () => setFilters({ search: "", zip: "" });
  return (
    <div className="bg-card rounded-2xl p-5 border border-border/50 sticky top-20">
      <h3 className="font-heading text-base font-semibold mb-4">Filters</h3>
      <FilterContent filters={filters} setFilters={setFilters} onClear={onClear} />
    </div>
  );
}

export default function FilterPanel({ filters, setFilters }) {
  const onClear = () => setFilters({ search: "", zip: "" });
  const activeCount = Object.entries(filters).filter(([k, v]) => v && k !== "search" && k !== "zip").length + (filters.search ? 1 : 0) + (filters.zip ? 1 : 0);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl">
          <SlidersHorizontal className="w-4 h-4 mr-1.5" /> Filters
          {activeCount > 0 && <span className="ml-1.5 w-5 h-5 rounded-full bg-navy text-white text-xs flex items-center justify-center">{activeCount}</span>}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
        <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
        <div className="py-4">
          <FilterContent filters={filters} setFilters={setFilters} onClear={onClear} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
