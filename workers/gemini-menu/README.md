# Gemini menu worker

Cloudflare Worker that calls **Google Gemini** to turn a menu **photo** or OCR **text** into structured dishes for the demo onboarding flow.

## 1. Get a Gemini API key

1. Open [Google AI Studio → API keys](https://aistudio.google.com/apikey).
2. Sign in with Google.
3. Click **Create API key** (pick or create a Google Cloud project).
4. Copy the key — it starts with `AIza…`.

Free tier has rate limits; for production use billing in [Google AI / Cloud Console](https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com).

## 2. Deploy the worker

```bash
cd workers/gemini-menu
npx wrangler login
npx wrangler secret put GEMINI_API_KEY
# paste your AIza… key

# Optional: restrict CORS to your site
npx wrangler secret put ALLOWED_ORIGINS
# e.g. http://localhost:8000,https://moralesmozart.github.io

npx wrangler deploy
```

Note the URL, e.g. `https://gastovision-gemini-menu.<account>.workers.dev/`

## 3. Point the app at the worker

In `index.html`:

```html
<script>
  window.GV_GEMINI_MENU_URL = "https://gastovision-gemini-menu.<account>.workers.dev/";
</script>
```

## 4. Test

1. `python3 -m http.server 8000` in the repo root.
2. Open `#/demo/setup` → scan a menu photo.
3. You should see **“Reading menu with AI…”** then prefilled dishes on the edit step.

## API

**POST** `/`  
`Content-Type: application/json`

**Image (preferred)**

```json
{
  "imageBase64": "<base64 or data:image/jpeg;base64,...>",
  "mimeType": "image/jpeg",
  "lang": "es"
}
```

**Text (OCR fallback)**

```json
{
  "text": "raw OCR text…",
  "lang": "en"
}
```

**Dish image (AI photo)**

```json
{
  "action": "generateDishImage",
  "dishName": "Pulpo a la gallega",
  "lang": "es"
}
```

**Response**

```json
{
  "imageBase64": "...",
  "mimeType": "image/png"
}
```

**Menu parse response**

```json
{
  "items": [
    {
      "title": "Croquetas",
      "description": "Jamón ibérico",
      "price": 13.9,
      "currency": "EUR",
      "category": "starters"
    }
  ]
}
```

The API key never goes in the frontend — only in the worker secret.
