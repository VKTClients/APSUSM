"""
Download the exact font set required by the card generator.
Tries multiple sources for each font and falls back to Windows system fonts.
Run once: python download_font.py
"""

import os
import shutil
import urllib.request

FONT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")

_FONT_SOURCES = {
    "Inter-Bold.ttf": [
        "https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/Inter-Bold.ttf",
        "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf",
    ],
    "Inter-Medium.ttf": [
        "https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/Inter-Medium.ttf",
        "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-500-normal.ttf",
    ],
    "Inter-Regular.ttf": [
        "https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/Inter-Regular.ttf",
        "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf",
    ],
    "Montserrat-SemiBold.ttf": [
        "https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/Montserrat-SemiBold.ttf",
        "https://cdn.jsdelivr.net/fontsource/fonts/montserrat@latest/latin-600-normal.ttf",
    ],
}

_WINDOWS_FONT_MAP = {
    "Inter-Bold.ttf": ("calibrib.ttf", "arialbd.ttf", "segoeuib.ttf"),
    "Inter-Medium.ttf": ("calibri.ttf", "arial.ttf", "segoeui.ttf"),
    "Inter-Regular.ttf": ("calibri.ttf", "arial.ttf", "segoeui.ttf"),
    "Montserrat-SemiBold.ttf": ("calibrib.ttf", "arialbd.ttf", "segoeuib.ttf"),
}


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


def _copy_windows_fallback(target_name: str) -> bool:
    windir = os.environ.get("WINDIR", r"C:\Windows")
    for fallback_name in _WINDOWS_FONT_MAP.get(target_name, ()):
        sys_font = os.path.join(windir, "Fonts", fallback_name)
        if os.path.isfile(sys_font):
            shutil.copy2(sys_font, os.path.join(FONT_DIR, target_name))
            print(f"  Copied system font: {fallback_name} -> {target_name}")
            return True
    return False


def download():
    os.makedirs(FONT_DIR, exist_ok=True)

    missing = []
    for target_name, urls in _FONT_SOURCES.items():
        dest = os.path.join(FONT_DIR, target_name)
        if os.path.isfile(dest) and os.path.getsize(dest) > 1000:
            print(f"Font already exists: {dest}")
            continue

        print(f"Resolving {target_name}...")
        downloaded = False
        for url in urls:
            print(f"  Downloading from {url}")
            if _try_download(url, dest):
                size_kb = os.path.getsize(dest) / 1024
                print(f"  OK ({size_kb:.0f} KB)")
                downloaded = True
                break

        if downloaded:
            continue

        print(f"  Remote download failed for {target_name}. Trying Windows fallback...")
        if _copy_windows_fallback(target_name):
            continue

        missing.append(target_name)

    if missing:
        print("WARNING: Some fonts are still missing.")
        for name in missing:
            print(f"  Missing: {name}")
        print("Card text rendering may fall back to Pillow defaults.")
    else:
        print("Font download complete.")


if __name__ == "__main__":
    download()
