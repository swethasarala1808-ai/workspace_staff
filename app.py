import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder="static/build", static_url_path="")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET", "dev-secret-change-in-production")

CORS(app, resources={r"/api/*": {"origins": "*"}})
jwt = JWTManager(app)

# Serve uploaded files
@app.route("/static/uploads/<path:filename>")
def serve_upload(filename):
    upload_dir = os.path.join(os.path.dirname(__file__), "static", "uploads")
    return send_from_directory(upload_dir, filename)

from routes.auth import auth_bp
from routes.chat import chat_bp
from routes.ideas import ideas_bp
from routes.policies import policies_bp
from routes.materials import materials_bp
from routes.email_routes import email_bp
from routes.users import users_bp

app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(chat_bp, url_prefix="/api/chat")
app.register_blueprint(ideas_bp, url_prefix="/api")
app.register_blueprint(policies_bp, url_prefix="/api")
app.register_blueprint(materials_bp, url_prefix="/api")
app.register_blueprint(email_bp, url_prefix="/api")
app.register_blueprint(users_bp, url_prefix="/api")

@app.route("/api/health")
def health():
    return jsonify({"status": "ok"}), 200

# React catch-all — must come LAST
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    # Don't intercept /api or /static/uploads
    if path.startswith("api/") or path.startswith("static/uploads/"):
        return jsonify({"error": "Not found"}), 404
    build_dir = app.static_folder
    full = os.path.join(build_dir, path)
    if path and os.path.exists(full):
        return send_from_directory(build_dir, path)
    index = os.path.join(build_dir, "index.html")
    if os.path.exists(index):
        return send_from_directory(build_dir, "index.html")
    return jsonify({"error": "Frontend not built. Run: cd frontend && npm install && npm run build"}), 404

if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    print(f"\n🚀 WorkSpace Staff running at http://localhost:{port}")
    print(f"📡 Share with office: http://YOUR_LOCAL_IP:{port}\n")
    app.run(host="0.0.0.0", port=port, debug=debug)
