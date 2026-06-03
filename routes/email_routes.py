from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import users_col
from bson import ObjectId
import imaplib, smtplib, email
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import socket

email_bp = Blueprint("email_routes", __name__)

IMAP_HOST = "mail.hostinger.com"
IMAP_PORT = 993
SMTP_HOST = "mail.hostinger.com"
SMTP_PORT = 465
TIMEOUT = 15  # seconds

def get_creds(uid):
    u = users_col.find_one({"_id": ObjectId(uid)})
    if not u:
        return "", "", None
    return u.get("hostinger_email", ""), u.get("hostinger_password_plain", ""), u

@email_bp.route("/email/inbox", methods=["GET"])
@jwt_required()
def get_inbox():
    uid = get_jwt_identity()
    email_addr, password, user = get_creds(uid)
    if not email_addr:
        return jsonify({"error": "No email configured. Go to Settings to add your Hostinger email."}), 400
    if not password:
        return jsonify({"error": "No password saved. Go to Settings and re-enter your email password."}), 400
    try:
        socket.setdefaulttimeout(TIMEOUT)
        mail = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT)
        mail.login(email_addr, password)
        mail.select("INBOX")
        _, data = mail.search(None, "ALL")
        ids = data[0].split()
        ids = ids[-20:] if len(ids) > 20 else ids
        emails = []
        for num in reversed(ids):
            try:
                _, msg_data = mail.fetch(num, "(RFC822.HEADER)")
                msg = email.message_from_bytes(msg_data[0][1])
                emails.append({
                    "id": num.decode(),
                    "from": msg.get("From", ""),
                    "subject": msg.get("Subject", "(No subject)"),
                    "date": msg.get("Date", ""),
                })
            except Exception:
                continue
        mail.logout()
        return jsonify(emails), 200
    except imaplib.IMAP4.error as e:
        return jsonify({"error": f"Login failed: Wrong email or password. ({str(e)})"}), 401
    except socket.timeout:
        return jsonify({"error": "Connection timed out. Check your internet connection or Hostinger server settings."}), 503
    except ConnectionRefusedError:
        return jsonify({"error": "Connection refused. Hostinger IMAP server unreachable."}), 503
    except Exception as e:
        return jsonify({"error": f"Could not connect: {str(e)}"}), 500

@email_bp.route("/email/read/<msg_id>", methods=["GET"])
@jwt_required()
def read_email(msg_id):
    uid = get_jwt_identity()
    email_addr, password, _ = get_creds(uid)
    if not email_addr:
        return jsonify({"error": "No email configured"}), 400
    try:
        socket.setdefaulttimeout(TIMEOUT)
        mail = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT)
        mail.login(email_addr, password)
        mail.select("INBOX")
        _, msg_data = mail.fetch(msg_id.encode(), "(RFC822)")
        msg = email.message_from_bytes(msg_data[0][1])
        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                ct = part.get_content_type()
                if ct == "text/plain":
                    body = part.get_payload(decode=True).decode(errors="replace")
                    break
                elif ct == "text/html" and not body:
                    body = part.get_payload(decode=True).decode(errors="replace")
        else:
            body = msg.get_payload(decode=True).decode(errors="replace")
        mail.store(msg_id.encode(), "+FLAGS", "\\Seen")
        mail.logout()
        return jsonify({
            "id": msg_id,
            "from": msg.get("From", ""),
            "to": msg.get("To", ""),
            "subject": msg.get("Subject", ""),
            "date": msg.get("Date", ""),
            "body": body,
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@email_bp.route("/email/send", methods=["POST"])
@jwt_required()
def send_email():
    uid = get_jwt_identity()
    email_addr, password, _ = get_creds(uid)
    if not email_addr:
        return jsonify({"error": "No email configured"}), 400
    data = request.json
    try:
        socket.setdefaulttimeout(TIMEOUT)
        msg = MIMEMultipart()
        msg["From"] = email_addr
        msg["To"] = data["to"]
        msg["Subject"] = data.get("subject", "")
        msg.attach(MIMEText(data.get("body", ""), "plain"))
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(email_addr, password)
            server.send_message(msg)
        return jsonify({"ok": True}), 200
    except smtplib.SMTPAuthenticationError:
        return jsonify({"error": "SMTP login failed. Check your email and password."}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@email_bp.route("/email/credentials", methods=["POST"])
@jwt_required()
def save_credentials():
    uid = get_jwt_identity()
    data = request.json
    users_col.update_one(
        {"_id": ObjectId(uid)},
        {"$set": {
            "hostinger_email": data.get("email", ""),
            "hostinger_password_plain": data.get("password", ""),
        }}
    )
    return jsonify({"ok": True}), 200

@email_bp.route("/email/test", methods=["GET"])
@jwt_required()
def test_connection():
    """Test IMAP connection and return detailed status"""
    uid = get_jwt_identity()
    email_addr, password, _ = get_creds(uid)
    if not email_addr:
        return jsonify({"ok": False, "error": "No email configured"}), 200
    try:
        socket.setdefaulttimeout(10)
        mail = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT)
        mail.login(email_addr, password)
        mail.logout()
        return jsonify({"ok": True, "message": "Connected successfully!"}), 200
    except imaplib.IMAP4.error:
        return jsonify({"ok": False, "error": "Wrong email or password"}), 200
    except socket.timeout:
        return jsonify({"ok": False, "error": "Timed out — check internet connection"}), 200
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 200
