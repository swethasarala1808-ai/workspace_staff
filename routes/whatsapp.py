from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import users_col, db
from bson import ObjectId
import re

whatsapp_bp = Blueprint("whatsapp", __name__)
depts_col = db["departments"]

def clean_phone(phone):
    """Normalize phone to digits only, ensure country code present (default 91 for India)."""
    if not phone:
        return ""
    digits = re.sub(r"\D", "", phone)
    if len(digits) == 10:
        digits = "91" + digits
    return digits

@whatsapp_bp.route("/whatsapp/directory", methods=["GET"])
@jwt_required()
def get_directory():
    uid = get_jwt_identity()
    me = users_col.find_one({"_id": ObjectId(uid)})
    if not me:
        return jsonify({"error": "User not found"}), 404

    company = me.get("company", "BIZAXL")
    all_users = list(users_col.find({"company": company}))

    result = []
    for u in all_users:
        if str(u["_id"]) == uid:
            continue
        phone = clean_phone(u.get("phone", ""))
        result.append({
            "id": str(u["_id"]),
            "name": u["name"],
            "department": u.get("department", ""),
            "role": u.get("role", "employee"),
            "phone": phone,
            "wa_link": f"https://wa.me/{phone}" if phone else "",
        })

    # Group counts per department for the UI
    depts = list(depts_col.find().sort("name", 1))
    dept_list = [{"name": d["name"], "color": d.get("color", "#14F1B1")} for d in depts]

    return jsonify({"contacts": result, "departments": dept_list}), 200

@whatsapp_bp.route("/whatsapp/group_link", methods=["GET"])
@jwt_required()
def get_group_links():
    """Returns admin-configured WhatsApp group invite links (e.g. company broadcast, dept groups)."""
    links_col = db["whatsapp_group_links"]
    links = list(links_col.find())
    return jsonify([{"id": str(l["_id"]), "name": l["name"], "link": l["link"], "department": l.get("department", "")} for l in links]), 200

@whatsapp_bp.route("/whatsapp/group_link", methods=["POST"])
@jwt_required()
def create_group_link():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error": "Forbidden"}), 403
    data = request.json
    links_col = db["whatsapp_group_links"]
    doc = {"name": data.get("name", ""), "link": data.get("link", ""), "department": data.get("department", "")}
    r = links_col.insert_one(doc)
    doc["_id"] = r.inserted_id
    return jsonify({"id": str(doc["_id"]), "name": doc["name"], "link": doc["link"], "department": doc["department"]}), 201

@whatsapp_bp.route("/whatsapp/group_link/<lid>", methods=["DELETE"])
@jwt_required()
def delete_group_link(lid):
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user.get("role") != "admin":
        return jsonify({"error": "Forbidden"}), 403
    db["whatsapp_group_links"].delete_one({"_id": ObjectId(lid)})
    return jsonify({"ok": True}), 200
