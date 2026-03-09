"""
Vercel Serverless Function for APSUSM Card Generator
Entry point: /api/generate-card-ai, /api/generate-card-back, /api/health
"""

import os
import sys
import json
from pathlib import Path

# Add the card-generator directory to Python path
sys.path.append(str(Path(__file__).parent.parent))

from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import tempfile
import shutil

# Import our card generation functions
from card_generator_gpt import generate_front_card_ai, generate_back_card, generate_member_id
from renderer_v2 import render_front_card

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = tempfile.mkdtemp()
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_response(data, status=200):
    """Create JSON response with proper headers for Vercel"""
    response = jsonify(data)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response, status

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    try:
        return create_response({
            "status": "healthy",
            "version": "1.0.0",
            "features": {
                "ai_generation": bool(os.environ.get("OPENAI_API_KEY")),
                "photo_enhancement": True,
                "deterministic_fallback": True
            },
            "coordinates": {
                "photo_x": 171,
                "photo_y": 223,
                "photo_w": 375,
                "photo_h": 440
            }
        })
    except Exception as e:
        return create_response({"error": str(e)}, 500)

@app.route('/api/generate-card-ai', methods=['POST'])
def generate_card_ai():
    """Generate front card with AI layout and optional photo enhancement"""
    try:
        # Get form data
        if 'photo' not in request.files:
            return create_response({"error": "No photo file provided"}, 400)
        
        file = request.files['photo']
        if file.filename == '':
            return create_response({"error": "No file selected"}, 400)
        
        if not allowed_file(file.filename):
            return create_response({"error": "File type not allowed. Use PNG, JPG, JPEG, or WebP"}, 400)
        
        # Get other form fields
        full_name = request.form.get("full_name", "").strip()
        if not full_name:
            return create_response({"error": "Full name is required"}, 400)
        
        member_id = request.form.get("member_id", "").strip() or None
        user_id = request.form.get("user_id", "").strip()
        photo_mode = request.form.get("photo_mode", "original").strip().lower()
        
        if photo_mode not in ["original", "enhanced"]:
            photo_mode = "original"
        
        # Read photo bytes
        photo_bytes = file.read()
        if len(photo_bytes) > MAX_FILE_SIZE:
            return create_response({"error": "File too large. Maximum size is 10MB"}, 400)
        
        # Generate card
        png_bytes = generate_front_card_ai(
            photo_bytes=photo_bytes,
            full_name=full_name,
            member_id=member_id,
            user_id=user_id,
            template_path=None,  # Use default paths
            example_path=None,
            photo_mode=photo_mode,
        )
        
        # Return as base64
        import base64
        img_b64 = base64.b64encode(png_bytes).decode('utf-8')
        
        return create_response({
            "success": True,
            "image": f"data:image/png;base64,{img_b64}",
            "metadata": {
                "name": full_name,
                "member_id": member_id,
                "user_id": user_id,
                "photo_mode": photo_mode,
                "size_bytes": len(png_bytes)
            }
        })
        
    except Exception as e:
        print(f"Error in generate_card_ai: {e}")
        return create_response({"error": f"Card generation failed: {str(e)}"}, 500)

@app.route('/api/generate-card-back', methods=['POST'])
def generate_card_back():
    """Generate back card with dates"""
    try:
        data = request.get_json() if request.is_json else {}
        
        membro_desde = data.get("membro_desde", "")
        valido_ate = data.get("valido_ate", "")
        
        png_bytes = generate_back_card(
            membro_desde_date=membro_desde,
            valido_ate_date=valido_ate
        )
        
        # Return as base64
        import base64
        img_b64 = base64.b64encode(png_bytes).decode('utf-8')
        
        return create_response({
            "success": True,
            "image": f"data:image/png;base64,{img_b64}",
            "metadata": {
                "membro_desde": membro_desde,
                "valido_ate": valido_ate,
                "size_bytes": len(png_bytes)
            }
        })
        
    except Exception as e:
        print(f"Error in generate_card_back: {e}")
        return create_response({"error": f"Back card generation failed: {str(e)}"}, 500)

@app.route('/api/generate-card-fallback', methods=['POST'])
def generate_card_fallback():
    """Generate front card using deterministic fallback only"""
    try:
        # Get form data
        if 'photo' not in request.files:
            return create_response({"error": "No photo file provided"}, 400)
        
        file = request.files['photo']
        if file.filename == '':
            return create_response({"error": "No file selected"}, 400)
        
        if not allowed_file(file.filename):
            return create_response({"error": "File type not allowed. Use PNG, JPG, JPEG, or WebP"}, 400)
        
        # Get other form fields
        full_name = request.form.get("full_name", "").strip()
        if not full_name:
            return create_response({"error": "Full name is required"}, 400)
        
        member_id = request.form.get("member_id", "").strip() or None
        user_id = request.form.get("user_id", "").strip()
        
        # Read photo bytes
        photo_bytes = file.read()
        if len(photo_bytes) > MAX_FILE_SIZE:
            return create_response({"error": "File too large. Maximum size is 10MB"}, 400)
        
        # Generate card using deterministic renderer
        png_bytes = render_front_card(
            template_path=None,  # Use default
            photo_buffer=photo_bytes,
            full_name=full_name,
            member_id=member_id,
            user_id=user_id,
        )
        
        # Return as base64
        import base64
        img_b64 = base64.b64encode(png_bytes).decode('utf-8')
        
        return create_response({
            "success": True,
            "image": f"data:image/png;base64,{img_b64}",
            "metadata": {
                "name": full_name,
                "member_id": member_id,
                "user_id": user_id,
                "renderer": "deterministic_fallback",
                "size_bytes": len(png_bytes)
            }
        })
        
    except Exception as e:
        print(f"Error in generate_card_fallback: {e}")
        return create_response({"error": f"Card generation failed: {str(e)}"}, 500)

@app.route('/api/generate-member-id', methods=['POST'])
def generate_member_id_endpoint():
    """Generate a member ID"""
    try:
        data = request.get_json() if request.is_json else {}
        
        first_name = data.get("first_name", "")
        last_name = data.get("last_name", "")
        license_number = data.get("license_number", "")
        email = data.get("email", "")
        
        member_id = generate_member_id(
            first_name=first_name,
            last_name=last_name,
            license_number=license_number,
            email=email
        )
        
        return create_response({
            "success": True,
            "member_id": member_id,
            "metadata": {
                "first_name": first_name,
                "last_name": last_name,
                "license_number": license_number,
                "email": email
            }
        })
        
    except Exception as e:
        print(f"Error in generate_member_id: {e}")
        return create_response({"error": f"Member ID generation failed: {str(e)}"}, 500)

# Handle OPTIONS requests for CORS
@app.route('/api/<path:path>', methods=['OPTIONS'])
def options_handler(path):
    return create_response({"status": "ok"})

# Vercel serverless function handler
def handler(request):
    """Main handler for Vercel serverless functions"""
    return app(request.environ, lambda status, headers: b'')

# For local testing
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
