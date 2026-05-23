/**
 * POST /  JSON body (one of):
 *   { "text": "<OCR text>", "lang": "en" }
 *   { "imageBase64": "<base64>", "mimeType": "image/jpeg", "lang": "en" }
 *   { "action": "generateDishImage", "dishName": "Paella", "lang": "es" }
 *
 * Responses:
 *   menu parse → { items: [...] }
 *   dish image → { imageBase64, mimeType }
 *
 * Secrets: GEMINI_API_KEY (required)
 * Vars:    ALLOWED_ORIGINS, GEMINI_MODEL, GEMINI_IMAGE_MODEL (optional)
 */

const MODEL_FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash"
];

const IMAGE_GEN_MODEL_FALLBACKS = [
  "gemini-2.5-flash-image",
  "gemini-3.1-flash-image-preview",
  "gemini-3-pro-image-preview"
];

const STRUCTURE_PROMPT = `You receive content from a restaurant menu (printed card, chalkboard photo, or OCR text). Extract every dish and drink you can read.

Return ONE JSON array only (no markdown fences, no commentary). Each element:
{
  "title": string (dish or drink name in the menu's language),
  "description": string (short summary or ingredients if visible, else ""),
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

function modelCandidates(env) {
  const configured = (env.GEMINI_MODEL || "").trim();
  return [configured, ...MODEL_FALLBACKS].filter((m, i, arr) => m && arr.indexOf(m) === i);
}

function imageModelCandidates(env) {
  const configured = (env.GEMINI_IMAGE_MODEL || "").trim();
  return [configured, ...IMAGE_GEN_MODEL_FALLBACKS].filter(
    (m, i, arr) => m && arr.indexOf(m) === i
  );
}

function extractImagePart(gemJson) {
  const parts = gemJson.candidates?.[0]?.content?.parts || [];
  for (let i = 0; i < parts.length; i++) {
    const inline = parts[i].inlineData || parts[i].inline_data;
    if (inline && inline.data) {
      return {
        imageBase64: inline.data,
        mimeType: inline.mimeType || inline.mime_type || "image/png"
      };
    }
  }
  return null;
}

function buildDishImagePrompt(dishName, lang) {
  return `Act as a specialist chef and food photographer. Create a single appetizing, professional restaurant menu photograph of: "${dishName}".

Requirements:
- Photorealistic plated dish, high-end restaurant quality
- Soft natural light, shallow depth of field, warm tones
- No text, no watermark, no logo, no people's faces
- Square-friendly composition, food fills most of the frame

Locale context for styling (not for text in image): ${lang}.`;
}

async function generateDishImage(env, dishName, lang) {
  const key = env.GEMINI_API_KEY;
  if (!key) {
    return { ok: false, status: 500, payload: { error: "Worker missing GEMINI_API_KEY secret." } };
  }

  const prompt = buildDishImagePrompt(dishName, lang);
  const attempts = [];

  for (const model of imageModelCandidates(env)) {
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
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      })
    });

    const gemText = await gemRes.text();
    let gemJson;
    try {
      gemJson = JSON.parse(gemText);
    } catch (_) {
      return {
        ok: false,
        status: 502,
        payload: { error: "Gemini returned non-JSON.", detail: gemText.slice(0, 200) }
      };
    }

    if (!gemRes.ok) {
      const msg =
        model +
        ": HTTP " +
        gemRes.status +
        " — " +
        (gemJson.error?.message || gemText.slice(0, 220));
      attempts.push(msg);
      const tryNext = gemRes.status === 404 || gemRes.status === 429;
      if (!tryNext) {
        return {
          ok: false,
          status: 502,
          payload: { error: "Gemini HTTP " + gemRes.status, detail: msg, attempts: attempts }
        };
      }
      continue;
    }

    const image = extractImagePart(gemJson);
    if (image) {
      return { ok: true, status: 200, payload: image };
    }

    const parts = gemJson.candidates?.[0]?.content?.parts || [];
    const textHint = parts
      .map((p) => p.text)
      .filter(Boolean)
      .join(" ")
      .slice(0, 120);
    attempts.push(
      model +
        ": no image in response" +
        (textHint ? " — " + textHint : "")
    );
  }

  return {
    ok: false,
    status: 422,
    payload: {
      error: "Could not generate dish image (no image models succeeded).",
      detail: attempts.join(" | "),
      attempts: attempts,
      hint:
        "Image generation may require billing on your Google AI project. See https://ai.google.dev/gemini-api/docs/image-generation"
    }
  };
}

async function callGemini(env, parts, allow) {
  const key = env.GEMINI_API_KEY;
  if (!key) {
    return { ok: false, status: 500, payload: { error: "Worker missing GEMINI_API_KEY secret." } };
  }

  let gemRes;
  let gemText = "";
  let gemJson = null;
  let lastDetail = "";

  for (const model of modelCandidates(env)) {
    const gemUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    gemRes = await fetch(gemUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key
      },
      body: JSON.stringify({
        contents: [{ parts }],
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
      return {
        ok: false,
        status: 502,
        payload: { error: "Gemini returned non-JSON.", detail: gemText.slice(0, 200) }
      };
    }

    if (gemRes.ok) break;

    lastDetail = gemJson.error?.message || gemText.slice(0, 400);
    const tryNext = gemRes.status === 404 || gemRes.status === 429;
    if (!tryNext) {
      return {
        ok: false,
        status: 502,
        payload: { error: "Gemini HTTP " + gemRes.status, detail: lastDetail }
      };
    }
  }

  if (!gemRes.ok) {
    return {
      ok: false,
      status: 502,
      payload: {
        error: "Gemini HTTP " + gemRes.status + " (all listed models failed).",
        detail: lastDetail
      }
    };
  }

  const outParts = gemJson.candidates?.[0]?.content?.parts || [];
  const textOut = outParts.map((p) => p.text).filter(Boolean).join("\n");
  if (!textOut.trim()) {
    return { ok: false, status: 502, payload: { error: "Empty model response.", raw: gemJson } };
  }

  let rows;
  try {
    rows = parseModelJsonArray(textOut);
  } catch (e) {
    return {
      ok: false,
      status: 502,
      payload: {
        error: "Could not parse model JSON: " + (e && e.message),
        snippet: textOut.slice(0, 500)
      }
    };
  }

  const items = rows.map(normalizeItem).filter(Boolean);
  if (!items.length) {
    return {
      ok: false,
      status: 422,
      payload: { error: "Model returned no usable dishes.", snippet: textOut.slice(0, 500) }
    };
  }

  return { ok: true, status: 200, payload: { items } };
}

function buildTextParts(ocr, lang) {
  const userMessage = `${STRUCTURE_PROMPT}

