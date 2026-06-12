from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db, users_col
from bson import ObjectId
import datetime

announcements_bp = Blueprint("announcements", __name__)
ann_col = db["announcements"]

def serialize_ann(a):
    return {
        "id": str(a["_id"]),
        "type": a.get("type","welcome"),  # welcome | general
        "title": a["title"],
        "message": a.get("message",""),
        "person_name": a.get("person_name",""),
        "person_dept": a.get("person_dept",""),
        "person_role": a.get("person_role",""),
        "created_by": a.get("created_by_name","Admin"),
        "created_at": a["created_at"].strftime("%d %b %Y") if hasattr(a.get("created_at"),"strftime") else "",
        "active": a.get("active",True),
    }

@announcements_bp.route("/announcements", methods=["GET"])
@jwt_required()
def get_announcements():
    anns = list(ann_col.find({"active":True}).sort("created_at",-1).limit(10))
    return jsonify([serialize_ann(a) for a in anns]), 200

@announcements_bp.route("/announcements", methods=["POST"])
@jwt_required()
def create_announcement():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error":"Forbidden"}), 403
    data = request.json
    ann = {
        "type": data.get("type","welcome"),
        "title": data.get("title",""),
        "message": data.get("message",""),
        "person_name": data.get("person_name",""),
        "person_dept": data.get("person_dept",""),
        "person_role": data.get("person_role",""),
        "created_by_id": uid,
        "created_by_name": user["name"],
        "active": True,
        "created_at": datetime.datetime.utcnow(),
    }
    r = ann_col.insert_one(ann)
    ann["_id"] = r.inserted_id
    return jsonify(serialize_ann(ann)), 201

@announcements_bp.route("/announcements/<aid>", methods=["DELETE"])
@jwt_required()
def delete_announcement(aid):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error":"Forbidden"}), 403
    ann_col.delete_one({"_id": ObjectId(aid)})
    return jsonify({"ok":True}), 200

# ── Daily quote override ──────────────────────────────────
quotes_col = db["daily_quotes"]

@announcements_bp.route("/daily_quote", methods=["GET"])
@jwt_required()
def get_daily_quote():
    from datetime import datetime
    today = datetime.utcnow().strftime("%Y-%m-%d")
    q = quotes_col.find_one({"date": today})
    if q:
        return jsonify({"text": q["text"], "attr": q["attr"], "custom": True}), 200
    return jsonify({"custom": False}), 200

@announcements_bp.route("/daily_quote", methods=["POST"])
@jwt_required()
def set_daily_quote():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error":"Forbidden"}), 403
    from datetime import datetime
    data = request.json
    today = datetime.utcnow().strftime("%Y-%m-%d")
    quotes_col.update_one({"date": today}, {"$set": {"text": data["text"], "attr": data.get("attr",""), "date": today}}, upsert=True)
    return jsonify({"ok": True}), 200
