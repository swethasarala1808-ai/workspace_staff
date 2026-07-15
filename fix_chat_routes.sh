#!/bin/bash
# Run this in your workspace_staff folder to fix chat routes without git
cd ~/workspace_staff

cat > routes/chat.py << 'PYEOF'
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import messages_col, users_col, db
from bson import ObjectId
import datetime, base64, os, re

chat_bp = Blueprint("chat", __name__)
groups_col = db["chat_groups"]

IS_VERCEL = os.environ.get("VERCEL", False)
CHAT_UPLOAD_DIR = "/tmp/chat_uploads" if IS_VERCEL else os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "chat_uploads")
os.makedirs(CHAT_UPLOAD_DIR, exist_ok=True)

def serialize_msg(m):
    return {
        "id": str(m["_id"]),
        "sender_id": m.get("sender_id",""),
        "sender_name": m.get("sender_name",""),
        "sender_dept": m.get("sender_dept",""),
        "channel": m["channel"],
        "text": m.get("text",""),
        "edited": m.get("edited", False),
        "file_url": m.get("file_url",""),
        "file_name": m.get("file_name",""),
        "file_type": m.get("file_type",""),
        "created_at": m["created_at"].isoformat() if hasattr(m.get("created_at"),"isoformat") else str(m.get("created_at","")),
    }

def serialize_group(g):
    return {
        "id": str(g["_id"]),
        "name": g["name"],
        "icon": g.get("icon","💬"),
        "description": g.get("description",""),
        "members": g.get("members",[]),
        "member_names": g.get("member_names",[]),
        "created_by": g.get("created_by",""),
        "created_by_name": g.get("created_by_name",""),
        "created_at": g["created_at"].isoformat() if hasattr(g.get("created_at"),"isoformat") else "",
        "channel": f"group_{str(g['_id'])}",
    }

def check_access(channel, uid, user):
    if channel.startswith("dept_"):
        dept = channel.replace("dept_","").lower()
        if user.get("department","").lower() != dept and user.get("role") != "admin":
            return False
    if channel.startswith("group_"):
        gid = channel.replace("group_","")
        try:
            group = groups_col.find_one({"_id": ObjectId(gid)})
            if not group: return False
            if uid not in group.get("members",[]) and user.get("role") != "admin":
                return False
        except Exception:
            return False
    return True

@chat_bp.route("/messages/<channel>", methods=["GET"])
@jwt_required()
def get_messages(channel):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if not check_access(channel, uid, user):
        return jsonify({"error":"Forbidden"}), 403
    msgs = list(messages_col.find({"channel": channel}).sort("created_at",1).limit(300))
    return jsonify([serialize_msg(m) for m in msgs]), 200

@chat_bp.route("/messages", methods=["POST"])
@jwt_required()
def send_message():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    data = request.json or {}
    channel = data.get("channel","company")
    if not check_access(channel, uid, user):
        return jsonify({"error":"Forbidden"}), 403
    file_url = file_name = file_type = ""
    if data.get("file_data"):
        b64 = data["file_data"]
        if "," in b64: b64 = b64.split(",",1)[1]
        fname = re.sub(r'[^\w.\-]', '_', data.get("file_name","file"))
        safe = f"{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}_{fname}"
        fpath = os.path.join(CHAT_UPLOAD_DIR, safe)
        try:
            raw = base64.b64decode(b64)
            with open(fpath,"wb") as fp: fp.write(raw)
            file_url = f"/static/chat_uploads/{safe}"
            file_name = data.get("file_name","file")
            file_type = data.get("file_type","application/octet-stream")
        except Exception as e:
            print(f"Chat upload error: {e}")
    msg = {
        "sender_id": uid, "sender_name": user["name"],
        "sender_dept": user.get("department",""),
        "channel": channel, "text": data.get("text",""),
        "file_url": file_url, "file_name": file_name, "file_type": file_type,
        "edited": False, "created_at": datetime.datetime.utcnow(),
    }
    r = messages_col.insert_one(msg)
    msg["_id"] = r.inserted_id
    return jsonify(serialize_msg(msg)), 201

