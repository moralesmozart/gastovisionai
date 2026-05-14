/* GastoVision — Demo Mode
 *
 * A 4-step wizard the salesperson uses in front of a restaurant owner:
 *   1. Scan menu photo (Tesseract.js OCR) OR add items manually.
 *   2. Edit the extracted items (titles, descriptions, prices, categories).
 *   3. Add photos per dish (compressed + CSS "pro" filter).
 *   4. Publish: name the restaurant, generate a live URL + QR code.
 *
 * Storage strategy (no backend, fits in GitHub Pages):
 *   - Draft lives in localStorage under "gv.demo.draft".
 *   - Publish encodes the entire demo (LZ-compressed JSON) into the page
 *     query string as ?gv_d=…#/demo/v (not raw ?d= inside the hash).
 *     Reason: URLSearchParams treats "+" as a space; LZ output can contain
 *     "+", which used to corrupt payloads and show "link corrupted".
 *     encodeURIComponent on publish + gv_d in location.search fixes that.
 *     Legacy #/demo/v?d=… links still load when possible.
 *
 * The whole module hangs off window.GV (set by app.js).
 */
(function () {
  if (!window.GV) {
    console.error("[demo] window.GV not ready — load demo.js after app.js.");
    return;
  }
  const GV = window.GV;
  const I18N = GV.I18N;
  const el = GV.el;

  /* ---------------------------- Constants ---------------------------- */

  const STORAGE_DRAFT = "gv.demo.draft";
  const STORAGE_LOCAL_DEMOS = "gv.demo.local"; // map<id, demo>
  const STORAGE_PUBLISHED = "gv.demo.published"; // [{id, mode, name, createdAt}]
  const MAX_QR_URL_LENGTH = 4000; // QR scanners get unreliable past this
  const PHOTO_MAX_DIM = 1200;
  const PHOTO_QUALITY = 0.72;
  const PHOTO_FOR_URL_MAX_DIM = 600;
  const PHOTO_FOR_URL_QUALITY = 0.55;
  const TESSERACT_CDN =
    "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
  const QRIOUS_CDN =
    "https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js";
  const LZSTRING_CDN =
    "https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js";

  /* ------------------------------ State ------------------------------ */

  function emptyDraft() {
    return {
      restaurant: { name: "", tagline: "" },
      items: [],
      lang: I18N.get() || "en"
    };
  }

  function loadDraft() {
    const d = GV.loadJson(STORAGE_DRAFT, null);
    return d && d.items ? d : emptyDraft();
  }
  function saveDraft(draft) {
    GV.saveJson(STORAGE_DRAFT, draft);
  }
  function clearDraft() {
    try {
      localStorage.removeItem(STORAGE_DRAFT);
    } catch (_) {}
  }

  function uid() {
    return (
      Math.random().toString(36).slice(2, 8) +
      Math.random().toString(36).slice(2, 6)
    );
  }

  /* ------------------- Lazy CDN script loaders ----------------------- */

  const _scriptCache = {};
  function loadScript(src) {
    if (_scriptCache[src]) return _scriptCache[src];
    _scriptCache[src] = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () =>
        reject(new Error("Failed to load " + src + " — check your connection."));
      document.head.appendChild(s);
    });
    return _scriptCache[src];
  }

  function loadTesseract() {
    return loadScript(TESSERACT_CDN).then(() => window.Tesseract);
  }
  function loadQRious() {
    return loadScript(QRIOUS_CDN).then(() => window.QRious);
  }
  function loadLZString() {
    return loadScript(LZSTRING_CDN).then(() => window.LZString);
  }

  /* ------------------ Photo compression helpers --------------------- */

  function fileToImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        resolve(img);
        URL.revokeObjectURL(url);
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });
  }

  function compressImage(img, maxDim, quality) {
    const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.round(img.width * ratio);
    const h = Math.round(img.height * ratio);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  }

  function dataUrlToImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("bad image"));
      img.src = dataUrl;
    });
  }

  /* Deep-clone draft and recompress every data-URL photo for a smaller ?gv_d= payload. */
  async function draftWithPhotosResized(draft, maxDim, quality) {
    const d = JSON.parse(JSON.stringify(draft));
    const items = d.items || [];
    for (let i = 0; i < items.length; i++) {
      const url = items[i].photoUrl;
      if (!url || typeof url !== "string" || !url.startsWith("data:image")) continue;
      try {
        const img = await dataUrlToImage(url);
        items[i].photoUrl = compressImage(img, maxDim, quality);
      } catch (_) {}
    }
    return d;
  }

  async function fileToCompressedDataUrl(file, maxDim, quality) {
    const img = await fileToImage(file);
    return compressImage(img, maxDim || PHOTO_MAX_DIM, quality || PHOTO_QUALITY);
  }

  /* ----------------------- OCR text parsing -------------------------- */

  /* Heuristic that turns raw OCR text from a printed menu into structured
   * items. Real menus vary wildly so we keep this defensive — anything
   * weird shows up as an editable card the user fixes by hand. */
  function parseMenuText(text) {
    if (!text) return [];

    /* Older regex required two decimals (14.00) and missed (14€), 14€, 9,5€ —
     * that collapsed whole menus into a single "dish". */
    function rangesOverlap(a, b) {
      return !(a.end <= b.start || b.end <= a.start);
    }

    function pushPriceIfClear(out, start, end, price, currency) {
      if (isNaN(price) || price <= 0 || price > 499) return;
      const cand = { start, end, price, currency };
      if (out.some((x) => rangesOverlap(x, cand))) return;
      out.push(cand);
    }

    function pushStandaloneIfClear(out, start, end, price, currency, line) {
      if (isNaN(price) || price <= 0 || price > 499) return;
      if (!/[A-Za-z\u00C0-\u024F]/.test(line)) return;
      const cand = { start, end, price, currency };
      if (out.some((x) => rangesOverlap(x, cand))) return;
      out.push(cand);
    }

    /* Printed menus often omit the € in OCR, or glue every row into one line.
     * We merge explicit currency hits with standalone numbers that look like prices. */
    function findAllPriceMatches(line) {
      /* Note: `\b` after `€` fails in JS when the next char is a space (both are
       * “non-word”), so euro prices were never matched — use `(?=\D|$)` instead. */
      const re =
        /\(\s*(\d{1,3}(?:[.,]\d{1,2})?)\s*(?:€|EUR)\s*\)|(\d{1,3}(?:[.,]\d{1,2})?)\s*(?:€|EUR)(?=\D|$)|(?:€|EUR)\s*(\d{1,3}(?:[.,]\d{1,2})?)(?=\D|$)|(\d{1,3}(?:[.,]\d{1,2})?)\s*(USD)\b|(\d{1,3}(?:[.,]\d{1,2})?)\s*(\$)|(\$)\s*(\d{1,3}(?:[.,]\d{1,2})?)|([£])\s*(\d{1,3}(?:[.,]\d{1,2})?)/gi;
      const out = [];
      let m;
      while ((m = re.exec(line)) !== null) {
        let priceStr = "";
        let currency = "€";
        if (m[1]) {
          priceStr = m[1];
        } else if (m[2]) {
          priceStr = m[2];
        } else if (m[3]) {
          priceStr = m[3];
        } else if (m[4] && m[5]) {
          priceStr = m[4];
          currency = "$";
        } else if (m[6] && m[7]) {
          priceStr = m[6];
          currency = "$";
        } else if (m[8] && m[9]) {
          priceStr = m[9];
          currency = "$";
        } else if (m[10] && m[11]) {
          priceStr = m[11];
          currency = "£";
        }
        const price = parseFloat(String(priceStr).replace(",", "."));
        pushPriceIfClear(out, m.index, m.index + m[0].length, price, currency);
      }

      /* Trailing "… 12,50" / "… 9" with no currency (very common after OCR). */
      const trail = line.match(/(\d{1,3}(?:[.,]\d{1,2})?)\s*$/);
      if (trail) {
        const raw = trail[1];
        const price = parseFloat(String(raw).replace(",", "."));
        const start = line.length - trail[0].length;
        pushStandaloneIfClear(out, start, line.length, price, "€", line);
      }

      /* Same line, multiple dishes: "Ceviche 14 Lomo saltado 22" — price
       * followed by a word that looks like a new dish name (≥3 letters). */
      const midRe =
        /(?<=[A-Za-z\u00C0-\u024f\)]\s)(\d{1,3}(?:[.,]\d{1,2})?)\s+(?=[A-Za-z\u00C0-\u024F\u00f1\u00d1]{3,})/g;
      while ((m = midRe.exec(line)) !== null) {
        const price = parseFloat(String(m[1]).replace(",", "."));
        pushStandaloneIfClear(out, m.index, m.index + m[0].length, price, "€", line);
      }

      out.sort((a, b) => a.start - b.start);
      return out;
    }

    function expandPhysicalLine(line) {
      const matches = findAllPriceMatches(line);
      const parts = [];
      if (!matches.length) {
        parts.push({ kind: "noPrice", text: line });
        return parts;
      }
      let prev = 0;
      matches.forEach((match) => {
        const slice = line.slice(prev, match.end).trim();
        if (slice) parts.push({ kind: "withPrice", text: slice });
        prev = match.end;
      });
      const rest = line.slice(prev).trim();
      if (rest) parts.push({ kind: "noPrice", text: rest });
      return parts;
    }

    function dishFromPricedSegment(segment) {
      const matches = findAllPriceMatches(segment);
      if (!matches.length) return null;
      const last = matches[matches.length - 1];
      const title = segment
        .slice(0, last.start)
        .replace(/[:\-–—•·\s]+$/u, "")
        .trim();
      return {
        title: title || "Untitled",
        price: last.price,
        currency: last.currency
      };
    }

    /* Two-column menus: OCR often reads across the gutter ("…10€ Next dish…"). */
    function normalizeOcrMenuText(t) {
      if (!t) return t;
      /* After €, allow bullets / OCR noise before the next dish name. */
      return t.replace(
        /(\d{1,3}(?:[.,]\d{1,2})?)\s*(€|EUR)(?=\s+(?:(?:[*+•·«»®©]+|[(])\s*)?[A-Za-z\u00C0-\u024f(])/gi,
        "$1$2\n"
      );
    }

    const lines = normalizeOcrMenuText(text)
      .split(/\r?\n/)
      .map((l) => l.replace(/\s+/g, " ").trim())
      .filter((l) => l.length > 1);

    const parts = [];
    lines.forEach((line) => {
      expandPhysicalLine(line).forEach((p) => parts.push(p));
    });

    const items = [];
    const lang = I18N.get() || "en";
    let pending = { title: "", description: "", price: null, currency: "€" };

    function flush() {
      if (pending.title || pending.description || pending.price != null) {
        items.push({
          id: uid(),
          category: "mains",
          title: { [lang]: pending.title || "Untitled" },
          description: { [lang]: pending.description || "" },
          price: pending.price != null ? pending.price : 0,
          currency: pending.currency || "€",
          tags: [],
          allergens: [],
          photoUrl: null
        });
      }
      pending = { title: "", description: "", price: null, currency: "€" };
    }

    parts.forEach((part) => {
      if (part.kind === "noPrice") {
        const t = part.text;
        if (pending.title || pending.price != null) {
          pending.description = (pending.description + " " + t).trim();
        } else if (items.length) {
          const last = items[items.length - 1];
          last.description[lang] = ((last.description[lang] || "") + " " + t).trim();
        } else {
          pending.title = t;
        }
        return;
      }

      const d = dishFromPricedSegment(part.text);
      if (!d) return;

      const headerOnly =
        pending.title &&
        pending.price == null &&
        !pending.description;

      if (headerOnly) {
        pending.title = pending.title + " — " + d.title;
        pending.price = d.price;
        pending.currency = d.currency;
      } else {
        flush();
        pending.title = d.title;
        pending.price = d.price;
        pending.currency = d.currency;
      }
    });
    flush();

    /* Drop obvious garbage — single-letter items, very short noise. */
    return items.filter((it) => (it.title[lang] || "").length >= 2);
  }

  /* ------------------ Demo → DATA shape converter ------------------- */

  /* The demo wizard stores items in a compact shape. The main app expects
   * the full DATA shape (multilingual fields, categories with icons, etc.).
   * This converter bridges the two so we can hand any draft straight into
   * GV.setData() to render the live preview / published view. */
  function draftToData(draft) {
    const lang = draft.lang || I18N.get() || "en";

    /* Pick a hero image: the first item with a photo, otherwise the
     * built-in tomato-salad scene. */
    let hero = "assets/img/dishes/tomato-salad.jpg";
    const firstWithPhoto = (draft.items || []).find((i) => i.photoUrl);
    if (firstWithPhoto) hero = firstWithPhoto.photoUrl;

    const usedCategories = new Set(
      (draft.items || []).map((i) => i.category || "mains")
    );
    const allCategories = [
      { id: "starters", icon: "🥖" },
      { id: "mains", icon: "🍝" },
      { id: "drinks", icon: "🍹" },
      { id: "desserts", icon: "🍰" },
      { id: "specials", icon: "✨" }
    ].filter((c) => usedCategories.has(c.id));

    /* Make sure non-current-language fields exist by mirroring. The app
     * falls back to "en" automatically if a field is missing. */
    function fanOut(obj, fallback) {
      const langs = ["en", "es", "pt", "fr", "de"];
      const out = {};
      langs.forEach((l) => {
        out[l] = (obj && obj[l]) || (obj && obj[lang]) || fallback || "";
      });
      return out;
    }

    const items = (draft.items || []).map((it) => ({
      id: it.id,
      category: it.category || "mains",
      price: typeof it.price === "number" ? it.price : 0,
      currency: it.currency || "€",
      tags: it.tags || [],
      allergens: it.allergens || [],
      name: fanOut(it.title, "Untitled"),
      description: fanOut(it.description, ""),
      photoUrl: it.photoUrl || null,
      photoFilter: it.photoFilter || "pro"
    }));

    return {
      restaurant: {
        name: draft.restaurant.name || "Your Restaurant",
        tagline: fanOut(
          { [lang]: draft.restaurant.tagline || "Demo menu by GastoVision" },
          "Demo menu by GastoVision"
        ),
        hero: hero
      },
      categories: allCategories.length
        ? allCategories
        : [{ id: "mains", icon: "🍝" }],
      items: items
    };
  }

  /* ------------------ Publish: encode into URL ---------------------- */

  /* Serialize a published demo as ?gv_d=<encodeURIComponent(compressed)>#/demo/v
   * so "+" and other characters in the LZ payload are not mangled by
   * URLSearchParams (+ → space). If the result is too long for a comfortable
   * QR scan, persist to localStorage instead and return a same-device-only URL. */
  async function publishDemo(draft) {
    const LZ = await loadLZString();
    const path = location.pathname.replace(/\/$/, "/");

    function encodeUrlPayload(data) {
      const compressed = LZ.compressToEncodedURIComponent(JSON.stringify(data));
      const baseUrl =
        location.origin +
        path +
        "?gv_d=" +
        encodeURIComponent(compressed) +
        "#/demo/v";
      return { baseUrl, len: baseUrl.length };
    }

    const shrinkSteps = [
      [PHOTO_FOR_URL_MAX_DIM, PHOTO_FOR_URL_QUALITY],
      [520, 0.48],
      [440, 0.42],
      [380, 0.37],
      [320, 0.33],
      [280, 0.29],
      [240, 0.26],
      [200, 0.23],
      [180, 0.2]
    ];

    /* Try URL-stuffed mode (cross-device): start as-is, then smaller photos. */
    try {
      for (let s = 0; s < shrinkSteps.length; s++) {
        const [dim, q] = shrinkSteps[s];
        const pubDraft =
          s === 0 ? draft : await draftWithPhotosResized(draft, dim, q);
        const data = draftToData(pubDraft);
        const { baseUrl, len } = encodeUrlPayload(data);
        if (len <= MAX_QR_URL_LENGTH) {
          return {
            url: baseUrl,
            mode: "url",
            size: len,
            photosReduced: s > 0,
            photosReducedNote:
              s > 0
                ? "Photos were compressed so the QR link fits every phone."
                : ""
          };
        }
      }

      /* Last resort for URL mode: menu text only (no photos in the link). */
      const textOnly = JSON.parse(JSON.stringify(draft));
      (textOnly.items || []).forEach((it) => {
        it.photoUrl = null;
      });
      const dataNoPhotos = draftToData(textOnly);
      const { baseUrl, len } = encodeUrlPayload(dataNoPhotos);
      if (len <= MAX_QR_URL_LENGTH) {
        return {
          url: baseUrl,
          mode: "url",
          size: len,
          photosReduced: true,
          photosStrippedForUrl: true,
          photosReducedNote:
            "Photos are not in this link (too many dishes for one QR). The menu still opens; add photos again on the owner's device if you need them."
        };
      }
    } catch (_) {
      /* Fall through to local mode. */
    }

    /* Fallback: device-local (full payload in localStorage). */
    const data = draftToData(draft);
    const id = uid();
    const map = GV.loadJson(STORAGE_LOCAL_DEMOS, {});
    map[id] = data;
    GV.saveJson(STORAGE_LOCAL_DEMOS, map);
    const url =
      location.origin + location.pathname.replace(/\/$/, "/") + "#/demo/v/" + id;
    return { url: url, mode: "local", size: url.length };
  }

  /* ------------------ Load published demo from URL ------------------ */

  /* Re-entry guard. setData() in applyDemoData triggers route() which
   * re-runs the route hook → loadPublishedFromHash again. The flag stops
   * an infinite loop in that handoff. */
  let _applyingDemo = false;

  async function loadPublishedFromHash(rest) {
    if (_applyingDemo) return;

    /* 1) Primary: ?gv_d=…#/demo/v (payload is encodeURIComponent-safe). */
    let compressed = new URLSearchParams(location.search).get("gv_d");

    /* 2) Legacy: #/demo/v?d=… (URLSearchParams turned "+" into spaces — we heal below). */
    if (!compressed) {
      const hash = location.hash || "";
      const q = hash.indexOf("?");
      if (q !== -1) {
        compressed = new URLSearchParams(hash.slice(q + 1)).get("d");
      }
    }

    if (compressed) {
      try {
        const LZ = await loadLZString();
        let json = LZ.decompressFromEncodedURIComponent(compressed);
        if (!json && / /.test(compressed)) {
          json = LZ.decompressFromEncodedURIComponent(compressed.replace(/ /g, "+"));
        }
        if (!json) throw new Error("decompress failed");
        const data = JSON.parse(json);
        applyDemoData(data);
      } catch (err) {
        renderError("Couldn't open this demo. The link looks corrupted.");
      }
      return;
    }

    /* 3) Device-local: #/demo/v/<id> (no query payload). */
    const localId =
      rest[1] === "v" && rest[2] ? String(rest[2]).split("?")[0] : "";
    if (localId) {
      const map = GV.loadJson(STORAGE_LOCAL_DEMOS, {});
      const data = map[localId];
      if (data) {
        applyDemoData(data);
        return;
      }
      renderError(
        "This demo was created on another device.\nAsk the salesperson to show it to you, or create your own."
      );
      return;
    }

    renderError("This demo link is missing its data.");
  }

  function applyDemoData(data) {
    _applyingDemo = true;
    try {
      GV.setData(data);
      document.body.classList.add("gv-demo-mode");
      /* Send the user to the welcome screen of the new restaurant.
       * route() will fire again here, but our route hook short-circuits
       * because _applyingDemo is still set. After the navigate the
       * URL is "#/" so the next route() lands on renderWelcome with
       * the new DATA already in place. */
      GV.navigate("#/");
    } finally {
      setTimeout(() => {
        _applyingDemo = false;
      }, 50);
    }
  }

  /* ----------------------------- Wizard UI -------------------------- */

  const view = GV.view;
  const tabbar = GV.tabbar;

  function showWizardChrome() {
    document.body.classList.add("body--demo-wizard");
    document.body.classList.remove("body--welcome");
    if (tabbar) tabbar.classList.add("tabbar--hidden");
  }

  function hideWizardChrome() {
    document.body.classList.remove("body--demo-wizard");
  }

  function stepHeader(currentStep, title, subtitle) {
    const wrap = el("header", { class: "demo-header" });
    wrap.appendChild(
      el("a", {
        href: "#/",
        class: "demo-header__exit",
        html: GV.makeIcon("x") + "<span>Exit demo</span>"
      })
    );
    const steps = el("div", { class: "demo-steps" });
    [1, 2, 3, 4].forEach((n) => {
      const cls =
        "demo-steps__dot" +
        (n === currentStep ? " demo-steps__dot--current" : "") +
        (n < currentStep ? " demo-steps__dot--done" : "");
      steps.appendChild(el("span", { class: cls, text: String(n) }));
    });
    wrap.appendChild(steps);
    wrap.appendChild(el("h1", { class: "demo-header__title", text: title }));
    if (subtitle)
      wrap.appendChild(
        el("p", { class: "demo-header__sub", text: subtitle })
      );
    return wrap;
  }

  function renderError(msg) {
    showWizardChrome();
    view.innerHTML = "";
    const wrap = el("section", { class: "demo demo--error" });
    wrap.appendChild(
      el("h2", { class: "demo__error-title", text: "We hit a snag" })
    );
    wrap.appendChild(el("p", { class: "demo__error-msg", text: msg }));
    wrap.appendChild(
      el("a", { href: "#/", class: "btn btn--primary", text: "Back home" })
    );
    view.appendChild(wrap);
  }

  /* ----------------------- Step 1: Choose input --------------------- */

  function renderStep1() {
    showWizardChrome();
    view.innerHTML = "";
    const wrap = el("section", { class: "demo demo--center" });
    wrap.appendChild(
      stepHeader(
        1,
        "Let's build a demo menu",
        "Two ways to get started. The whole flow takes ~2 minutes."
      )
    );

    const grid = el("div", { class: "demo-choice" });

    const scan = el("button", {
      class: "demo-choice__card",
      type: "button",
      onClick: () => GV.navigate("#/demo/scan")
    });
    scan.appendChild(el("div", { class: "demo-choice__icon", text: "📷" }));
    scan.appendChild(el("h3", { text: "Scan a menu photo" }));
    scan.appendChild(
      el("p", {
        text:
          "Snap or upload a photo of the printed menu. We'll extract the dishes automatically."
      })
    );
    scan.appendChild(
      el("span", { class: "demo-choice__badge", text: "Recommended" })
    );

    const manual = el("button", {
      class: "demo-choice__card",
      type: "button",
      onClick: () => {
        const draft = loadDraft();
        if (!draft.items || draft.items.length === 0) {
          /* Seed with one empty item so the editor isn't blank. */
          draft.items = [
            {
              id: uid(),
              category: "mains",
              title: { [I18N.get() || "en"]: "" },
              description: { [I18N.get() || "en"]: "" },
              price: 0,
              currency: "€",
              tags: [],
              allergens: [],
              photoUrl: null
            }
          ];
          saveDraft(draft);
        }
        GV.navigate("#/demo/edit");
      }
    });
    manual.appendChild(el("div", { class: "demo-choice__icon", text: "✍️" }));
    manual.appendChild(el("h3", { text: "Add items manually" }));
    manual.appendChild(
      el("p", {
        text: "Type in dishes, prices, and descriptions yourself."
      })
    );

    grid.appendChild(scan);
    grid.appendChild(manual);
    wrap.appendChild(grid);

    /* Resume in-progress draft. */
    const draft = loadDraft();
    if (draft.items && draft.items.length > 0) {
      const resume = el("div", { class: "demo-resume" });
      resume.appendChild(
        el("p", {
          text:
            "You have an unfinished demo with " +
            draft.items.length +
            " item" +
            (draft.items.length === 1 ? "" : "s") +
            "."
        })
      );
      const row = el("div", { class: "demo-resume__row" });
      row.appendChild(
        el("a", {
          href: "#/demo/edit",
          class: "btn btn--ghost",
          text: "Resume editing"
        })
      );
      row.appendChild(
        el("button", {
          class: "btn btn--ghost btn--danger",
          type: "button",
          text: "Discard & start over",
          onClick: () => {
            if (
              confirm("Delete the in-progress demo? This can't be undone.")
            ) {
              clearDraft();
              GV.render();
            }
          }
        })
      );
      resume.appendChild(row);
      wrap.appendChild(resume);
    }

    view.appendChild(wrap);
  }

  /* --------------------- Step 2a: Scan with OCR --------------------- */

  function renderStepScan() {
    showWizardChrome();
    view.innerHTML = "";
    const wrap = el("section", { class: "demo" });
    wrap.appendChild(
      stepHeader(
        2,
        "Scan the menu",
        "Take or upload a photo. We'll OCR it and extract dishes."
      )
    );

    const card = el("div", { class: "demo-card" });
    const dropzone = el("label", { class: "demo-dropzone" });
    const input = el("input", {
      type: "file",
      accept: "image/*",
      class: "demo-dropzone__input"
    });
    dropzone.appendChild(input);

    const dzIcon = el("div", {
      class: "demo-dropzone__icon",
      text: "📷"
    });
    const dzText = el("div", {
      class: "demo-dropzone__text",
      text: "Tap to take a photo or upload"
    });
    const dzHint = el("div", {
      class: "demo-dropzone__hint",
      text:
        "Tip: clean printed menus on light backgrounds work best. Avoid glare."
    });
    dropzone.appendChild(dzIcon);
    dropzone.appendChild(dzText);
    dropzone.appendChild(dzHint);

    card.appendChild(dropzone);

    const previewBox = el("div", { class: "demo-preview", hidden: true });
    const previewImg = el("img", { class: "demo-preview__img", alt: "" });
    previewBox.appendChild(previewImg);
    card.appendChild(previewBox);

    const progressBox = el("div", {
      class: "demo-progress",
      hidden: true
    });
    const progressLabel = el("div", {
      class: "demo-progress__label",
      text: "Preparing OCR engine…"
    });
    const progressTrack = el("div", { class: "demo-progress__track" });
    const progressBar = el("div", { class: "demo-progress__bar" });
    progressTrack.appendChild(progressBar);
    progressBox.appendChild(progressLabel);
    progressBox.appendChild(progressTrack);
    card.appendChild(progressBox);

    const resultBox = el("div", { class: "demo-result", hidden: true });
    card.appendChild(resultBox);

    const actions = el("div", { class: "demo-actions" });
    const backBtn = el("a", {
      href: "#/demo",
      class: "btn btn--ghost",
      text: "Back"
    });
    const skipBtn = el("button", {
      class: "btn btn--ghost",
      type: "button",
      text: "Skip — type manually instead",
      onClick: () => GV.navigate("#/demo/edit")
    });
    actions.appendChild(backBtn);
    actions.appendChild(skipBtn);
    card.appendChild(actions);
    wrap.appendChild(card);
    view.appendChild(wrap);

    let selectedImage = null;

    input.addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const dataUrl = await fileToCompressedDataUrl(file, 1600, 0.85);
        selectedImage = dataUrl;
        previewImg.src = dataUrl;
        previewBox.hidden = false;
        dropzone.classList.add("demo-dropzone--with-preview");
        runOcr(dataUrl);
      } catch (err) {
        GV.showToast("Couldn't read that photo. Try another one.");
      }
    });

    async function runOcr(dataUrl) {
      progressBox.hidden = false;
      resultBox.hidden = true;
      progressBar.style.width = "5%";
      progressLabel.textContent = "Loading OCR engine (~10 MB, one time)…";

      try {
        const Tesseract = await loadTesseract();
        progressLabel.textContent = "Reading the menu…";
        progressBar.style.width = "20%";

        const result = await Tesseract.recognize(dataUrl, "eng+spa+por", {
          logger: (m) => {
            if (m.status === "recognizing text") {
              const pct = Math.min(95, 20 + Math.round(m.progress * 75));
              progressBar.style.width = pct + "%";
              progressLabel.textContent =
                "Reading the menu… " + Math.round(m.progress * 100) + "%";
            }
          }
        });

        progressBar.style.width = "100%";
        progressLabel.textContent = "Done.";

        const text = (result && result.data && result.data.text) || "";
        const items = parseMenuText(text);

        if (items.length === 0) {
          resultBox.innerHTML = "";
          resultBox.hidden = false;
          resultBox.appendChild(
            el("p", {
              class: "demo-result__msg",
              text:
                "We couldn't pull dishes out of this image. Try a clearer photo or add the items manually."
            })
          );
          const row = el("div", { class: "demo-actions" });
          row.appendChild(
            el("button", {
              class: "btn btn--primary",
              type: "button",
              text: "Add items manually",
              onClick: () => GV.navigate("#/demo/edit")
            })
          );
          resultBox.appendChild(row);
          return;
        }

        const draft = loadDraft();
        draft.items = items;
        saveDraft(draft);

        resultBox.innerHTML = "";
        resultBox.hidden = false;
        resultBox.appendChild(
          el("p", {
            class: "demo-result__msg demo-result__msg--ok",
            html:
              "Found <strong>" +
              items.length +
              "</strong> dish" +
              (items.length === 1 ? "" : "es") +
              ". Review and edit them next."
          })
        );
        const row = el("div", { class: "demo-actions" });
        row.appendChild(
          el("a", {
            href: "#/demo/edit",
            class: "btn btn--primary",
            text: "Continue →"
          })
        );
        resultBox.appendChild(row);
      } catch (err) {
        progressBox.hidden = true;
        resultBox.innerHTML = "";
        resultBox.hidden = false;
        resultBox.appendChild(
          el("p", {
            class: "demo-result__msg",
            text:
              "Couldn't load the OCR engine (you may be offline). Add the items manually instead."
          })
        );
        const row = el("div", { class: "demo-actions" });
        row.appendChild(
          el("button", {
            class: "btn btn--primary",
            type: "button",
            text: "Add items manually",
            onClick: () => GV.navigate("#/demo/edit")
          })
        );
        resultBox.appendChild(row);
      }
    }
  }

  /* --------------------- Step 2b: Edit items list ------------------- */

  function renderStepEdit() {
    showWizardChrome();
    view.innerHTML = "";
    const draft = loadDraft();
    const lang = draft.lang || I18N.get() || "en";

    const wrap = el("section", { class: "demo" });
    wrap.appendChild(
      stepHeader(
        2,
        "Review your dishes",
        "Edit titles, descriptions, prices and categories. Drag to reorder later."
      )
    );

    const list = el("div", { class: "demo-list" });
    wrap.appendChild(list);

    function renderRow(item, idx) {
      const row = el("div", { class: "demo-row" });
      const handle = el("div", { class: "demo-row__index", text: String(idx + 1) });
      row.appendChild(handle);

      const fields = el("div", { class: "demo-row__fields" });

      const title = el("input", {
        type: "text",
        class: "demo-input demo-input--title",
        placeholder: "Dish name",
        value: (item.title && item.title[lang]) || ""
      });
      title.addEventListener("input", () => {
        item.title = item.title || {};
        item.title[lang] = title.value;
        saveDraft(draft);
      });
      fields.appendChild(title);

      const desc = el("textarea", {
        class: "demo-input demo-input--desc",
        rows: 2,
        placeholder: "Short description (e.g. ingredients, cooking style)"
      });
      desc.value = (item.description && item.description[lang]) || "";
      desc.addEventListener("input", () => {
        item.description = item.description || {};
        item.description[lang] = desc.value;
        saveDraft(draft);
      });
      fields.appendChild(desc);

      const meta = el("div", { class: "demo-row__meta" });

      const cat = el("select", { class: "demo-input demo-input--cat" });
      ["starters", "mains", "drinks", "desserts", "specials"].forEach((c) => {
        const opt = el("option", { value: c, text: c });
        if ((item.category || "mains") === c) opt.selected = true;
        cat.appendChild(opt);
      });
      cat.addEventListener("change", () => {
        item.category = cat.value;
        saveDraft(draft);
      });
      meta.appendChild(cat);

      const priceWrap = el("div", { class: "demo-input--price-wrap" });
      const currency = el("input", {
        type: "text",
        class: "demo-input demo-input--currency",
        value: item.currency || "€",
        maxlength: 2
      });
      currency.addEventListener("input", () => {
        item.currency = currency.value || "€";
        saveDraft(draft);
      });
      const price = el("input", {
        type: "number",
        step: "0.10",
        min: "0",
        class: "demo-input demo-input--price",
        placeholder: "0.00",
        value: item.price ? String(item.price) : ""
      });
      price.addEventListener("input", () => {
        const v = parseFloat(price.value);
        item.price = isNaN(v) ? 0 : v;
        saveDraft(draft);
      });
      priceWrap.appendChild(currency);
      priceWrap.appendChild(price);
      meta.appendChild(priceWrap);

      fields.appendChild(meta);
      row.appendChild(fields);

      const remove = el("button", {
        type: "button",
        class: "demo-row__remove",
        title: "Remove item",
        "aria-label": "Remove item",
        html: GV.makeIcon("x")
      });
      remove.addEventListener("click", () => {
        if (confirm("Remove this dish?")) {
          draft.items.splice(idx, 1);
          saveDraft(draft);
          renderStepEdit();
        }
      });
      row.appendChild(remove);

      return row;
    }

    function rebuild() {
      list.innerHTML = "";
      draft.items.forEach((item, idx) => list.appendChild(renderRow(item, idx)));
    }
    rebuild();

    const addBtn = el("button", {
      type: "button",
      class: "btn btn--ghost demo-add",
      html: '<span aria-hidden="true">+</span> Add another dish',
      onClick: () => {
        draft.items.push({
          id: uid(),
          category: "mains",
          title: { [lang]: "" },
          description: { [lang]: "" },
          price: 0,
          currency: "€",
          tags: [],
          allergens: [],
          photoUrl: null
        });
        saveDraft(draft);
        rebuild();
      }
    });
    wrap.appendChild(addBtn);

    const actions = el("div", { class: "demo-actions demo-actions--sticky" });
    actions.appendChild(
      el("a", { href: "#/demo", class: "btn btn--ghost", text: "Back" })
    );
    actions.appendChild(
      el("button", {
        class: "btn btn--primary",
        type: "button",
        text: "Continue to photos →",
        onClick: () => {
          if (
            !draft.items.length ||
            draft.items.every((i) => !((i.title && i.title[lang]) || "").trim())
          ) {
            GV.showToast("Add at least one dish title.");
            return;
          }
          GV.navigate("#/demo/photos");
        }
      })
    );
    wrap.appendChild(actions);

    view.appendChild(wrap);
  }

  /* --------------------- Step 3: Photos per dish -------------------- */

  function renderStepPhotos() {
    showWizardChrome();
    view.innerHTML = "";
    const draft = loadDraft();
    const lang = draft.lang || I18N.get() || "en";

    const wrap = el("section", { class: "demo" });
    wrap.appendChild(
      stepHeader(
        3,
        "Add a photo for each dish",
        "Snap or upload one photo per dish. We'll polish it with a Pro filter."
      )
    );

    const grid = el("div", { class: "demo-photos" });
    wrap.appendChild(grid);

    function renderTile(item, idx) {
      const tile = el("div", { class: "demo-photo" });
      const previewWrap = el("div", { class: "demo-photo__preview" });
      if (item.photoUrl) {
        const img = el("img", {
          class:
            "demo-photo__img" +
            (item.photoFilter !== "none" ? " demo-photo__img--pro" : ""),
          src: item.photoUrl
        });
        previewWrap.appendChild(img);
      } else {
        previewWrap.appendChild(el("div", { class: "demo-photo__empty", text: "📷" }));
      }
      tile.appendChild(previewWrap);

      const title = el("h3", {
        class: "demo-photo__title",
        text: (item.title && item.title[lang]) || "Untitled"
      });
      tile.appendChild(title);

      const actions = el("div", { class: "demo-photo__actions" });

      const fileLabel = el("label", {
        class: "btn btn--ghost demo-photo__upload",
        text: item.photoUrl ? "Replace photo" : "+ Add photo"
      });
      const fileInput = el("input", {
        type: "file",
        accept: "image/*",
        hidden: true
      });
      fileInput.addEventListener("change", async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        try {
          fileLabel.textContent = "Processing…";
          const dataUrl = await fileToCompressedDataUrl(
            file,
            PHOTO_FOR_URL_MAX_DIM,
            PHOTO_FOR_URL_QUALITY
          );
          item.photoUrl = dataUrl;
          if (!item.photoFilter) item.photoFilter = "pro";
          saveDraft(draft);
          renderStepPhotos();
        } catch (err) {
          GV.showToast("Couldn't read that photo.");
          fileLabel.textContent = "+ Add photo";
        }
      });
      fileLabel.appendChild(fileInput);
      actions.appendChild(fileLabel);

      if (item.photoUrl) {
        const filterToggle = el("button", {
          type: "button",
          class:
            "btn btn--ghost demo-photo__toggle" +
            (item.photoFilter !== "none" ? " is-on" : ""),
          text: item.photoFilter !== "none" ? "Pro filter: on" : "Pro filter: off",
          onClick: () => {
            item.photoFilter = item.photoFilter === "none" ? "pro" : "none";
            saveDraft(draft);
            renderStepPhotos();
          }
        });
        actions.appendChild(filterToggle);
      }

      tile.appendChild(actions);
      return tile;
    }

    draft.items.forEach((it, idx) => grid.appendChild(renderTile(it, idx)));

    const skipNote = el("p", {
      class: "demo-skip-note",
      text:
        "You can skip photos for any dish — it'll fall back to a stylish category placeholder."
    });
    wrap.appendChild(skipNote);

    const actions = el("div", { class: "demo-actions demo-actions--sticky" });
    actions.appendChild(
      el("a", {
        href: "#/demo/edit",
        class: "btn btn--ghost",
        text: "Back"
      })
    );
    actions.appendChild(
      el("button", {
        class: "btn btn--primary",
        type: "button",
        text: "Continue →",
        onClick: () => GV.navigate("#/demo/launch")
      })
    );
    wrap.appendChild(actions);
    view.appendChild(wrap);
  }

  /* --------------------- Step 4: Launch + QR ------------------------ */

  function renderStepLaunch() {
    showWizardChrome();
    view.innerHTML = "";
    const draft = loadDraft();

    const wrap = el("section", { class: "demo" });
    wrap.appendChild(
      stepHeader(
        4,
        "Launch the demo",
        "Name the restaurant, then publish a live link + QR for the owner."
      )
    );

    const form = el("div", { class: "demo-card demo-card--launch" });

    const nameLabel = el("label", { class: "demo-field" });
    nameLabel.appendChild(el("span", { class: "demo-field__label", text: "Restaurant name" }));
    const nameInput = el("input", {
      type: "text",
      class: "demo-input",
      placeholder: "e.g. Bar Manolo",
      value: draft.restaurant.name || ""
    });
    nameInput.addEventListener("input", () => {
      draft.restaurant.name = nameInput.value;
      saveDraft(draft);
    });
    nameLabel.appendChild(nameInput);
    form.appendChild(nameLabel);

    const taglineLabel = el("label", { class: "demo-field" });
    taglineLabel.appendChild(
      el("span", { class: "demo-field__label", text: "Tagline (optional)" })
    );
    const taglineInput = el("input", {
      type: "text",
      class: "demo-input",
      placeholder: "e.g. Tapas with a modern twist",
      value: draft.restaurant.tagline || ""
    });
    taglineInput.addEventListener("input", () => {
      draft.restaurant.tagline = taglineInput.value;
      saveDraft(draft);
    });
    taglineLabel.appendChild(taglineInput);
    form.appendChild(taglineLabel);

    const summary = el("div", { class: "demo-summary" });
    const itemsWithPhotos = draft.items.filter((i) => i.photoUrl).length;
    summary.innerHTML =
      "<span><strong>" +
      draft.items.length +
      "</strong> dishes</span>" +
      "<span><strong>" +
      itemsWithPhotos +
      "</strong> with photos</span>";
    form.appendChild(summary);

    const launchBtn = el("button", {
      type: "button",
      class: "btn btn--primary btn--big",
      text: "✨ Generate live demo"
    });
    form.appendChild(launchBtn);

    const result = el("div", { class: "demo-launch-result", hidden: true });
    form.appendChild(result);

    launchBtn.addEventListener("click", async () => {
      if (!draft.restaurant.name.trim()) {
        GV.showToast("Give the restaurant a name first.");
        nameInput.focus();
        return;
      }
      launchBtn.disabled = true;
      launchBtn.textContent = "Publishing…";

      try {
        const published = await publishDemo(draft);

        /* Record it. */
        const list = GV.loadJson(STORAGE_PUBLISHED, []);
        list.unshift({
          id: uid(),
          mode: published.mode,
          name: draft.restaurant.name,
          url: published.url,
          createdAt: Date.now()
        });
        GV.saveJson(STORAGE_PUBLISHED, list.slice(0, 10));

        await renderQrInto(result, published);
        result.hidden = false;
        launchBtn.style.display = "none";
      } catch (err) {
        GV.showToast("Something went wrong publishing the demo.");
        launchBtn.disabled = false;
        launchBtn.textContent = "✨ Generate live demo";
      }
    });

    wrap.appendChild(form);

    const actions = el("div", { class: "demo-actions demo-actions--sticky" });
    actions.appendChild(
      el("a", {
        href: "#/demo/photos",
        class: "btn btn--ghost",
        text: "Back"
      })
    );
    actions.appendChild(
      el("button", {
        type: "button",
        class: "btn btn--ghost btn--danger",
        text: "Reset everything",
        onClick: () => {
          if (
            confirm(
              "Reset the demo and start over? Photos and dishes will be deleted."
            )
          ) {
            clearDraft();
            GV.navigate("#/demo");
          }
        }
      })
    );
    wrap.appendChild(actions);
    view.appendChild(wrap);
  }

  async function renderQrInto(container, published) {
    container.innerHTML = "";

    const banner = el("div", {
      class:
        "demo-launch-banner" +
        (published.mode === "url"
          ? " demo-launch-banner--ok"
          : " demo-launch-banner--local")
    });
    banner.innerHTML =
      published.mode === "url"
        ? published.photosStrippedForUrl
          ? "<strong>Live!</strong> This QR opens the full menu on any phone. Photos were left out so the link fits in the code — add them again on the owner's device if you want."
          : "<strong>Live!</strong> Anyone can scan this QR to open your demo on any phone."
        : "<strong>Demo ready.</strong> The menu is too big for a cross-device QR. Hand the device to the owner, or remove some photos to enable cross-device sharing.";
    container.appendChild(banner);

    if (published.mode === "url" && published.photosReducedNote && !published.photosStrippedForUrl) {
      container.appendChild(
        el("p", {
          class: "demo-launch-banner-note",
          text: published.photosReducedNote
        })
      );
    }

    const qrWrap = el("div", { class: "demo-qr" });
    const canvas = el("canvas", { class: "demo-qr__canvas" });
    qrWrap.appendChild(canvas);
    container.appendChild(qrWrap);

    try {
      const QRious = await loadQRious();
      new QRious({
        element: canvas,
        value: published.url,
        size: 320,
        background: "#ffffff",
        foreground: "#062927",
        level: "M",
        padding: 12
      });
    } catch (_) {
      qrWrap.appendChild(
        el("p", {
          class: "demo-qr__error",
          text: "Couldn't render the QR (offline). Use the link below."
        })
      );
    }

    const linkRow = el("div", { class: "demo-link" });
    const linkInput = el("input", {
      type: "text",
      class: "demo-input demo-link__input",
      readonly: "",
      value: published.url
    });
    linkInput.addEventListener("focus", () => linkInput.select());
    const copyBtn = el("button", {
      type: "button",
      class: "btn btn--ghost",
      text: "Copy"
    });
    copyBtn.addEventListener("click", () => {
      try {
        navigator.clipboard.writeText(published.url);
        GV.showToast("Link copied.");
      } catch (_) {
        linkInput.select();
        document.execCommand("copy");
        GV.showToast("Link copied.");
      }
    });
    linkRow.appendChild(linkInput);
    linkRow.appendChild(copyBtn);
    container.appendChild(linkRow);

    const cta = el("div", { class: "demo-actions" });
    cta.appendChild(
      el("a", {
        href: published.url,
        target: "_blank",
        rel: "noopener",
        class: "btn btn--primary",
        text: "Open the demo →"
      })
    );
    cta.appendChild(
      el("button", {
        type: "button",
        class: "btn btn--ghost btn--danger",
        text: "Reset & start over",
        onClick: () => {
          if (
            confirm("Discard the current draft and start a new demo?")
          ) {
            clearDraft();
            GV.navigate("#/demo");
          }
        }
      })
    );
    container.appendChild(cta);

    const sizeNote = el("p", {
      class: "demo-launch-size",
      text:
        "URL size: " +
        (published.size / 1024).toFixed(1) +
        " KB · " +
        (published.mode === "url" ? "encoded inline" : "stored on this device")
    });
    container.appendChild(sizeNote);
  }

  /* --------------------------- Route hook --------------------------- */

  GV._routeHooks.push(function (parts /*, hash */) {
    if (parts[0] !== "demo") return false;
    /* All demo routes hide the regular tab bar via showWizardChrome().
     * The viewer (#/demo/v) is the only one that *re-enables* it because
     * it acts like a normal app session for the demo restaurant. */

    if (parts.length === 1) {
      renderStep1();
      return true;
    }
    /* Strip query strings from sub so #/demo/v?d=… still matches "v". */
    const sub = (parts[1] || "").split("?")[0];
    if (sub === "scan") {
      renderStepScan();
      return true;
    }
    if (sub === "edit") {
      renderStepEdit();
      return true;
    }
    if (sub === "photos") {
      renderStepPhotos();
      return true;
    }
    if (sub === "launch") {
      renderStepLaunch();
      return true;
    }
    if (sub === "v") {
      hideWizardChrome();
      /* Pass cleaned parts so loadPublishedFromHash can read the
       * trailing local-id without the query string attached. */
      const cleanParts = parts.slice();
      if (cleanParts[1]) cleanParts[1] = cleanParts[1].split("?")[0];
      if (cleanParts[2]) cleanParts[2] = cleanParts[2].split("?")[0];
      loadPublishedFromHash(cleanParts);
      return true;
    }
    /* Unknown demo subroute → step 1. */
    renderStep1();
    return true;
  });

  /* While in viewer mode the user CAN navigate freely between
   * #/menu, #/video, #/cart, etc. (the demo restaurant's own pages).
   * Exiting demo mode is explicit: an overlay pill (rendered below)
   * lets the salesperson reset back to the original GastoVision app.
   *
   * We render the pill once on boot. CSS shows it only when the
   * `gv-demo-mode` body class is on. */
  function ensureExitPill() {
    if (document.getElementById("gvDemoExit")) return;
    const pill = document.createElement("a");
    pill.id = "gvDemoExit";
    pill.href = "#/";
    pill.className = "demo-exit-pill";
    pill.textContent = "↩ Exit demo";
    pill.addEventListener("click", (e) => {
      e.preventDefault();
      document.body.classList.remove("gv-demo-mode");
      GV.resetData();
      GV.navigate("#/");
    });
    document.body.appendChild(pill);
  }
  ensureExitPill();

  /* Expose a tiny API for tests / future buttons. */
  window.GV.demo = {
    loadDraft,
    saveDraft,
    clearDraft,
    publishDemo,
    parseMenuText
  };
})();
