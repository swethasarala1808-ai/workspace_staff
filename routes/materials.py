from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import materials_col, feedback_col, users_col, solutions_col, db
from bson import ObjectId
import datetime, base64, os

materials_bp = Blueprint("materials", __name__)
FEEDBACK_OPTIONS = ["Excellent","Good","Okay","Needs Work","Bad"]
notifs_col = db["notifications"]

IS_VERCEL = os.environ.get("VERCEL", False)
UPLOAD_DIR = "/tmp/uploads" if IS_VERCEL else os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ── Solutions ──────────────────────────────────────────────
@materials_bp.route("/solutions", methods=["GET"])
@jwt_required()
def get_solutions():
    sols = list(solutions_col.find())
    return jsonify([{"id":str(s["_id"]),"name":s["name"],"icon":s.get("icon","📦"),"color":s.get("color","#14F1B1")} for s in sols]), 200

@materials_bp.route("/solutions", methods=["POST"])
@jwt_required()
def create_solution():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin": return jsonify({"error":"Forbidden"}), 403
    data = request.json
    if not data.get("name"): return jsonify({"error":"Name required"}), 400
    if solutions_col.find_one({"name":data["name"]}): return jsonify({"error":"Already exists"}), 409
    sol = {"name":data["name"],"icon":data.get("icon","📦"),"color":data.get("color","#14F1B1"),"created_at":datetime.datetime.utcnow()}
    r = solutions_col.insert_one(sol); sol["_id"] = r.inserted_id
    return jsonify({"id":str(sol["_id"]),"name":sol["name"],"icon":sol["icon"],"color":sol["color"]}), 201

@materials_bp.route("/solutions/<sol_id>", methods=["DELETE"])
@jwt_required()
def delete_solution(sol_id):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin": return jsonify({"error":"Forbidden"}), 403
    solutions_col.delete_one({"_id": ObjectId(sol_id)})
    return jsonify({"ok":True}), 200

@materials_bp.route("/solutions/seed", methods=["POST"])
@jwt_required()
def seed_solutions():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin": return jsonify({"error":"Forbidden"}), 403
    defaults = [
        {"name":"CA & CS","icon":"📊","color":"#6366f1"},
        {"name":"Legal","icon":"⚖️","color":"#f59e0b"},
        {"name":"HR","icon":"👥","color":"#ec4899"},
        {"name":"Marketing","icon":"📣","color":"#14F1B1"},
        {"name":"Finance","icon":"💰","color":"#10b981"},
    ]
    inserted = 0
    for d in defaults:
        if not solutions_col.find_one({"name":d["name"]}):
            d["created_at"] = datetime.datetime.utcnow()
            solutions_col.insert_one(d); inserted += 1
    return jsonify({"message":f"Seeded {inserted} solutions"}), 200

# ── Notifications ──────────────────────────────────────────
@materials_bp.route("/notifications", methods=["GET"])
@jwt_required()
def get_notifications():
    uid = get_jwt_identity()
    notifs = list(notifs_col.find({"user_id":uid,"read":False}).sort("created_at",-1).limit(20))
    return jsonify([{"id":str(n["_id"]),"type":n.get("type","info"),"message":n["message"],"created_at":n["created_at"].strftime("%d %b, %I:%M %p") if hasattr(n.get("created_at"),"strftime") else ""} for n in notifs]), 200

@materials_bp.route("/notifications/read", methods=["POST"])
@jwt_required()
def mark_notifs_read():
    uid = get_jwt_identity()
    notifs_col.update_many({"user_id":uid},{"$set":{"read":True}})
    return jsonify({"ok":True}), 200

def notify_all_except(uploader_id, message, notif_type="material"):
    all_users = list(users_col.find({"company":"BIZAXL"},{"_id":1}))
    seria_users = list(users_col.find({"company":"SERIA"},{"_id":1}))
    now = datetime.datetime.utcnow()
    docs = []
    for u in all_users + seria_users:
        uid = str(u["_id"])
        if uid != uploader_id:
            docs.append({"user_id":uid,"type":notif_type,"message":message,"read":False,"created_at":now})
    if docs:
        notifs_col.insert_many(docs)

# ── Materials ──────────────────────────────────────────────
def serialize_mat(m):
    fb = list(feedback_col.find({"material_id":str(m["_id"])}))
    counts = {r:sum(1 for f in fb if f.get("rating")==r) for r in FEEDBACK_OPTIONS}
    return {
        "id": str(m["_id"]),
        "title": m["title"],
        "description": m.get("description",""),
        "solution": m.get("solution",""),
        "material_type": m.get("material_type","document"),
        "status": m.get("status","pending"),
        "files": m.get("files",[]),
        "tags": m.get("tags",[]),
        "uploaded_by_name": m.get("uploaded_by_name",""),
        "uploaded_by_dept": m.get("uploaded_by_dept",""),
        "uploaded_by_id": m.get("uploaded_by_id",""),
        "created_at": m["created_at"].strftime("%d %b %Y") if hasattr(m.get("created_at"),"strftime") else "",
        "feedback_count": len(fb),
        "feedback_counts": counts,
        "director_note": m.get("director_note",""),
    }

@materials_bp.route("/materials", methods=["GET"])
@jwt_required()
def get_materials():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    role = user.get("role","employee")
    dept = user.get("department","")
    status_filter = request.args.get("status","")
    solution_filter = request.args.get("solution","")
    if role == "admin": q = {}
    elif dept == "Marketing" or role in ["marketing","director"]:
        q = {"$or":[{"uploaded_by_id":uid},{"status":"approved"}]}
    else: q = {"status":"approved"}
    if status_filter and role == "admin": q = {"status":status_filter}
    if solution_filter:
        if "$or" in q: q = {"$and":[q,{"solution":solution_filter}]}
        else: q["solution"] = solution_filter
    mats = list(materials_col.find(q).sort("created_at",-1))
    return jsonify([serialize_mat(m) for m in mats]), 200

