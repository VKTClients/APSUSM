"""
APSUSM Membership Card Generator — OpenAI Image + Pillow Photo Paste
=====================================================================
Workflow:
  1. User registers → system stores details + generates APSUSM-DR-2026-####
  2. OpenAI image-edit API generates the FULL card (design, text, layout)
     using CardExample.png (reference) + CardFront.png (blank template)
  3. Pillow pastes the REAL uploaded photo onto the AI-generated card
     (OpenAI cannot reliably preserve the exact photo, so we force it)
  4. Card returned to user after loading spinner

Requirements:
  - OPENAI_API_KEY environment variable
  - openai >= 1.0.0
  - Pillow
"""

import base64
import io
import os
import renderer_v2
from PIL import Image, ImageDraw, ImageFilter

from renderer_v2 import (
    generate_member_id,
    crop_to_aspect,
    rounded_rect_mask,
    FRONT_DESIGN_WIDTH,
    FRONT_DESIGN_HEIGHT,
    PHOTO_FRAME,
    render_front_card,
)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")

FRONT_TEMPLATE = os.path.join(TEMPLATE_DIR, "CardFront.png")
CARD_EXAMPLE = os.path.join(TEMPLATE_DIR, "CardExample.png")

IMAGE_EDIT_MODEL = os.environ.get("OPENAI_IMAGE_MODEL", "gpt-image-1")

# ---------------------------------------------------------------------------
# ██  PHOTO COORDINATES — DEV REFERENCE  ██
# ---------------------------------------------------------------------------
# These are the pixel coordinates for pasting the user's photo onto the
# AI-generated card. Calibrated against CardExample.png (1536 × 1024 px).
#
#   ┌─────────────────────────────────────────────┐
#   │  APSUSM Card (1536 × 1024)                  │
#   │                                              │
#   │   ┌──────────┐                               │
#   │   │  PHOTO   │  ← x=222, y=380              │
#   │   │  227×301 │  ← width=227, height=301     │
#   │   │  r=8     │  ← corner_radius=8           │
#   │   └──────────┘                               │
#   │   Name Text Below                            │
#   │   ═══════════════════════                    │
#   │   CÓDIGO DE MEMBRO  APSUSM-DR-2026-####     │
#   │   www.apsusm.org                             │
#   └─────────────────────────────────────────────┘
#
# Canonical photo window from the calibrated Pillow renderer.
# To adjust photo position, change these values:
PHOTO_X = 171
PHOTO_Y = 208
PHOTO_W = 385
PHOTO_H = 450
PHOTO_CORNER_R = 20
# ---------------------------------------------------------------------------


def _get_client():
    """Create an OpenAI client. Requires OPENAI_API_KEY env var."""
    try:
        from openai import OpenAI
    except ImportError:
        raise RuntimeError(
            "openai package is not installed. Install with: pip install openai"
        )
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY environment variable is not set."
        )
    return OpenAI(api_key=api_key)


# ---------------------------------------------------------------------------
# Identity-preserving blend for AI enhancement
# ---------------------------------------------------------------------------

def _blend_enhanced_with_original(
    original_photo: Image.Image,
    enhanced_photo: Image.Image,
) -> Image.Image:
    """
    Keep the original person dominant in the center while allowing the AI
    version to contribute mostly around the edges/background.

    This makes the enhancement path much less likely to alter facial features.
    """
    original_photo = original_photo.convert("RGBA")
    target_aspect = original_photo.width / original_photo.height

    enhanced_photo = crop_to_aspect(enhanced_photo.convert("RGBA"), target_aspect)
    enhanced_photo = enhanced_photo.resize(original_photo.size, Image.LANCZOS)

    w, h = original_photo.size
    inset_x = max(1, int(w * 0.12))
    inset_top = max(1, int(h * 0.08))
    inset_bottom = max(1, int(h * 0.10))
    radius = max(16, int(min(w, h) * 0.08))
    blur_radius = max(10, int(min(w, h) * 0.05))

    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle(
        (inset_x, inset_top, w - inset_x, h - inset_bottom),
        radius=radius,
        fill=255,
    )
    mask = mask.filter(ImageFilter.GaussianBlur(radius=blur_radius))

    return Image.composite(original_photo, enhanced_photo, mask)


# ---------------------------------------------------------------------------
# Photo Enhancement: AI-enhanced professional photo (preserves real face)
# ---------------------------------------------------------------------------

