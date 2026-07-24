export function scoreOpportunity(opp, profile) {
  let score = 0;
  const reasons = [];

  const userSkills = profile?.skills || [];
  const userInterests = profile?.interests || [];
  const userCareers = profile?.career_interests || [];
  const userField = profile?.field_of_study || "";

  const skillMatches = (opp.skill_tags || []).filter((s) => userSkills.includes(s));
  if (skillMatches.length > 0) {
    score += skillMatches.length * 10;
    reasons.push(`Skills: ${skillMatches.join(", ")}`);
  }

  const interestMatches = (opp.interest_tags || []).filter((i) => userInterests.includes(i));
  if (interestMatches.length > 0) {
    score += interestMatches.length * 7;
    reasons.push(`Interests: ${interestMatches.join(", ")}`);
  }

  const careerMatches = (opp.career_tags || []).filter((c) => userCareers.includes(c));
  if (careerMatches.length > 0) {
    score += careerMatches.length * 12;
    reasons.push(`Career fit: ${careerMatches.join(", ")}`);
  }

  if (userField && (opp.field_of_study_tags || []).includes(userField)) {
    score += 8;
    reasons.push(`Field of study: ${userField}`);
  }

  if ((profile?.internship_interests || []).length > 0 && opp.opportunity_type === "internship") {
    score += 8;
    reasons.push("Internship");
  }

  const eduLevels = opp.education_levels || [];
  if (profile?.education_status && eduLevels.includes(profile.education_status)) {
    score += 4;
    reasons.push("Matches your level");
  }

  if (profile?.remote_only && opp.remote_allowed) {
    score += 5;
    reasons.push("Remote");
  }

  if (profile?.ssl_only && opp.ssl_approved) {
    score += 5;
    reasons.push("SSL-approved");
  }

  if (profile?.zip_code && opp.zip_code === profile.zip_code) {
    score += 4;
    reasons.push("Nearby ZIP");
  }

  const safetyPrefs = profile?.safety_preferences || [];
  if (safetyPrefs.includes("Women-led") && opp.women_led) { score += 3; reasons.push("Women-led"); }
  if (safetyPrefs.includes("Mosque-based") && opp.mosque_based) { score += 3; reasons.push("Mosque-based"); }
  if (safetyPrefs.includes("Youth-friendly") && opp.youth_friendly) { score += 2; }
  if (safetyPrefs.includes("Family-safe") && opp.family_safe) { score += 2; }

  if (opp.youth_friendly) score += 1;

  return { score, reasons };
}

export function matchAndSort(opportunities, profile) {
  return opportunities
    .map((o) => {
      const { score, reasons } = scoreOpportunity(o, profile);
      return { ...o, matchScore: score, matchReasons: reasons };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

export function applyFilters(opportunities, filters) {
  const now = new Date();
  const has = (arr, term) => Array.isArray(arr) && arr.some((d) => String(d).toLowerCase().includes(term));
  return opportunities.filter((o) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!o.title?.toLowerCase().includes(q) && !o.organization_name?.toLowerCase().includes(q) && !o.description?.toLowerCase().includes(q)) return false;
    }
    if (filters.zip && o.zip_code && !o.zip_code.startsWith(filters.zip)) return false;
    if (filters.ssl_approved && !o.ssl_approved) return false;
    if (filters.remote_allowed && !o.remote_allowed) return false;
    if (filters.local && o.remote_allowed) return false;
    if (filters.internship && o.opportunity_type !== "internship") return false;
    if (filters.career && o.opportunity_type !== "job" && !(o.career_tags || []).length) return false;
    if (filters.no_transportation && o.transportation_needed && !o.remote_allowed) return false;
    if (filters.women_led && !o.women_led) return false;
    if (filters.mosque_based && !o.mosque_based) return false;
    if (filters.youth_friendly && !o.youth_friendly) return false;
    if (filters.family_safe && !o.family_safe) return false;
    if (filters.under_18 && !(o.youth_friendly || (o.age_max || 0) >= 18)) return false;
    if (filters.weekend_only && !(has(o.availability_days, "saturday") || has(o.availability_days, "sunday"))) return false;
    if (filters.after_school && !(has(o.availability_times, "after") || has(o.availability_times, "afternoon"))) return false;
    if (filters.evening_only && !has(o.availability_times, "evening")) return false;
    if (filters.open_now) {
      const startOk = !o.date_start || new Date(o.date_start) <= now;
      const endOk = !o.date_end || new Date(o.date_end) >= now;
      if (!startOk || !endOk) return false;
    }
    return true;
  });
}
