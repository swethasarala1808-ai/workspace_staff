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
}

def get_content():
    doc = about_col.find_one({"_id": "main"})
    if not doc:
        about_col.insert_one({"_id": "main", **DEFAULT_CONTENT, "updated_at": datetime.datetime.utcnow()})
        return DEFAULT_CONTENT
    doc.pop("_id", None)
    doc.pop("updated_at", None)
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
    allowed = ["mission","values","principles","promise","team_note"]
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
