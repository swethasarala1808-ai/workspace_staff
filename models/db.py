from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

_uri = os.getenv("MONGODB_URI", "")

# Try SRV URI first, fall back to direct IPs if DNS fails
def make_client():
    # Direct IP fallback - bypasses DNS completely
    DIRECT_URI = "mongodb://swethasarala1808_db_user:INqA7wi6yzin50sG@ac-cc74ey8-shard-00-00.9vlscd5.mongodb.net:27017,ac-cc74ey8-shard-00-01.9vlscd5.mongodb.net:27017,ac-cc74ey8-shard-00-02.9vlscd5.mongodb.net:27017/workspace_staff?authSource=admin&replicaSet=atlas-xxxxxxx&tls=true"
    
    opts = dict(
        serverSelectionTimeoutMS=15000,
        connectTimeoutMS=15000,
        socketTimeoutMS=20000,
        tls=True,
        tlsAllowInvalidCertificates=True,
    )
    
    if _uri:
        try:
            c = MongoClient(_uri, **opts)
            c.admin.command('ping')
            print("  MongoDB connected via SRV")
            return c
        except Exception as e:
            print(f"  SRV failed ({e}), trying direct IPs...")
    
    # Try direct IPs - bypasses DNS
    hosts = [
        "ac-cc74ey8-shard-00-00.9vlscd5.mongodb.net",
        "ac-cc74ey8-shard-00-01.9vlscd5.mongodb.net", 
        "ac-cc74ey8-shard-00-02.9vlscd5.mongodb.net",
    ]
    
    import socket
    for host in hosts:
        try:
            ip = socket.gethostbyname(host)
            direct = f"mongodb://swethasarala1808_db_user:INqA7wi6yzin50sG@{ip}:27017/workspace_staff?authSource=admin&tls=true"
            c = MongoClient(direct, **opts)
            c.admin.command('ping')
            print(f"  MongoDB connected via {ip}")
            return c
        except Exception:
            continue
    
    raise RuntimeError("Cannot connect to MongoDB. Fix network first: sudo chattr -i /etc/resolv.conf && echo 'nameserver 8.8.8.8' | sudo tee /etc/resolv.conf")

client = make_client()

db            = client["workspace_staff"]
users_col     = db["users"]
messages_col  = db["messages"]
ideas_col     = db["ideas"]
policies_col  = db["policies"]
materials_col = db["materials"]
feedback_col  = db["feedback"]
solutions_col = db["solutions"]
meetings_col  = db["meetings"]
drive_col     = db["drive_files"]

try:
    users_col.create_index("email", unique=True)
    messages_col.create_index([("channel",1),("created_at",-1)])
    meetings_col.create_index("start_dt")
    drive_col.create_index("parent_id")
except Exception:
    pass
