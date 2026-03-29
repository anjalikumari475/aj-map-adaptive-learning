"""
AJ Map - Adaptive Learning Platform
Backend : Python + Flask
Database: Neon PostgreSQL via pg8000 (pure-Python, no C extensions)
Hosting : Render
"""

import os
import json
import uuid
import ssl
from datetime import datetime
from functools import wraps
from urllib.parse import urlparse, unquote

import pg8000.dbapi as pg
from fpdf import FPDF
from flask import (Flask, render_template, request, redirect,
                   url_for, session, make_response, jsonify)
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "aj-map-local-dev-secret-key")

_RAW_DB_URL = os.environ.get("DATABASE_URL", "")


# ==========================================
# DATABASE CONNECTION
# ==========================================

def _parse(url: str) -> dict:
    """
    Safely split a Neon URL into its components.
    Strips the query-string before parsing so urlparse never
    gets confused by sslmode / channel_binding parameters.
    Works on every Python version.
    """
    # Remove query string — SSL is handled via ssl_context below
    base = url.split("?")[0]

    # Neon URLs start with "postgresql://" or "postgres://"
    # Make sure urlparse recognises the scheme
    if base.startswith("postgres://"):
        base = "postgresql://" + base[len("postgres://"):]

    p = urlparse(base)

    host     = p.hostname
    port     = p.port or 5432
    database = (p.path or "").lstrip("/")
    user     = unquote(p.username or "")
    password = unquote(p.password or "")

    if not host or not user:
        raise RuntimeError(
            f"Cannot parse DATABASE_URL — got host={host!r} user={user!r}. "
            f"First 40 chars: {base[:40]!r}"
        )

    return dict(host=host, port=port, database=database, user=user, password=password)


def get_db():
    """Return a new pg8000 connection. Caller is responsible for closing it."""
    if not _RAW_DB_URL:
        raise RuntimeError("DATABASE_URL environment variable is not set.")

    p = _parse(_RAW_DB_URL)

    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode    = ssl.CERT_NONE

    conn = pg.connect(
        host=p["host"],
        port=p["port"],
        database=p["database"],
        user=p["user"],
        password=p["password"],
        ssl_context=ssl_ctx,
    )
    conn.autocommit = False
    return conn


def _row(cursor, row):
    """Turn a single pg8000 tuple into a dict (or None)."""
    if row is None:
        return None
    cols = [d[0] for d in cursor.description]
    return dict(zip(cols, row))


def _rows(cursor, rows):
    """Turn a list of pg8000 tuples into a list of dicts."""
    if not rows:
        return []
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, r)) for r in rows]


def init_db():
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id         TEXT PRIMARY KEY,
                name       TEXT NOT NULL,
                email      TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS course_progress (
                id               TEXT PRIMARY KEY,
                user_id          TEXT NOT NULL,
                course_id        TEXT NOT NULL,
                completed_videos TEXT    DEFAULT '[]',
                total_videos     INTEGER DEFAULT 5,
                percent_complete REAL    DEFAULT 0,
                completed        BOOLEAN DEFAULT FALSE,
                updated_at       TIMESTAMP DEFAULT NOW(),
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
        print("Database initialised successfully.")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


with app.app_context():
    try:
        init_db()
    except Exception:
        import traceback
        print("ERROR: Could not initialise database:")
        traceback.print_exc()


# ==========================================
# COURSE DATA
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
            {"id": "v1", "title": "HTML & CSS Fundamentals",        "youtube_id": "ysEN5RaKOlA"},
            {"id": "v2", "title": "JavaScript Essentials",          "youtube_id": "UB1O30fR-EE"},
            {"id": "v3", "title": "React.js for Beginners",         "youtube_id": "h0e2HAPTGF0"},
            {"id": "v4", "title": "Node.js & Express Backend",      "youtube_id": "G3e-cpL7ofc"},
            {"id": "v5", "title": "Full Stack Project Walkthrough",  "youtube_id": "SBmUHDkbHUA"},
        ]
    },
    "cyber-security": {
        "id": "cyber-security",
        "title": "Cyber Security",
        "description": "Learn ethical hacking, network security, and best practices to protect systems from threats.",
        "color": "#f97316",
        "icon": "🔒",
        "videos": [
            {"id": "v1", "title": "Introduction to Cyber Security",  "youtube_id": "inWWhr5tnEA"},
            {"id": "v2", "title": "Network Security Fundamentals",   "youtube_id": "hXSFdwxNqMs"},
            {"id": "v3", "title": "Ethical Hacking Basics",          "youtube_id": "U_P23SqJaDc"},
            {"id": "v4", "title": "Cryptography & Encryption",       "youtube_id": "nzZkKoREEGo"},
            {"id": "v5", "title": "Security Best Practices",         "youtube_id": "26ABzvAuyS8"},
        ]
    }
}


