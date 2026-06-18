from flask import Blueprint, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db, users_col
from bson import ObjectId
import datetime, base64, os

drive_bp = Blueprint("drive", __name__)

IS_VERCEL = os.environ.get("VERCEL", False)
DRIVE_DIR = "/tmp/drive" if IS_VERCEL else os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "drive")
os.makedirs(DRIVE_DIR, exist_ok=True)

drive_col = db["drive_files"]

def serialize_file(f, uid=None):
    return {
        "id": str(f["_id"]),
        "name": f["name"],
        "type": f.get("type","file"),
        "mime": f.get("mime",""),
        "size": f.get("size",0),
        "size_str": human_size(f.get("size",0)),
        "parent_id": f.get("parent_id",""),
        "owner_id": f.get("owner_id",""),
        "owner_name": f.get("owner_name",""),
        "owner_dept": f.get("owner_dept",""),
        "shared_with": f.get("shared_with","everyone"),
        "depts": f.get("depts",[]),
        "url": f.get("url",""),
        "starred": uid in f.get("starred_by",[]) if uid else False,
        "created_at": f["created_at"].strftime("%d %b %Y") if hasattr(f.get("created_at"),"strftime") else "",
    }

def human_size(b):
    if not b: return ""
    if b < 1024: return f"{b} B"
    if b < 1024**2: return f"{b/1024:.1f} KB"
    return f"{b/1024**2:.1f} MB"

def normalize_sharing(data, user):
    """
    Returns (shared_with, depts) handling both the new format and legacy values.
    shared_with: 'everyone' | 'private' | 'depts'
    depts: list of department names (only meaningful when shared_with == 'depts')
    """
    sw = data.get("shared_with", "everyone")
    depts = data.get("depts", [])

    # Backward compatibility with old values
    if sw == "all":
        sw = "everyone"
    elif sw == "dept":
        sw = "depts"
        if not depts:
            depts = [user.get("department", "")] if user.get("department") else []

    if sw == "depts" and not isinstance(depts, list):
        depts = [depts] if depts else []

    return sw, depts

def can_access(f, uid, user):
    if f.get("owner_id") == uid or user.get("role") == "admin":
        return True
    sw = f.get("shared_with", "everyone")
    if sw == "everyone":
        return True
    if sw == "depts":
        return user.get("department", "") in f.get("depts", [])
    return False  # private

@drive_bp.route("/drive/files", methods=["GET"])
@jwt_required()
def list_files():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    parent_id = request.args.get("parent_id","")
    view = request.args.get("view","all")
    dept = user.get("department","")
    role = user.get("role","employee")

    if view == "mine":
        q = {"owner_id": uid, "parent_id": parent_id}
    elif view == "starred":
        q = {"starred_by": uid}
    elif view == "shared":
        q = {
            "owner_id": {"$ne": uid},
            "$or": [
                {"shared_with": "everyone"},
                {"shared_with": "depts", "depts": dept},
                {"shared_with": "all"},          # legacy
                {"shared_with": "dept", "dept": dept},  # legacy
            ],
        }
    else:
        if role == "admin":
            q = {"parent_id": parent_id}
        else:
            q = {"parent_id": parent_id, "$or": [
                {"owner_id": uid},
                {"shared_with": "everyone"},
                {"shared_with": "depts", "depts": dept},
                {"shared_with": "all"},          # legacy
                {"shared_with": "dept", "dept": dept},  # legacy
            ]}

    files = list(drive_col.find(q).sort([("type",-1),("created_at",-1)]))
    return jsonify([serialize_file(f, uid) for f in files if can_access(f, uid, user)]), 200

