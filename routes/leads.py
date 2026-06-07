from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db, users_col
from bson import ObjectId
import datetime

leads_bp = Blueprint("leads", __name__)
leads_col = db["leads"]

def serialize_lead(l):
    return {
        "id": str(l["_id"]),
        "title": l["title"],
        "source": l.get("source",""),  # circle|linkedin|instagram|facebook|whatsapp|other
        "platform": l.get("platform",""),
        "contact_name": l.get("contact_name",""),
        "contact_info": l.get("contact_info",""),
        "company": l.get("company",""),
        "description": l.get("description",""),
        "status": l.get("status","new"),  # new|contacted|qualified|converted|lost
        "submitted_by": l.get("submitted_by_name",""),
        "submitted_dept": l.get("submitted_dept",""),
        "created_at": l["created_at"].strftime("%d %b %Y") if hasattr(l.get("created_at"),"strftime") else "",
        "submitted_by_id": l.get("submitted_by_id",""),
    }

@leads_bp.route("/leads", methods=["GET"])
@jwt_required()
def get_leads():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    role = user.get("role","employee")
    dept = user.get("department","")
    status_filter = request.args.get("status","")
    q = {}
    if status_filter: q["status"] = status_filter
    # Marketing sees all; others see only their own submissions
    if role != "admin" and dept != "Marketing":
        q["submitted_by_id"] = uid
    ls = list(leads_col.find(q).sort("created_at",-1))
    return jsonify([serialize_lead(l) for l in ls]), 200

@leads_bp.route("/leads", methods=["POST"])
@jwt_required()
def create_lead():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    data = request.json
    lead = {
        "title": data.get("title",""),
        "source": data.get("source","other"),
        "platform": data.get("platform",""),
        "contact_name": data.get("contact_name",""),
        "contact_info": data.get("contact_info",""),
        "company": data.get("company",""),
        "description": data.get("description",""),
        "status": "new",
        "submitted_by_id": uid,
        "submitted_by_name": user["name"],
        "submitted_dept": user.get("department",""),
        "created_at": datetime.datetime.utcnow(),
    }
    r = leads_col.insert_one(lead)
    lead["_id"] = r.inserted_id
    return jsonify(serialize_lead(lead)), 201

@leads_bp.route("/leads/<lid>/status", methods=["PUT"])
@jwt_required()
def update_lead_status(lid):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin" and user.get("department") != "Marketing":
        return jsonify({"error":"Forbidden"}), 403
    data = request.json
    leads_col.update_one({"_id": ObjectId(lid)}, {"$set":{"status": data.get("status","new")}})
    return jsonify({"ok":True}), 200

@leads_bp.route("/leads/<lid>", methods=["DELETE"])
@jwt_required()
def delete_lead(lid):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    lead = leads_col.find_one({"_id": ObjectId(lid)})
    if not lead: return jsonify({"error":"Not found"}), 404
    if user.get("role") != "admin" and lead.get("submitted_by_id") != uid:
        return jsonify({"error":"Forbidden"}), 403
    leads_col.delete_one({"_id": ObjectId(lid)})
    return jsonify({"ok":True}), 200
