from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import users_col
from bson import ObjectId
import imaplib, smtplib, email
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

email_bp = Blueprint("email_routes", __name__)
IMAP_HOST = "mail.hostinger.com"; IMAP_PORT = 993
SMTP_HOST = "mail.hostinger.com"; SMTP_PORT = 465

def get_creds(uid):
    u = users_col.find_one({"_id": ObjectId(uid)})
    return u.get("hostinger_email",""), u.get("hostinger_password_plain",""), u

@email_bp.route("/email/inbox", methods=["GET"])
@jwt_required()
def get_inbox():
    uid = get_jwt_identity()
    email_addr, password, user = get_creds(uid)
    if not email_addr:
        return jsonify({"error": "No email configured. Add Hostinger credentials in Profile."}), 400
    try:
        mail = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT)
        mail.login(email_addr, password)
        mail.select("INBOX")
        _, data = mail.search(None, "ALL")
        ids = data[0].split()[-20:]
        emails = []
        for num in reversed(ids):
            _, msg_data = mail.fetch(num, "(RFC822)")
            msg = email.message_from_bytes(msg_data[0][1])
            emails.append({"id": num.decode(), "from": msg.get("From",""), "subject": msg.get("Subject","(No subject)"), "date": msg.get("Date","")})
        mail.logout()
        return jsonify(emails), 200
    except Exception as e:
        return jsonify({"error": f"Could not connect: {str(e)}"}), 500

@email_bp.route("/email/read/<msg_id>", methods=["GET"])
@jwt_required()
def read_email(msg_id):
    uid = get_jwt_identity()
    email_addr, password, _ = get_creds(uid)
    if not email_addr: return jsonify({"error":"No email configured"}), 400
    try:
        mail = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT)
        mail.login(email_addr, password)
        mail.select("INBOX")
        _, msg_data = mail.fetch(msg_id.encode(), "(RFC822)")
        msg = email.message_from_bytes(msg_data[0][1])
        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type()=="text/plain":
                    body = part.get_payload(decode=True).decode(errors="replace"); break
        else:
            body = msg.get_payload(decode=True).decode(errors="replace")
        mail.store(msg_id.encode(), "+FLAGS", "\\Seen")
        mail.logout()
        return jsonify({"id":msg_id,"from":msg.get("From",""),"to":msg.get("To",""),"subject":msg.get("Subject",""),"date":msg.get("Date",""),"body":body}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@email_bp.route("/email/send", methods=["POST"])
@jwt_required()
def send_email():
    uid = get_jwt_identity()
    email_addr, password, _ = get_creds(uid)
    if not email_addr: return jsonify({"error":"No email configured"}), 400
    data = request.json
    try:
        msg = MIMEMultipart()
        msg["From"] = email_addr; msg["To"] = data["to"]; msg["Subject"] = data.get("subject","")
        msg.attach(MIMEText(data.get("body",""), "plain"))
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(email_addr, password); server.send_message(msg)
        return jsonify({"ok": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@email_bp.route("/email/credentials", methods=["POST"])
@jwt_required()
def save_credentials():
    uid = get_jwt_identity()
    data = request.json
    users_col.update_one({"_id": ObjectId(uid)}, {"$set": {"hostinger_email": data.get("email",""), "hostinger_password_plain": data.get("password","")}})
    return jsonify({"ok": True}), 200
