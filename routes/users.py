from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import users_col, db
from bson import ObjectId

users_bp = Blueprint("users", __name__)
depts_col = db["departments"]

def serialize_user(u):
    return {
        "id": str(u["_id"]),
        "name": u["name"],
        "email": u["email"],
        "phone": u.get("phone",""),
        "company": u["company"],
        "department": u.get("department",""),
        "role": u.get("role","employee"),
    }

# ── Departments ────────────────────────────────────────────
@users_bp.route("/departments", methods=["GET"])
@jwt_required()
def get_departments():
    depts = list(depts_col.find().sort("name",1))
    result = []
    for d in depts:
        count = users_col.count_documents({"department": d["name"], "company": "BIZAXL"})
        result.append({"id": str(d["_id"]), "name": d["name"], "color": d.get("color","#14F1B1"), "icon": d.get("icon","👥"), "member_count": count})
    return jsonify(result), 200

@users_bp.route("/departments", methods=["POST"])
@jwt_required()
def create_department():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error":"Forbidden"}), 403
    data = request.json
    if not data.get("name"):
        return jsonify({"error":"Name required"}), 400
    if depts_col.find_one({"name": data["name"]}):
        return jsonify({"error":"Department already exists"}), 409
    import datetime
    dept = {"name": data["name"], "color": data.get("color","#14F1B1"), "icon": data.get("icon","👥"), "created_at": datetime.datetime.utcnow()}
    r = depts_col.insert_one(dept)
    dept["_id"] = r.inserted_id
    return jsonify({"id": str(dept["_id"]), "name": dept["name"], "color": dept["color"], "icon": dept["icon"], "member_count": 0}), 201

@users_bp.route("/departments/<did>", methods=["DELETE"])
@jwt_required()
def delete_department(did):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error":"Forbidden"}), 403
    dept = depts_col.find_one({"_id": ObjectId(did)})
    if not dept:
        return jsonify({"error":"Not found"}), 404
    depts_col.delete_one({"_id": ObjectId(did)})
    return jsonify({"ok": True}), 200

@users_bp.route("/departments/seed", methods=["POST"])
@jwt_required()
def seed_departments():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error":"Forbidden"}), 403
    import datetime
    defaults = [
        {"name":"Deployment","color":"#3b82f6","icon":"🚀"},
        {"name":"Functional","color":"#8b5cf6","icon":"⚙️"},
        {"name":"Marketing","color":"#ec4899","icon":"📣"},
        {"name":"Research","color":"#10b981","icon":"🔬"},
    ]
    inserted = 0
    for d in defaults:
        if not depts_col.find_one({"name": d["name"]}):
            d["created_at"] = datetime.datetime.utcnow()
            depts_col.insert_one(d)
            inserted += 1
    return jsonify({"message": f"Seeded {inserted} departments"}), 200

# ── Users ──────────────────────────────────────────────────
@users_bp.route("/users", methods=["GET"])
@jwt_required()
def list_users():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error":"Forbidden"}), 403
    company = request.args.get("company")
    q = {}
    if company:
        q["company"] = company
    all_users = list(users_col.find(q))
    return jsonify([serialize_user(u) for u in all_users]), 200

@users_bp.route("/users/<user_id>", methods=["PUT"])
@jwt_required()
def update_user(user_id):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error":"Forbidden"}), 403
    data = request.json
    allowed = ["name","role","department","phone"]
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
        return jsonify({"error":"Forbidden"}), 403
    users_col.delete_one({"_id": ObjectId(user_id)})
    return jsonify({"ok": True}), 200
