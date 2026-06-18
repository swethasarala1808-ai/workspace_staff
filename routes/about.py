from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db, users_col
from bson import ObjectId
import datetime

about_bp = Blueprint("about", __name__)
about_col = db["about_content"]

DEFAULT_CONTENT = {
    "mission": {
        "headline": "We don't just build software.",
        "subheadline": "We build confidence, dignity, and growth.",
        "body": "For every MSME in India — from the retailer who built from nothing to the manufacturer who scaled against all odds — bizaxl exists as their Business Growth Engine.\n\nWe simplify, automate, and accelerate the growth of small and medium businesses across India. We want to be a genuine friend in their journey — one that understands their struggles, respects their efforts, and helps them build sustainable, successful businesses with dignity and peace of mind.",
        "email": "markcom@bizaxl.com",
        "phone": "+91 98867 11156",
        "website": "bizaxl.com",
    },
    "values": [
        {"icon":"🔍","title":"Truth & Honesty","desc":"We are completely transparent about what our software can and cannot do. We never over-promise. Honesty may cost us in the short term — but it earns lasting loyalty, and that is the only kind of growth we want."},
        {"icon":"❤️","title":"Compassion & Empathy","desc":"Running a small business is hard. We never forget that. We listen with care, respond with kindness, and treat every customer as a fellow human being — not a ticket or a revenue number."},
        {"icon":"🙏","title":"Respect","desc":"We respect the courage and hard work of every MSME owner. We never talk down to them or treat them as 'small' because of their current size. Every customer deserves dignity."},
        {"icon":"⚡","title":"Reliability","desc":"When a small business depends on us, delays hurt real people and real families. We commit to being consistently dependable — in our product, our support, and our promises."},
        {"icon":"🌱","title":"Empowerment","desc":"Our goal is not to make customers dependent on us forever. It is to make them stronger, smarter, and more confident in their own business."},
    ],
    "principles": [
        {"title":"Human First. AI Second. Always.","desc":"AI is a tool to remove repetitive work. Human judgment, care, and relationships always remain at the centre."},
        {"title":"Warmth in every interaction.","desc":"Every email, call, and message should feel like it's coming from a caring partner — never a cold corporation."},
        {"title":"Long-term relationship over short-term profit.","desc":"We would rather lose a sale today than win it by misleading a customer."},
        {"title":"Radical transparency.","desc":"We openly share our product roadmap, limitations, pricing logic, and data practices. We welcome all feedback."},
        {"title":"Continuous humility.","desc":"We acknowledge we don't know everything. We learn from our customers, admit mistakes quickly, and keep improving."},
    ],
    "promise": [
        "Honest advice, even if it means we sell you less.",
        "Patient support that respects your pace and understanding.",
        "Solutions designed with real care for your challenges.",
        "A team that celebrates your wins as if they were our own.",
        "A partner that treats you with dignity and genuine respect.",
    ],
    "team_note": {
        "intro": "This is not just a company document. This is who we are.",
        "checks": [
            "Does this sound warm and human?",
            "Am I being fully honest?",
            "Have I shown respect and empathy?",
            "Would I say this to a family member who runs a business?",
        ],
        "closing": "Every customer you speak to has a person at bizaxl. That person is you.",
        "subtext": "Make them feel it.",
    },
    "company": {
        "what_is": "bizaxl is a business acceleration suite built specifically for Indian MSMEs. The easiest way to think about it is as one platform that runs the everyday operations of a small or mid-sized business, instead of that business having to juggle five or six different tools or rely on spreadsheets and paper registers. The product brings together accounting, HR and payroll, inventory management, project tracking, asset management, and manufacturing operations into a single connected system, so a business owner or manager isn't switching between disconnected apps just to get a full picture of how their company is doing on any given day.",
        "why_exists": "The reason bizaxl exists comes down to a handful of problems that show up again and again across small and mid-sized businesses in India. Data tends to live in silos, so there's no single, reliable source of truth that everyone in the business can trust. A huge amount of time goes into manual processes — things like invoicing or following up with clients — that should realistically take seconds but end up eating hours every week. Owners and managers are often making decisions without any real-time visibility into what's actually happening in their business, which means they're reacting to problems after the fact rather than catching them early. On top of that, most of the software available to smaller businesses is either too complicated to adopt properly or it works fine while the business is small but starts breaking down the moment that business grows and needs more from its systems. bizaxl was built specifically to solve those problems for MSMEs, rather than being a stripped-down version of software designed for large enterprises.",
        "modules": [
            {"name":"Accounting","desc":"Automated bookkeeping, invoicing, payments, and real-time financial reporting — no manual data entry."},
            {"name":"HR & Payroll","desc":"Manages the full employee lifecycle — attendance, leave, payroll processing, and compliance, mostly automated."},
            {"name":"Inventory & Stock","desc":"Real-time tracking of stock levels with automated reordering and streamlined warehouse operations."},
            {"name":"Projects","desc":"Lets teams plan, track, and manage work using tasks, timesheets, and budgets, all in one place."},
            {"name":"Assets","desc":"Covers the full lifecycle of company equipment — acquisition, depreciation, and ongoing maintenance."},
            {"name":"Manufacturing","desc":"Handles bills of materials, work orders, and job cards to keep production running efficiently."},
        ],
        "customer_journey": "From the customer's side, the experience starts with booking a demo, where our team walks them through the platform live. From there, they pick the vertical that matches their business from more than ninety pre-configured industry templates — whether that's a tuition centre, a medical store, a manufacturing unit, or any number of other business types. Once they've made that choice, bizaxl builds their tailored instance of the platform in under ten minutes, and they're handed a workspace that's already configured for the way their specific industry operates, rather than a blank system they have to set up from scratch.",
        "industries": "We currently serve more than one hundred and fifty industries, spanning education, healthcare, retail, manufacturing, hospitality, professional services, construction, agriculture, financial services, beauty and wellness, and a long list of others. A tuition centre and a medical store don't run their day-to-day operations the same way, so there's no reason they should be forced into the same generic software setup. Each industry template comes pre-loaded with the fields, workflows, and reports that actually make sense for that kind of business.",
        "differentiators": [
            {"title":"Industry-specific, not generic","desc":"Every template is built around a particular type of business rather than handing the customer a blank slate to configure themselves."},
            {"title":"Fast to deploy","desc":"Customers go live in minutes rather than months, removing the long, expensive implementation projects common with traditional business software."},
            {"title":"AI-human hybrid","desc":"A lot of the repetitive back-office work gets automated, freeing people up to focus on actually running the business."},
            {"title":"Built for MSMEs specifically","desc":"Not a cut-down version of something designed for much larger enterprises — built from the ground up for MSMEs."},
        ],
        "company_info": "We're bizaxl Optimisations LLP, headquartered in Bengaluru. The product is the bizaxl Business Acceleration Suite, and our focus is on Indian MSMEs across 150-plus industries. For anything customer-facing or marketing-related, the point of contact is markcom@bizaxl.com.",
    },
}

