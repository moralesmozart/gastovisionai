/**
 * POST /  JSON body: { "imageBase64": "<raw base64>", "mimeType": "image/jpeg", "lang": "en" }
 * Response: { "items": [ { "title", "description", "price", "currency", "category" }, ... ] }
 *
 * Secrets: GEMINI_API_KEY (required)
 * Vars:    ALLOWED_ORIGINS (optional, comma-separated), GEMINI_MODEL (optional)
 */

const DEFAULT_MODEL = "gemini-1.5-flash";

const MENU_PROMPT = `You are digitizing a restaurant menu from a photograph.

Return ONE JSON array only (no markdown fences, no commentary). Each element:
{
  "title": string (dish or drink name in the menu's language),
  "description": string (short subtitle or ingredients under the name, else ""),
  "price": number or null (major currency units, e.g. 12.5 for 12,50€; null only if no price on that line),
  "currency": "EUR" | "USD" | "GBP" (from symbols on the menu, default EUR),
  "category": "starters" | "mains" | "drinks" | "desserts" | "specials"
}

Rules:
- One object per priced line (if two sizes e.g. half/full with two prices, output two objects with clear titles).
- Do not output section headers (e.g. PESCADOS) as items unless they include a price.
- Skip footnotes, VAT-only lines, and decorative text without a dish name.
- category: map antipasti/tapas/entrantes → starters; postres/desserts → desserts; arroces/pasta/platos → mains; vinos/bebidas → drinks; chef specials → specials; if unsure use mains.`;

function getAllowOrigin(request, env) {
  const raw = (env.ALLOWED_ORIGINS || "").trim();
  if (!raw) return "*";
  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const origin = request.headers.get("Origin");
  if (origin && list.includes(origin)) return origin;
  if (list.length === 1) return list[0];
  return null;
}

function json(data, status, request, env) {
  const allow = getAllowOrigin(request, env);
  const headers = new Headers({ "Content-Type": "application/json; charset=utf-8" });
  if (allow) {
    headers.set("Access-Control-Allow-Origin", allow);
    headers.set("Vary", "Origin");
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function parseModelJsonArray(text) {
  let t = String(text || "").trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const arr = JSON.parse(t);
  if (!Array.isArray(arr)) throw new Error("Model output is not a JSON array");
  return arr;
}

function normalizeItem(row) {
  if (!row || typeof row !== "object") return null;
  const title = String(row.title || row.name || "").trim();
  if (title.length < 2) return null;
  const description = String(row.description || "").trim();
  let price = row.price;
  if (price === "" || price === undefined) price = null;
  if (price !== null && typeof price === "string") {
    price = Number(String(price).replace(",", "."));
  }
  if (price !== null && (typeof price !== "number" || Number.isNaN(price))) price = null;

  const currency = String(row.currency || "EUR")
    .toUpperCase()
    .replace(/^€$/, "EUR")
    .replace(/^\$$/, "USD")
    .replace(/^£$/, "GBP");
  const cat = String(row.category || "mains").toLowerCase();
  const allowed = new Set(["starters", "mains", "drinks", "desserts", "specials"]);
  return {
    title,
    description,
    price,
    currency: ["EUR", "USD", "GBP"].includes(currency) ? currency : "EUR",
    category: allowed.has(cat) ? cat : "mains"
  };
}

export default {
  async fetch(request, env) {
    const allow = getAllowOrigin(request, env);
    if (request.method === "OPTIONS") {
      if (!allow) return new Response(null, { status: 403 });
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": allow,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          Vary: "Origin"
        }
      });
    }

    if (request.method !== "POST") {
      return json({ error: "Use POST with JSON body { imageBase64, mimeType?, lang? }." }, 405, request, env);
    }

    if (!allow) {
      return json({ error: "Origin not allowed. Set ALLOWED_ORIGINS or remove it for *." }, 403, request, env);
    }

    const key = env.GEMINI_API_KEY;
    if (!key) {
      return json({ error: "Worker missing GEMINI_API_KEY secret." }, 500, request, env);
    }

    let body;
    try {
      body = await request.json();
    } catch (_) {
      return json({ error: "Invalid JSON body." }, 400, request, env);
    }

    let b64 = body.imageBase64;
    if (typeof b64 !== "string" || !b64.length) {
      return json({ error: "Missing imageBase64 string." }, 400, request, env);
    }
    b64 = b64.replace(/^data:[^;]+;base64,/i, "").trim();

    const mimeType = typeof body.mimeType === "string" && body.mimeType ? body.mimeType : "image/jpeg";
    const lang = typeof body.lang === "string" ? body.lang : "en";

    const model = (env.GEMINI_MODEL || DEFAULT_MODEL).trim();
    const gemUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const gemRes = await fetch(gemUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: mimeType, data: b64 } },
              { text: `${MENU_PROMPT}\n\nRespond in valid JSON only. UI locale hint: ${lang}.` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192
        }
      })
    });

    const gemText = await gemRes.text();
    let gemJson;
    try {
      gemJson = JSON.parse(gemText);
    } catch (_) {
      return json({ error: "Gemini returned non-JSON.", detail: gemText.slice(0, 200) }, 502, request, env);
    }

    if (!gemRes.ok) {
      const msg = gemJson.error?.message || gemText.slice(0, 300);
      return json({ error: "Gemini HTTP " + gemRes.status, detail: msg }, 502, request, env);
    }

    const parts = gemJson.candidates?.[0]?.content?.parts || [];
    const textOut = parts.map((p) => p.text).filter(Boolean).join("\n");
    if (!textOut.trim()) {
      return json({ error: "Empty model response.", raw: gemJson }, 502, request, env);
    }

    let rows;
    try {
      rows = parseModelJsonArray(textOut);
    } catch (e) {
      return json(
        { error: "Could not parse model JSON: " + (e && e.message), snippet: textOut.slice(0, 500) },
        502,
        request,
        env
      );
    }

    const items = rows.map(normalizeItem).filter(Boolean);
    if (!items.length) {
      return json({ error: "Model returned no usable dishes.", snippet: textOut.slice(0, 500) }, 422, request, env);
    }

    return json({ items }, 200, request, env);
  }
};
