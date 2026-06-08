from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import policies_col, users_col
from bson import ObjectId
import datetime

policies_bp = Blueprint("policies", __name__)

HANDBOOK_POLICIES = [
  # Company Handbook
  {"category":"Our Purpose","emoji":"🚀","title":"Why Bizaxl Exists",
   "summary":"We exist to simplify, automate, and accelerate the growth of MSMEs across India.",
   "content":"""We exist to simplify, automate, and accelerate the growth of MSMEs across India.

We want to be a genuine friend in every small business owner's journey — one that understands their struggles and respects their hard work.

We believe technology should free people from drudgery — not distance them from humanity.

Behind every MSME is a real person carrying real dreams for their family. We never forget that.

What we want every customer to feel:
• "I have someone who genuinely cares about my business."
• "They are honest with me — even when it's not what I want to hear."
• "They treat me with dignity and respect, no matter how small my business is."
• "They celebrate my wins like their own." """},

  {"category":"Core Values","emoji":"❤️","title":"Our Five Core Values",
   "summary":"The five values that are the soul of Bizaxl.",
   "content":"""🔍 Truth & Honesty
We are always transparent — about what we can do, what we can't, and what it costs.

❤️ Compassion & Empathy
We listen with care and respond with kindness. Every customer is a fellow human.

🙏 Respect
We never talk down. Every customer deserves dignity, no matter their business size.

⚡ Reliability
We are consistently dependable — in our product, our support, and our promises.

🌱 Empowerment
Our goal is to make customers stronger and more confident — not dependent on us."""},

  {"category":"Guiding Principles","emoji":"🧭","title":"How We Live Our Values Every Day",
   "summary":"Five principles that guide every decision and interaction at Bizaxl.",
   "content":"""1. Human first, AI second.
AI is a tool to remove repetitive work. Human judgment, care, and relationships always remain at the centre.

2. Warmth in every interaction.
Every email, call, and message should feel like it's coming from a caring partner — never a cold corporation.

3. Long-term relationship over short-term profit.
We would rather lose a sale today than win it by misleading a customer.

4. Radical transparency.
We openly share our product roadmap, limitations, pricing logic, and data practices. We welcome all feedback.

5. Continuous humility.
We acknowledge we don't know everything. We learn from our customers, admit mistakes quickly, and keep improving."""},

  {"category":"Team Culture","emoji":"👥","title":"How We Work Together",
   "summary":"How we treat each other inside Bizaxl.",
   "content":"""How we work together:
• No hierarchy in conversations — message anyone, including founders, directly.
• Every meeting needs an agenda. No agenda = no meeting.
• Be honest — even when it's uncomfortable. Hard truths are welcome here.
• Disagree respectfully. Challenge ideas, never people.
• Celebrate each other's wins loudly and genuinely.

How we think about customers:
• Start every day asking: "How can I act like a true partner for our customers today?"
• Before any action, ask: "If this customer were my friend, would I still do this?"
• Their stress is real. Their family depends on their business. We carry that with us always.

This handbook belongs to everyone at Bizaxl — from founders to the newest intern. Living these values is not optional. It is who we are."""},

  # HR Policies
  {"category":"Work & Hours","emoji":"🕐","title":"Work Hours & Flexibility",
   "summary":"Core hours 10 AM–5 PM Monday to Friday. We trust you to own your time and results.",
   "content":"""Daily schedule:
• Core hours: 10 AM – 5 PM, Monday to Friday. Be reachable during this window.
• Outside core hours, you manage your own time. What matters is your output, not the clock.
• Hybrid and remote options are available — discuss with your manager based on your role.
• Interns follow the same hours and flexibility. You are a full member of this team.

After hours rule:
• No one is expected to reply after 7 PM or on weekends.
• Genuine emergencies are the only exception — and they should be rare.
• Overworking is never celebrated here. Log off and come back fresh."""},

  {"category":"Leave","emoji":"🏖️","title":"Leave Policy",
   "summary":"12 paid leaves + 8 sick + 6 casual + 10 festival holidays + 2 mental health days per year.",
   "content":"""Leave entitlements per year:
• 12 Paid leave days
• 8 Sick leave days
• 6 Casual leave days
• 10 Festival holidays (your choice from approved list)
• 2 Mental health days (no questions asked)

How to apply:
• Casual leave → inform manager at least 1 day before
• Planned leave → inform at least 3 days before
• Mental health days → no forms, no questions, no explanation needed
• Unused paid leave carries forward — max 10 days
• Festival holidays — pick 10 days based on what you celebrate
• Interns get leave proportional to their internship duration"""},

  {"category":"Pay & Growth","emoji":"📈","title":"Pay & Career Growth",
   "summary":"Salaries on last working day. ₹5,000/year learning budget. Quarterly check-ins.",
   "content":"""Salary & payments:
• Salaries credited on the last working day of every month — always, no delays.
• Intern stipend is confirmed clearly before joining. Zero surprises.
• Expense reimbursements within 7 working days of submission.
• Salary revisions shared in writing 30 days in advance.
• Pay questions? Ask HR directly — we are fully transparent.

Learning & career growth:
• ₹5,000 per year learning budget — spend it on any course, book, or workshop you choose.
• Quarterly check-ins (not just once a year) — you always know where you stand.
• Feedback is two-way. You can and should give feedback to your manager too.
• All open positions posted internally first. We grow people from within.
• Interns receive written feedback at mid-internship and end of internship."""},

  {"category":"Safety & Respect","emoji":"🛡️","title":"Safety & Respect Policy",
   "summary":"Zero tolerance for harassment, discrimination, bullying, or dishonesty. Always.",
   "content":"""We do not tolerate:
✗ Harassment of any kind — verbal, written, physical, or digital
✗ Discrimination based on gender, religion, caste, age, sexuality, or background
✗ Bullying or talking down to any colleague, intern, or customer
✗ Dishonesty — lying, hiding errors, or taking credit for others' work
✗ Sharing customer or company data with anyone outside without permission

If something feels wrong:
• Speak to your manager, HR, or the founder directly — or raise it anonymously.
• Every complaint is handled with full seriousness and confidentiality.
• Zero retaliation for raising a genuine concern. Ever."""},

  {"category":"Joining & Exit","emoji":"🚪","title":"Joining & Exit Process",
   "summary":"Your first day and last day both matter. Clear, fair, and respectful process.",
   "content":"""When you join:
• Offer letter sent within 2 days of verbal confirmation.
• First week: Orientation and team intros. Zero pressure to perform immediately.
• A buddy assigned for your first 30 days. No question is silly.

When you leave:
• Notice period: 30 days for employees · 15 days for interns.
• Final settlement: All dues cleared within 15 working days of last day.
• Exit interview: Optional, but we genuinely value your honest feedback.

You always leave on good terms. You are part of the Bizaxl family even after you move on."""},
]

