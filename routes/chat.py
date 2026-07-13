from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import messages_col, users_col, db
from bson import ObjectId
import datetime

chat_bp = Blueprint("chat", __name__)
groups_col = db["chat_groups"]

def serialize_msg(m):
    return {
        "id": str(m["_id"]),
        "sender_id": m.get("sender_id",""),
        "sender_name": m.get("sender_name",""),
        "sender_dept": m.get("sender_dept",""),
        "channel": m["channel"],
        "text": m["text"],
        "edited": m.get("edited", False),
        "created_at": m["created_at"].isoformat() if hasattr(m.get("created_at"),"isoformat") else str(m.get("created_at","")),
    }

def serialize_group(g):
    return {
        "id": str(g["_id"]),
        "name": g["name"],
        "icon": g.get("icon","💬"),
        "description": g.get("description",""),
        "members": g.get("members",[]),      # list of user ids
        "member_names": g.get("member_names",[]),
        "created_by": g.get("created_by",""),
        "created_by_name": g.get("created_by_name",""),
        "created_at": g["created_at"].isoformat() if hasattr(g.get("created_at"),"isoformat") else "",
        "channel": f"group_{str(g['_id'])}",
    }

# ── Messages ────────────────────────────────────────────────

@chat_bp.route("/chat/messages/<channel>", methods=["GET"])
@jwt_required()
def get_messages(channel):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})

    # Validate access for dept channels
    if channel.startswith("dept_"):
        dept = channel.replace("dept_","").lower()
        if user.get("department","").lower() != dept and user.get("role") != "admin":
            return jsonify({"error":"Forbidden"}), 403

    # Validate access for group channels
    if channel.startswith("group_"):
        gid = channel.replace("group_","")
        try:
            group = groups_col.find_one({"_id": ObjectId(gid)})
            if not group:
                return jsonify({"error":"Group not found"}), 404
            if uid not in group.get("members",[]) and user.get("role") != "admin":
                return jsonify({"error":"You are not a member of this group"}), 403
        except Exception:
            return jsonify({"error":"Invalid group"}), 400

    msgs = list(messages_col.find({"channel": channel}).sort("created_at",1).limit(300))
    return jsonify([serialize_msg(m) for m in msgs]), 200

@chat_bp.route("/chat/messages", methods=["POST"])
@jwt_required()
def send_message():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    data = request.json
    channel = data.get("channel","company")

    if channel.startswith("dept_"):
        dept = channel.replace("dept_","").lower()
        if user.get("department","").lower() != dept and user.get("role") != "admin":
            return jsonify({"error":"Forbidden"}), 403

    if channel.startswith("group_"):
        gid = channel.replace("group_","")
        try:
            group = groups_col.find_one({"_id": ObjectId(gid)})
            if not group:
                return jsonify({"error":"Group not found"}), 404
            if uid not in group.get("members",[]) and user.get("role") != "admin":
                return jsonify({"error":"Not a member"}), 403
        except Exception:
            return jsonify({"error":"Invalid group"}), 400

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

@chat_bp.route("/chat/messages/<msg_id>", methods=["PUT"])
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

@chat_bp.route("/chat/messages/<msg_id>", methods=["DELETE"])
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

# ── Groups ───────────────────────────────────────────────────

@chat_bp.route("/chat/groups", methods=["GET"])
@jwt_required()
def get_groups():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") == "admin":
        groups = list(groups_col.find().sort("created_at", -1))
    else:
        groups = list(groups_col.find({"members": uid}).sort("created_at", -1))
    return jsonify([serialize_group(g) for g in groups]), 200

@chat_bp.route("/chat/groups", methods=["POST"])
@jwt_required()
def create_group():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error":"Only admin can create groups"}), 403
    data = request.json
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error":"Group name required"}), 400
    member_ids = data.get("members", [])
    if uid not in member_ids:
        member_ids = [uid] + member_ids
    # Fetch member names
    member_names = []
    for mid in member_ids:
        try:
            u = users_col.find_one({"_id": ObjectId(mid)})
            if u: member_names.append(u["name"])
        except Exception:
            pass
    group = {
        "name": name,
        "icon": data.get("icon","💬"),
        "description": data.get("description",""),
        "members": member_ids,
        "member_names": member_names,
        "created_by": uid,
        "created_by_name": user["name"],
        "created_at": datetime.datetime.utcnow(),
    }
    r = groups_col.insert_one(group)
    group["_id"] = r.inserted_id
    return jsonify(serialize_group(group)), 201

@chat_bp.route("/chat/groups/<gid>", methods=["PUT"])
@jwt_required()
def update_group(gid):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error":"Only admin can edit groups"}), 403
    data = request.json
    member_ids = data.get("members")
    member_names = []
    if member_ids:
        for mid in member_ids:
            try:
                u = users_col.find_one({"_id": ObjectId(mid)})
                if u: member_names.append(u["name"])
            except Exception:
                pass
    update = {}
    if "name" in data: update["name"] = data["name"]
    if "icon" in data: update["icon"] = data["icon"]
    if "description" in data: update["description"] = data["description"]
    if member_ids is not None:
        update["members"] = member_ids
        update["member_names"] = member_names
    groups_col.update_one({"_id": ObjectId(gid)}, {"$set": update})
    group = groups_col.find_one({"_id": ObjectId(gid)})
    return jsonify(serialize_group(group)), 200

@chat_bp.route("/chat/groups/<gid>", methods=["DELETE"])
@jwt_required()
def delete_group(gid):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error":"Only admin can delete groups"}), 403
    groups_col.delete_one({"_id": ObjectId(gid)})
    messages_col.delete_many({"channel": f"group_{gid}"})
    return jsonify({"ok":True}), 200

@chat_bp.route("/chat/groups/<gid>/members", methods=["POST"])
@jwt_required()
def add_member(gid):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error":"Only admin can add members"}), 403
    data = request.json
    mid = data.get("user_id")
    member = users_col.find_one({"_id": ObjectId(mid)})
    if not member: return jsonify({"error":"User not found"}), 404
    groups_col.update_one({"_id": ObjectId(gid)}, {
        "$addToSet": {"members": mid},
        "$push": {"member_names": member["name"]}
    })
    group = groups_col.find_one({"_id": ObjectId(gid)})
    return jsonify(serialize_group(group)), 200

@chat_bp.route("/chat/groups/<gid>/members/<mid>", methods=["DELETE"])
@jwt_required()
def remove_member(gid, mid):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error":"Only admin can remove members"}), 403
    member = users_col.find_one({"_id": ObjectId(mid)})
    groups_col.update_one({"_id": ObjectId(gid)}, {
        "$pull": {"members": mid}
    })
    if member:
        group = groups_col.find_one({"_id": ObjectId(gid)})
        names = [u["name"] for m in group.get("members",[])
                 for u in [users_col.find_one({"_id": ObjectId(m)})] if u]
        groups_col.update_one({"_id": ObjectId(gid)}, {"$set":{"member_names": names}})
    group = groups_col.find_one({"_id": ObjectId(gid)})
    return jsonify(serialize_group(group)), 200
