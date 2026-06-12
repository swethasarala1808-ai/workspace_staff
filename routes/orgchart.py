from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db, users_col
from bson import ObjectId
import datetime

orgchart_bp = Blueprint("orgchart", __name__)
org_col = db["org_nodes"]

def serialize_node(n):
    return {
        "id": str(n["_id"]),
        "name": n["name"],
        "title": n.get("title",""),
        "type": n.get("type","employee"),  # founder|dept_head|lead|employee|intern
        "department": n.get("department",""),
        "parent_id": n.get("parent_id",""),
        "email": n.get("email",""),
        "linked_user_id": n.get("linked_user_id",""),
        "order": n.get("order", 0),
    }

@orgchart_bp.route("/org", methods=["GET"])
@jwt_required()
def get_org():
    nodes = list(org_col.find().sort("order", 1))
    return jsonify([serialize_node(n) for n in nodes]), 200

@orgchart_bp.route("/org", methods=["POST"])
@jwt_required()
def create_node():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error": "Forbidden"}), 403
    data = request.json
    node = {
        "name": data.get("name", ""),
        "title": data.get("title", ""),
        "type": data.get("type", "employee"),
        "department": data.get("department", ""),
        "parent_id": data.get("parent_id", ""),
        "email": data.get("email", ""),
        "linked_user_id": data.get("linked_user_id", ""),
        "order": data.get("order", 99),
        "created_at": datetime.datetime.utcnow(),
    }
    r = org_col.insert_one(node)
    node["_id"] = r.inserted_id
    return jsonify(serialize_node(node)), 201

@orgchart_bp.route("/org/<nid>", methods=["PUT"])
@jwt_required()
def update_node(nid):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error": "Forbidden"}), 403
    data = request.json
    allowed = ["name","title","type","department","parent_id","email","linked_user_id","order"]
    update = {k: data[k] for k in allowed if k in data}
    org_col.update_one({"_id": ObjectId(nid)}, {"$set": update})
    node = org_col.find_one({"_id": ObjectId(nid)})
    return jsonify(serialize_node(node)), 200

@orgchart_bp.route("/org/<nid>", methods=["DELETE"])
@jwt_required()
def delete_node(nid):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error": "Forbidden"}), 403
    # Also delete all children
    org_col.delete_many({"parent_id": nid})
    org_col.delete_one({"_id": ObjectId(nid)})
    return jsonify({"ok": True}), 200

@orgchart_bp.route("/org/seed", methods=["POST"])
@jwt_required()
def seed_org():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error": "Forbidden"}), 403
    if org_col.count_documents({}) > 0:
        return jsonify({"message": "Org chart already has data"}), 200
    import datetime as dt
    now = dt.datetime.utcnow()
    # Founder
    founder = org_col.insert_one({"name":"Founder / CEO","title":"Founder & CEO","type":"founder","department":"","parent_id":"","email":"","linked_user_id":"","order":0,"created_at":now})
    fid = str(founder.inserted_id)
    # Departments
    depts = [
        ("Deployment","Deployment Head","dept_head",1),
        ("Functional","Functional Head","dept_head",2),
        ("Marketing","Marketing Head","dept_head",3),
        ("Research","Research Head","dept_head",4),
    ]
    for dept_name, title, node_type, order in depts:
        org_col.insert_one({"name":title,"title":title,"type":node_type,"department":dept_name,"parent_id":fid,"email":"","linked_user_id":"","order":order,"created_at":now})
    return jsonify({"message": "Org chart seeded with founder and department heads"}), 200
