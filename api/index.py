import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, send_from_directory, jsonify, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD_DIR = os.path.join(BASE_DIR, "static", "build")
UPLOAD_DIR = "/tmp/uploads"
DRIVE_DIR  = "/tmp/drive"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(DRIVE_DIR,  exist_ok=True)

app = Flask(__name__, static_folder=None)
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
CORS(app, resources={r"/api/*": {"origins": "*"}})
jwt = JWTManager(app)

@app.route("/static/uploads/<path:filename>")
def serve_upload(filename):
    return send_from_directory(UPLOAD_DIR, filename)

@app.route("/static/drive/<path:filename>")
def serve_drive_file(filename):
    return send_from_directory(DRIVE_DIR, filename)

@app.route("/static/<path:filename>")
def serve_static(filename):
    return send_from_directory(os.path.join(BUILD_DIR, "static"), filename)

from routes.auth         import auth_bp
from routes.chat         import chat_bp
from routes.ideas        import ideas_bp
from routes.policies     import policies_bp
from routes.materials    import materials_bp
from routes.email_routes import email_bp
from routes.users        import users_bp
from routes.drive        import drive_bp
from routes.meetings     import meetings_bp

app.register_blueprint(auth_bp,      url_prefix="/api/auth")
app.register_blueprint(chat_bp,      url_prefix="/api/chat")
app.register_blueprint(ideas_bp,     url_prefix="/api")
app.register_blueprint(policies_bp,  url_prefix="/api")
app.register_blueprint(materials_bp, url_prefix="/api")
app.register_blueprint(email_bp,     url_prefix="/api")
app.register_blueprint(users_bp,     url_prefix="/api")
app.register_blueprint(drive_bp,     url_prefix="/api")
app.register_blueprint(meetings_bp,  url_prefix="/api")

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "env": "vercel"}), 200

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    if path.startswith("api/") or path.startswith("static/"):
        return jsonify({"error": "Not found"}), 404
    index_path = os.path.join(BUILD_DIR, "index.html")
    if os.path.exists(index_path):
        return send_file(index_path)
    return jsonify({"error": "Frontend not built"}), 404

# Vercel needs this exact variable name
application = app