@materials_bp.route("/materials/library", methods=["GET"])
@jwt_required()
def get_library():
    solution_filter = request.args.get("solution","")
    q = {"status":"approved"}
    if solution_filter: q["solution"] = solution_filter
    mats = list(materials_col.find(q).sort("created_at",-1))
    return jsonify([serialize_mat(m) for m in mats]), 200

@materials_bp.route("/materials/pending_director", methods=["GET"])
@jwt_required()
def get_director_pending():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") not in ["admin","director"]: return jsonify({"error":"Forbidden"}), 403
    mats = list(materials_col.find({"status":"sent_to_director"}).sort("created_at",-1))
    return jsonify([serialize_mat(m) for m in mats]), 200

@materials_bp.route("/materials/<mid>", methods=["GET"])
@jwt_required()
def get_material(mid):
    mat = materials_col.find_one({"_id":ObjectId(mid)})
    if not mat: return jsonify({"error":"Not found"}), 404
    return jsonify(serialize_mat(mat)), 200

@materials_bp.route("/materials", methods=["POST"])
@jwt_required()
def create_material():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    dept = user.get("department","")
    role = user.get("role","employee")
    if dept != "Marketing" and role not in ["admin","marketing"]:
        return jsonify({"error":"Only Marketing team can upload materials"}), 403
    data = request.json
    saved_files = []
    for f in data.get("files",[]):
        fname = f.get("name","file"); b64 = f.get("data","")
        if b64:
            if "," in b64: b64 = b64.split(",",1)[1]
            safe_name = f"{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}_{fname}"
            fpath = os.path.join(UPLOAD_DIR, safe_name)
            try:
                raw = base64.b64decode(b64)
                with open(fpath,"wb") as fp: fp.write(raw)
                saved_files.append({"name":fname,"url":f"/static/uploads/{safe_name}"})
            except Exception as e: print(f"Upload error: {e}")
    mat = {
        "title": data.get("title","Untitled"),
        "description": data.get("description",""),
        "solution": data.get("solution",""),
        "material_type": data.get("material_type","document"),
        "status": "pending",
        "files": saved_files,
        "tags": data.get("tags",[]),
        "uploaded_by_id": uid,
        "uploaded_by_name": user["name"],
        "uploaded_by_dept": dept,
        "created_at": datetime.datetime.utcnow(),
    }
    r = materials_col.insert_one(mat); mat["_id"] = r.inserted_id
    # Notify everyone
    notify_all_except(uid, f"New material uploaded: \"{mat['title']}\" by {user['name']} ({dept})", "material")
    return jsonify(serialize_mat(mat)), 201

@materials_bp.route("/materials/<mid>/action", methods=["POST"])
@jwt_required()
def material_action(mid):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") not in ["admin","director"]: return jsonify({"error":"Forbidden"}), 403
    data = request.json; action = data.get("action",""); note = data.get("note","")
    status_map = {"approve":"approved","reject":"rejected","revision":"revision_needed","send_to_director":"sent_to_director","director_approve":"approved","director_reject":"rejected","director_revision":"revision_needed"}
    if action == "delete":
        materials_col.delete_one({"_id":ObjectId(mid)}); return jsonify({"ok":True}), 200
    if action not in status_map: return jsonify({"error":"Unknown action"}), 400
    new_status = status_map[action]
    materials_col.update_one({"_id":ObjectId(mid)},{"$set":{"status":new_status,"director_note":note}})
    mat = materials_col.find_one({"_id":ObjectId(mid)})
    # Notify uploader of status change
    uploader_id = mat.get("uploaded_by_id","")
    status_labels = {"approved":"approved ✓","rejected":"rejected","revision_needed":"needs revision","sent_to_director":"sent to director"}
    if uploader_id:
        notifs_col.insert_one({"user_id":uploader_id,"type":"material_status","message":f"Your material \"{mat['title']}\" was {status_labels.get(new_status,new_status)}","read":False,"created_at":datetime.datetime.utcnow()})
    return jsonify(serialize_mat(mat)), 200

@materials_bp.route("/materials/<mid>/feedback", methods=["POST"])
@jwt_required()
def give_feedback(mid):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    data = request.json; rating = data.get("rating","")
    if rating not in FEEDBACK_OPTIONS: return jsonify({"error":"Invalid rating"}), 400
    existing = feedback_col.find_one({"material_id":mid,"user_id":uid})
    if existing:
        feedback_col.update_one({"_id":existing["_id"]},{"$set":{"rating":rating,"comment":data.get("comment",""),"suggestion":data.get("suggestion","")}})
    else:
        feedback_col.insert_one({"material_id":mid,"user_id":uid,"user_name":user["name"],"dept":user.get("department",""),"company":user.get("company",""),"rating":rating,"comment":data.get("comment",""),"suggestion":data.get("suggestion",""),"created_at":datetime.datetime.utcnow()})
    return jsonify({"ok":True}), 201

@materials_bp.route("/materials/<mid>/feedback", methods=["GET"])
@jwt_required()
def get_feedback(mid):
    fbs = list(feedback_col.find({"material_id":mid}))
    return jsonify([{"user_name":f.get("user_name",""),"rating":f.get("rating",""),"comment":f.get("comment",""),"suggestion":f.get("suggestion",""),"dept":f.get("dept","")} for f in fbs]), 200
