from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import ideas_col, users_col
from bson import ObjectId
import datetime

ideas_bp = Blueprint("ideas", __name__)

def serialize_idea(idea, uid=None):
    return {
        "id": str(idea["_id"]),
        "title": idea["title"],
        "description": idea["description"],
        "tags": idea.get("tags",[]),
        "status": idea.get("status","Open"),
        "author_id": idea.get("author_id",""),
        "author_name": idea.get("author_name",""),
        "author_dept": idea.get("author_dept",""),
        "like_count": len(idea.get("likes",[])),
        "likes": idea.get("likes",[]),
        "comments": idea.get("comments",[]),
        "created_at": idea["created_at"].isoformat() if hasattr(idea.get("created_at"),"isoformat") else "",
    }

@ideas_bp.route("/ideas", methods=["GET"])
@jwt_required()
def get_ideas():
    sort_by = request.args.get("sort","newest")
    sort = [("created_at",-1)] if sort_by=="newest" else [("like_count",-1)]
    # Add computed like_count for sorting
    pipeline = [
        {"$addFields":{"like_count":{"$size":{"$ifNull":["$likes",[]]}}}},
        {"$sort":{"like_count":-1} if sort_by=="liked" else {"created_at":-1}},
    ]
    ideas = list(ideas_col.aggregate(pipeline))
    uid = get_jwt_identity()
    return jsonify([serialize_idea(i,uid) for i in ideas]), 200

@ideas_bp.route("/ideas", methods=["POST"])
@jwt_required()
def create_idea():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    data = request.json
    idea = {
        "title": data.get("title",""),
        "description": data.get("description",""),
        "tags": data.get("tags",[]),
        "status": "Open",
        "author_id": uid,
        "author_name": user["name"],
        "author_dept": user.get("department",""),
        "likes": [],
        "comments": [],
        "created_at": datetime.datetime.utcnow(),
    }
    r = ideas_col.insert_one(idea)
    idea["_id"] = r.inserted_id
    return jsonify(serialize_idea(idea)), 201

@ideas_bp.route("/ideas/<iid>", methods=["PUT"])
@jwt_required()
def update_idea(iid):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    idea = ideas_col.find_one({"_id": ObjectId(iid)})
    if not idea: return jsonify({"error":"Not found"}), 404
    if idea.get("author_id") != uid and user.get("role") != "admin":
        return jsonify({"error":"Forbidden"}), 403
    data = request.json
    update = {}
    for f in ["title","description","tags"]:
        if f in data: update[f] = data[f]
    ideas_col.update_one({"_id":ObjectId(iid)},{"$set":update})
    idea = ideas_col.find_one({"_id":ObjectId(iid)})
    return jsonify(serialize_idea(idea)), 200

@ideas_bp.route("/ideas/<iid>", methods=["DELETE"])
@jwt_required()
def delete_idea(iid):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    idea = ideas_col.find_one({"_id": ObjectId(iid)})
    if not idea: return jsonify({"error":"Not found"}), 404
    if idea.get("author_id") != uid and user.get("role") != "admin":
        return jsonify({"error":"Forbidden"}), 403
    ideas_col.delete_one({"_id":ObjectId(iid)})
    return jsonify({"ok":True}), 200

@ideas_bp.route("/ideas/<iid>/like", methods=["POST"])
@jwt_required()
def like_idea(iid):
    uid = get_jwt_identity()
    idea = ideas_col.find_one({"_id": ObjectId(iid)})
    if not idea: return jsonify({"error":"Not found"}), 404
    likes = idea.get("likes",[])
    if uid in likes:
        ideas_col.update_one({"_id":ObjectId(iid)},{"$pull":{"likes":uid}})
    else:
        ideas_col.update_one({"_id":ObjectId(iid)},{"$addToSet":{"likes":uid}})
    idea = ideas_col.find_one({"_id":ObjectId(iid)})
    return jsonify(serialize_idea(idea)), 200

@ideas_bp.route("/ideas/<iid>/comment", methods=["POST"])
@jwt_required()
def add_comment(iid):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    data = request.json
    comment = {"author":user["name"],"dept":user.get("department",""),"text":data.get("text",""),"created_at":datetime.datetime.utcnow().isoformat()}
    ideas_col.update_one({"_id":ObjectId(iid)},{"$push":{"comments":comment}})
    idea = ideas_col.find_one({"_id":ObjectId(iid)})
    return jsonify(serialize_idea(idea)), 200

@ideas_bp.route("/ideas/<iid>/status", methods=["PUT"])
@jwt_required()
def update_status(iid):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin": return jsonify({"error":"Forbidden"}), 403
    data = request.json
    ideas_col.update_one({"_id":ObjectId(iid)},{"$set":{"status":data.get("status","Open")}})
    idea = ideas_col.find_one({"_id":ObjectId(iid)})
    return jsonify(serialize_idea(idea)), 200
