from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db, users_col
from bson import ObjectId
import datetime

quicklinks_bp = Blueprint("quicklinks", __name__)
ql_col = db["quick_links"]

def serialize_ql(q):
    return {
        "id": str(q["_id"]),
        "title": q["title"],
        "url": q["url"],
        "icon": q.get("icon","🔗"),
        "dept": q.get("dept","all"),  # all | dept name
        "created_by": q.get("created_by_name",""),
        "created_at": q["created_at"].strftime("%d %b %Y") if hasattr(q.get("created_at"),"strftime") else "",
    }

@quicklinks_bp.route("/quicklinks", methods=["GET"])
@jwt_required()
def get_quicklinks():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    dept = user.get("department","")
    q = {"$or": [{"dept":"all"}, {"dept": dept}]}
    links = list(ql_col.find(q).sort("created_at",-1))
    return jsonify([serialize_ql(l) for l in links]), 200

@quicklinks_bp.route("/quicklinks", methods=["POST"])
@jwt_required()
def create_quicklink():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error":"Forbidden"}), 403
    data = request.json
    link = {
        "title": data.get("title",""),
        "url": data.get("url",""),
        "icon": data.get("icon","🔗"),
        "dept": data.get("dept","all"),
        "created_by_id": uid,
        "created_by_name": user["name"],
        "created_at": datetime.datetime.utcnow(),
    }
    r = ql_col.insert_one(link)
    link["_id"] = r.inserted_id
    return jsonify(serialize_ql(link)), 201

@quicklinks_bp.route("/quicklinks/<lid>", methods=["DELETE"])
@jwt_required()
def delete_quicklink(lid):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error":"Forbidden"}), 403
    ql_col.delete_one({"_id": ObjectId(lid)})
    return jsonify({"ok":True}), 200
