// Indexed by day of week: 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
export const WEEKDAY_QUOTES = [
  { text: "Rest well. Come back ready to serve.", attr: "Sunday" },
  { text: "Start strong. Be honest today.", attr: "Monday" },
  { text: "Listen first. Solve second.", attr: "Tuesday" },
  { text: "One warm message can change someone's day.", attr: "Wednesday" },
  { text: "Be the person your customer trusts most.", attr: "Thursday" },
  { text: "Celebrate a win — yours or your customer's.", attr: "Friday" },
  { text: "Reflect. Recharge. Return stronger.", attr: "Saturday" },
];

export const QUOTES = [
  { text: "We don't just build software. We build confidence, dignity, and growth.", attr: "Our Mission" },
  { text: "Behind every MSME is a person carrying stress, responsibilities, and dreams.", attr: "Compassion & Empathy" },
  { text: "We would rather lose a sale today than win it by misleading a customer.", attr: "Truth & Honesty" },
  { text: "If this customer was my friend, would I do this?", attr: "Partner Mindset" },
  { text: "Human First. AI Second. Always.", attr: "Guiding Principle" },
  { text: "My customer has a person at bizaxl. That person is me.", attr: "My Commitment" },
  { text: "Warmth in every interaction.", attr: "bizaxl Standard" },
  { text: "Partnership through Warmth.", attr: "Core Values" },
  { text: "Honesty earns lasting loyalty — that is the only kind of growth we want.", attr: "Our Promise" },
  { text: "Trust through Truth. Loyalty through Honesty.", attr: "What We Stand For" },
  { text: "Technology should free people from drudgery — not distance them from humanity.", attr: "Our Belief" },
  { text: "We celebrate our customers' wins as if they were our own.", attr: "The bizaxl Promise" },
  { text: "Respect the courage and hard work of every MSME owner.", attr: "Respect" },
  { text: "Continuous humility — we learn from our customers every day.", attr: "Humility" },
  { text: "Reliability means showing up — every time, no excuses.", attr: "Reliability" },
];

export function getDailyQuote() {
  const day = new Date().getDay(); // 0=Sun ... 6=Sat
  return WEEKDAY_QUOTES[day];
}
