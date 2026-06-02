from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import materials_col, feedback_col, users_col
from bson import ObjectId
import datetime

materials_bp = Blueprint("materials", __name__)

FEEDBACK_OPTIONS = ["Excellent", "Good", "Okay", "Needs Work", "Bad"]

def serialize_material(m):
    return {
        "id": str(m["_id"]),
        "title": m["title"],
        "description": m.get("description", ""),
        "file_url": m.get("file_url", ""),
        "type": m.get("type", "document"),
        "status": m.get("status", "draft"),
        "created_by": m.get("created_by_name", "Admin"),
        "created_at": m["created_at"].isoformat(),
    }

@materials_bp.route("/materials", methods=["GET"])
@jwt_required()
def get_materials():
    company = request.args.get("company", "BIZAXL")
    ms = list(materials_col.find({"company": company}).sort("created_at", -1))
    return jsonify([serialize_material(m) for m in ms]), 200

@materials_bp.route("/materials", methods=["POST"])
@jwt_required()
def create_material():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error": "Forbidden"}), 403
    data = request.json
    material = {
        "title": data["title"],
        "description": data.get("description", ""),
        "file_url": data.get("file_url", ""),
        "type": data.get("type", "document"),
        "company": data.get("company", "BIZAXL"),
        "status": "active",
        "created_by": uid,
        "created_by_name": user["name"],
        "created_at": datetime.datetime.utcnow(),
    }
    result = materials_col.insert_one(material)
    material["_id"] = result.inserted_id
    return jsonify(serialize_material(material)), 201

@materials_bp.route("/materials/<material_id>/feedback", methods=["POST"])
@jwt_required()
def give_feedback(material_id):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    data = request.json
    rating = data.get("rating")
    if rating not in FEEDBACK_OPTIONS:
        return jsonify({"error": "Invalid rating"}), 400
    fb = {
        "material_id": material_id,
        "user_id": uid,
        "user_name": user["name"],
        "company": user.get("company", ""),
        "rating": rating,
        "comment": data.get("comment", ""),
        "suggestion": data.get("suggestion", ""),
        "created_at": datetime.datetime.utcnow(),
    }
    feedback_col.insert_one(fb)
    return jsonify({"ok": True}), 201

@materials_bp.route("/materials/<material_id>/feedback", methods=["GET"])
@jwt_required()
def get_feedback(material_id):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error": "Forbidden"}), 403
    fbs = list(feedback_col.find({"material_id": material_id}))
    for f in fbs:
        f["id"] = str(f["_id"])
        del f["_id"]
        f["created_at"] = f["created_at"].isoformat()
    return jsonify(fbs), 200