@drive_bp.route("/drive/files", methods=["POST"])
@jwt_required()
def upload_file():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    data = request.json
    shared_with, depts = normalize_sharing(data, user)

    if data.get("type") == "folder":
        folder = {
            "name": data.get("name","New Folder"),
            "type": "folder", "mime": "folder", "size": 0,
            "parent_id": data.get("parent_id",""),
            "owner_id": uid, "owner_name": user["name"],
            "owner_dept": user.get("department",""),
            "shared_with": shared_with,
            "depts": depts,
            "url": "", "starred_by": [],
            "created_at": datetime.datetime.utcnow(),
        }
        r = drive_col.insert_one(folder)
        folder["_id"] = r.inserted_id
        return jsonify(serialize_file(folder, uid)), 201

    b64 = data.get("data","")
    fname = data.get("name","file")
    mime = data.get("mime","application/octet-stream")
    size = data.get("size",0)
    url = ""

    if b64:
        if "," in b64: b64 = b64.split(",",1)[1]
        safe_name = f"{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}_{fname}"
        fpath = os.path.join(DRIVE_DIR, safe_name)
        try:
            raw = base64.b64decode(b64)
            size = len(raw)
            with open(fpath,"wb") as fp: fp.write(raw)
            url = f"/static/drive/{safe_name}"
        except Exception as e:
            print(f"Upload error: {e}")

    doc = {
        "name": fname, "type": "file", "mime": mime, "size": size,
        "parent_id": data.get("parent_id",""),
        "owner_id": uid, "owner_name": user["name"],
        "owner_dept": user.get("department",""),
        "shared_with": shared_with,
        "depts": depts,
        "url": url, "starred_by": [],
        "created_at": datetime.datetime.utcnow(),
    }
    r = drive_col.insert_one(doc)
    doc["_id"] = r.inserted_id
    return jsonify(serialize_file(doc, uid)), 201

@drive_bp.route("/drive/files/<fid>/star", methods=["POST"])
@jwt_required()
def star_file(fid):
    uid = get_jwt_identity()
    f = drive_col.find_one({"_id": ObjectId(fid)})
    if not f: return jsonify({"error":"Not found"}), 404
    starred = f.get("starred_by",[])
    if uid in starred: starred.remove(uid)
    else: starred.append(uid)
    drive_col.update_one({"_id": ObjectId(fid)}, {"$set":{"starred_by": starred}})
    return jsonify({"starred": uid in starred}), 200

@drive_bp.route("/drive/files/<fid>", methods=["DELETE"])
@jwt_required()
def delete_file(fid):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    f = drive_col.find_one({"_id": ObjectId(fid)})
    if not f: return jsonify({"error":"Not found"}), 404
    if f.get("owner_id") != uid and user.get("role") != "admin":
        return jsonify({"error":"Forbidden"}), 403
    if f.get("url"):
        fname = f["url"].split("/")[-1]
        fpath = os.path.join(DRIVE_DIR, fname)
        if os.path.exists(fpath): os.remove(fpath)
    if f.get("type") == "folder":
        drive_col.delete_many({"parent_id": fid})
    drive_col.delete_one({"_id": ObjectId(fid)})
    return jsonify({"ok":True}), 200

@drive_bp.route("/drive/files/<fid>/rename", methods=["PUT"])
@jwt_required()
def rename_file(fid):
    data = request.json
    drive_col.update_one({"_id": ObjectId(fid)}, {"$set":{"name": data.get("name","")}})
    return jsonify({"ok":True}), 200

@drive_bp.route("/drive/files/<fid>/share", methods=["PUT"])
@jwt_required()
def share_file(fid):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    data = request.json
    shared_with, depts = normalize_sharing(data, user)
    drive_col.update_one({"_id": ObjectId(fid)}, {"$set":{"shared_with": shared_with, "depts": depts}})
    return jsonify({"ok":True}), 200

@drive_bp.route("/drive/stats", methods=["GET"])
@jwt_required()
def drive_stats():
    uid = get_jwt_identity()
    total = drive_col.count_documents({})
    mine = drive_col.count_documents({"owner_id": uid})
    shared = drive_col.count_documents({"shared_with": {"$in": ["everyone", "all"]}})
    starred = drive_col.count_documents({"starred_by": uid})
    my_files = list(drive_col.find({"owner_id": uid, "type":"file"}))
    used = sum(f.get("size",0) for f in my_files)
    return jsonify({"total":total,"mine":mine,"shared":shared,"starred":starred,"used":used,"used_str":human_size(used)}), 200
