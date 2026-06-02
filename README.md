# 🏢 WorkSpace Staff

Internal collaboration platform for SERIA and BIZAXL staff. Runs on a single command.

## Features

### SERIA Portal
- View marketing materials
- Give feedback (Excellent/Good/Okay/Needs Work/Bad) with comments

### BIZAXL Workspace
- 💬 **Chat** — Department chat + company-wide chat, auto-refreshes every 5s
- 📧 **Email** — Hostinger IMAP/SMTP inbox, compose, reply
- 💡 **Ideas Board** — Post, like, comment, status tracking
- 📋 **Policies** — Admin-created policies, acknowledge with ✅ read
- 📁 **Materials** — Company docs with feedback
- ⚙️ **Admin Panel** — Manage users, roles, content

## Quick Start

```bash
git clone https://github.com/swethasarala1808-ai/workspace_staff.git
cd workspace_staff
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Build the React frontend
cd frontend
npm install
npm run build
cd ..

# Run the app
python app.py
```

Open: http://localhost:5000

Share with office (same network): `http://YOUR_LOCAL_IP:5000`

To find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

## .env Setup

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/workspace_staff
JWT_SECRET=any_long_random_string_here
FLASK_PORT=5000
FLASK_DEBUG=True
```

## First Admin

The **first user to register** for each company automatically becomes **admin**.

1. Register at http://localhost:5000
2. Choose company: BIZAXL or SERIA
3. You'll be admin automatically
4. Admins can then seed default policies, manage users, and add materials

## Tech Stack

- **Backend:** Python Flask + PyMongo
- **Frontend:** React 18 (served as static files by Flask)
- **Database:** MongoDB Atlas
- **Email:** Python imaplib + smtplib (Hostinger IMAP/SMTP)
- **Auth:** JWT via flask-jwt-extended

## File Structure

```
workspace_staff/
├── app.py              # Flask app entry point
├── requirements.txt
├── .env.example
├── models/db.py        # MongoDB connection
├── routes/             # API blueprints
│   ├── auth.py
│   ├── chat.py
│   ├── ideas.py
│   ├── policies.py
│   ├── materials.py
│   ├── email_routes.py
│   └── users.py
├── frontend/           # React source
│   └── src/
└── static/build/       # Built React (auto-generated)
```

## Department Colors
- 🔵 Deployment
- 🟣 Functional  
- 🩷 Marketing
- 🟢 Research
