from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import policies_col, users_col
from bson import ObjectId
import datetime

policies_bp = Blueprint("policies", __name__)

DEFAULT_POLICIES = [
    {
        "category": "Leave",
        "emoji": "🏖️",
        "title": "Leave Policy",
        "summary": "How to request time off — simple and fair",
        "content": "You get 18 days of paid leave per year. To request leave, just message your manager at least 3 days in advance (except emergencies). Sick leave is separate — 10 days per year, no questions asked. Carry forward up to 5 unused days to next year.",
    },
    {
        "category": "Code of Conduct",
        "emoji": "🤝",
        "title": "How We Work Together",
        "summary": "Be kind, be honest, be awesome",
        "content": "We treat everyone with respect — no bullying, no discrimination, no drama. Speak up if something doesn't feel right. We fix problems together. Keep company info private. Don't use work resources for personal business. Simple as that.",
    },
    {
        "category": "Remote Work",
        "emoji": "🏠",
        "title": "Working From Home",
        "summary": "Work from anywhere, stay connected",
        "content": "You can work from home up to 2 days a week. Be online during core hours (10 AM–4 PM your time). Join team standups. Keep your camera on for important meetings. If you need better internet or a desk setup, talk to HR — we'll help.",
    },
    {
        "category": "Benefits",
        "emoji": "🎁",
        "title": "What You Get",
        "summary": "Health, snacks, learning and more",
        "content": "You get health insurance (you + family), ₹20,000/year for learning and courses, free lunch in office, annual team offsite, and birthday leave. Ask HR for the full benefits document. We review benefits every year and try to improve them.",
    },
    {
        "category": "Performance",
        "emoji": "🚀",
        "title": "How We Review Performance",
        "summary": "Honest feedback twice a year",
        "content": "We do reviews in June and December. Your manager shares feedback, you share yours. No surprise ratings — we talk throughout the year. Good work gets recognized with bonuses and promotions. If something isn't working, we figure it out together early.",
    },
]

def serialize_policy(p, read_list=None):
    return {
        "id": str(p["_id"]),
        "category": p["category"],
        "emoji": p.get("emoji", "📄"),
        "title": p["title"],
        "summary": p["summary"],
        "content": p["content"],
        "created_at": p["created_at"].isoformat(),
        "read": str(p["_id"]) in (read_list or []),
    }

@policies_bp.route("/policies", methods=["GET"])
@jwt_required()
def get_policies():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    read_list = [str(r) for r in user.get("read_policies", [])]
    ps = list(policies_col.find().sort("created_at", -1))
    return jsonify([serialize_policy(p, read_list) for p in ps]), 200

@policies_bp.route("/policies", methods=["POST"])
@jwt_required()
def create_policy():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error": "Forbidden"}), 403
    data = request.json
    policy = {
        "category": data["category"],
        "emoji": data.get("emoji", "📄"),
        "title": data["title"],
        "summary": data["summary"],
        "content": data["content"],
        "created_at": datetime.datetime.utcnow(),
    }
    result = policies_col.insert_one(policy)
    policy["_id"] = result.inserted_id
    return jsonify(serialize_policy(policy)), 201

@policies_bp.route("/policies/seed", methods=["POST"])
@jwt_required()
def seed_policies():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error": "Forbidden"}), 403
    inserted = 0
    for p in DEFAULT_POLICIES:
        if not policies_col.find_one({"title": p["title"]}):
            p["created_at"] = datetime.datetime.utcnow()
            policies_col.insert_one(p)
            inserted += 1
    return jsonify({"message": f"Seeded {inserted} policies"}), 200

@policies_bp.route("/policies/<policy_id>/read", methods=["POST"])
@jwt_required()
def mark_read(policy_id):
    uid = get_jwt_identity()
    users_col.update_one(
        {"_id": ObjectId(uid)},
        {"$addToSet": {"read_policies": policy_id}}
    )
    return jsonify({"ok": True}), 200
