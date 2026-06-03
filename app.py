import os
from flask import Flask, send_from_directory, jsonify, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

load_dotenv()

BUILD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "build")

app = Flask(__name__, static_folder=None)
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET", "dev-secret-change-in-production")

CORS(app, resources={r"/api/*": {"origins": "*"}})
jwt = JWTManager(app)

# Serve uploaded files
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.route("/static/uploads/<path:filename>")
def serve_upload(filename):
    return send_from_directory(UPLOAD_DIR, filename)

# Serve React static assets (JS/CSS)
@app.route("/static/<path:filename>")
def serve_static(filename):
    static_dir = os.path.join(BUILD_DIR, "static")
    return send_from_directory(static_dir, filename)

# Register API blueprints
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

# ALL non-API routes → serve React index.html (SPA routing)
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    # Don't intercept API calls
    if path.startswith("api/"):
        return jsonify({"error": "Not found"}), 404
    # Don't intercept static assets
    if path.startswith("static/"):
        return jsonify({"error": "Not found"}), 404
    # Serve index.html for ALL other paths (React router handles them)
    index_path = os.path.join(BUILD_DIR, "index.html")
    if os.path.exists(index_path):
        return send_file(index_path)
    return jsonify({"error": "Frontend not built. Run: cd frontend && npm install && npm run build"}), 404

if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    print(f"\n🚀 WorkSpace Staff running at http://localhost:{port}")
    print(f"📡 Share with office: http://YOUR_LOCAL_IP:{port}\n")
    app.run(host="0.0.0.0", port=port, debug=debug)
