"""
Setup script — copies template and downloads font.
Run once: python setup.py
"""

import os
import shutil

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")
# Legacy templates
TEMPLATE_SRC = os.path.join(BASE_DIR, "..", "apsusm-frontend", "ID Card.png")
TEMPLATE_DST = os.path.join(TEMPLATE_DIR, "template.png")

# New v2 templates
FRONT_SRC = os.path.join(BASE_DIR, "..", "CardFront.png")
FRONT_DST = os.path.join(TEMPLATE_DIR, "CardFront.png")
BACK_SRC = os.path.join(BASE_DIR, "..", "CardBack.png")
BACK_DST = os.path.join(TEMPLATE_DIR, "CardBack.png")


def setup():
    # 1. Copy templates
    os.makedirs(TEMPLATE_DIR, exist_ok=True)

    # v2 templates (CardFront / CardBack)
    for src, dst, label in [
        (FRONT_SRC, FRONT_DST, "CardFront.png"),
        (BACK_SRC, BACK_DST, "CardBack.png"),
    ]:
        if not os.path.isfile(dst):
            if os.path.isfile(src):
                shutil.copy2(src, dst)
                print(f"Template copied: {dst}")
            else:
                print(f"WARNING: {label} not found at {src}")
                print(f"  Please manually copy {label} to templates/")
        else:
            print(f"Template already exists: {dst}")

    # Legacy template (optional)
    if not os.path.isfile(TEMPLATE_DST):
        if os.path.isfile(TEMPLATE_SRC):
            shutil.copy2(TEMPLATE_SRC, TEMPLATE_DST)
            print(f"Legacy template copied: {TEMPLATE_DST}")
    else:
        print(f"Legacy template already exists: {TEMPLATE_DST}")

    # 2. Create output dir
    os.makedirs(os.path.join(BASE_DIR, "output"), exist_ok=True)

    # 3. Download font
    from download_font import download
    download()

    print("\nSetup complete. Run: python app.py")


if __name__ == "__main__":
    setup()
