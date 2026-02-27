"""
Download a suitable font for the card generator.
Tries multiple sources; falls back to Windows system fonts if all fail.
Run once: python download_font.py
"""

import os
import shutil
import urllib.request

FONT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")

# Sources to try, in order (each is a list of (local_name, url) tuples)
_SOURCES = [
    # 1) Google Fonts GitHub repo — variable font
    [
        ("Inter-Medium.ttf",
         "https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf"),
    ],
    # 2) Alternative: fontsource CDN
    [
        ("Inter-Medium.ttf",
         "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-500-normal.ttf"),
    ],
    # 3) Another CDN
    [
        ("Inter-Medium.ttf",
         "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf"),
    ],
]

# Windows system font fallbacks (already on the machine)
_WINDOWS_FALLBACKS = [
    os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts", f)
    for f in ("arial.ttf", "calibri.ttf", "segoeui.ttf", "verdana.ttf", "tahoma.ttf")
]


def _try_download(url: str, dest: str, timeout: int = 30) -> bool:
    """Download a single file. Returns True on success."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = resp.read()
        if len(data) < 1000:
            return False  # too small, probably an error page
        with open(dest, "wb") as f:
            f.write(data)
        return True
    except Exception as e:
        print(f"    Failed: {e}")
        # Cleanup partial file
        if os.path.isfile(dest):
            os.remove(dest)
        return False


def download():
    os.makedirs(FONT_DIR, exist_ok=True)

    target = os.path.join(FONT_DIR, "Inter-Medium.ttf")
    if os.path.isfile(target) and os.path.getsize(target) > 1000:
        print(f"Font already exists: {target}")
        return

    # Try each remote source
    for i, source in enumerate(_SOURCES, 1):
        print(f"Trying source {i}/{len(_SOURCES)}...")
        all_ok = True
        for local_name, url in source:
            dest = os.path.join(FONT_DIR, local_name)
            print(f"  Downloading {local_name}...")
            if _try_download(url, dest):
                size_kb = os.path.getsize(dest) / 1024
                print(f"  OK ({size_kb:.0f} KB)")
            else:
                all_ok = False
                break
        if all_ok:
            print("Font download complete.")
            return

    # All remote sources failed — copy a Windows system font
    print("All remote downloads failed. Trying Windows system fonts...")
    for sys_font in _WINDOWS_FALLBACKS:
        if os.path.isfile(sys_font):
            dest = os.path.join(FONT_DIR, "Inter-Medium.ttf")
            shutil.copy2(sys_font, dest)
            name = os.path.basename(sys_font)
            print(f"  Copied system font: {name} -> Inter-Medium.ttf")
            print("  (Card will use this font instead of Inter)")
            return

    print("WARNING: No font available. Card text rendering will use Pillow default.")
    print("  You can manually place any .ttf file in fonts/Inter-Medium.ttf")


if __name__ == "__main__":
    download()
