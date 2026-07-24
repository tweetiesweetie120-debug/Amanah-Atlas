import { base44 } from "@/api/base44Client";
import { canDo } from "@/lib/rateLimit";
import { toast } from "@/components/ui/use-toast";

export function buildOutreachMailto(opp, userName) {
  const subject = encodeURIComponent(`Volunteer interest: ${opp.title}`);
  const body = encodeURIComponent(
`Hello ${opp.organization_name},

My name is ${userName}, and I'm a student in the DMV area. I'm interested in "${opp.title}".

I found this opportunity through Amanah Atlas. Could you please share the next steps, availability, and any requirements?

Thank you,
${userName}`
  );
  const to = opp.contact_email || "";
  return `mailto:${to}?subject=${subject}&body=${body}`;
}

// Direct signup link — explicit signup_url takes priority, then the org website, then the source page.
export function signUpUrl(opp) {
  return opp.signup_url || opp.org_website || opp.source_url || "";
}

// "More info" link — the exact source page with full details.
export function moreInfoUrl(opp) {
  return opp.source_url || "";
}

export async function logOutreach(opp, user) {
  await base44.entities.SentMessage.create({
    user_id: user.id,
    message_type: "outreach",
    recipient_type: "organization",
    recipient: opp.contact_email || opp.organization_name,
    related_opportunity_id: opp.id,
    subject: `Volunteer interest: ${opp.title}`,
    body: `Outreach email prepared for ${opp.organization_name} regarding "${opp.title}".`,
  });
}

// Rate-limited outreach: blocks rapid-fire emails and logs when allowed.
// Returns the rate-limit result so callers can prevent the mailto from opening.
export function rateLimitedOutreach(opp, user) {
  const rl = canDo("outreach");
  if (!rl.ok) {
    toast({ title: "Please wait a moment", description: `You can reach out again in ${rl.wait}s.`, variant: "destructive" });
    return rl;
  }
  logOutreach(opp, user);
  return rl;
}