def serialize_policy(p, read_list=None):
    return {
        "id": str(p["_id"]),
        "category": p["category"],
        "emoji": p.get("emoji","📋"),
        "title": p["title"],
        "summary": p["summary"],
        "content": p["content"],
        "created_at": p["created_at"].strftime("%d %b %Y") if hasattr(p.get("created_at"),"strftime") else "",
        "read": str(p["_id"]) in (read_list or []),
    }

@policies_bp.route("/policies", methods=["GET"])
@jwt_required()
def get_policies():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    read_list = [str(r) for r in user.get("read_policies",[])]
    ps = list(policies_col.find().sort("created_at", 1))
    return jsonify([serialize_policy(p, read_list) for p in ps]), 200

@policies_bp.route("/policies", methods=["POST"])
@jwt_required()
def create_policy():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error":"Forbidden"}), 403
    data = request.json
    policy = {
        "category": data.get("category","General"),
        "emoji": data.get("emoji","📋"),
        "title": data["title"],
        "summary": data["summary"],
        "content": data["content"],
        "created_at": datetime.datetime.utcnow(),
    }
    r = policies_col.insert_one(policy)
    policy["_id"] = r.inserted_id
    return jsonify(serialize_policy(policy)), 201

@policies_bp.route("/policies/<pid>", methods=["DELETE"])
@jwt_required()
def delete_policy(pid):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error":"Forbidden"}), 403
    policies_col.delete_one({"_id": ObjectId(pid)})
    return jsonify({"ok": True}), 200

@policies_bp.route("/policies/seed", methods=["POST"])
@jwt_required()
def seed_policies():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error":"Forbidden"}), 403
    inserted = 0
    for p in HANDBOOK_POLICIES:
        if not policies_col.find_one({"title": p["title"]}):
            p2 = dict(p)
            p2["created_at"] = datetime.datetime.utcnow()
            policies_col.insert_one(p2)
            inserted += 1
    return jsonify({"message": f"Seeded {inserted} policies from Company Handbook & HR Policies"}), 200

@policies_bp.route("/policies/<pid>/read", methods=["POST"])
@jwt_required()
def mark_read(pid):
    uid = get_jwt_identity()
    users_col.update_one({"_id": ObjectId(uid)}, {"$addToSet": {"read_policies": pid}})
    return jsonify({"ok": True}), 200
