"""
Generate mask images for GPT image edit (inpainting).

Masks are the same size as the template. White (255) = editable region,
black (0) = preserve. The OpenAI API requires RGBA PNG where transparent
pixels mark the editable area.

This script creates:
  - masks/front_photo_mask.png  (photo region only)
"""

import os
from PIL import Image, ImageDraw

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MASK_DIR = os.path.join(BASE_DIR, "masks")
TEMPLATE_PATH = os.path.join(BASE_DIR, "templates", "CardFront.png")

# Photo region coordinates (must match renderer_v2.py PHOTO_FRAME)
PHOTO_REGION = {
    "x": 222,
    "y": 380,
    "width": 227,
    "height": 301,
}


def generate_front_photo_mask():
    """
    Create an RGBA mask where the photo region is fully transparent
    (alpha=0) and everything else is opaque (alpha=255).
    OpenAI's image edit API treats transparent pixels as the area to edit.
    """
    template = Image.open(TEMPLATE_PATH)
    tw, th = template.size

    # Create a fully opaque image (all pixels preserved)
    mask = Image.new("RGBA", (tw, th), (0, 0, 0, 255))
    draw = ImageDraw.Draw(mask)

    # Make the photo region transparent (area to be edited by GPT)
    x = PHOTO_REGION["x"]
    y = PHOTO_REGION["y"]
    w = PHOTO_REGION["width"]
    h = PHOTO_REGION["height"]
    draw.rectangle([x, y, x + w, y + h], fill=(0, 0, 0, 0))

    os.makedirs(MASK_DIR, exist_ok=True)
    out_path = os.path.join(MASK_DIR, "front_photo_mask.png")
    mask.save(out_path, "PNG")
    print(f"Mask saved: {out_path} ({tw}x{th})")
    print(f"  Photo region: x={x}, y={y}, w={w}, h={h}")
    return out_path


if __name__ == "__main__":
    generate_front_photo_mask()
    print("Done.")
