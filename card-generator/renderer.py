"""
APSUSM Membership Card Renderer
================================
Deterministic, pixel-accurate card generator using Pillow.
Takes a template PNG, user photo, and full name, and composites
them at fixed (scaled) coordinates.

Coordinates are calibrated against the pinpointed ID_Template.png.
Canonical template size: 1536 × 1024 px.
"""

import hashlib
import io
import math
import os
import time
from PIL import Image, ImageDraw, ImageFont

# ---------------------------------------------------------------------------
# Design coordinates (canonical template width = 1536px, height = 1024px)
# All values are in design-pixels and get multiplied by scale at render time.
# ---------------------------------------------------------------------------
DESIGN_WIDTH = 1536

# Profile image — square, anchored to the left side of the card
PHOTO_FRAME = {
    "x": 180,
    "y": 400,
    "width": 260,
    "height": 260,
    "corner_radius": 20,
}

# Name text — left-aligned, to the right of the photo with 60px gap
# Photo right edge = 180 + 260 = 440; 440 + 40 ≈ 480
NAME_TEXT = {
    "x": 480,              # left-aligned x position
    "y": 500,              # vertically centered relative to photo
    "max_width": 500,
    "font_size": 48,
    "min_font_size": 32,
    "font_weight": "Medium",
    "color": "#333333",
    "line_height": 1.25,
    "align": "left",
    "max_lines": 2,
}

# Member ID — left-aligned directly below the name, 30px gap
MEMBER_ID_TEXT = {
    "x": 480,              # same left edge as name
    "y_offset": 30,        # 30px below last name line
    "font_size": 28,
    "color": "#1F4E8C",
}

# ---------------------------------------------------------------------------
# Font resolution
# ---------------------------------------------------------------------------
_FONT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")
_FONT_CANDIDATES = [
    os.path.join(_FONT_DIR, "Inter-Medium.ttf"),
    os.path.join(_FONT_DIR, "Inter-Regular.ttf"),
    os.path.join(_FONT_DIR, "Roboto-Medium.ttf"),
]


