from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import messages_col, users_col
from bson import ObjectId
import datetime

chat_bp = Blueprint("chat", __name__)

def serialize_msg(m):
    return {
        "id": str(m["_id"]),
        "sender_id": m.get("sender_id",""),
        "sender_name": m.get("sender_name",""),
        "sender_dept": m.get("sender_dept",""),
        "channel": m["channel"],
        "text": m["text"],
        "edited": m.get("edited", False),
        "created_at": m["created_at"].isoformat(),
    }

@chat_bp.route("/messages/<channel>", methods=["GET"])
@jwt_required()
def get_messages(channel):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if channel.startswith("dept_"):
        dept = channel.replace("dept_","")
        if user.get("department","").lower() != dept.lower() and user.get("role") != "admin":
            return jsonify({"error":"Forbidden"}), 403
    msgs = list(messages_col.find({"channel": channel}).sort("created_at",1).limit(200))
    return jsonify([serialize_msg(m) for m in msgs]), 200

@chat_bp.route("/messages", methods=["POST"])
@jwt_required()
def send_message():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    data = request.json
    channel = data.get("channel","company")
    if channel.startswith("dept_"):
        dept = channel.replace("dept_","")
        if user.get("department","").lower() != dept.lower() and user.get("role") != "admin":
            return jsonify({"error":"Forbidden"}), 403
    msg = {
        "sender_id": uid,
        "sender_name": user["name"],
        "sender_dept": user.get("department",""),
        "channel": channel,
        "text": data.get("text",""),
        "edited": False,
        "created_at": datetime.datetime.utcnow(),
    }
    result = messages_col.insert_one(msg)
    msg["_id"] = result.inserted_id
    return jsonify(serialize_msg(msg)), 201

@chat_bp.route("/messages/<msg_id>", methods=["PUT"])
@jwt_required()
def edit_message(msg_id):
    uid = get_jwt_identity()
    msg = messages_col.find_one({"_id": ObjectId(msg_id)})
    if not msg: return jsonify({"error":"Not found"}), 404
    if msg.get("sender_id") != uid:
        return jsonify({"error":"Forbidden"}), 403
    data = request.json
    messages_col.update_one({"_id": ObjectId(msg_id)}, {"$set":{"text": data.get("text",""), "edited": True}})
    msg = messages_col.find_one({"_id": ObjectId(msg_id)})
    return jsonify(serialize_msg(msg)), 200

@chat_bp.route("/messages/<msg_id>", methods=["DELETE"])
@jwt_required()
def delete_message(msg_id):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    msg = messages_col.find_one({"_id": ObjectId(msg_id)})
    if not msg: return jsonify({"error":"Not found"}), 404
    if msg.get("sender_id") != uid and user.get("role") != "admin":
        return jsonify({"error":"Forbidden"}), 403
    messages_col.delete_one({"_id": ObjectId(msg_id)})
    return jsonify({"ok":True}), 200
