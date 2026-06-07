from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models.db import users_col
import bcrypt
from bson import ObjectId
import datetime

auth_bp = Blueprint("auth", __name__)

def serialize_user(u):
    return {
        "id": str(u["_id"]),
        "name": u["name"],
        "email": u["email"],
        "phone": u.get("phone",""),
        "company": u["company"],
        "department": u.get("department",""),
        "role": u.get("role","employee"),
        "hostinger_email": u.get("hostinger_email",""),
    }

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    for f in ["name","email","password","phone","company"]:
        if not data.get(f): return jsonify({"error": f"{f} is required"}), 400
    if users_col.find_one({"email": data["email"]}):
        return jsonify({"error":"Email already registered"}), 409
    hashed = bcrypt.hashpw(data["password"].encode(), bcrypt.gensalt())
    # Normalize: always store as uppercase internally for logic, display as proper
    company = data["company"].upper()
    is_first = not users_col.find_one({"company": company})
    user = {
        "name": data["name"],
        "email": data["email"],
        "password": hashed,
        "phone": data["phone"],
        "company": company,
        "department": data.get("department",""),
        "role": "admin" if is_first else "employee",
        "hostinger_email": "",
        "hostinger_password_plain": "",
        "read_policies": [],
        "created_at": datetime.datetime.utcnow(),
    }
    result = users_col.insert_one(user)
    user["_id"] = result.inserted_id
    token = create_access_token(identity=str(result.inserted_id), expires_delta=datetime.timedelta(days=7))
    return jsonify({"token": token, "user": serialize_user(user)}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    user = users_col.find_one({"email": data.get("email")})
    if not user or not bcrypt.checkpw(data.get("password","").encode(), user["password"]):
        return jsonify({"error":"Invalid email or password"}), 401
    token = create_access_token(identity=str(user["_id"]), expires_delta=datetime.timedelta(days=7))
    return jsonify({"token": token, "user": serialize_user(user)}), 200

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if not user: return jsonify({"error":"Not found"}), 404
    return jsonify(serialize_user(user)), 200

@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    uid = get_jwt_identity()
    data = request.json
    allowed = ["name","phone","department","hostinger_email","hostinger_password_plain"]
    update = {k:data[k] for k in allowed if k in data}
    users_col.update_one({"_id": ObjectId(uid)}, {"$set": update})
    user = users_col.find_one({"_id": ObjectId(uid)})
    return jsonify(serialize_user(user)), 200
