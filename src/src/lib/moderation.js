// Client-side first-layer content filter for community posts/replies.
// Blocks harassment, hate, scams, doxxing, sexual content, and encouraging self-harm toward others.
// Allows students to disclose their own distress (handled by the chatbot / moderators, not silenced here).
const BLOCKED = [
  "kill yourself", "kys", "cut yourself", "end your life", "everyone hates you",
  "nigger", "faggot", "tranny", "slut", "whore", "raghead", "terrorist",
  "rape", "molest",
  "nude", "nudes", "onlyfans", "sex tape", "hook up", "send pics", "send me pics",
  "send money", "cash app", "venmo me", "bitcoin", "crypto giveaway", "wire transfer", "western union",
  "home address", "social security", "doxx", "dox ", "her address is", "his address is", "her number is", "his number is"
];

export function checkContent(text) {
  const lower = ` ${(text || "").toLowerCase()} `;
  for (const term of BLOCKED) {
    if (lower.includes(term)) {
      return { blocked: true, reason: `This content isn't allowed in our community. Please edit your message and try again.` };
    }
  }
  return { blocked: false };
}
