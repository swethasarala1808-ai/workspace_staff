from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

_uri = os.getenv("MONGODB_URI")
if not _uri:
    raise RuntimeError("MONGODB_URI environment variable is not set. Add it in Vercel dashboard → Settings → Environment Variables")

client = MongoClient(_uri)
db = client["workspace_staff"]

users_col     = db["users"]
messages_col  = db["messages"]
ideas_col     = db["ideas"]
policies_col  = db["policies"]
materials_col = db["materials"]
feedback_col  = db["feedback"]
solutions_col = db["solutions"]
meetings_col  = db["meetings"]
drive_col     = db["drive_files"]

# Indexes
try:
    users_col.create_index("email", unique=True)
    messages_col.create_index([("channel", 1), ("created_at", -1)])
    meetings_col.create_index("start_dt")
    drive_col.create_index("parent_id")
except Exception:
    pass