# ==========================================
# AUTH DECORATOR
# ==========================================

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated


# ==========================================
# PROGRESS HELPER
# ==========================================

def get_progress(user_id, course_id=None):
    conn = get_db()
    try:
        cur = conn.cursor()
        if course_id:
            cur.execute(
                "SELECT * FROM course_progress WHERE user_id = %s AND course_id = %s",
                (user_id, course_id)
            )
        else:
            cur.execute(
                "SELECT * FROM course_progress WHERE user_id = %s", (user_id,)
            )
        rows = _rows(cur, cur.fetchall())
        cur.close()
    finally:
        conn.close()

    return {
        r["course_id"]: {
            "completed_videos": json.loads(r["completed_videos"]),
            "total_videos":     r["total_videos"],
            "percent_complete": r["percent_complete"],
            "completed":        r["completed"],
        }
        for r in rows
    }


# ==========================================
# ROUTES
# ==========================================

@app.route("/login", methods=["GET", "POST"])
def login():
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
                name = email.split("@")[0]
            conn = get_db()
            try:
                cur = conn.cursor()
                cur.execute("SELECT * FROM users WHERE email = %s", (email,))
                user = _row(cur, cur.fetchone())

                if user:
                    session["user_id"]    = user["id"]
                    session["user_name"]  = user["name"]
                    session["user_email"] = user["email"]
                else:
                    uid = str(uuid.uuid4())
                    cur.execute(
                        "INSERT INTO users (id, name, email) VALUES (%s, %s, %s)",
                        (uid, name, email)
                    )
                    conn.commit()
                    session["user_id"]    = uid
                    session["user_name"]  = name
                    session["user_email"] = email

                cur.close()
                return redirect(url_for("home"))
            except Exception as e:
                conn.rollback()
                error = f"Database error: {e}"
            finally:
                conn.close()

    return render_template("login.html", error=error)


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


@app.route("/")
@login_required
def home():
    return render_template("home.html", courses=COURSES,
                           progress=get_progress(session["user_id"]))


@app.route("/courses")
@login_required
def courses():
    return render_template("courses.html", courses=COURSES,
                           progress=get_progress(session["user_id"]))


