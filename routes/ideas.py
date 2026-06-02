from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import ideas_col, users_col
from bson import ObjectId
import datetime

ideas_bp = Blueprint("ideas", __name__)

def serialize_idea(i):
    return {
        "id": str(i["_id"]),
        "title": i["title"],
        "description": i["description"],
        "tags": i.get("tags", []),
        "author_name": i.get("author_name", ""),
        "author_dept": i.get("author_dept", ""),
        "likes": i.get("likes", []),
        "like_count": len(i.get("likes", [])),
        "comments": i.get("comments", []),
        "status": i.get("status", "Open"),
        "created_at": i["created_at"].isoformat(),
    }

@ideas_bp.route("/ideas", methods=["GET"])
@jwt_required()
def get_ideas():
    sort = request.args.get("sort", "newest")
    sort_field = "created_at" if sort == "newest" else "like_count"
    ideas = list(ideas_col.find().sort("created_at", -1))
    if sort == "liked":
        ideas.sort(key=lambda x: len(x.get("likes", [])), reverse=True)
    return jsonify([serialize_idea(i) for i in ideas]), 200

@ideas_bp.route("/ideas", methods=["POST"])
@jwt_required()
def post_idea():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    data = request.json
    idea = {
        "title": data["title"],
        "description": data["description"],
        "tags": data.get("tags", []),
        "author_id": uid,
        "author_name": user["name"],
        "author_dept": user.get("department", ""),
        "likes": [],
        "comments": [],
        "status": "Open",
        "created_at": datetime.datetime.utcnow(),
    }
    result = ideas_col.insert_one(idea)
    idea["_id"] = result.inserted_id
    return jsonify(serialize_idea(idea)), 201

@ideas_bp.route("/ideas/<idea_id>/like", methods=["POST"])
@jwt_required()
def like_idea(idea_id):
    uid = get_jwt_identity()
    idea = ideas_col.find_one({"_id": ObjectId(idea_id)})
    if not idea:
        return jsonify({"error": "Not found"}), 404
    likes = idea.get("likes", [])
    if uid in likes:
        likes.remove(uid)
    else:
        likes.append(uid)
    ideas_col.update_one({"_id": ObjectId(idea_id)}, {"$set": {"likes": likes}})
    return jsonify({"likes": len(likes), "liked": uid in likes}), 200

@ideas_bp.route("/ideas/<idea_id>/comment", methods=["POST"])
@jwt_required()
def comment_idea(idea_id):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    data = request.json
    comment = {
        "author": user["name"],
        "text": data["text"],
        "created_at": datetime.datetime.utcnow().isoformat(),
    }
    ideas_col.update_one({"_id": ObjectId(idea_id)}, {"$push": {"comments": comment}})
    return jsonify(comment), 201

@ideas_bp.route("/ideas/<idea_id>/status", methods=["PUT"])
@jwt_required()
def update_status(idea_id):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error": "Forbidden"}), 403
    data = request.json
    ideas_col.update_one({"_id": ObjectId(idea_id)}, {"$set": {"status": data["status"]}})
    return jsonify({"status": data["status"]}), 200
