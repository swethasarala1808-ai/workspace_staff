from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import db, users_col
from bson import ObjectId
import datetime

meetings_bp = Blueprint("meetings", __name__)
meetings_col = db["meetings"]

def serialize_meeting(m, uid=None):
    now = datetime.datetime.utcnow()
    start = m.get("start_dt")
    end = m.get("end_dt")
    status = "upcoming"
    if start and end:
        if now > end: status = "ended"
        elif now >= start: status = "live"
    return {
        "id": str(m["_id"]),
        "title": m["title"],
        "description": m.get("description",""),
        "start_dt": start.isoformat() if start else "",
        "end_dt": end.isoformat() if end else "",
        "start_str": start.strftime("%d %b %Y, %I:%M %p") if start else "",
        "end_str": end.strftime("%I:%M %p") if end else "",
        "duration_mins": m.get("duration_mins",60),
        "meeting_link": m.get("meeting_link",""),
        "platform": m.get("platform","Google Meet"),
        "organizer_id": m.get("organizer_id",""),
        "organizer_name": m.get("organizer_name",""),
        "attendees": m.get("attendees",[]),  # ["all"] or ["dept:Marketing"] or list of user ids
        "attendee_names": m.get("attendee_names",[]),
        "notes": m.get("notes",""),
        "agenda": m.get("agenda",[]),
        "recording_url": m.get("recording_url",""),
        "status": status,
        "is_organizer": m.get("organizer_id") == uid,
        "created_at": m["created_at"].strftime("%d %b %Y") if hasattr(m.get("created_at"),"strftime") else "",
    }

def user_can_see(m, uid, user):
    dept = user.get("department","")
    role = user.get("role","employee")
    if role == "admin" or m.get("organizer_id") == uid: return True
    attendees = m.get("attendees",[])
    if "all" in attendees: return True
    if f"dept:{dept}" in attendees: return True
    if uid in attendees: return True
    return False

@meetings_bp.route("/meetings", methods=["GET"])
@jwt_required()
def list_meetings():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    view = request.args.get("view","upcoming")  # upcoming | past | mine | all
    now = datetime.datetime.utcnow()

    if view == "mine":
        q = {"organizer_id": uid}
    elif view == "past":
        q = {"end_dt": {"$lt": now}}
    elif view == "all":
        q = {}
    else:
        q = {"end_dt": {"$gte": now}}

    all_meetings = list(meetings_col.find(q).sort("start_dt", 1))
    visible = [m for m in all_meetings if user_can_see(m, uid, user)]
    return jsonify([serialize_meeting(m, uid) for m in visible]), 200

@meetings_bp.route("/meetings", methods=["POST"])
@jwt_required()
def create_meeting():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    data = request.json

    # Parse dates
    try:
        start_dt = datetime.datetime.fromisoformat(data["start_dt"])
        duration = int(data.get("duration_mins", 60))
        end_dt = start_dt + datetime.timedelta(minutes=duration)
    except Exception as e:
        return jsonify({"error": f"Invalid date: {e}"}), 400

    meeting = {
        "title": data.get("title","Untitled Meeting"),
        "description": data.get("description",""),
        "start_dt": start_dt,
        "end_dt": end_dt,
        "duration_mins": duration,
        "meeting_link": data.get("meeting_link",""),
        "platform": data.get("platform","Google Meet"),
        "organizer_id": uid,
        "organizer_name": user["name"],
        "attendees": data.get("attendees",["all"]),
        "attendee_names": data.get("attendee_names",[]),
        "agenda": data.get("agenda",[]),
        "notes": "",
        "recording_url": "",
        "created_at": datetime.datetime.utcnow(),
    }
    r = meetings_col.insert_one(meeting)
    meeting["_id"] = r.inserted_id
    return jsonify(serialize_meeting(meeting, uid)), 201

@meetings_bp.route("/meetings/<mid>", methods=["PUT"])
@jwt_required()
def update_meeting(mid):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    m = meetings_col.find_one({"_id": ObjectId(mid)})
    if not m: return jsonify({"error":"Not found"}), 404
    if m.get("organizer_id") != uid and user.get("role") != "admin":
        return jsonify({"error":"Forbidden"}), 403
    data = request.json
    update = {}
    for field in ["title","description","meeting_link","platform","attendees","attendee_names","notes","agenda","recording_url"]:
        if field in data: update[field] = data[field]
    if "start_dt" in data:
        start_dt = datetime.datetime.fromisoformat(data["start_dt"])
        duration = data.get("duration_mins", m.get("duration_mins",60))
        update["start_dt"] = start_dt
        update["end_dt"] = start_dt + datetime.timedelta(minutes=int(duration))
        update["duration_mins"] = int(duration)
    if update:
        meetings_col.update_one({"_id": ObjectId(mid)}, {"$set": update})
    m = meetings_col.find_one({"_id": ObjectId(mid)})
    return jsonify(serialize_meeting(m, uid)), 200

@meetings_bp.route("/meetings/<mid>", methods=["DELETE"])
@jwt_required()
def delete_meeting(mid):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    m = meetings_col.find_one({"_id": ObjectId(mid)})
    if not m: return jsonify({"error":"Not found"}), 404
    if m.get("organizer_id") != uid and user.get("role") != "admin":
        return jsonify({"error":"Forbidden"}), 403
    meetings_col.delete_one({"_id": ObjectId(mid)})
    return jsonify({"ok":True}), 200

@meetings_bp.route("/meetings/<mid>/notes", methods=["PUT"])
@jwt_required()
def update_notes(mid):
    data = request.json
    meetings_col.update_one({"_id": ObjectId(mid)}, {"$set": {"notes": data.get("notes","")}})
    return jsonify({"ok":True}), 200

@meetings_bp.route("/meetings/upcoming_count", methods=["GET"])
@jwt_required()
def upcoming_count():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    now = datetime.datetime.utcnow()
    soon = now + datetime.timedelta(hours=24)
    meetings = list(meetings_col.find({"start_dt":{"$gte":now,"$lte":soon}}))
    visible = [m for m in meetings if user_can_see(m, uid, user)]
    return jsonify({"count": len(visible)}), 200
