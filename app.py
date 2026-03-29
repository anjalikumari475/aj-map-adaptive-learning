"""
AJ Map - Adaptive Learning Platform
Backend: Python + Flask
Database: Neon PostgreSQL (psycopg2)
Hosting: Render
"""

import os
import json
import uuid
from datetime import datetime
from functools import wraps

import psycopg2
import psycopg2.extras
from fpdf import FPDF
from flask import (Flask, render_template, request, redirect,
                   url_for, session, make_response, jsonify)
from dotenv import load_dotenv

# Load .env file for local development
load_dotenv()

app = Flask(__name__)

# Secret key for session cookies (set in environment variables on Render)
app.secret_key = os.environ.get("SECRET_KEY", "aj-map-local-dev-secret-key")

# Neon PostgreSQL connection string (set in environment variables on Render)
DATABASE_URL = os.environ.get("DATABASE_URL", "")


# ==========================================
# COURSE DATA
# All courses, videos and YouTube IDs are here
# ==========================================

COURSES = {
    "data-analyst": {
        "id": "data-analyst",
        "title": "Data Analyst",
        "description": "Master data analysis, visualization, and statistical thinking to turn raw data into powerful insights.",
        "color": "#06b6d4",
        "icon": "📊",
        "videos": [
            {"id": "v1", "title": "Introduction to Data Analysis", "youtube_id": "Liv2MfdJIvg"},
            {"id": "v2", "title": "Python for Data Analysis",      "youtube_id": "iuBaJtW5gA8"},
            {"id": "v3", "title": "Data Visualization Basics",     "youtube_id": "QYcnkHWHFbE"},
            {"id": "v4", "title": "SQL for Data Analysts",         "youtube_id": "1VCWpRwZ4dM"},
            {"id": "v5", "title": "Machine Learning Basics",       "youtube_id": "bDTE7aJZSaM"},
        ]
    },
    "web-developer": {
        "id": "web-developer",
        "title": "Web Developer",
        "description": "Build modern, responsive web apps from scratch using HTML, CSS, JavaScript, and popular frameworks.",
        "color": "#8b5cf6",
        "icon": "💻",
        "videos": [
            {"id": "v1", "title": "HTML & CSS Fundamentals",       "youtube_id": "ysEN5RaKOlA"},
            {"id": "v2", "title": "JavaScript Essentials",         "youtube_id": "UB1O30fR-EE"},
            {"id": "v3", "title": "React.js for Beginners",        "youtube_id": "h0e2HAPTGF0"},
            {"id": "v4", "title": "Node.js & Express Backend",     "youtube_id": "G3e-cpL7ofc"},
            {"id": "v5", "title": "Full Stack Project Walkthrough", "youtube_id": "SBmUHDkbHUA"},
        ]
    },
    "cyber-security": {
        "id": "cyber-security",
        "title": "Cyber Security",
        "description": "Learn ethical hacking, network security, and best practices to protect systems from threats.",
        "color": "#f97316",
        "icon": "🔒",
        "videos": [
            {"id": "v1", "title": "Introduction to Cyber Security",   "youtube_id": "inWWhr5tnEA"},
            {"id": "v2", "title": "Network Security Fundamentals",    "youtube_id": "hXSFdwxNqMs"},
            {"id": "v3", "title": "Ethical Hacking Basics",           "youtube_id": "U_P23SqJaDc"},
            {"id": "v4", "title": "Cryptography & Encryption",        "youtube_id": "nzZkKoREEGo"},
            {"id": "v5", "title": "Security Best Practices",          "youtube_id": "26ABzvAuyS8"},
        ]
    }
}


# ==========================================
# DATABASE HELPERS
# ==========================================

def get_db():
    """Create a new database connection."""
    # Make sure sslmode=require is in the URL for Neon
    url = DATABASE_URL
    if "sslmode" not in url:
        url += ("&" if "?" in url else "?") + "sslmode=require"
    conn = psycopg2.connect(url)
    return conn


