"""
Quick visual test for renderer_v2.
Generates front and back cards with a synthetic test photo.
"""
import io
import os
from PIL import Image, ImageDraw
from renderer_v2 import render_front_card, render_back_card, generate_member_id

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONT_TEMPLATE = os.path.join(BASE_DIR, "templates", "CardFront.png")
BACK_TEMPLATE = os.path.join(BASE_DIR, "templates", "CardBack.png")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")


def make_test_photo(w=400, h=500):
    """Create a synthetic portrait photo for testing."""
    img = Image.new("RGB", (w, h), (70, 130, 180))  # steel blue bg
    draw = ImageDraw.Draw(img)
    # Draw a simple face outline
    cx, cy = w // 2, h // 2 - 30
    r = min(w, h) // 4
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(220, 185, 155))  # skin tone
    # Eyes
    draw.ellipse([cx - r//3 - 8, cy - 10, cx - r//3 + 8, cy + 10], fill=(50, 50, 50))
    draw.ellipse([cx + r//3 - 8, cy - 10, cx + r//3 + 8, cy + 10], fill=(50, 50, 50))
    # Mouth
    draw.arc([cx - r//3, cy + r//4, cx + r//3, cy + r//2], 0, 180, fill=(180, 80, 80), width=3)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_front():
    print(f"Front template: {FRONT_TEMPLATE} (exists={os.path.isfile(FRONT_TEMPLATE)})")
    photo = make_test_photo()
    member_id = "APSUSM-DR-2026-00008"

    result = render_front_card(
        FRONT_TEMPLATE, photo,
        "António Januário Duze Chicombe Chiquila",
        member_id,
    )

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    out_path = os.path.join(OUTPUT_DIR, "test_front_v2.png")
    with open(out_path, "wb") as f:
        f.write(result)

    img = Image.open(io.BytesIO(result))
    print(f"Front card: {img.size}, {len(result):,} bytes -> {out_path}")

    # Also test with a short name
    result2 = render_front_card(
        FRONT_TEMPLATE, photo,
        "Dr. Ana Machava",
        "APSUSM-DR-2026-00142"
    )
    out_path2 = os.path.join(OUTPUT_DIR, "test_front_v2_long.png")
    with open(out_path2, "wb") as f:
        f.write(result2)
    print(f"Front card (long name): {len(result2):,} bytes -> {out_path2}")


def test_back():
    print(f"Back template: {BACK_TEMPLATE} (exists={os.path.isfile(BACK_TEMPLATE)})")

    result = render_back_card(BACK_TEMPLATE, "01 Fev 2026", "01 Fev 2028")

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    out_path = os.path.join(OUTPUT_DIR, "test_back_v2.png")
    with open(out_path, "wb") as f:
        f.write(result)

    img = Image.open(io.BytesIO(result))
    print(f"Back card: {img.size}, {len(result):,} bytes -> {out_path}")


if __name__ == "__main__":
    test_front()
    print()
    test_back()
    print("\nDone! Check output/ folder for results.")
