"""
APSUSM Card Generator Flask API.

Workflow:
  1. POST /api/generate-card-ai → OpenAI image generation + Pillow photo paste
  2. POST /api/generate-card-back → Pillow-rendered back card PNG
  3. GET  /api/health → service health check
"""

import io
import os
import uuid
from dotenv import load_dotenv
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from renderer_v2 import render_back_card, generate_member_id
from card_generator_gpt import generate_front_card_ai, PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H

load_dotenv()

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_PATH = os.environ.get(
    "CARD_TEMPLATE",
    os.path.join(BASE_DIR, "templates", "CardFront.png"),
)
CARD_EXAMPLE_PATH = os.environ.get(
    "CARD_EXAMPLE",
    os.path.join(BASE_DIR, "templates", "CardExample.png"),
)
BACK_TEMPLATE_PATH = os.environ.get(
    "CARD_TEMPLATE_BACK",
    os.path.join(BASE_DIR, "templates", "CardBack.png"),
)
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

MAX_PHOTO_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}


def _allowed(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.route("/api/generate-card-ai", methods=["POST"])
@app.route("/api/generate-card", methods=["POST"])
def generate_card_ai():
    """
    Front card generation:
      - OpenAI generates the full card design (background, name, member ID)
      - Pillow pastes the REAL uploaded photo on top

    Accept multipart form-data:
      - full_name   (text, required)
      - photo       (file, required, JPEG/PNG/WebP, <=10 MB)
      - member_id   (text, optional — auto-generated if omitted)
      - email       (text, optional)
      - save        (text, optional, "true" to persist to disk)

    Returns the generated PNG directly (Content-Type: image/png).
    """
    full_name = request.form.get("full_name", "").strip()
    if not full_name:
        first_name = request.form.get("first_name", "").strip()
        last_name = request.form.get("last_name", "").strip()
        full_name = " ".join(part for part in (first_name, last_name) if part).strip()
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

    member_id = request.form.get("member_id", "").strip() or None
    user_id = request.form.get("user_id", "").strip()
    photo_mode = request.form.get("photo_mode", "original").strip().lower()
    if photo_mode not in ("original", "enhanced"):
        photo_mode = "original"
    save_to_disk = request.form.get("save", "").lower() == "true"

    # Auto-generate member ID if not provided
    if not member_id:
        email = request.form.get("email", "").strip()
        parts = full_name.split(None, 1)
        member_id = generate_member_id(
            first_name=parts[0] if parts else full_name,
            last_name=parts[1] if len(parts) > 1 else "",
            email=email,
        )

    try:
        png_bytes = generate_front_card_ai(
            photo_bytes=photo_bytes,
            full_name=full_name,
            member_id=member_id,
            user_id=user_id,
            template_path=TEMPLATE_PATH,
            example_path=CARD_EXAMPLE_PATH,
            photo_mode=photo_mode,
        )
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": f"Card generation failed: {str(e)}"}), 500

    if save_to_disk:
        filename = f"card_ai_{uuid.uuid4().hex[:12]}.png"
        out_path = os.path.join(OUTPUT_DIR, filename)
        with open(out_path, "wb") as f:
            f.write(png_bytes)
        return jsonify({
            "success": True,
            "filename": filename,
            "path": out_path,
            "size_bytes": len(png_bytes),
            "full_name": full_name,
            "member_id": member_id,
        })

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

    return send_file(
        io.BytesIO(png_bytes),
        mimetype="image/png",
        as_attachment=False,
        download_name="card_back.png",
    )


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "mode": "openai-image+pillow-photo-paste",
        "template_exists": os.path.isfile(TEMPLATE_PATH),
        "example_exists": os.path.isfile(CARD_EXAMPLE_PATH),
        "back_template_exists": os.path.isfile(BACK_TEMPLATE_PATH),
        "openai_key_set": bool(os.environ.get("OPENAI_API_KEY")),
        "photo_coordinates": {
            "x": PHOTO_X, "y": PHOTO_Y,
            "width": PHOTO_W, "height": PHOTO_H,
            "note": "Pillow pastes real photo at these coords on the 1536x1024 card",
        },
    })


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5500))
    print(f"Card Generator API (OpenAI image + Pillow photo paste)")
    print(f"  Running on http://localhost:{port}")
    print(f"  Template: {TEMPLATE_PATH}")
    print(f"  Example:  {CARD_EXAMPLE_PATH}")
    print(f"  Photo coords: x={PHOTO_X}, y={PHOTO_Y}, {PHOTO_W}x{PHOTO_H}")
    app.run(host="0.0.0.0", port=port, debug=True)
