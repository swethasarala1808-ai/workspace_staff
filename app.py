import os
from flask import Flask, send_from_directory, jsonify, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BUILD_DIR = os.path.join(BASE_DIR, "static", "build")
IS_VERCEL = os.environ.get("VERCEL", False)
UPLOAD_DIR = "/tmp/uploads" if IS_VERCEL else os.path.join(BASE_DIR, "static", "uploads")
DRIVE_DIR  = "/tmp/drive"   if IS_VERCEL else os.path.join(BASE_DIR, "static", "drive")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(DRIVE_DIR, exist_ok=True)

app = Flask(__name__, static_folder=None)
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET", "bizaxl-workspace-secret-key-2024")
CORS(app, resources={r"/api/*": {"origins": "*"}})
jwt = JWTManager(app)

@app.route("/static/logo.svg")
def serve_logo():
    return send_from_directory(os.path.join(BASE_DIR, "static"), "logo.svg")

@app.route("/static/uploads/<path:filename>")
def serve_upload(filename):
    return send_from_directory(UPLOAD_DIR, filename)

@app.route("/static/drive/<path:filename>")
def serve_drive_file(filename):
    return send_from_directory(DRIVE_DIR, filename)

@app.route("/static/<path:filename>")
def serve_static(filename):
    return send_from_directory(os.path.join(BUILD_DIR, "static"), filename)

from routes.auth          import auth_bp
from routes.chat          import chat_bp
from routes.ideas         import ideas_bp
from routes.policies      import policies_bp
from routes.materials     import materials_bp
from routes.email_routes  import email_bp
from routes.users         import users_bp
from routes.drive         import drive_bp
from routes.meetings      import meetings_bp
from routes.leads         import leads_bp
from routes.quicklinks    import quicklinks_bp
from routes.announcements import announcements_bp
from routes.orgchart      import orgchart_bp

app.register_blueprint(auth_bp,          url_prefix="/api/auth")
app.register_blueprint(chat_bp,          url_prefix="/api/chat")
app.register_blueprint(ideas_bp,         url_prefix="/api")
app.register_blueprint(policies_bp,      url_prefix="/api")
app.register_blueprint(materials_bp,     url_prefix="/api")
app.register_blueprint(email_bp,         url_prefix="/api")
app.register_blueprint(users_bp,         url_prefix="/api")
app.register_blueprint(drive_bp,         url_prefix="/api")
app.register_blueprint(meetings_bp,      url_prefix="/api")
app.register_blueprint(leads_bp,         url_prefix="/api")
app.register_blueprint(quicklinks_bp,    url_prefix="/api")
app.register_blueprint(announcements_bp, url_prefix="/api")
app.register_blueprint(orgchart_bp,      url_prefix="/api")

# Public endpoint - departments for registration (no auth needed)
from models.db import db
@app.route("/api/public/departments")
def public_departments():
    depts = list(db["departments"].find({}, {"name":1, "color":1, "icon":1}))
    return jsonify([{"name":d["name"],"color":d.get("color","#14F1B1"),"icon":d.get("icon","👥")} for d in depts])

@app.route("/api/health")
def health():
    return jsonify({"status":"ok"}), 200

@app.route("/", defaults={"path":""})
@app.route("/<path:path>")
def serve_react(path):
    if path.startswith("api/") or path.startswith("static/"):
        return jsonify({"error":"Not found"}), 404
    index_path = os.path.join(BUILD_DIR, "index.html")
    if os.path.exists(index_path):
        return send_file(index_path)
    return jsonify({"error":"Frontend not built"}), 404

if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5000))
    debug = os.getenv("FLASK_DEBUG","True").lower() == "true"
    print(f"\n  bizaxl WorkSpace running at http://localhost:{port}\n")
    app.run(host="0.0.0.0", port=port, debug=debug)
