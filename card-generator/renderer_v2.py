"""
APSUSM Membership Card Renderer v2
====================================
Deterministic, pixel-accurate card generator using Pillow.
Uses the new CardFront.png / CardBack.png templates.

Composites user photo, full name, and member ID onto the front card.
Composites dates onto the back card.

Coordinates are calibrated against CardFront.png (1536 × 1024 px)
and CardBack.png (1011 × 638 px).
"""

import hashlib
import io
import os
import time
from copy import deepcopy
from PIL import Image, ImageDraw, ImageFont

# ---------------------------------------------------------------------------
# Front card design coordinates (canonical: 1536 × 1024 px)
# All values in design-pixels; multiplied by scale at render time.
# ---------------------------------------------------------------------------
FRONT_DESIGN_WIDTH = 1536
FRONT_DESIGN_HEIGHT = 1024

# Profile photo — exact coordinates from template design spec.
PHOTO_FRAME = {
    "x": 222,
    "y": 340,
    "width": 260,
    "height": 340,
    "corner_radius": 8,
}

# Full name — center-aligned below the photo.
# Font: Montserrat SemiBold, size 32
NAME_TEXT = {
    "center_x": 457,       # horizontal center point for the text block
    "x": 488,
    "y": 638,
    "max_width": 720,
    "font_size": 37,
    "min_font_size": 27,
    "color": "#2C2C2C",
    "line_height": 1.2,
    "align": "left",
    "max_lines": 2,
}

# Member ID (e.g. APSUSM-DR-2026-01234)
# Rendered inside the "CÓDIGO DE MEMBRO" gradient bar.
# Font: Inter Bold, size 36
MEMBER_ID_TEXT = {
    "x": 610,
    "y": 710,
    "font_size": 36,
    "color": "#FFFFFF",
}

SYSTEM_USER_ID_TEXT = {
    "x": 610,
    "y": 756,
    "font_size": 18,
    "prefix": "UID: ",
    "color": "#E8EEF7",
}

DEFAULT_FRONT_LAYOUT = {
    "photo_frame": deepcopy(PHOTO_FRAME),
    "name_text": deepcopy(NAME_TEXT),
    "member_id_text": deepcopy(MEMBER_ID_TEXT),
    "system_user_id_text": deepcopy(SYSTEM_USER_ID_TEXT),
}

# ---------------------------------------------------------------------------
# Back card design coordinates (canonical: 1011 × 638 px)
# ---------------------------------------------------------------------------
BACK_DESIGN_WIDTH = 1011
BACK_DESIGN_HEIGHT = 638

# "MEMBRO DESDE" — date rendered below/right of the pre-printed label
# Label is at top-right of back card
MEMBRO_DESDE = {
    "right_x": 810,        # right edge for right-aligned date (label ends ~x=783)
    "y": 130,              # y position for the date (label at y=86, clear gap below)
    "font_size": 16,
    "color": "#555555",
}

# "VÁLIDO ATÉ" — date rendered to the right of the pre-printed label
# Label is at bottom-left of back card
VALIDO_ATE = {
    "x": 170,              # x position (aligned with label start at x=170)
    "y": 520,              # baseline, just below the label (label at y=496-506)
    "font_size": 16,
    "color": "#555555",
}

# ---------------------------------------------------------------------------
# Font resolution
# ---------------------------------------------------------------------------
_FONT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")

# Name font: Montserrat SemiBold
_FONT_NAME_CANDIDATES = [
    os.path.join(_FONT_DIR, "Montserrat-SemiBold.ttf"),
    os.path.join(_FONT_DIR, "Calibri-Bold.ttf"),
]

# ID font: Inter Bold
_FONT_ID_CANDIDATES = [
    os.path.join(_FONT_DIR, "Inter-Bold.ttf"),
    os.path.join(_FONT_DIR, "Calibri-Bold.ttf"),
]

_FONT_REGULAR_CANDIDATES = [
    os.path.join(_FONT_DIR, "Inter-Medium.ttf"),
    os.path.join(_FONT_DIR, "Inter-Regular.ttf"),
    os.path.join(_FONT_DIR, "Calibri-Regular.ttf"),
    os.path.join(_FONT_DIR, "Roboto-Medium.ttf"),
]

_FONT_BOLD_CANDIDATES = [
    os.path.join(_FONT_DIR, "Inter-Bold.ttf"),
    os.path.join(_FONT_DIR, "Calibri-Bold.ttf"),
    os.path.join(_FONT_DIR, "Roboto-Bold.ttf"),
]


