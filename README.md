# AJ Map — Adaptive Learning Platform

A beginner-friendly full-stack web application for adaptive learning.

## Tech Stack

| Layer     | Technology          |
|-----------|---------------------|
| Frontend  | HTML + Tailwind CSS + JavaScript |
| Backend   | Python + Flask      |
| Database  | Neon (PostgreSQL)   |
| Hosting   | Render              |
| PDF       | fpdf2               |

---

## Features

- 3 courses: Data Analyst, Web Developer, Cyber Security
- 5 YouTube video lessons per course
- Real-time SVG flowchart progress tracking
- User accounts (email-based, no password needed)
- PDF certificate download on course completion
- Dark navy + cyan color scheme

---

## Local Setup

### 1. Install Python 3.10+
Download from https://python.org

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Set up your database
- Create a free account at https://neon.tech
- Create a new project
- Copy the **Connection String** (it looks like `postgresql://...`)

### 4. Create a `.env` file
```
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
SECRET_KEY=any-random-string-here
```

### 5. Run the app
```bash
python app.py
```

Open http://localhost:5000 in your browser.

---

## Deploy to Render (Free)

1. Push this folder to a GitHub repository
2. Go to https://render.com and sign in
3. Click **New → Web Service**
4. Connect your GitHub repo
5. Render auto-detects Python — settings:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app --bind 0.0.0.0:$PORT`
6. Add **Environment Variables:**
   - `DATABASE_URL` = your Neon connection string
   - `SECRET_KEY` = any random string
7. Click **Deploy**

Your app will be live at `https://your-app-name.onrender.com`

---

## Project Structure

```
aj-map/
├── app.py                 ← All Flask routes + logic
├── requirements.txt       ← Python packages
├── render.yaml            ← Render deployment config
├── Procfile               ← For Render/Heroku
├── .env.example           ← Template for your .env file
├── static/
│   └── js/
│       └── main.js        ← Global JavaScript
└── templates/
    ├── base.html          ← Sidebar + header layout
    ├── login.html         ← Login/signup page
    ├── home.html          ← Dashboard
    ├── courses.html       ← Course listing
    ├── course_detail.html ← Video player + flowchart
    ├── progress.html      ← Progress tracking
    ├── certifications.html← Certificate download
    └── account.html       ← User profile
```
