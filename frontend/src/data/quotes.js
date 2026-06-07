export const QUOTES = [
  { text: "We don't just build software. We build confidence, dignity, and growth.", attr: "Our Mission · Bizaxl" },
  { text: "Behind every MSME is a person carrying stress, responsibilities, and dreams for their family.", attr: "Core Value: Compassion & Empathy" },
  { text: "We would rather lose a sale today than win it by misleading a customer.", attr: "Sales Team · Truth & Honesty" },
  { text: "Before every action, ask: If this customer was my friend, would I do this?", attr: "Partner Mindset · Daily Rule" },
  { text: "Human First. AI Second. Always.", attr: "Guiding Principle · Bizaxl" },
  { text: "My customer has a person at Bizaxl. That person is me.", attr: "Desk Reminder · My Commitment" },
  { text: "Start strong. Be honest today.", attr: "Monday · Weekly Motivation" },
  { text: "Listen first. Solve second.", attr: "Tuesday · Weekly Motivation" },
  { text: "One warm message can change someone's day.", attr: "Wednesday · Weekly Motivation" },
  { text: "Be the person your customer trusts most.", attr: "Thursday · Weekly Motivation" },
  { text: "Celebrate a win — yours or your customer's.", attr: "Friday · Weekly Motivation" },
  { text: "Trust through Truth. Loyalty through Honesty. Respect through Humility.", attr: "What We Stand For · Bizaxl" },
  { text: "Warmth in every interaction.", attr: "Bizaxl Communication Standard" },
  { text: "Partnership through Warmth.", attr: "Bizaxl Core Values" },
  { text: "AI removes repetitive work. Human judgment, care, and relationships remain at the center.", attr: "Guiding Principle" },
];
export function getDailyQuote() {
  const day = Math.floor(Date.now() / 86400000);
  return QUOTES[day % QUOTES.length];
}
