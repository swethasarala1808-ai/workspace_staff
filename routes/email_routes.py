from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import users_col
from bson import ObjectId
import socket

email_bp = Blueprint("email_routes", __name__)
IMAP_HOST = "mail.hostinger.com"; IMAP_PORT = 993
SMTP_HOST = "mail.hostinger.com"; SMTP_PORT = 465
TIMEOUT = 20

def get_creds(uid):
    u = users_col.find_one({"_id": ObjectId(uid)})
    if not u: return "", "", None
    return u.get("hostinger_email",""), u.get("hostinger_password_plain",""), u

def try_imap(email_addr, password):
    import imaplib
    socket.setdefaulttimeout(TIMEOUT)
    mail = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT)
    mail.login(email_addr, password)
    return mail

@email_bp.route("/email/inbox", methods=["GET"])
@jwt_required()
def get_inbox():
    import imaplib, email as emaillib
    uid = get_jwt_identity()
    email_addr, password, user = get_creds(uid)
    if not email_addr:
        return jsonify({"error":"No email configured. Go to Profile → Email Settings."}), 400
    if not password:
        return jsonify({"error":"No password saved. Go to Profile → Email Settings."}), 400
    try:
        mail = try_imap(email_addr, password)
        mail.select("INBOX")
        _, data = mail.search(None, "ALL")
        ids = data[0].split()
        ids = ids[-25:] if len(ids) > 25 else ids
        emails = []
        for num in reversed(ids):
            try:
                _, msg_data = mail.fetch(num, "(RFC822.HEADER)")
                msg = emaillib.message_from_bytes(msg_data[0][1])
                emails.append({"id":num.decode(),"from":msg.get("From",""),"subject":msg.get("Subject","(No subject)"),"date":msg.get("Date","")})
            except Exception: continue
        mail.logout()
        return jsonify(emails), 200
    except imaplib.IMAP4.error as e:
        return jsonify({"error":f"Login failed. Check your email and password. ({str(e)})"}), 401
    except socket.timeout:
        return jsonify({"error":"Connection timed out. Your network may be blocking port 993. Try on a different network."}), 503
    except OSError as e:
        if getattr(e, "errno", None) == 101:
            return jsonify({"error":"Network is unreachable on port 993. This network (often a campus/ISP/router firewall in WSL setups) blocks outbound mail ports entirely, even though normal web browsing works. This isn't something the app can bypass — try a mobile hotspot, a VPN, or open webmail directly at https://mail.hostinger.com instead."}), 503
        return jsonify({"error":f"Network error: {str(e)}. Port 993 may be blocked on this network (common in WSL/office networks)."}), 503
    except Exception as e:
        return jsonify({"error":f"Could not connect: {str(e)}"}), 500

@email_bp.route("/email/read/<msg_id>", methods=["GET"])
@jwt_required()
def read_email(msg_id):
    import imaplib, email as emaillib
    uid = get_jwt_identity()
    email_addr, password, _ = get_creds(uid)
    if not email_addr: return jsonify({"error":"No email configured"}), 400
    try:
        mail = try_imap(email_addr, password)
        mail.select("INBOX")
        _, msg_data = mail.fetch(msg_id.encode(), "(RFC822)")
        msg = emaillib.message_from_bytes(msg_data[0][1])
        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                ct = part.get_content_type()
                if ct == "text/plain":
                    body = part.get_payload(decode=True).decode(errors="replace"); break
                elif ct == "text/html" and not body:
                    body = part.get_payload(decode=True).decode(errors="replace")
        else:
            body = msg.get_payload(decode=True).decode(errors="replace")
        mail.store(msg_id.encode(), "+FLAGS", "\\Seen")
        mail.logout()
        return jsonify({"id":msg_id,"from":msg.get("From",""),"to":msg.get("To",""),"subject":msg.get("Subject",""),"date":msg.get("Date",""),"body":body}), 200
    except Exception as e:
        return jsonify({"error":str(e)}), 500

@email_bp.route("/email/send", methods=["POST"])
@jwt_required()
def send_email():
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    uid = get_jwt_identity()
    email_addr, password, _ = get_creds(uid)
    if not email_addr: return jsonify({"error":"No email configured"}), 400
    data = request.json
    try:
        socket.setdefaulttimeout(TIMEOUT)
        msg = MIMEMultipart()
        msg["From"] = email_addr; msg["To"] = data["to"]; msg["Subject"] = data.get("subject","")
        msg.attach(MIMEText(data.get("body",""), "plain"))
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(email_addr, password); server.send_message(msg)
        return jsonify({"ok":True}), 200
    except smtplib.SMTPAuthenticationError:
        return jsonify({"error":"SMTP login failed. Check email and password."}), 401
    except socket.timeout:
        return jsonify({"error":"Connection timed out. Port 465 may be blocked."}), 503
    except OSError as e:
        if getattr(e, "errno", None) == 101:
            return jsonify({"error":"Network is unreachable on port 465. This network blocks outbound mail ports — try a mobile hotspot, a VPN, or send via https://mail.hostinger.com directly."}), 503
        return jsonify({"error":f"Network error: {str(e)}"}), 503
    except Exception as e:
        return jsonify({"error":str(e)}), 500

@email_bp.route("/email/credentials", methods=["POST"])
@jwt_required()
def save_credentials():
    uid = get_jwt_identity()
    data = request.json
    users_col.update_one({"_id":ObjectId(uid)},{"$set":{"hostinger_email":data.get("email",""),"hostinger_password_plain":data.get("password","")}})
    return jsonify({"ok":True}), 200

@email_bp.route("/email/test", methods=["GET"])
@jwt_required()
def test_connection():
    import imaplib
    uid = get_jwt_identity()
    email_addr, password, _ = get_creds(uid)
    if not email_addr: return jsonify({"ok":False,"error":"No email configured"}), 200
    try:
        mail = try_imap(email_addr, password)
        mail.logout()
        return jsonify({"ok":True,"message":"Connected successfully!"}), 200
    except imaplib.IMAP4.error:
        return jsonify({"ok":False,"error":"Wrong email or password"}), 200
    except socket.timeout:
        return jsonify({"ok":False,"error":"Timed out — port 993 is blocked on this network"}), 200
    except OSError as e:
        return jsonify({"ok":False,"error":f"Network blocked: {str(e)}"}), 200
    except Exception as e:
        return jsonify({"ok":False,"error":str(e)}), 200
