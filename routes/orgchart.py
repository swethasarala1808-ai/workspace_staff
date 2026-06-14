from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db, users_col
from bson import ObjectId
import datetime

orgchart_bp = Blueprint("orgchart", __name__)
orgchart_col = db["org_chart"]

def serialize_node(n):
    return {
        "id": str(n["_id"]),
        "name": n["name"],
        "role": n.get("role_title",""),
        "department": n.get("department",""),
        "level": n.get("level", 0),
        "parent_id": n.get("parent_id",""),
        "color": n.get("color","#14F1B1"),
        "user_id": n.get("user_id",""),
        "avatar": n.get("avatar",""),
    }

@orgchart_bp.route("/orgchart", methods=["GET"])
@jwt_required()
def get_orgchart():
    nodes = list(orgchart_col.find().sort("level", 1))
    return jsonify([serialize_node(n) for n in nodes]), 200

@orgchart_bp.route("/orgchart", methods=["POST"])
@jwt_required()
def create_node():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error": "Forbidden"}), 403
    data = request.json
    node = {
        "name": data.get("name",""),
        "role_title": data.get("role_title",""),
        "department": data.get("department",""),
        "level": int(data.get("level", 0)),
        "parent_id": data.get("parent_id",""),
        "color": data.get("color","#14F1B1"),
        "user_id": data.get("user_id",""),
        "created_at": datetime.datetime.utcnow(),
    }
    r = orgchart_col.insert_one(node)
    node["_id"] = r.inserted_id
    return jsonify(serialize_node(node)), 201

@orgchart_bp.route("/orgchart/<nid>", methods=["PUT"])
@jwt_required()
def update_node(nid):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error": "Forbidden"}), 403
    data = request.json
    allowed = ["name","role_title","department","level","parent_id","color","user_id"]
    update = {k: data[k] for k in allowed if k in data}
    orgchart_col.update_one({"_id": ObjectId(nid)}, {"$set": update})
    node = orgchart_col.find_one({"_id": ObjectId(nid)})
    return jsonify(serialize_node(node)), 200

@orgchart_bp.route("/orgchart/<nid>", methods=["DELETE"])
@jwt_required()
def delete_node(nid):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error": "Forbidden"}), 403
    # Delete children too
    orgchart_col.delete_many({"parent_id": nid})
    orgchart_col.delete_one({"_id": ObjectId(nid)})
    return jsonify({"ok": True}), 200

@orgchart_bp.route("/orgchart/seed", methods=["POST"])
@jwt_required()
def seed_orgchart():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error": "Forbidden"}), 403
    if orgchart_col.count_documents({}) > 0:
        return jsonify({"message": "Already has data"}), 200
    from datetime import datetime as dt
    nodes = [
        {"name":"Founder","role_title":"Founder & CEO","department":"Leadership","level":0,"parent_id":"","color":"#05133c"},
        {"name":"Deployment Head","role_title":"Department Head","department":"Deployment","level":1,"parent_id":"founder","color":"#3b82f6"},
        {"name":"Functional Head","role_title":"Department Head","department":"Functional","level":1,"parent_id":"founder","color":"#8b5cf6"},
        {"name":"Marketing Head","role_title":"Department Head","department":"Marketing","level":1,"parent_id":"founder","color":"#ec4899"},
        {"name":"Research Head","role_title":"Department Head","department":"Research","level":1,"parent_id":"founder","color":"#10b981"},
    ]
    inserted_ids = {}
    for n in nodes:
        n["created_at"] = dt.utcnow()
        pid = n.get("parent_id","")
        if pid in inserted_ids:
            n["parent_id"] = inserted_ids[pid]
        r = orgchart_col.insert_one(dict(n))
        key = n["role_title"].split()[0].lower() if "Founder" in n["name"] else n["name"].split()[0].lower()
        inserted_ids[key] = str(r.inserted_id)
        if "Founder" in n["name"]:
            inserted_ids["founder"] = str(r.inserted_id)
    return jsonify({"message": "Seeded org chart"}), 200