def enhance_photo_ai(photo_bytes: bytes) -> bytes:
    """
    Use OpenAI image edit to enhance a member photo:
    - Clean up / improve background
    - Make it look more professional / passport-style
    - Improve lighting and clarity
    - PRESERVE the exact face and features — no hallucination

    Returns enhanced photo as PNG bytes.
    """
    client = _get_client()

    # Prepare photo as PNG for the API
    photo_img = Image.open(io.BytesIO(photo_bytes)).convert("RGB")
    png_buf = io.BytesIO()
    photo_img.save(png_buf, format="PNG")
    png_buf.seek(0)
    png_buf.name = "photo.png"

    prompt = (
        "Identity-preserving ID-photo cleanup only. The output must remain the exact same "
        "person, same face, same expression, same pose, same clothes, same glasses, same hair, "
        "same skin tone, and same framing as the input photo.\n"
        "\n"
        "ALLOWED CHANGES ONLY:\n"
        "1. Clean or simplify the background into a neutral studio/passport-style background.\n"
        "2. Apply very mild global lighting, exposure, white-balance, and contrast improvement.\n"
        "3. Apply very light cleanup for noise and clarity if needed.\n"
        "\n"
        "STRICTLY FORBIDDEN:\n"
        "1. Do not redraw, regenerate, beautify, stylize, or reinterpret the face.\n"
        "2. Do not change the eyes, nose, lips, jawline, teeth, ears, hairline, skin texture, or face shape.\n"
        "3. Do not change age, gender presentation, expression, gaze direction, pose, clothing, jewelry, or glasses.\n"
        "4. Do not make the person look like a different person in any way.\n"
        "5. Do not crop tighter or wider; keep the same head-and-shoulders composition.\n"
        "\n"
        "If there is any uncertainty, make the smallest possible change and keep the original photo nearly unchanged."
    )

    response = client.images.edit(
        model=IMAGE_EDIT_MODEL,
        image=[png_buf],
        prompt=prompt,
        size="1024x1024",
    )

    result_data = response.data[0]
    if hasattr(result_data, "b64_json") and result_data.b64_json:
        img_bytes = base64.b64decode(result_data.b64_json)
    elif hasattr(result_data, "url") and result_data.url:
        import urllib.request
        img_bytes = urllib.request.urlopen(result_data.url).read()
    else:
        raise RuntimeError("No image data in OpenAI enhancement response")

    return img_bytes


# ---------------------------------------------------------------------------
# Step 2: OpenAI generates the full card (design + name + member ID text)
# ---------------------------------------------------------------------------

