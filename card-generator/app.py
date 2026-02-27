"""
APSUSM Card Generator — Flask API
==================================
POST /api/generate-card  →  returns PNG membership card
"""

import os
import shutil
import uuid
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from renderer import render_card, render_back_card, generate_member_id

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_PATH = os.environ.get(
    "CARD_TEMPLATE",
    os.path.join(BASE_DIR, "templates", "ID_Template.png"),
)
_BACK_DEFAULT = os.path.join(BASE_DIR, "templates", "ID_Template_Back.png")
# Auto-copy from frontend folder if not already in templates/
if not os.path.isfile(_BACK_DEFAULT):
    _BACK_SRC = os.path.join(BASE_DIR, "..", "apsusm-frontend", "ID_Template_Back.png")
    if os.path.isfile(_BACK_SRC):
        shutil.copy2(_BACK_SRC, _BACK_DEFAULT)
BACK_TEMPLATE_PATH = os.environ.get("CARD_TEMPLATE_BACK", _BACK_DEFAULT)
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

MAX_PHOTO_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}


def _allowed(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.route("/api/generate-card", methods=["POST"])
def generate_card():
    """
    Accept multipart form-data:
      - full_name  (text, required)
      - photo      (file, required, JPEG/PNG/WebP, ≤10 MB)
      - member_id  (text, optional)
      - save       (text, optional, "true" to persist to disk)

    Returns the generated PNG directly (Content-Type: image/png).
    If ?save=true, also saves to /output/ and returns JSON with the path.
    """
    # --- Validate inputs ---
    full_name = request.form.get("full_name", "").strip()
    if not full_name:
        return jsonify({"error": "full_name is required"}), 400

    if "photo" not in request.files:
        return jsonify({"error": "photo file is required"}), 400

    photo_file = request.files["photo"]
    if not photo_file.filename or not _allowed(photo_file.filename):
        return jsonify({"error": f"Invalid file type. Allowed: {ALLOWED_EXTENSIONS}"}), 400

    photo_bytes = photo_file.read()
    if len(photo_bytes) > MAX_PHOTO_SIZE:
        return jsonify({"error": f"Photo exceeds {MAX_PHOTO_SIZE // (1024*1024)} MB limit"}), 400

    if not os.path.isfile(TEMPLATE_PATH):
        return jsonify({"error": f"Template not found at {TEMPLATE_PATH}"}), 500

    member_id = request.form.get("member_id", "").strip() or None
    save_to_disk = request.form.get("save", "").lower() == "true"

    # Auto-generate member ID if not provided
    if not member_id:
        first_name = request.form.get("first_name", "").strip()
        last_name = request.form.get("last_name", "").strip()
        license_number = request.form.get("license_number", "").strip()
        email = request.form.get("email", "").strip()
        member_id = generate_member_id(first_name, last_name, license_number, email)

    # --- Generate card ---
    try:
        png_bytes = render_card(TEMPLATE_PATH, photo_bytes, full_name, member_id)
    except Exception as e:
        return jsonify({"error": f"Card generation failed: {str(e)}"}), 500

    # --- Optionally save ---
    if save_to_disk:
        filename = f"card_{uuid.uuid4().hex[:12]}.png"
        out_path = os.path.join(OUTPUT_DIR, filename)
        with open(out_path, "wb") as f:
            f.write(png_bytes)
        return jsonify({
            "success": True,
            "filename": filename,
            "path": out_path,
            "size_bytes": len(png_bytes),
        })

    # --- Return PNG directly ---
    import io
    return send_file(
        io.BytesIO(png_bytes),
        mimetype="image/png",
        as_attachment=False,
        download_name=f"card_{full_name.replace(' ', '_')}.png",
    )


@app.route("/api/generate-card-back", methods=["POST"])
def generate_card_back():
    """
    Accept multipart form-data or JSON:
      - membro_desde_date  (text, optional, e.g. "01 Fev 2026")
      - valido_ate_date    (text, optional, e.g. "01 Fev 2028")
      - save               (text, optional, "true" to persist to disk)

    Returns the generated back card PNG directly.
    """
    membro_desde = request.form.get("membro_desde_date", "").strip()
    valido_ate = request.form.get("valido_ate_date", "").strip()
    save_to_disk = request.form.get("save", "").lower() == "true"

    if not os.path.isfile(BACK_TEMPLATE_PATH):
        return jsonify({"error": f"Back template not found at {BACK_TEMPLATE_PATH}"}), 500

    try:
        png_bytes = render_back_card(BACK_TEMPLATE_PATH, membro_desde, valido_ate)
    except Exception as e:
        return jsonify({"error": f"Back card generation failed: {str(e)}"}), 500

    if save_to_disk:
        filename = f"card_back_{uuid.uuid4().hex[:12]}.png"
        out_path = os.path.join(OUTPUT_DIR, filename)
        with open(out_path, "wb") as f:
            f.write(png_bytes)
        return jsonify({
            "success": True,
            "filename": filename,
            "path": out_path,
            "size_bytes": len(png_bytes),
        })

    import io as _io
    return send_file(
        _io.BytesIO(png_bytes),
        mimetype="image/png",
        as_attachment=False,
        download_name="card_back.png",
    )


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "template_exists": os.path.isfile(TEMPLATE_PATH),
        "template_path": TEMPLATE_PATH,
        "back_template_exists": os.path.isfile(BACK_TEMPLATE_PATH),
        "back_template_path": BACK_TEMPLATE_PATH,
    })


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5500))
    print(f"Card Generator API running on http://localhost:{port}")
    print(f"Template: {TEMPLATE_PATH}")
    print(f"Back template: {BACK_TEMPLATE_PATH}")
    print(f"Output dir: {OUTPUT_DIR}")
    app.run(host="0.0.0.0", port=port, debug=True)