@chat_bp.route("/messages/<msg_id>", methods=["PUT"])
@jwt_required()
def edit_message(msg_id):
    uid = get_jwt_identity()
    msg = messages_col.find_one({"_id": ObjectId(msg_id)})
    if not msg: return jsonify({"error":"Not found"}), 404
    if msg.get("sender_id") != uid: return jsonify({"error":"Forbidden"}), 403
    data = request.json or {}
    messages_col.update_one({"_id": ObjectId(msg_id)}, {"$set":{"text": data.get("text",""), "edited": True}})
    return jsonify(serialize_msg(messages_col.find_one({"_id": ObjectId(msg_id)}))), 200

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

@chat_bp.route("/groups", methods=["GET"])
@jwt_required()
def get_groups():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") == "admin":
        groups = list(groups_col.find().sort("created_at",-1))
    else:
        groups = list(groups_col.find({"members": uid}).sort("created_at",-1))
    return jsonify([serialize_group(g) for g in groups]), 200

@chat_bp.route("/groups", methods=["POST"])
@jwt_required()
def create_group():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error":"Only admin can create groups"}), 403
    data = request.json or {}
    name = (data.get("name") or "").strip()
    if not name: return jsonify({"error":"Group name required"}), 400
    member_ids = data.get("members", [])
    if uid not in member_ids: member_ids = [uid] + member_ids
    member_names = []
    for mid in member_ids:
        try:
            u = users_col.find_one({"_id": ObjectId(mid)})
            if u: member_names.append(u["name"])
        except: pass
    group = {
        "name": name, "icon": data.get("icon","💬"),
        "description": data.get("description",""),
        "members": member_ids, "member_names": member_names,
        "created_by": uid, "created_by_name": user["name"],
        "created_at": datetime.datetime.utcnow(),
    }
    r = groups_col.insert_one(group)
    group["_id"] = r.inserted_id
    return jsonify(serialize_group(group)), 201

@chat_bp.route("/groups/<gid>", methods=["PUT"])
@jwt_required()
def update_group(gid):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin": return jsonify({"error":"Forbidden"}), 403
    data = request.json or {}
    update = {}
    for f in ["name","icon","description"]:
        if f in data: update[f] = data[f]
    if "members" in data:
        member_ids = data["members"]
        names = []
        for mid in member_ids:
            try:
                u = users_col.find_one({"_id": ObjectId(mid)})
                if u: names.append(u["name"])
            except: pass
        update["members"] = member_ids
        update["member_names"] = names
    groups_col.update_one({"_id": ObjectId(gid)}, {"$set": update})
    return jsonify(serialize_group(groups_col.find_one({"_id": ObjectId(gid)}))), 200

@chat_bp.route("/groups/<gid>", methods=["DELETE"])
@jwt_required()
def delete_group(gid):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin": return jsonify({"error":"Forbidden"}), 403
    groups_col.delete_one({"_id": ObjectId(gid)})
    messages_col.delete_many({"channel": f"group_{gid}"})
    return jsonify({"ok":True}), 200

@chat_bp.route("/groups/<gid>/members/<mid>", methods=["DELETE"])
@jwt_required()
def remove_member(gid, mid):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin": return jsonify({"error":"Forbidden"}), 403
    groups_col.update_one({"_id": ObjectId(gid)}, {"$pull": {"members": mid}})
    group = groups_col.find_one({"_id": ObjectId(gid)})
    names = []
    for m in group.get("members",[]):
        try:
            u = users_col.find_one({"_id": ObjectId(m)})
            if u: names.append(u["name"])
        except: pass
    groups_col.update_one({"_id": ObjectId(gid)}, {"$set": {"member_names": names}})
    return jsonify(serialize_group(groups_col.find_one({"_id": ObjectId(gid)}))), 200
PYEOF

echo "chat.py patched! Now run: python3 app.py"