def generate_front_card_ai(
    photo_bytes: bytes,
    full_name: str,
    member_id: str = None,
    user_id: str = "",
    template_path: str = None,
    example_path: str = None,
    photo_mode: str = "original",
) -> bytes:
    """
    Generate a complete front membership card.

    OpenAI creates the full card design with name and member ID text.
    Then Pillow pastes the REAL uploaded photo on top.

    Args:
        photo_bytes:   Raw bytes of the member's uploaded photo.
        full_name:     Member's full name (displayed on card).
        member_id:     Member ID e.g. APSUSM-DR-2026-0042. Auto-generated if None.
        template_path: Path to blank CardFront.png template.
        example_path:  Path to CardExample.png (completed reference).
        photo_mode:    "original" = use photo as-is, "enhanced" = AI-enhance first.

    Returns:
        PNG bytes of the final card with the real photo composited.
    """
    template_path = template_path or FRONT_TEMPLATE
    example_path = example_path or CARD_EXAMPLE

    if not os.path.isfile(example_path):
        raise FileNotFoundError(f"Reference card not found: {example_path}")
    if not os.path.isfile(template_path):
        raise FileNotFoundError(f"Blank template not found: {template_path}")

    if not member_id:
        member_id = generate_member_id(full_name)

    # --- Build the prompt ---
    # OpenAI handles: card design, name text, member ID text
    # OpenAI must leave the portrait window empty; Pillow pastes the real photo.
    prompt = (
        "Create a membership ID card identical to IMAGE 1 (the completed reference), "
        "using IMAGE 2 (blank template) as the base.\n\n"
        "MEMBER DETAILS (use EXACTLY as written):\n"
        f"- Full name: {full_name}\n"
        f"- Member ID: {member_id}\n\n"
        "INSTRUCTIONS:\n"
        f"1. Write exactly '{full_name}' in the name area below the photo, in dark text.\n"
        f"2. Write exactly '{member_id}' in the bottom gradient bar in bold white text.\n"
        "3. Copy ALL design elements pixel-for-pixel from the reference: "
        "logo, flag, banners, borders, gradients, patterns, "
        "'CARTÃO DE MEMBRO', 'CÓDIGO DE MEMBRO', 'www.apsusm.org'.\n"
        f"4. Reserve a clean empty portrait window for later compositing at x={PHOTO_X}, y={PHOTO_Y}, width={PHOTO_W}, height={PHOTO_H}, corner radius={PHOTO_CORNER_R} on the 1536x1024 canvas.\n"
        "5. The portrait window must match the blank template background only. Do not add a grey card, border, frame, shadow, silhouette, or any decorative block inside or around it.\n"
        "6. Keep the portrait window fully unobstructed and ready for the real photo to be pasted there later.\n\n"
        "DO NOT:\n"
        "- Generate any human face or person image\n"
        "- Generate a silhouette, body, clothing, shadow person, or partial person in the portrait area\n"
        "- Change, misspell, or rearrange any text\n"
        "- Add or remove any design elements\n"
    )

    # --- Call OpenAI image edit API ---
    client = _get_client()

    final_photo_bytes = photo_bytes
    if photo_mode == "enhanced":
        try:
            print("  Enhancing photo with AI...")
            final_photo_bytes = enhance_photo_ai(photo_bytes)
            print("  Photo enhancement complete.")
        except Exception as e:
            print(f"  Photo enhancement failed, using original: {e}")
            final_photo_bytes = photo_bytes

    example_file = open(example_path, "rb")
    template_file = open(template_path, "rb")

    try:
        try:
            response = client.images.edit(
                model=IMAGE_EDIT_MODEL,
                image=[example_file, template_file],
                prompt=prompt,
                size="1536x1024",
            )

            result_data = response.data[0]
            if hasattr(result_data, "b64_json") and result_data.b64_json:
                img_bytes = base64.b64decode(result_data.b64_json)
            elif hasattr(result_data, "url") and result_data.url:
                import urllib.request
                img_bytes = urllib.request.urlopen(result_data.url).read()
            else:
                raise RuntimeError("No image data in OpenAI response")
        except Exception as e:
            print(f"  OpenAI layout generation failed, using deterministic fallback: {e}")
            return render_front_card(
                template_path=template_path,
                photo_buffer=final_photo_bytes,
                full_name=full_name,
                member_id=member_id,
                user_id=user_id,
            )
    finally:
        example_file.close()
        template_file.close()

    ai_card = Image.open(io.BytesIO(img_bytes)).convert("RGBA")

    # --- Step 3: Pillow pastes the REAL uploaded photo ---
    final_card = _paste_real_photo(ai_card, final_photo_bytes, template_path)
    final_card = _redraw_front_text(final_card, full_name, member_id, user_id, template_path)

    buf = io.BytesIO()
    final_card.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def _redraw_front_text(
    card_img: Image.Image,
    full_name: str,
    member_id: str,
    user_id: str = "",
    template_path: str = None,
) -> Image.Image:
    card_w, card_h = card_img.size
    scale = min(card_w / FRONT_DESIGN_WIDTH, card_h / FRONT_DESIGN_HEIGHT)
    name_x = int(568 * scale)
    name_y = int(616 * scale)
    name_max_w = int(720 * scale)
    name_font_size = max(1, int(32 * scale))
    name_min_font_size = max(1, int(22 * scale))
    member_id_x = int(610 * scale)
    member_id_y = int(710 * scale)
    member_id_font_size = max(1, int(36 * scale))
    user_id_x = int(610 * scale)
    user_id_y = int(756 * scale)
    user_id_font_size = max(1, int(18 * scale))

    template_path = template_path or FRONT_TEMPLATE
    if os.path.isfile(template_path):
        template_img = Image.open(template_path).convert("RGBA")
        if template_img.size != card_img.size:
            template_img = template_img.resize((card_w, card_h), Image.LANCZOS)

        clear_boxes = (
            (
                max(0, int(150 * scale)),
                max(0, int(596 * scale)),
                min(card_w, int(1308 * scale)),
                min(card_h, int(706 * scale)),
            ),
            (
                max(0, int(592 * scale)),
                max(0, int(690 * scale)),
                min(card_w, int(1465 * scale)),
                min(card_h, int(790 * scale)),
            ),
        )

        for x1, y1, x2, y2 in clear_boxes:
            if x2 <= x1 or y2 <= y1:
                continue
            patch = template_img.crop((x1, y1, x2, y2))
            card_img.paste(patch, (x1, y1), patch)

    draw = ImageDraw.Draw(card_img)
    name_font, name_lines = renderer_v2.fit_and_wrap_text(
        full_name=full_name,
        font_loader=lambda sz: renderer_v2._resolve_font_from_list(renderer_v2._FONT_NAME_CANDIDATES, sz),
        max_width=name_max_w,
        font_size=name_font_size,
        min_font_size=name_min_font_size,
        max_lines=2,
    )
    line_spacing = round(name_font_size * 1.2)
    y_start = name_y - (len(name_lines) - 1) * line_spacing

    for i, line in enumerate(name_lines):
        draw.text((name_x, y_start + i * line_spacing), line, fill="#2C2C2C", font=name_font)

    member_id_font = renderer_v2._resolve_font_from_list(renderer_v2._FONT_ID_CANDIDATES, member_id_font_size)
    draw.text((member_id_x, member_id_y), member_id, fill="#FFFFFF", font=member_id_font)

    if user_id:
        uid_font = renderer_v2._resolve_font(user_id_font_size, bold=True)
        draw.text((user_id_x, user_id_y), f"UID: {user_id}", fill="#E8EEF7", font=uid_font)

    return card_img


