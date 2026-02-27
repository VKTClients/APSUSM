# APSUSM Card Generator

Pixel-accurate membership card generator. Takes the APSUSM card template, a user photo, and their full name, and composites them into a finished PNG card.

**Stack:** Python 3.10+ / Pillow / Flask

## Quick Start

```bash
cd card-generator

# 1. Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run setup (copies template + downloads Inter font)
python setup.py

# 4. Start API server
python app.py
```

Server runs on **http://localhost:5500**.

## API

### `POST /api/generate-card`

Multipart form-data:

| Field       | Type   | Required | Description                          |
|-------------|--------|----------|--------------------------------------|
| `full_name` | text   | yes      | Member's full name                   |
| `photo`     | file   | yes      | Portrait photo (JPEG/PNG/WebP, ≤10MB)|
| `member_id` | text   | no       | Member ID (reserved for future use)  |
| `save`      | text   | no       | `"true"` to save to disk and return JSON |

**Returns:** PNG image (or JSON with file path if `save=true`)

### `GET /api/health`

Returns JSON with server status and template availability.

## cURL Examples

```bash
# Generate card and save to file
curl -X POST http://localhost:5500/api/generate-card \
  -F "full_name=Dr. Ana Machava" \
  -F "photo=@./my_photo.jpg" \
  --output card.png

# Generate and save on server
curl -X POST http://localhost:5500/api/generate-card \
  -F "full_name=Dr. Ana Machava" \
  -F "photo=@./my_photo.jpg" \
  -F "save=true"

# Health check
curl http://localhost:5500/api/health
```

## CLI Usage

```bash
python renderer.py templates/template.png photo.jpg "Dr. Ana Machava"
# Output: output/generated.png
```

## Coordinate System

All coordinates are defined for a **1500px-wide** canonical template. The renderer auto-scales to match the actual template resolution.

```
scale = actual_template_width / 1500
```

### Photo Frame
| Property      | Design Value | Description                     |
|---------------|--------------|---------------------------------|
| x             | 110          | Left edge of photo area         |
| y             | 215          | Top edge of photo area          |
| width         | 310          | Photo frame width               |
| height        | 370          | Photo frame height              |
| corner_radius | 25           | Rounded corner radius           |

### Name Text
| Property      | Design Value | Description                     |
|---------------|--------------|---------------------------------|
| x             | 460          | Left edge of text area          |
| y             | 475          | Top edge (baseline) of text     |
| max_width     | 520          | Maximum text width before wrap  |
| font_size     | 42           | Starting font size              |
| min_font_size | 32           | Minimum font size before wrap   |
| color         | #333333      | Text color                      |
| max_lines     | 2            | Maximum number of text lines    |

### Changing Coordinates

Edit the `PHOTO_FRAME` and `NAME_TEXT` dicts at the top of `renderer.py`. All values are in "design pixels" for a 1500px-wide template — they auto-scale to any resolution.

## Text Fitting Algorithm

1. Try full name at `font_size` — if it fits in `max_width`, done (single line).
2. Shrink font down to `min_font_size` seeking single-line fit.
3. Word-wrap at largest working size into ≤ `max_lines`.
4. If 2nd line overflows, ellipsize with "…".

## Tests

```bash
pytest test_renderer.py -v
```

Requires template to be set up first (`python setup.py`).

## Project Structure

```
card-generator/
├── app.py              # Flask API server
├── renderer.py         # Core rendering engine
├── download_font.py    # Inter font downloader
├── setup.py            # One-time setup script
├── test_renderer.py    # Unit + integration tests
├── requirements.txt    # Python dependencies
├── fonts/              # TTF fonts (auto-downloaded)
│   └── Inter-Medium.ttf
├── templates/          # Card template (auto-copied)
│   └── template.png
└── output/             # Generated cards
    └── generated.png
```