@app.route("/courses/<course_id>")
@login_required
def course_detail(course_id):
    course = COURSES.get(course_id)
    if not course:
        return redirect(url_for("courses"))
    prog     = get_progress(session["user_id"], course_id)
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
    data      = request.get_json()
    user_id   = session["user_id"]
    course_id = data.get("course_id")
    ytid      = data.get("youtube_id")

    course = COURSES.get(course_id)
    if not course:
        return jsonify({"error": "Course not found"}), 404

    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM course_progress WHERE user_id = %s AND course_id = %s",
            (user_id, course_id)
        )
        row = _row(cur, cur.fetchone())

        done_list = json.loads(row["completed_videos"]) if row else []
        if ytid not in done_list:
            done_list.append(ytid)

        total   = len(course["videos"])
        percent = (len(done_list) / total) * 100
        done    = len(done_list) >= total

        if row:
            cur.execute("""
                UPDATE course_progress
                   SET completed_videos = %s,
                       percent_complete = %s,
                       completed        = %s,
                       updated_at       = NOW()
                 WHERE user_id = %s AND course_id = %s
            """, (json.dumps(done_list), percent, done, user_id, course_id))
        else:
            cur.execute("""
                INSERT INTO course_progress
                    (id, user_id, course_id, completed_videos, total_videos, percent_complete, completed)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (str(uuid.uuid4()), user_id, course_id,
                  json.dumps(done_list), total, percent, done))

        conn.commit()
        cur.close()
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

    return jsonify({"completed_videos": done_list, "percent": percent, "completed": done})


@app.route("/progress")
@login_required
def progress():
    return render_template("progress.html", courses=COURSES,
                           progress=get_progress(session["user_id"]))


@app.route("/certifications")
@login_required
def certifications():
    user_id = session["user_id"]
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM course_progress WHERE user_id = %s", (user_id,))
        prog_rows = _rows(cur, cur.fetchall())
        cur.execute("SELECT * FROM certificates WHERE user_id = %s", (user_id,))
        cert_rows = _rows(cur, cur.fetchall())
        cur.close()
    finally:
        conn.close()

    return render_template(
        "certifications.html",
        courses=COURSES,
        progress={r["course_id"]: {"completed": r["completed"]} for r in prog_rows},
        certs={r["course_id"]: r for r in cert_rows},
    )


@app.route("/download-certificate/<course_id>")
@login_required
def download_certificate(course_id):
    user_id = session["user_id"]
    course  = COURSES.get(course_id)
    if not course:
        return redirect(url_for("certifications"))

    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM course_progress WHERE user_id = %s AND course_id = %s",
            (user_id, course_id)
        )
        prog = _row(cur, cur.fetchone())
        if not prog or not prog["completed"]:
            cur.close()
            return redirect(url_for("certifications"))

        cur.execute(
            "SELECT * FROM certificates WHERE user_id = %s AND course_id = %s",
            (user_id, course_id)
        )
        cert      = _row(cur, cur.fetchone())
        user_name = session["user_name"]

        if not cert:
            cur.execute("""
                INSERT INTO certificates (id, user_id, course_id, course_name, user_name)
                VALUES (%s, %s, %s, %s, %s)
            """, (str(uuid.uuid4()), user_id, course_id, course["title"], user_name))
            conn.commit()
            issue_date = datetime.now()
        else:
            issue_date = cert["issued_at"]
        cur.close()
    except Exception as e:
        conn.rollback()
        return f"Error generating certificate: {e}", 500
    finally:
        conn.close()

    # ---- Build PDF ----
    pdf = FPDF(orientation="L", format="A4")
    pdf.add_page()
    pdf.set_fill_color(15, 23, 42);  pdf.rect(0, 0, 297, 210, "F")
    pdf.set_draw_color(6, 182, 212); pdf.set_line_width(2); pdf.rect(8, 8, 281, 194)

    pdf.set_font("Helvetica", "B", 34); pdf.set_text_color(6, 182, 212); pdf.set_y(32)
    pdf.cell(0, 12, "AJ MAP", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11);  pdf.set_text_color(148, 163, 184)
    pdf.cell(0, 7, "ADAPTIVE LEARNING PLATFORM", align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.set_draw_color(6, 182, 212); pdf.set_line_width(0.4); pdf.line(40, 62, 257, 62)

    pdf.set_y(68); pdf.set_font("Helvetica", "B", 24); pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 12, "Certificate of Completion", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 12); pdf.set_text_color(148, 163, 184)
    pdf.cell(0, 9, "This is to certify that", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "B", 28); pdf.set_text_color(6, 182, 212)
    pdf.cell(0, 14, user_name, align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 12); pdf.set_text_color(148, 163, 184)
    pdf.cell(0, 9, "has successfully completed the course", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "B", 22); pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 12, course["title"], align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11); pdf.set_text_color(148, 163, 184)
    pdf.cell(0, 10, f'Issued on: {issue_date.strftime("%B %d, %Y")}',
             align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.set_draw_color(6, 182, 212); pdf.set_line_width(0.4); pdf.line(40, 177, 257, 177)
    pdf.set_y(180); pdf.set_font("Helvetica", "", 9); pdf.set_text_color(71, 85, 105)
    pdf.cell(0, 7, "Powered by AJ Map - Adaptive Learning Platform", align="C")

    pdf_bytes = bytes(pdf.output())
    filename  = f"AJMap_Certificate_{course['title'].replace(' ', '_')}.pdf"
    response  = make_response(pdf_bytes)
    response.headers["Content-Type"]        = "application/pdf"
    response.headers["Content-Disposition"] = f"attachment; filename={filename}"
    return response


@app.route("/account")
@login_required
def account():
    user_id = session["user_id"]
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = _row(cur, cur.fetchone())
        cur.execute(
            "SELECT COUNT(*) FROM course_progress WHERE user_id = %s AND completed = TRUE",
            (user_id,)
        )
        completed_count = cur.fetchone()[0]
        cur.close()
    finally:
        conn.close()
    return render_template("account.html", user=user, completed_count=completed_count)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
