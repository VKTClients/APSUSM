# Deploying APSUSM Card Generator to Vercel

## Prerequisites
- Vercel account
- OpenAI API key
- Git repository with the code

## Setup Steps

### 1. Environment Variables
In your Vercel dashboard, add these environment variables:
- `OPENAI_API_KEY`: Your OpenAI API key (required)

### 2. Template Files
Ensure these files exist in `card-generator/templates/`:
- `CardFront.png` - Blank front template
- `CardExample.png` - Completed example for AI reference
- `CardBack.png` - Back template with dates

### 3. Deployment
```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy from project root
vercel

# Or connect your Git repository in Vercel dashboard
```

## API Endpoints

Once deployed, your API will be available at:

### Health Check
```
GET https://your-app.vercel.app/api/health
```

### Generate Front Card (AI + Photo Enhancement)
```
POST https://your-app.vercel.app/api/generate-card-ai
Content-Type: multipart/form-data

photo: [file]
full_name: "John Doe"
member_id: "APSUSM-DR-2026-01234" (optional)
user_id: "12345" (optional)
photo_mode: "original" or "enhanced"
```

### Generate Front Card (Deterministic Fallback)
```
POST https://your-app.vercel.app/api/generate-card-fallback
Content-Type: multipart/form-data

photo: [file]
full_name: "John Doe"
member_id: "APSUSM-DR-2026-01234" (optional)
user_id: "12345" (optional)
```

### Generate Back Card
```
POST https://your-app.vercel.app/api/generate-card-back
Content-Type: application/json

{
  "membro_desde": "01 Fev 2026",
  "valido_ate": "01 Fev 2028"
}
```

### Generate Member ID
```
POST https://your-app.vercel.app/api/generate-member-id
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "license_number": "12345",
  "email": "john@example.com"
}
```

## Response Format
All endpoints return JSON with:
```json
{
  "success": true,
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "metadata": { ... }
}
```

## Configuration
- Function timeout: 30 seconds (configurable in `vercel.json`)
- Max file size: 10MB
- Supported formats: PNG, JPG, JPEG, WebP
- CORS enabled for all origins

## Monitoring
- Check Vercel Functions logs for errors
- Monitor OpenAI API usage in your OpenAI dashboard
- Function execution time should stay under 30 seconds

## Troubleshooting
1. **500 errors**: Check Vercel function logs, likely missing OpenAI API key
2. **Timeout**: Increase `maxDuration` in `vercel.json`
3. **Template not found**: Ensure template files are in `card-generator/templates/`
4. **CORS issues**: API has CORS enabled, but you may need to whitelist specific domains

## Local Development
```bash
cd card-generator
pip install -r requirements.txt
python api/index.py
```
Server runs on http://localhost:5000
