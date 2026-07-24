import React, { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import OpportunityCard from "@/components/opportunities/OpportunityCard";
import FilterPanel, { DesktopFilterPanel } from "@/components/opportunities/FilterPanel";
import EmptyState from "@/components/ui/EmptyState";
import { Compass } from "lucide-react";
import { matchAndSort, applyFilters } from "@/lib/matchEngine";

export default function Opportunities() {
  const { user, profile } = useOutletContext();
  const [opportunities, setOpportunities] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [filters, setFilters] = useState({ search: "", zip: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [opps, saved] = await Promise.all([
        base44.entities.Opportunity.filter({ status: "active" }),
        base44.entities.SavedOpportunity.filter({ user_id: user.id }),
      ]);
      setOpportunities(opps);
      setSavedIds(new Set(saved.map(s => s.opportunity_id)));
      setLoading(false);
    };
    load();
  }, [user.id]);

  const processed = useMemo(() => {
    const filtered = applyFilters(opportunities, filters);
    return matchAndSort(filtered, profile);
  }, [opportunities, filters, profile]);

  const toggleSave = async (oppId) => {
    if (savedIds.has(oppId)) {
      const saved = await base44.entities.SavedOpportunity.filter({ user_id: user.id, opportunity_id: oppId });
      if (saved.length > 0) await base44.entities.SavedOpportunity.delete(saved[0].id);
      setSavedIds(s => { const n = new Set(s); n.delete(oppId); return n; });
    } else {
      await base44.entities.SavedOpportunity.create({ user_id: user.id, opportunity_id: oppId });
      setSavedIds(s => new Set(s).add(oppId));
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-sage border-t-navy rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Opportunities</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {processed.length} opportunities matched to your profile
          </p>
        </div>
        <div className="lg:hidden">
          <FilterPanel filters={filters} setFilters={setFilters} />
        </div>
      </div>

      <div className="flex gap-6">
        <div className="hidden lg:block w-72 shrink-0">
          <DesktopFilterPanel filters={filters} setFilters={setFilters} />
        </div>

        <div className="flex-1">
          {processed.length === 0 ? (
            <EmptyState 
              icon={Compass} 
              title="No opportunities found" 
              description="Try adjusting your filters or check back later for new opportunities."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {processed.map(o => (
                <OpportunityCard 
                  key={o.id} 
                  opportunity={o} 
                  matchReasons={o.matchReasons} 
                  isSaved={savedIds.has(o.id)} 
                  onToggleSave={toggleSave} 
                  user={user}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