def _resolve_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """Load the first available bundled font at the given size."""
    candidates = _FONT_BOLD_CANDIDATES if bold else _FONT_REGULAR_CANDIDATES
    for path in candidates:
        if os.path.isfile(path):
            return ImageFont.truetype(path, size)
    # Fallback to regular candidates if bold not found
    if bold:
        for path in _FONT_REGULAR_CANDIDATES:
            if os.path.isfile(path):
                return ImageFont.truetype(path, size)
    # Try system fonts
    for name in ("Calibri", "Inter", "Arial", "DejaVuSans"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def _resolve_font_from_list(candidates: list, size: int) -> ImageFont.FreeTypeFont:
    """Load the first available font from a candidate list at the given size."""
    for path in candidates:
        if os.path.isfile(path):
            return ImageFont.truetype(path, size)
    # Fallback to system fonts
    for name in ("Montserrat", "Inter", "Calibri", "Arial"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


# ---------------------------------------------------------------------------
# Member ID generation
# ---------------------------------------------------------------------------

def generate_member_id(
    first_name: str = "",
    last_name: str = "",
    license_number: str = "",
    email: str = "",
) -> str:
    """
    Generate a deterministic unique member ID.

    Format: APSUSM-DR-YYYY-NNNNN
      - YYYY = current year
      - NNNNN = 5-digit number derived from a hash of user details + timestamp
    """
    year = time.strftime("%Y")
    seed = f"{first_name.strip().lower()}|{last_name.strip().lower()}|" \
           f"{license_number.strip()}|{email.strip().lower()}|{time.time_ns()}"
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    num = int(digest[:10], 16) % 100000
    return f"APSUSM-DR-{year}-{num:05d}"


# ---------------------------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------------------------

def compute_scale(actual_width: int, design_width: int) -> float:
    """Compute the scale factor relative to the canonical design width."""
    return actual_width / design_width


def crop_to_aspect(img: Image.Image, target_aspect: float) -> Image.Image:
    """Center-crop *img* to the given width/height aspect ratio."""
    w, h = img.size
    current_aspect = w / h
    if current_aspect > target_aspect:
        new_w = int(h * target_aspect)
        left = (w - new_w) // 2
        return img.crop((left, 0, left + new_w, h))
    else:
        new_h = int(w / target_aspect)
        top = (h - new_h) // 2
        return img.crop((0, top, w, top + new_h))


def rounded_rect_mask(width: int, height: int, radius: int) -> Image.Image:
    """Create an anti-aliased rounded-rectangle alpha mask (4× supersampled)."""
    ss = 4
    big = Image.new("L", (width * ss, height * ss), 0)
    draw = ImageDraw.Draw(big)
    draw.rounded_rectangle(
        [(0, 0), (width * ss - 1, height * ss - 1)],
        radius=radius * ss,
        fill=255,
    )
    return big.resize((width, height), Image.LANCZOS)


def _measure_text_width(font, text: str) -> int:
    """Return the pixel width of *text* rendered in *font*."""
    bbox = font.getbbox(text)
    return bbox[2] - bbox[0]


def _measure_text_height(font, text: str) -> int:
    """Return the pixel height of *text* rendered in *font*."""
    bbox = font.getbbox(text)
    return bbox[3] - bbox[1]


def fit_and_wrap_text(
    full_name: str,
    font_loader,
    max_width: int,
    font_size: int,
    min_font_size: int,
    max_lines: int,
) -> tuple:
    """
    Determine the best font size and line breaks for *full_name*.
    Returns (font, lines).
    """
    def _tw(font, text):
        bbox = font.getbbox(text)
        return bbox[2] - bbox[0]

    # Phase 1: at full font_size, try single-line first
    font = font_loader(font_size)
    if _tw(font, full_name) <= max_width:
        return font, [full_name]

    # Phase 2: at full font_size, try word-wrap (prefer large wrapped over small single-line)
    lines = _word_wrap(full_name, font, max_width, _tw)
    if len(lines) <= max_lines:
        return font, lines

    # Phase 3: shrink font seeking a fit (single-line or wrapped)
    for sz in range(font_size - 1, min_font_size - 1, -1):
        font = font_loader(sz)
        if _tw(font, full_name) <= max_width:
            return font, [full_name]
        lines = _word_wrap(full_name, font, max_width, _tw)
        if len(lines) <= max_lines:
            return font, lines

    # Phase 3: force wrap at min size, ellipsize if needed
    font = font_loader(min_font_size)
    lines = _word_wrap(full_name, font, max_width, _tw)

    if len(lines) > max_lines:
        lines = lines[:max_lines]
        last = lines[-1]
        while _tw(font, last + "\u2026") > max_width and len(last) > 1:
            last = last[:-1].rstrip()
        lines[-1] = last + "\u2026"

    return font, lines


def _word_wrap(text: str, font, max_width: int, measure_fn) -> list:
    """Balanced word-wrap: splits text to minimise line-length difference."""
    words = text.split()
    if not words:
        return []
    # If everything fits on one line, return it
    if measure_fn(font, text) <= max_width:
        return [text]
    # Try every possible split point and pick the most balanced one
    n = len(words)
    best_lines = None
    best_diff = float("inf")
    for i in range(1, n):
        line1 = " ".join(words[:i])
        line2 = " ".join(words[i:])
        w1 = measure_fn(font, line1)
        w2 = measure_fn(font, line2)
        if w1 > max_width or w2 > max_width:
            continue
        diff = abs(w1 - w2)
        if diff < best_diff:
            best_diff = diff
            best_lines = [line1, line2]
    if best_lines:
        return best_lines
    # Fallback: greedy wrap for 3+ lines
    lines = []
    current = ""
    for word in words:
        test = f"{current} {word}".strip() if current else word
        if measure_fn(font, test) <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


# ---------------------------------------------------------------------------
# Front card renderer
# ---------------------------------------------------------------------------

def render_front_card(
    template_path: str,
    photo_buffer: bytes,
    full_name: str,
    member_id: str = None,
    user_id: str = "",
    layout: dict = None,
) -> bytes:
    """
    Composite the user photo, name, and member ID onto the front template.

    Parameters
    ----------
    template_path : str
        Path to CardFront.png.
    photo_buffer : bytes
        Raw bytes of the user photo (JPEG/PNG/WebP).
    full_name : str
        Full name to print on the card.
    member_id : str, optional
        Member ID (e.g. APSUSM-DR-2026-01234). Auto-generated if None.

    Returns
    -------
    bytes
        PNG image bytes of the generated front card.
    """
    # --- Load template ---
    template = Image.open(template_path).convert("RGBA")
    tw, th = template.size
    scale = compute_scale(tw, FRONT_DESIGN_WIDTH)
    resolved_layout = layout or DEFAULT_FRONT_LAYOUT
    photo_frame = resolved_layout.get("photo_frame", PHOTO_FRAME)
    name_text = resolved_layout.get("name_text", NAME_TEXT)
    member_id_text = resolved_layout.get("member_id_text", MEMBER_ID_TEXT)
    system_user_id_text = resolved_layout.get("system_user_id_text", SYSTEM_USER_ID_TEXT)

    # Auto-generate member ID if not provided
    if not member_id:
        member_id = generate_member_id()

    # =====================================================================
    # 1) PHOTO — crop to portrait aspect, resize, rounded-rect mask
    # =====================================================================
    px = round(photo_frame["x"] * scale)
    py = round(photo_frame["y"] * scale)
    pw = round(photo_frame["width"] * scale)
    ph = round(photo_frame["height"] * scale)
    pr = round(photo_frame["corner_radius"] * scale)

    user_photo = Image.open(io.BytesIO(photo_buffer)).convert("RGBA")
    target_aspect = pw / ph
    user_photo = crop_to_aspect(user_photo, target_aspect)
    user_photo = user_photo.resize((pw, ph), Image.LANCZOS)

    mask = rounded_rect_mask(pw, ph, pr)
    photo_layer = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
    photo_layer.paste(user_photo, (0, 0))
    photo_layer.putalpha(mask)

    template.paste(photo_layer, (px, py), photo_layer)

    # =====================================================================
    # 2) NAME — center-aligned below the photo, up to 2 lines
    # =====================================================================
    n_cx = round(name_text["center_x"] * scale)
    ny = round(name_text["y"] * scale)
    n_max_w = round(name_text["max_width"] * scale)
    n_fs = max(1, round(name_text["font_size"] * scale))
    n_min_fs = max(1, round(name_text["min_font_size"] * scale))

    font, lines = fit_and_wrap_text(
        full_name=full_name,
        font_loader=lambda sz: _resolve_font_from_list(_FONT_NAME_CANDIDATES, sz),
        max_width=n_max_w,
        font_size=n_fs,
        min_font_size=n_min_fs,
        max_lines=name_text["max_lines"],
    )

    draw = ImageDraw.Draw(template)
    name_color = name_text["color"]
    line_spacing = round(n_fs * name_text["line_height"])

    num_lines = len(lines)
    y_start = ny - (num_lines - 1) * line_spacing
    name_align = name_text.get("align", "center")
    name_x = round(name_text.get("x", 0) * scale)

    for i, line in enumerate(lines):
        y_pos = y_start + i * line_spacing
        if name_align == "left":
            lx = name_x
        else:
            line_w = _measure_text_width(font, line)
            lx = n_cx - line_w // 2
        draw.text((lx, y_pos), line, fill=name_color, font=font)

    # =====================================================================
    # 3) MEMBER ID — in the CÓDIGO DE MEMBRO bar
    # =====================================================================
    mid = member_id_text
    mid_x = round(mid["x"] * scale)
    mid_y = round(mid["y"] * scale)
    mid_fs = max(1, round(mid["font_size"] * scale))
    mid_font = _resolve_font_from_list(_FONT_ID_CANDIDATES, mid_fs)

    draw.text(
        (mid_x, mid_y),
        member_id,
        fill=mid["color"],
        font=mid_font,
    )

    if user_id:
        uid = system_user_id_text
        uid_x = round(uid["x"] * scale)
        uid_y = round(uid["y"] * scale)
        uid_fs = max(1, round(uid["font_size"] * scale))
        uid_font = _resolve_font(uid_fs, bold=True)
        uid_value = f"{uid.get('prefix', '')}{user_id}"
        draw.text(
            (uid_x, uid_y),
            uid_value,
            fill=uid["color"],
            font=uid_font,
        )

    # --- Output ---
    out = io.BytesIO()
    template.save(out, format="PNG", optimize=True)
    return out.getvalue()


# ---------------------------------------------------------------------------
# Back card renderer
# ---------------------------------------------------------------------------

def render_back_card(
    template_path: str,
    membro_desde_date: str = "",
    valido_ate_date: str = "",
) -> bytes:
    """
    Render the back of the membership card with dynamic dates.

    Parameters
    ----------
    template_path : str
        Path to CardBack.png.
    membro_desde_date : str
        Date string for "Membro desde" (e.g. "01 Fev 2026").
    valido_ate_date : str
        Date string for "Válido até" (e.g. "01 Fev 2028").

    Returns
    -------
    bytes
        PNG image bytes of the generated back card.
    """
    template = Image.open(template_path).convert("RGBA")
    tw, th = template.size
    scale = compute_scale(tw, BACK_DESIGN_WIDTH)

    draw = ImageDraw.Draw(template)

    # =====================================================================
    # 1) MEMBRO DESDE date — right-aligned below the label
    # =====================================================================
    if membro_desde_date:
        md = MEMBRO_DESDE
        md_fs = max(1, round(md["font_size"] * scale))
        md_font = _resolve_font(md_fs)
        md_right_x = round(md["right_x"] * scale)
        md_y = round(md["y"] * scale)

        date_width = _measure_text_width(md_font, membro_desde_date)
        md_x = md_right_x - date_width

        draw.text(
            (md_x, md_y),
            membro_desde_date,
            fill=md["color"],
            font=md_font,
        )

    # =====================================================================
    # 2) VÁLIDO ATÉ date — to the right of the label
    # =====================================================================
    if valido_ate_date:
        va = VALIDO_ATE
        va_fs = max(1, round(va["font_size"] * scale))
        va_font = _resolve_font(va_fs)
        va_x = round(va["x"] * scale) + 3
        va_y = round(va["y"] * scale) - 2

        draw.text(
            (va_x, va_y),
            valido_ate_date,
            fill=va["color"],
            font=va_font,
        )

    # --- Output ---
    out = io.BytesIO()
    template.save(out, format="PNG", optimize=True)
    return out.getvalue()


# ---------------------------------------------------------------------------
# Convenience CLI
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 4:
        print("Usage: python renderer_v2.py <CardFront.png> <photo.jpg> <full_name> [member_id]")
        print("  Back: python renderer_v2.py --back <CardBack.png> <membro_desde> <valido_ate>")
        sys.exit(1)

    if sys.argv[1] == "--back":
        back_path = sys.argv[2]
        desde = sys.argv[3] if len(sys.argv) > 3 else ""
        ate = sys.argv[4] if len(sys.argv) > 4 else ""
        result = render_back_card(back_path, desde, ate)
        os.makedirs("output", exist_ok=True)
        out_path = os.path.join("output", "generated_back.png")
        with open(out_path, "wb") as f:
            f.write(result)
        print(f"Back card saved to {out_path} ({len(result):,} bytes)")
    else:
        template_path = sys.argv[1]
        photo_path = sys.argv[2]
        full_name = sys.argv[3]
        mid = sys.argv[4] if len(sys.argv) > 4 else None

        with open(photo_path, "rb") as f:
            photo_bytes = f.read()

        result = render_front_card(template_path, photo_bytes, full_name, mid)
        os.makedirs("output", exist_ok=True)
        out_path = os.path.join("output", "generated_front.png")
        with open(out_path, "wb") as f:
            f.write(result)
        print(f"Front card saved to {out_path} ({len(result):,} bytes)")
        if mid:
            print(f"Member ID: {mid}")
