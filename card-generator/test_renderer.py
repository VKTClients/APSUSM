"""
Tests for the APSUSM card renderer.
Run: pytest test_renderer.py -v
"""

import os
import hashlib
import io
import pytest
from PIL import Image, ImageDraw

from renderer import (
    compute_scale,
    crop_to_aspect,
    rounded_rect_mask,
    fit_and_wrap_text,
    render_card,
    _resolve_font,
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_PATH = os.path.join(BASE_DIR, "templates", "template.png")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_test_photo(width=600, height=800, color=(100, 130, 180)) -> bytes:
    """Generate a simple solid-color test photo."""
    img = Image.new("RGB", (width, height), color)
    # Draw a face-like circle so we can see centering
    draw = ImageDraw.Draw(img)
    cx, cy = width // 2, height // 2
    r = min(width, height) // 4
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(220, 180, 150))
    # Eyes
    draw.ellipse([cx - r // 3 - 10, cy - 20, cx - r // 3 + 10, cy], fill=(60, 60, 60))
    draw.ellipse([cx + r // 3 - 10, cy - 20, cx + r // 3 + 10, cy], fill=(60, 60, 60))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Unit tests
# ---------------------------------------------------------------------------

class TestComputeScale:
    def test_canonical(self):
        assert compute_scale(1500) == 1.0

    def test_double(self):
        assert compute_scale(3000) == 2.0

    def test_half(self):
        assert compute_scale(750) == 0.5

    def test_arbitrary(self):
        assert abs(compute_scale(1024) - 1024 / 1500) < 1e-9


class TestCropToAspect:
    def test_wider_image(self):
        img = Image.new("RGB", (800, 400))
        result = crop_to_aspect(img, 1.0)  # target square
        assert result.size == (400, 400)

    def test_taller_image(self):
        img = Image.new("RGB", (400, 800))
        result = crop_to_aspect(img, 1.0)  # target square
        assert result.size == (400, 400)

    def test_exact_aspect(self):
        img = Image.new("RGB", (310, 370))
        result = crop_to_aspect(img, 310 / 370)
        assert result.size == (310, 370)

    def test_photo_frame_aspect(self):
        img = Image.new("RGB", (1000, 1200))
        aspect = 310 / 370
        result = crop_to_aspect(img, aspect)
        w, h = result.size
        assert abs(w / h - aspect) < 0.01


class TestRoundedRectMask:
    def test_dimensions(self):
        mask = rounded_rect_mask(310, 370, 25)
        assert mask.size == (310, 370)
        assert mask.mode == "L"

    def test_corners_transparent(self):
        mask = rounded_rect_mask(200, 200, 30)
        # Top-left corner pixel should be transparent
        assert mask.getpixel((0, 0)) < 128

    def test_center_opaque(self):
        mask = rounded_rect_mask(200, 200, 30)
        assert mask.getpixel((100, 100)) == 255

    def test_zero_radius(self):
        mask = rounded_rect_mask(100, 100, 0)
        # All corners should be opaque
        assert mask.getpixel((0, 0)) == 255


class TestFitAndWrapText:
    def test_short_name(self):
        font, lines = fit_and_wrap_text("Ana", _resolve_font, 520, 42, 32, 2)
        assert len(lines) == 1
        assert lines[0] == "Ana"

    def test_medium_name(self):
        font, lines = fit_and_wrap_text(
            "Dr. Maria da Silva", _resolve_font, 520, 42, 32, 2
        )
        assert len(lines) <= 2

    def test_long_name_wraps(self):
        font, lines = fit_and_wrap_text(
            "Dr. Anastácia Fernanda Machava dos Santos",
            _resolve_font, 300, 42, 32, 2,
        )
        assert len(lines) <= 2

    def test_very_long_name_ellipsis(self):
        name = "Dr. Anastácia Fernanda Maria Machava dos Santos Beira Sofala"
        font, lines = fit_and_wrap_text(name, _resolve_font, 300, 42, 32, 2)
        assert len(lines) <= 2
        if len(lines) == 2:
            # Last line may be ellipsized
            assert len(lines[1]) > 0

    def test_returns_font_and_lines(self):
        font, lines = fit_and_wrap_text("Test", _resolve_font, 520, 42, 32, 2)
        assert font is not None
        assert isinstance(lines, list)


# ---------------------------------------------------------------------------
# Integration / golden test
# ---------------------------------------------------------------------------

@pytest.mark.skipif(
    not os.path.isfile(TEMPLATE_PATH),
    reason="Template not found — run: python setup.py"
)
class TestRenderCard:
    def test_generates_valid_png(self):
        photo = _make_test_photo()
        result = render_card(TEMPLATE_PATH, photo, "Dr. Ana Machava")
        assert len(result) > 0
        # Verify it's a valid PNG
        img = Image.open(io.BytesIO(result))
        assert img.format == "PNG"
        assert img.size[0] > 0 and img.size[1] > 0

    def test_output_preserves_template_size(self):
        photo = _make_test_photo()
        template = Image.open(TEMPLATE_PATH)
        tw, th = template.size
        result = render_card(TEMPLATE_PATH, photo, "Dr. Ana Machava")
        out = Image.open(io.BytesIO(result))
        assert out.size == (tw, th)

    def test_golden_output(self):
        """Generate a golden card and save it."""
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        photo = _make_test_photo()
        result = render_card(TEMPLATE_PATH, photo, "Dr. Ana Machava")

        out_path = os.path.join(OUTPUT_DIR, "golden_test.png")
        with open(out_path, "wb") as f:
            f.write(result)

        # Verify file was written
        assert os.path.isfile(out_path)
        assert os.path.getsize(out_path) > 0

        # Print hash for determinism check
        h = hashlib.sha256(result).hexdigest()[:16]
        print(f"\nGolden test output: {out_path}")
        print(f"SHA-256 prefix: {h}")

    def test_long_name(self):
        photo = _make_test_photo()
        result = render_card(
            TEMPLATE_PATH, photo,
            "Dr. Anastácia Fernanda Maria Machava dos Santos"
        )
        img = Image.open(io.BytesIO(result))
        assert img.format == "PNG"

    def test_various_photo_sizes(self):
        """Ensure different photo aspect ratios work."""
        for w, h in [(200, 200), (1000, 500), (300, 900), (4000, 3000)]:
            photo = _make_test_photo(w, h)
            result = render_card(TEMPLATE_PATH, photo, "Test User")
            img = Image.open(io.BytesIO(result))
            assert img.format == "PNG"


# ---------------------------------------------------------------------------
# Flask API test
# ---------------------------------------------------------------------------

@pytest.mark.skipif(
    not os.path.isfile(TEMPLATE_PATH),
    reason="Template not found — run: python setup.py"
)
class TestFlaskAPI:
    @pytest.fixture
    def client(self):
        from app import app
        app.config["TESTING"] = True
        with app.test_client() as c:
            yield c

    def test_health(self, client):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["status"] == "ok"

    def test_generate_card(self, client):
        photo = _make_test_photo()
        resp = client.post(
            "/api/generate-card",
            data={"full_name": "Dr. Ana Machava"},
            content_type="multipart/form-data",
        )
        # This will fail without photo file — let's add it properly
        from io import BytesIO
        resp = client.post(
            "/api/generate-card",
            data={
                "full_name": "Dr. Ana Machava",
                "photo": (BytesIO(photo), "test_photo.png"),
            },
            content_type="multipart/form-data",
        )
        assert resp.status_code == 200
        assert resp.content_type == "image/png"
        assert len(resp.data) > 0

    def test_missing_name(self, client):
        photo = _make_test_photo()
        from io import BytesIO
        resp = client.post(
            "/api/generate-card",
            data={"photo": (BytesIO(photo), "test.png")},
            content_type="multipart/form-data",
        )
        assert resp.status_code == 400

    def test_missing_photo(self, client):
        resp = client.post(
            "/api/generate-card",
            data={"full_name": "Test"},
            content_type="multipart/form-data",
        )
        assert resp.status_code == 400

    def test_save_to_disk(self, client):
        photo = _make_test_photo()
        from io import BytesIO
        resp = client.post(
            "/api/generate-card",
            data={
                "full_name": "Dr. Ana Machava",
                "photo": (BytesIO(photo), "test_photo.png"),
                "save": "true",
            },
            content_type="multipart/form-data",
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["success"] is True
        assert os.path.isfile(data["path"])
