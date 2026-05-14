/**
 * POST /  JSON body: { "text": "<OCR/plain menu text>", "lang": "en" }
 * Response: { "items": [ { "title", "description", "price", "currency", "category" }, ... ] }
 *
 * Secrets: GEMINI_API_KEY (required)
 * Vars:    ALLOWED_ORIGINS (optional), GEMINI_MODEL (optional)
 */

/* Tried in order after GEMINI_MODEL (env). On 404/429 we try the next id — quotas differ per model. */
const MODEL_FALLBACKS = [
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash"
];

const STRUCTURE_PROMPT = `You receive noisy OCR text from a restaurant menu (possible column bleed, typos, bullets, multiple languages).

Return ONE JSON array only (no markdown fences, no commentary). Each element:
{
  "title": string (dish or drink name in the menu's language),
  "description": string (short subtitle or ingredients if visible in the OCR, else ""),
  "price": number or null (major currency units; null only if no price for that line),
  "currency": "EUR" | "USD" | "GBP" (infer from € $ £ or context, default EUR),
  "category": "starters" | "mains" | "drinks" | "desserts" | "specials"
}

Rules:
- One object per dish/drink line with a price when you can infer it; two prices on one line (e.g. half/full) → two objects with clear titles.
- Do not output section headers as items unless they clearly include a priced dish.
- Skip pure footnotes, VAT-only lines, and garbage with no dish name.
- category: antipasti/tapas/entrantes/salads cold → starters; postres/desserts → desserts; arroces/pasta/platos/carnes/pescados → mains; vinos/bebidas → drinks; specials → specials; if unsure use mains.`;

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
      return json({ error: "Use POST with JSON body { text, lang? }." }, 405, request, env);
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

    const rawText = body.text;
    if (typeof rawText !== "string" || rawText.trim().length < 8) {
      return json({ error: "Missing or too-short text (expected OCR output)." }, 400, request, env);
    }

    const ocr = rawText.trim().slice(0, 45000);
    const lang = typeof body.lang === "string" ? body.lang : "en";

    const configured = (env.GEMINI_MODEL || "").trim();
    const modelCandidates = [configured, ...MODEL_FALLBACKS].filter(
      (m, i, arr) => m && arr.indexOf(m) === i
    );

    const userMessage = `${STRUCTURE_PROMPT}

UI locale hint for wording: ${lang}.

OCR_TEXT:
---
${ocr}
---

Return one JSON array only.`;

    let gemRes;
    let gemText = "";
    let gemJson = null;
    let lastDetail = "";

    for (const model of modelCandidates) {
      const gemUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      gemRes = await fetch(gemUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: userMessage }]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192
          }
        })
      });

      gemText = await gemRes.text();
      try {
        gemJson = JSON.parse(gemText);
      } catch (_) {
        return json({ error: "Gemini returned non-JSON.", detail: gemText.slice(0, 200) }, 502, request, env);
      }

      if (gemRes.ok) break;

      lastDetail = gemJson.error?.message || gemText.slice(0, 400);
      const tryNext = gemRes.status === 404 || gemRes.status === 429;
      if (!tryNext) {
        return json({ error: "Gemini HTTP " + gemRes.status, detail: lastDetail }, 502, request, env);
      }
    }

    if (!gemRes.ok) {
      return json(
        {
          error: "Gemini HTTP " + gemRes.status + " (all listed models failed).",
          detail: lastDetail
        },
        502,
        request,
        env
      );
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