UI locale hint for wording: ${lang}.

OCR_TEXT:
---
${ocr}
---

Return one JSON array only.`;
  return [{ text: userMessage }];
}

function buildImageParts(imageBase64, mimeType, lang) {
  const userMessage = `${STRUCTURE_PROMPT}

Read every dish and drink visible in this menu photo. For each item return name (title), a short summary (description), and price when shown.

UI locale hint for wording: ${lang}.

Return one JSON array only.`;
  return [
    {
      inline_data: {
        mime_type: mimeType || "image/jpeg",
        data: imageBase64
      }
    },
    { text: userMessage }
  ];
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
      return json(
        {
          error:
            "Use POST with { text } or { imageBase64 } for menu parse, or { action: generateDishImage, dishName }."
        },
        405,
        request,
        env
      );
    }

    if (!allow) {
      return json(
        { error: "Origin not allowed. Set ALLOWED_ORIGINS or remove it for *." },
        403,
        request,
        env
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (_) {
      return json({ error: "Invalid JSON body." }, 400, request, env);
    }

    const lang = typeof body.lang === "string" ? body.lang : "en";

    if (body.action === "generateDishImage") {
      const dishName = String(body.dishName || body.dish || "").trim();
      if (dishName.length < 2) {
        return json({ error: "dishName is required (min 2 characters)." }, 400, request, env);
      }
      const imgResult = await generateDishImage(env, dishName, lang);
      if (!imgResult.ok) {
        return json(imgResult.payload, imgResult.status, request, env);
      }
      return json(imgResult.payload, 200, request, env);
    }

    const imageRaw = body.imageBase64 || body.image;
    let result;

    if (typeof imageRaw === "string" && imageRaw.length > 100) {
      let b64 = imageRaw.trim();
      let mimeType = body.mimeType || "image/jpeg";
      const dataUrlMatch = b64.match(/^data:([^;]+);base64,(.+)$/);
      if (dataUrlMatch) {
        mimeType = dataUrlMatch[1];
        b64 = dataUrlMatch[2];
      }
      if (b64.length > 4_500_000) {
        return json({ error: "Image too large. Use a smaller photo (under ~3 MB)." }, 413, request, env);
      }
      result = await callGemini(env, buildImageParts(b64, mimeType, lang), allow);
    } else {
      const rawText = body.text;
      if (typeof rawText !== "string" || rawText.trim().length < 8) {
        return json(
          { error: "Provide imageBase64 or text (OCR) in the JSON body." },
          400,
          request,
          env
        );
      }
      const ocr = rawText.trim().slice(0, 45000);
      result = await callGemini(env, buildTextParts(ocr, lang), allow);
    }

    if (!result.ok) {
      return json(result.payload, result.status, request, env);
    }
    return json(result.payload, 200, request, env);
  }
};
