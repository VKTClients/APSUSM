"""Copy ID_Template_Back.png into card-generator/templates/ if not already present."""
import shutil, os

src = os.path.join(os.path.dirname(__file__), "..", "apsusm-frontend", "ID_Template_Back.png")
dst = os.path.join(os.path.dirname(__file__), "templates", "ID_Template_Back.png")

if os.path.isfile(src) and not os.path.isfile(dst):
    shutil.copy2(src, dst)
    print(f"Copied {src} -> {dst}")
elif os.path.isfile(dst):
    print(f"Already exists: {dst}")
else:
    print(f"Source not found: {src}")
