from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import users_col
from bson import ObjectId

users_bp = Blueprint("users", __name__)

def serialize_user(u):
    return {
        "id": str(u["_id"]),
        "name": u["name"],
        "email": u["email"],
        "phone": u.get("phone", ""),
        "company": u["company"],
        "department": u.get("department", ""),
        "role": u.get("role", "employee"),
    }

@users_bp.route("/users", methods=["GET"])
@jwt_required()
def list_users():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error": "Forbidden"}), 403
    company = request.args.get("company")
    query = {}
    if company:
        query["company"] = company
    all_users = list(users_col.find(query))
    return jsonify([serialize_user(u) for u in all_users]), 200

@users_bp.route("/users/<user_id>", methods=["PUT"])
@jwt_required()
def update_user(user_id):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error": "Forbidden"}), 403
    data = request.json
    allowed = ["name", "role", "department", "phone"]
    update = {k: data[k] for k in allowed if k in data}
    users_col.update_one({"_id": ObjectId(user_id)}, {"$set": update})
    updated = users_col.find_one({"_id": ObjectId(user_id)})
    return jsonify(serialize_user(updated)), 200

@users_bp.route("/users/<user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error": "Forbidden"}), 403
    users_col.delete_one({"_id": ObjectId(user_id)})
    return jsonify({"ok": True}), 200

@users_bp.route("/team", methods=["GET"])
@jwt_required()
def get_team():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    team = list(users_col.find(
        {"company": user["company"], "department": user.get("department")},
        {"name": 1, "email": 1, "department": 1, "role": 1}
    ))
    return jsonify([serialize_user(u) for u in team]), 200
