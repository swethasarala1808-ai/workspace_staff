export const QUOTES = [
  { text: "We don't just build software. We build confidence, dignity, and growth.", attr: "Our Mission" },
  { text: "Behind every MSME is a person carrying stress, responsibilities, and dreams for their family.", attr: "Compassion & Empathy" },
  { text: "We would rather lose a sale today than win it by misleading a customer.", attr: "Truth & Honesty" },
  { text: "If this customer was my friend, would I do this?", attr: "Partner Mindset" },
  { text: "Human First. AI Second. Always.", attr: "Guiding Principle" },
  { text: "My customer has a person at bizaxl. That person is me.", attr: "My Commitment" },
  { text: "Start strong. Be honest today.", attr: "Monday" },
  { text: "Listen first. Solve second.", attr: "Tuesday" },
  { text: "One warm message can change someone's day.", attr: "Wednesday" },
  { text: "Be the person your customer trusts most.", attr: "Thursday" },
  { text: "Celebrate a win — yours or your customer's.", attr: "Friday" },
  { text: "Trust through Truth. Loyalty through Honesty.", attr: "What We Stand For" },
  { text: "Warmth in every interaction.", attr: "bizaxl Standard" },
  { text: "Partnership through Warmth.", attr: "Core Values" },
  { text: "Honesty may cost us short term. But it earns lasting loyalty.", attr: "Our Promise" },
];

export function getDailyQuote() {
  const day = Math.floor(Date.now() / 86400000);
  return QUOTES[day % QUOTES.length];
}
