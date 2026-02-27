"""
Setup script — copies template and downloads font.
Run once: python setup.py
"""

import os
import shutil

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")
TEMPLATE_SRC = os.path.join(BASE_DIR, "..", "apsusm-frontend", "ID Card.png")
TEMPLATE_DST = os.path.join(TEMPLATE_DIR, "template.png")


def setup():
    # 1. Copy template
    os.makedirs(TEMPLATE_DIR, exist_ok=True)
    if not os.path.isfile(TEMPLATE_DST):
        if os.path.isfile(TEMPLATE_SRC):
            shutil.copy2(TEMPLATE_SRC, TEMPLATE_DST)
            print(f"Template copied: {TEMPLATE_DST}")
        else:
            print(f"WARNING: Template source not found at {TEMPLATE_SRC}")
            print("Please manually copy your ID Card.png to templates/template.png")
    else:
        print(f"Template already exists: {TEMPLATE_DST}")

    # 2. Create output dir
    os.makedirs(os.path.join(BASE_DIR, "output"), exist_ok=True)

    # 3. Download font
    from download_font import download
    download()

    print("\nSetup complete. Run: python app.py")


if __name__ == "__main__":
    setup()
