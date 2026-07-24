// Lightweight client-side rate limiter for community actions.
// Prevents rapid-fire posts, replies, follows, flags, and outreach from the same browser.
// This is a first layer (not a substitute for server-side limits) and is applied honestly.

const MIN_GAP_MS = {
  post: 20000,
  reply: 15000,
  follow: 5000,
  outreach: 15000,
  flag: 10000,
  profile: 10000,
  message: 8000,
};

const lastAction = {};

export function canDo(action) {
  const now = Date.now();
  const gap = MIN_GAP_MS[action] || 8000;
  if (lastAction[action] && now - lastAction[action] < gap) {
    const wait = Math.ceil((gap - (now - lastAction[action])) / 1000);
    return { ok: false, wait };
  }
  lastAction[action] = now;
  return { ok: true };
}