def get_content():
    doc = about_col.find_one({"_id": "main"})
    if not doc:
        about_col.insert_one({"_id": "main", **DEFAULT_CONTENT, "updated_at": datetime.datetime.utcnow()})
        return DEFAULT_CONTENT
    doc.pop("_id", None)
    doc.pop("updated_at", None)
    # Backfill any new top-level sections (e.g. "company") that existed docs predate
    changed = False
    for key, default_val in DEFAULT_CONTENT.items():
        if key not in doc:
            doc[key] = default_val
            changed = True
    if changed:
        about_col.update_one({"_id": "main"}, {"$set": doc})
    return doc

@about_bp.route("/about_content", methods=["GET"])
@jwt_required()
def get_about():
    return jsonify(get_content()), 200

@about_bp.route("/about_content", methods=["PUT"])
@jwt_required()
def update_about():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error": "Forbidden"}), 403
    data = request.json
    allowed = ["mission","values","principles","promise","team_note","company"]
    update = {k: data[k] for k in allowed if k in data}
    update["updated_at"] = datetime.datetime.utcnow()
    about_col.update_one({"_id":"main"}, {"$set": update}, upsert=True)
    return jsonify(get_content()), 200

@about_bp.route("/about_content/reset", methods=["POST"])
@jwt_required()
def reset_about():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error": "Forbidden"}), 403
    about_col.delete_one({"_id": "main"})
    return jsonify(get_content()), 200