# ---------------------------------------------------------------------------
# Step 3: Pillow pastes the REAL uploaded photo onto the AI card
# ---------------------------------------------------------------------------

def _paste_real_photo(
    card_img: Image.Image,
    photo_bytes: bytes,
    template_path: str = None,
) -> Image.Image:
    """
    Paste the user's REAL uploaded photo onto the AI-generated card.

    Uses the coordinates defined at the top of this file (PHOTO_X, PHOTO_Y, etc.).
    The photo is cropped to portrait aspect ratio, resized, and given rounded corners.

    This ensures the actual uploaded image always appears on the card,
    regardless of what OpenAI generates in the photo area.
    """
    card_w, card_h = card_img.size

    # Scale coordinates proportionally if AI output differs from 1536×1024
    scale = min(card_w / FRONT_DESIGN_WIDTH, card_h / FRONT_DESIGN_HEIGHT)

    fx = int(PHOTO_X * scale)
    fy = int(PHOTO_Y * scale)
    fw = int(PHOTO_W * scale)
    fh = int(PHOTO_H * scale)
    cr = int(PHOTO_CORNER_R * scale)
    reset_pad_x = int(16 * scale)
    reset_pad_top = int(16 * scale)
    reset_pad_bottom = int(4 * scale)

    # Reset the portrait window back to the blank template background first.
    # This removes any placeholder box or unwanted OpenAI artifact before the
    # real photo is composited.
    template_path = template_path or FRONT_TEMPLATE
    if os.path.isfile(template_path):
        template_img = Image.open(template_path).convert("RGBA")
        if template_img.size != card_img.size:
            template_img = template_img.resize((card_w, card_h), Image.LANCZOS)
        rx1 = max(0, fx - reset_pad_x)
        ry1 = max(0, fy - reset_pad_top)
        rx2 = min(card_w, fx + fw + reset_pad_x)
        ry2 = min(card_h, fy + fh + reset_pad_bottom)
        background_patch = template_img.crop((rx1, ry1, rx2, ry2))
        card_img.paste(background_patch, (rx1, ry1), background_patch)

    # Load and prepare the member's photo
    member_photo = Image.open(io.BytesIO(photo_bytes)).convert("RGBA")

    # Crop to matching portrait aspect ratio, then resize
    target_aspect = PHOTO_W / PHOTO_H
    member_photo = crop_to_aspect(member_photo, target_aspect)
    member_photo = member_photo.resize((fw, fh), Image.LANCZOS)

    # Apply rounded-corner mask for clean edges
    mask = rounded_rect_mask(fw, fh, cr)
    member_photo.putalpha(mask)

    # Paste onto the AI-generated card
    card_img.paste(member_photo, (fx, fy), member_photo)

    return card_img


# ---------------------------------------------------------------------------
# CLI for testing
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="APSUSM Card Generator (OpenAI + Pillow)")
    parser.add_argument("--photo", required=True, help="Path to member photo")
    parser.add_argument("--name", required=True, help="Member full name")
    parser.add_argument("--id", default=None, help="Member ID (auto-generated if omitted)")
    parser.add_argument("--output", default=None, help="Output path")

    args = parser.parse_args()

    with open(args.photo, "rb") as f:
        photo_data = f.read()

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    out_path = args.output or os.path.join(OUTPUT_DIR, "card_ai.png")

    print(f"Generating card with OpenAI ({IMAGE_EDIT_MODEL})...")
    print(f"  Name: {args.name}")
    print(f"  ID: {args.id or '(auto-generated)'}")
    print(f"  Photo coordinates: x={PHOTO_X}, y={PHOTO_Y}, {PHOTO_W}x{PHOTO_H}, r={PHOTO_CORNER_R}")

    result = generate_front_card_ai(photo_data, args.name, args.id)

    with open(out_path, "wb") as f:
        f.write(result)
    print(f"Card saved: {out_path} ({len(result):,} bytes)")