def init_db():
    """Create tables if they do not exist yet."""
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            email       TEXT UNIQUE NOT NULL,
            created_at  TIMESTAMP DEFAULT NOW()
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS course_progress (
            id                TEXT PRIMARY KEY,
            user_id           TEXT NOT NULL,
            course_id         TEXT NOT NULL,
            completed_videos  TEXT    DEFAULT '[]',
            total_videos      INTEGER DEFAULT 5,
            percent_complete  REAL    DEFAULT 0,
            completed         BOOLEAN DEFAULT FALSE,
            updated_at        TIMESTAMP DEFAULT NOW(),
            UNIQUE(user_id, course_id)
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS certificates (
            id          TEXT PRIMARY KEY,
            user_id     TEXT NOT NULL,
            course_id   TEXT NOT NULL,
            course_name TEXT NOT NULL,
            user_name   TEXT NOT NULL,
            issued_at   TIMESTAMP DEFAULT NOW(),
            UNIQUE(user_id, course_id)
        )
    """)

    conn.commit()
    cur.close()
    conn.close()


# Run init_db when the app starts
with app.app_context():
    try:
        init_db()
    except Exception as e:
        print(f"Warning: Could not init DB: {e}")


# ==========================================
# LOGIN REQUIRED DECORATOR
# ==========================================

def login_required(f):
    """Redirect to /login if the user is not logged in."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated


# ==========================================
# HELPER: get user's progress from DB
# ==========================================

def get_progress(user_id, course_id=None):
    """Return a dict of course_id -> progress info for a user."""
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    if course_id:
        cur.execute(
            "SELECT * FROM course_progress WHERE user_id = %s AND course_id = %s",
            (user_id, course_id)
        )
        rows = cur.fetchall()
    else:
        cur.execute(
            "SELECT * FROM course_progress WHERE user_id = %s",
            (user_id,)
        )
        rows = cur.fetchall()

    cur.close()
    conn.close()

    result = {}
    for row in rows:
        result[row["course_id"]] = {
            "completed_videos": json.loads(row["completed_videos"]),
            "total_videos":     row["total_videos"],
            "percent_complete": row["percent_complete"],
            "completed":        row["completed"],
        }
    return result


# ==========================================
# ROUTES
# ==========================================

@app.route("/login", methods=["GET", "POST"])
def login():
    """Show login form (GET) or process login/signup (POST)."""
    if "user_id" in session:
        return redirect(url_for("home"))

    error = None

    if request.method == "POST":
        name  = request.form.get("name",  "").strip()
        email = request.form.get("email", "").strip().lower()

        if not email:
            error = "Please enter your email address."
        else:
            if not name:
                name = email.split("@")[0]   # use part before @ as name

            try:
                conn = get_db()
                cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

                # Check if user already exists
                cur.execute("SELECT * FROM users WHERE email = %s", (email,))
                user = cur.fetchone()

                if user:
                    # Existing user — log them in
                    session["user_id"]    = user["id"]
                    session["user_name"]  = user["name"]
                    session["user_email"] = user["email"]
                else:
                    # New user — create account
                    user_id = str(uuid.uuid4())
                    cur.execute(
                        "INSERT INTO users (id, name, email) VALUES (%s, %s, %s)",
                        (user_id, name, email)
                    )
                    conn.commit()
                    session["user_id"]    = user_id
                    session["user_name"]  = name
                    session["user_email"] = email

                cur.close()
                conn.close()
                return redirect(url_for("home"))

            except Exception as e:
                error = f"Database error: {str(e)}"

    return render_template("login.html", error=error)


@app.route("/logout")
def logout():
    """Clear session and redirect to login."""
    session.clear()
    return redirect(url_for("login"))


@app.route("/")
@login_required
def home():
    """Home page — shows course cards with progress."""
    progress = get_progress(session["user_id"])
    return render_template("home.html", courses=COURSES, progress=progress)


@app.route("/courses")
@login_required
def courses():
    """Courses listing page."""
    progress = get_progress(session["user_id"])
    return render_template("courses.html", courses=COURSES, progress=progress)


@app.route("/courses/<course_id>")
@login_required
def course_detail(course_id):
    """Single course page with video list and flowchart."""
    course = COURSES.get(course_id)
    if not course:
        return redirect(url_for("courses"))

    prog = get_progress(session["user_id"], course_id)
    progress = prog.get(course_id, {
        "completed_videos": [],
        "total_videos":     len(course["videos"]),
        "percent_complete": 0,
        "completed":        False,
    })

    return render_template("course_detail.html", course=course, progress=progress)


@app.route("/api/complete-video", methods=["POST"])
@login_required
def complete_video():
    """
    AJAX endpoint — mark a video as complete.
    Expected JSON body: { "course_id": "...", "youtube_id": "..." }
    """
    data      = request.get_json()
    user_id   = session["user_id"]
    course_id = data.get("course_id")
    ytid      = data.get("youtube_id")

    course = COURSES.get(course_id)
    if not course:
        return jsonify({"error": "Course not found"}), 404

    conn = get_db()
    cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Get existing progress row
    cur.execute(
        "SELECT * FROM course_progress WHERE user_id = %s AND course_id = %s",
        (user_id, course_id)
    )
    row = cur.fetchone()

    completed_videos = json.loads(row["completed_videos"]) if row else []

    # Add video if not already in the list
    if ytid not in completed_videos:
        completed_videos.append(ytid)

    total   = len(course["videos"])
    percent = (len(completed_videos) / total) * 100
    done    = len(completed_videos) >= total

    if row:
        cur.execute("""
            UPDATE course_progress
               SET completed_videos = %s,
                   percent_complete  = %s,
                   completed         = %s,
                   updated_at        = NOW()
             WHERE user_id = %s AND course_id = %s
        """, (json.dumps(completed_videos), percent, done, user_id, course_id))
    else:
        cur.execute("""
            INSERT INTO course_progress
                   (id, user_id, course_id, completed_videos, total_videos, percent_complete, completed)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (str(uuid.uuid4()), user_id, course_id,
              json.dumps(completed_videos), total, percent, done))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({
        "completed_videos": completed_videos,
        "percent":          percent,
        "completed":        done,
    })


@app.route("/progress")
@login_required
def progress():
    """Progress page — shows progress bars for all courses."""
    prog = get_progress(session["user_id"])
    return render_template("progress.html", courses=COURSES, progress=prog)


@app.route("/certifications")
@login_required
def certifications():
    """Certifications page — shows earned certificates."""
    user_id = session["user_id"]

    conn = get_db()
    cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM course_progress WHERE user_id = %s", (user_id,))
    prog_rows = cur.fetchall()
    cur.execute("SELECT * FROM certificates WHERE user_id = %s", (user_id,))
    cert_rows = cur.fetchall()
    cur.close()
    conn.close()

    progress = {r["course_id"]: {"completed": r["completed"]} for r in prog_rows}
    certs    = {r["course_id"]: r for r in cert_rows}

    return render_template("certifications.html",
                           courses=COURSES, progress=progress, certs=certs)


@app.route("/download-certificate/<course_id>")
@login_required
def download_certificate(course_id):
    """Generate and download a PDF certificate for a completed course."""
    user_id = session["user_id"]
    course  = COURSES.get(course_id)

    if not course:
        return redirect(url_for("certifications"))

    # Check course is actually completed
    conn = get_db()
    cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        "SELECT * FROM course_progress WHERE user_id = %s AND course_id = %s",
        (user_id, course_id)
    )
    prog = cur.fetchone()

    if not prog or not prog["completed"]:
        cur.close()
        conn.close()
        return redirect(url_for("certifications"))

    # Create certificate record if it does not exist yet
    cur.execute(
        "SELECT * FROM certificates WHERE user_id = %s AND course_id = %s",
        (user_id, course_id)
    )
    cert = cur.fetchone()

    user_name = session["user_name"]

    if not cert:
        cert_id = str(uuid.uuid4())
        cur.execute("""
            INSERT INTO certificates (id, user_id, course_id, course_name, user_name)
            VALUES (%s, %s, %s, %s, %s)
        """, (cert_id, user_id, course_id, course["title"], user_name))
        conn.commit()
        issue_date = datetime.now()
    else:
        issue_date = cert["issued_at"]

    cur.close()
    conn.close()

    # ---- Build the PDF ----
    pdf = FPDF(orientation="L", format="A4")   # Landscape A4
    pdf.add_page()

    # Dark background
    pdf.set_fill_color(15, 23, 42)
    pdf.rect(0, 0, 297, 210, "F")

    # Cyan border
    pdf.set_draw_color(6, 182, 212)
    pdf.set_line_width(2)
    pdf.rect(8, 8, 281, 194)

    # AJ MAP title
    pdf.set_font("Helvetica", "B", 34)
    pdf.set_text_color(6, 182, 212)
    pdf.set_y(32)
    pdf.cell(0, 12, "AJ MAP", align="C", new_x="LMARGIN", new_y="NEXT")

    # Subtitle
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(148, 163, 184)
    pdf.cell(0, 7, "ADAPTIVE LEARNING PLATFORM", align="C", new_x="LMARGIN", new_y="NEXT")

    # Divider line
    pdf.set_draw_color(6, 182, 212)
    pdf.set_line_width(0.4)
    pdf.line(40, 62, 257, 62)

    # Certificate heading
    pdf.set_y(68)
    pdf.set_font("Helvetica", "B", 24)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 12, "Certificate of Completion", align="C", new_x="LMARGIN", new_y="NEXT")

    # "This certifies that"
    pdf.set_font("Helvetica", "", 12)
    pdf.set_text_color(148, 163, 184)
    pdf.cell(0, 9, "This is to certify that", align="C", new_x="LMARGIN", new_y="NEXT")

    # Student name
    pdf.set_font("Helvetica", "B", 28)
    pdf.set_text_color(6, 182, 212)
    pdf.cell(0, 14, user_name, align="C", new_x="LMARGIN", new_y="NEXT")

    # "has successfully completed"
    pdf.set_font("Helvetica", "", 12)
    pdf.set_text_color(148, 163, 184)
    pdf.cell(0, 9, "has successfully completed the course", align="C", new_x="LMARGIN", new_y="NEXT")

    # Course name
    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 12, course["title"], align="C", new_x="LMARGIN", new_y="NEXT")

    # Issue date
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(148, 163, 184)
    pdf.cell(0, 10, f'Issued on: {issue_date.strftime("%B %d, %Y")}',
             align="C", new_x="LMARGIN", new_y="NEXT")

    # Bottom divider
    pdf.set_draw_color(6, 182, 212)
    pdf.set_line_width(0.4)
    pdf.line(40, 177, 257, 177)

    # Footer
    pdf.set_y(180)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(71, 85, 105)
    pdf.cell(0, 7, "Powered by AJ Map - Adaptive Learning Platform", align="C")

    # Send as download
    pdf_bytes = bytes(pdf.output())
    filename  = f"AJMap_Certificate_{course['title'].replace(' ', '_')}.pdf"

    response = make_response(pdf_bytes)
    response.headers["Content-Type"]        = "application/pdf"
    response.headers["Content-Disposition"] = f"attachment; filename={filename}"
    return response


@app.route("/account")
@login_required
def account():
    """Account settings page."""
    user_id = session["user_id"]

    conn = get_db()
    cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user = cur.fetchone()
    cur.execute("SELECT COUNT(*) AS cnt FROM course_progress WHERE user_id = %s AND completed = TRUE", (user_id,))
    completed_count = cur.fetchone()["cnt"]
    cur.close()
    conn.close()

    return render_template("account.html", user=user, completed_count=completed_count)


# ==========================================
# RUN (local development only)
# ==========================================

if __name__ == "__main__":
    app.run(debug=True, port=5000)
