from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

client = MongoClient(os.getenv("MONGODB_URI"))
db = client["workspace_staff"]

users_col = db["users"]
messages_col = db["messages"]
ideas_col = db["ideas"]
policies_col = db["policies"]
materials_col = db["materials"]
feedback_col = db["feedback"]
solutions_col = db["solutions"]

users_col.create_index("email", unique=True)
messages_col.create_index([("channel", 1), ("created_at", -1)])

meetings_col = db["meetings"]
meetings_col.create_index("start_dt")
drive_col = db["drive_files"]