def _resolve_font(size: int) -> ImageFont.FreeTypeFont:
    """Load the first available bundled font at the given size."""
    for path in _FONT_CANDIDATES:
        if os.path.isfile(path):
            return ImageFont.truetype(path, size)
    # Last-resort: try system fonts
    for name in ("Inter", "Inter Medium", "Roboto", "Arial", "DejaVuSans"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    # Absolute fallback — Pillow default bitmap font (ugly but works)
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

    The hash mixes user details with a high-resolution timestamp so that
    two registrations from the same person at different times still get
    different IDs, but the same input at the same instant is reproducible.
    """
    year = time.strftime("%Y")
    seed = f"{first_name.strip().lower()}|{last_name.strip().lower()}|" \
           f"{license_number.strip()}|{email.strip().lower()}|{time.time_ns()}"
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    num = int(digest[:10], 16) % 100000  # 5-digit number
    return f"APSUSM-DR-{year}-{num:05d}"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def compute_scale(template_width: int) -> float:
    """Compute the scale factor relative to the canonical 1536px design."""
    return template_width / DESIGN_WIDTH


def crop_to_aspect(img: Image.Image, target_aspect: float) -> Image.Image:
    """
    Center-crop *img* to the given width/height *target_aspect* ratio.
    No distortion — just removes excess from the longer axis.
    """
    w, h = img.size
    current_aspect = w / h

    if current_aspect > target_aspect:
        # Image is wider — crop left/right
        new_w = int(h * target_aspect)
        left = (w - new_w) // 2
        return img.crop((left, 0, left + new_w, h))
    else:
        # Image is taller — crop top/bottom
        new_h = int(w / target_aspect)
        top = (h - new_h) // 2
        return img.crop((0, top, w, top + new_h))


def rounded_rect_mask(width: int, height: int, radius: int) -> Image.Image:
    """
    Create an anti-aliased rounded-rectangle alpha mask.
    Uses 4× supersampling then downscales for smooth edges.
    """
    ss = 4  # supersampling factor
    big = Image.new("L", (width * ss, height * ss), 0)
    draw = ImageDraw.Draw(big)
    draw.rounded_rectangle(
        [(0, 0), (width * ss - 1, height * ss - 1)],
        radius=radius * ss,
        fill=255,
    )
    return big.resize((width, height), Image.LANCZOS)


def fit_and_wrap_text(
    full_name: str,
    font_loader,          # callable(size) -> ImageFont
    max_width: int,
    font_size: int,
    min_font_size: int,
    max_lines: int,
) -> tuple:
    """
    Determine the best font size and line breaks for *full_name*.

    Returns (font, lines) where *lines* is a list of strings and
    *font* is the ImageFont at the chosen size.

    Algorithm:
      1. Try current font_size — if single line fits, done.
      2. Shrink font down to min_font_size seeking single-line fit.
      3. If still too wide, word-wrap at max font_size into ≤ max_lines.
      4. If 2nd line overflows, ellipsize it.
    """
    # Helper to measure text width
    def _tw(font, text):
        bbox = font.getbbox(text)
        return bbox[2] - bbox[0]

    # --- Phase 1: try shrinking font for single-line fit ---
    for sz in range(font_size, min_font_size - 1, -1):
        font = font_loader(sz)
        if _tw(font, full_name) <= max_width:
            return font, [full_name]

    # --- Phase 2: word-wrap at best size (start large, work down) ---
    for sz in range(font_size, min_font_size - 1, -1):
        font = font_loader(sz)
        lines = _word_wrap(full_name, font, max_width, _tw)
        if len(lines) <= max_lines:
            return font, lines

    # --- Phase 3: force wrap at min size, ellipsize if needed ---
    font = font_loader(min_font_size)
    lines = _word_wrap(full_name, font, max_width, _tw)

    if len(lines) > max_lines:
        lines = lines[:max_lines]
        # Ellipsize last line if it overflows
        last = lines[-1]
        while _tw(font, last + "…") > max_width and len(last) > 1:
            last = last[:-1].rstrip()
        lines[-1] = last + "…"

    return font, lines


def _word_wrap(text: str, font, max_width: int, measure_fn) -> list:
    """Simple greedy word-wrap."""
    words = text.split()
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


def _measure_text_width(font, text: str) -> int:
    """Return the pixel width of *text* rendered in *font*."""
    bbox = font.getbbox(text)
    return bbox[2] - bbox[0]


def render_card(
    template_path: str,
    photo_buffer: bytes,
    full_name: str,
    member_id: str = None,
) -> bytes:
    """
    Composite the user photo and name onto the template and return PNG bytes.

    Parameters
    ----------
    template_path : str
        Path to the template PNG file.
    photo_buffer : bytes
        Raw bytes of the user photo (JPEG or PNG).
    full_name : str
        Full name to print on the card.
    member_id : str, optional
        Member ID to render on the bottom bar. If None, the template
        placeholder is left unchanged.

    Returns
    -------
    bytes
        PNG image bytes of the generated card.
    """
    # --- Load template ---
    template = Image.open(template_path).convert("RGBA")
    tw, th = template.size
    scale = compute_scale(tw)

    # --- Scaled photo coordinates ---
    px = round(PHOTO_FRAME["x"] * scale)
    py = round(PHOTO_FRAME["y"] * scale)
    pw = round(PHOTO_FRAME["width"] * scale)
    ph = round(PHOTO_FRAME["height"] * scale)
    pr = round(PHOTO_FRAME["corner_radius"] * scale)

    # --- Scaled name coordinates ---
    nx = round(NAME_TEXT["x"] * scale)
    ny = round(NAME_TEXT["y"] * scale)
    n_max_w = round(NAME_TEXT["max_width"] * scale)
    n_fs = max(1, round(NAME_TEXT["font_size"] * scale))
    n_min_fs = max(1, round(NAME_TEXT["min_font_size"] * scale))

    # =====================================================================
    # 1) PHOTO — center-crop to square, resize, rounded-rect mask
    # =====================================================================
    user_photo = Image.open(io.BytesIO(photo_buffer)).convert("RGBA")
    target_aspect = pw / ph  # 1.0 for square
    user_photo = crop_to_aspect(user_photo, target_aspect)
    user_photo = user_photo.resize((pw, ph), Image.LANCZOS)

    mask = rounded_rect_mask(pw, ph, pr)
    photo_with_mask = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
    photo_with_mask.paste(user_photo, (0, 0))
    photo_with_mask.putalpha(mask)

    template.paste(photo_with_mask, (px, py), photo_with_mask)

    # =====================================================================
    # 2) NAME — left-aligned, to the right of the photo
    # =====================================================================
    font, lines = fit_and_wrap_text(
        full_name=full_name,
        font_loader=_resolve_font,
        max_width=n_max_w,
        font_size=n_fs,
        min_font_size=n_min_fs,
        max_lines=NAME_TEXT["max_lines"],
    )

    draw = ImageDraw.Draw(template)
    name_color = NAME_TEXT["color"]
    line_spacing = round(n_fs * NAME_TEXT["line_height"])

    for i, line in enumerate(lines):
        y_pos = ny + i * line_spacing
        draw.text((nx, y_pos), line, fill=name_color, font=font)

    # Track the bottom of the last name line for ID placement
    name_bottom_y = ny + (len(lines) - 1) * line_spacing + n_fs

    # =====================================================================
    # 3) MEMBER ID — left-aligned directly below the name
    # =====================================================================
    if member_id:
        mid = MEMBER_ID_TEXT
        mid_x = round(mid["x"] * scale)
        mid_y = name_bottom_y + round(mid["y_offset"] * scale)
        mid_fs = max(1, round(mid["font_size"] * scale))
        mid_font = _resolve_font(mid_fs)

        draw.text(
            (mid_x, mid_y),
            member_id,
            fill=mid["color"],
            font=mid_font,
        )

    # --- Output ---
    out = io.BytesIO()
    template.save(out, format="PNG", optimize=True)
    return out.getvalue()


# ---------------------------------------------------------------------------
# Back card design coordinates (canonical template width = 1536px)
# ---------------------------------------------------------------------------

# "MEMBRO DESDE" label — top-right area of the back card
# The date renders directly below it, right-aligned with the label
MEMBRO_DESDE = {
    "label_right_x": 1380,   # right edge of "MEMBRO DESDE" label
    "label_y": 75,            # baseline of the label text
    "date_y_offset": 35,      # px below label baseline for the date
    "date_font_size": 26,
    "date_color": "#555555",
}

# "VÁLIDO ATÉ" label — bottom-left area of the back card
# The date renders immediately to the right of the label, same baseline
VALIDO_ATE = {
    "label_x": 80,            # left edge of "VÁLIDO ATÉ" label
    "label_y": 835,           # baseline of the label text
    "label_font_size": 26,    # size used to measure label width
    "date_gap": 12,           # px gap between label end and date start
    "date_font_size": 26,
    "date_color": "#555555",
}


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
        Path to the back template PNG file.
    membro_desde_date : str
        Date string for "Membro desde" (e.g. "01 Fev 2026"). If empty, left blank.
    valido_ate_date : str
        Date string for "Válido até" (e.g. "01 Fev 2028"). If empty, left blank.

    Returns
    -------
    bytes
        PNG image bytes of the generated back card.
    """
    # --- Load template ---
    template = Image.open(template_path).convert("RGBA")
    tw, th = template.size
    scale = compute_scale(tw)

    draw = ImageDraw.Draw(template)

    # =====================================================================
    # 1) MEMBRO DESDE date — right-aligned below the "MEMBRO DESDE" label
    # =====================================================================
    if membro_desde_date:
        md = MEMBRO_DESDE
        md_font_size = max(1, round(md["date_font_size"] * scale))
        md_font = _resolve_font(md_font_size)

        md_right_x = round(md["label_right_x"] * scale)
        md_date_y = round((md["label_y"] + md["date_y_offset"]) * scale)

        # Right-align: measure text width and subtract from right edge
        date_width = _measure_text_width(md_font, membro_desde_date)
        md_date_x = md_right_x - date_width

        draw.text(
            (md_date_x, md_date_y),
            membro_desde_date,
            fill=md["date_color"],
            font=md_font,
        )

    # =====================================================================
    # 2) VÁLIDO ATÉ date — to the right of the "VÁLIDO ATÉ" label
    # =====================================================================
    if valido_ate_date:
        va = VALIDO_ATE
        va_label_font_size = max(1, round(va["label_font_size"] * scale))
        va_label_font = _resolve_font(va_label_font_size)

        va_date_font_size = max(1, round(va["date_font_size"] * scale))
        va_date_font = _resolve_font(va_date_font_size)

        va_label_x = round(va["label_x"] * scale)
        va_label_y = round(va["label_y"] * scale)

        # Measure "VÁLIDO ATÉ" label width dynamically
        label_text = "VÁLIDO ATÉ"
        label_width = _measure_text_width(va_label_font, label_text)
        gap = round(va["date_gap"] * scale)

        va_date_x = va_label_x + label_width + gap

        draw.text(
            (va_date_x, va_label_y),
            valido_ate_date,
            fill=va["date_color"],
            font=va_date_font,
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
        print("Usage: python renderer.py <template.png> <photo.jpg> <full_name> [member_id]")
        sys.exit(1)

    template_path = sys.argv[1]
    photo_path = sys.argv[2]
    full_name = sys.argv[3]
    mid = sys.argv[4] if len(sys.argv) > 4 else generate_member_id(full_name)

    with open(photo_path, "rb") as f:
        photo_bytes = f.read()

    result = render_card(template_path, photo_bytes, full_name, mid)
    os.makedirs("output", exist_ok=True)
    out_path = os.path.join("output", "generated.png")
    with open(out_path, "wb") as f:
        f.write(result)
    print(f"Card saved to {out_path} ({len(result):,} bytes)")
    print(f"Member ID: {mid}")
