/* GastoVision app
 *
 * Tiny hash router + view renderers. No build step. Vanilla JS so it ships
 * cleanly to GitHub Pages.
 */
(function () {
  const I18N = window.I18N;
  const DATA = window.GV_DATA;

  /* ----------------------------- State ------------------------------- */

  const STATE = {
    favorites: loadJson("gv.favorites", []),
    cart: loadJson("gv.cart", []),
    feedback: { rating: null, dishes: [], note: "", recommend: null }
  };

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }
  function saveJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  function toggleFavorite(id) {
    const i = STATE.favorites.indexOf(id);
    if (i === -1) STATE.favorites.push(id);
    else STATE.favorites.splice(i, 1);
    saveJson("gv.favorites", STATE.favorites);
    updateCartCount();
  }
  function isFavorite(id) {
    return STATE.favorites.indexOf(id) !== -1;
  }
  function addToCart(id) {
    const existing = STATE.cart.find((c) => c.id === id);
    if (existing) existing.qty += 1;
    else STATE.cart.push({ id, qty: 1 });
    saveJson("gv.cart", STATE.cart);
    updateCartCount();
  }
  function removeFromCart(id) {
    STATE.cart = STATE.cart.filter((c) => c.id !== id);
    saveJson("gv.cart", STATE.cart);
    updateCartCount();
  }
  function setQty(id, qty) {
    const item = STATE.cart.find((c) => c.id === id);
    if (!item) return;
    item.qty = Math.max(1, qty);
    saveJson("gv.cart", STATE.cart);
    updateCartCount();
  }
  function clearCart() {
    STATE.cart = [];
    saveJson("gv.cart", STATE.cart);
    updateCartCount();
  }

  function updateCartCount() {
    const el = document.getElementById("cartCount");
    if (!el) return;
    const total = STATE.cart.reduce((s, c) => s + c.qty, 0);
    if (total > 0) {
      el.textContent = total;
      el.hidden = false;
    } else {
      el.hidden = true;
    }
  }

  /* ----------------------------- Helpers ----------------------------- */

  const view = document.getElementById("view");
  const tabbar = document.getElementById("tabbar");

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((k) => {
        const v = attrs[k];
        if (v === false || v == null) return;
        if (k === "class") node.className = v;
        else if (k === "html") node.innerHTML = v;
        else if (k === "text") node.textContent = v;
        else if (k.startsWith("on") && typeof v === "function")
          node.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === "dataset")
          Object.keys(v).forEach((dk) => (node.dataset[dk] = v[dk]));
        else if (k in node && typeof v !== "object") node[k] = v;
        else node.setAttribute(k, v);
      });
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach((c) => {
        if (c == null || c === false) return;
        node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      });
    }
    return node;
  }

  function getName(item) {
    return item.name[I18N.get()] || item.name.en;
  }
  function getDescription(item) {
    return item.description[I18N.get()] || item.description.en;
  }
  function getCategoryLabel(catId) {
    return I18N.t("welcome.cards." + catId) || catId;
  }
  function getLocalizedField(obj, fallback) {
    if (!obj) return fallback || "";
    if (typeof obj === "string") return obj;
    return obj[I18N.get()] || obj.en || fallback || "";
  }
  function formatPrice(item) {
    const price = item.price.toFixed(2).replace(".", I18N.get() === "en" ? "." : ",");
    return item.currency + price;
  }

  function showToast(message) {
    const t = document.getElementById("toast");
    t.textContent = message;
    t.hidden = false;
    t.classList.add("toast--show");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
      t.classList.remove("toast--show");
      setTimeout(() => (t.hidden = true), 250);
    }, 1800);
  }

  /* ------------------------ Reusable components ---------------------- */

  function makeIcon(name) {
    const paths = {
      heart:
        '<path fill="currentColor" d="M12 21s-7.5-4.6-9.7-9.1C.6 8.2 2.6 4 6.4 4c2 0 3.6 1 4.6 2.6h2c1-1.6 2.6-2.6 4.6-2.6 3.8 0 5.8 4.2 4 7.9C19.5 16.4 12 21 12 21Z"/>',
      heartLine:
        '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M12 20.5s-7-4.4-9.1-8.4c-1.6-3 .1-6.6 3.5-6.6 1.7 0 3.3.9 4.2 2.4h2.8c.9-1.5 2.5-2.4 4.2-2.4 3.4 0 5.1 3.6 3.5 6.6C19 16.1 12 20.5 12 20.5Z"/>',
      info:
        '<path fill="currentColor" d="M12 2a10 10 0 100 20 10 10 0 000-20Zm0 5a1.5 1.5 0 110 3 1.5 1.5 0 010-3Zm1.3 11h-2.6V11h2.6v7Z"/>',
      play: '<path fill="currentColor" d="M8 5v14l11-7Z"/>',
      back:
        '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M15 6l-6 6 6 6"/>',
      check:
        '<path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M5 12l5 5 9-10"/>',
      sparkle:
        '<path fill="currentColor" d="M12 2l1.7 4.3L18 8l-4.3 1.7L12 14l-1.7-4.3L6 8l4.3-1.7L12 2Zm6 11l1 2.5L21.5 17 19 18l-1 2.5L17 18l-2.5-1 2.5-1 1-2.5Z"/>',
      x: '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/>'
    };
    return `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">${paths[name]}</svg>`;
  }

  /* Resolves the image and (optional) video for a dish.
   *
   * Photo: assets/img/dishes/<id>.jpg (AI-generated, custom-shot per dish).
   * Video: assets/videos/<id>.mp4. If you drop a real Veo/Runway clip in
   *        that folder named after the dish id, the play button uses it.
   *        Otherwise, "play" triggers a cinematic Ken Burns pan/zoom on
   *        the photo so the experience is always on-topic.
   */
  const BUILTIN_DISH_IDS = new Set(
    (window.GV_DATA && window.GV_DATA.items ? window.GV_DATA.items : []).map((d) => d.id)
  );

  function getPhotoUrl(item) {
    /* Demo dishes ship their own user-uploaded photo as a data URL or a
     * remote http(s) URL — use it directly. Otherwise fall back to the
     * built-in cinematic AI photo for the original 11 items only. */
    if (item.photoUrl) return item.photoUrl;
    if (!BUILTIN_DISH_IDS.has(item.id)) return null;
    return "assets/img/dishes/" + item.id + ".jpg";
  }
  function getVideoUrl(item) {
    return "assets/videos/" + item.id + ".mp4";
  }

  function videoOrImage(item, opts) {
    opts = opts || {};
    const wrap = el("div", { class: "media" + (opts.tall ? " media--tall" : "") });

    /* Coloured gradient + category emoji as a last-resort fallback if the
     * dish photo itself fails to load. */
    const cat = (DATA.categories.find((c) => c.id === item.category) || {}).icon || "🍽";
    const fallback = el("div", {
      class: "media__fallback",
      "data-cat": item.category,
      html: '<span class="media__fallback-emoji">' + cat + "</span>"
    });
    wrap.appendChild(fallback);

    const photoSrc = getPhotoUrl(item);
    if (photoSrc) {
      const img = el("img", {
        class: "media__img",
        src: photoSrc,
        alt: getName(item),
        loading: "lazy"
      });
      img.addEventListener("error", () => img.classList.add("media__img--failed"));
      wrap.appendChild(img);
    }

    /* Play button — always shown. Tries to load a real MP4 once; if it 404s,
     * we silently switch this dish into Ken Burns mode for the rest of the
     * session. */
    const playBtn = el("button", {
      class: "media__play",
      type: "button",
      "aria-label": "Play video",
      html: makeIcon("play")
    });
    wrap.appendChild(playBtn);

    /* Per-card state: 'unknown' | 'video' | 'kenburns', plus optional <video>. */
    let mode = "unknown";
    let video = null;

    function startKenBurns() {
      mode = "kenburns";
      wrap.classList.add("media--playing", "media--kenburns");
    }
    function stopKenBurns() {
      wrap.classList.remove("media--playing");
    }

    playBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (mode === "kenburns") {
        wrap.classList.toggle("media--playing");
        return;
      }

      if (mode === "video") {
        if (video.paused) {
          video.play().catch(startKenBurns);
          wrap.classList.add("media--playing");
        } else {
          video.pause();
          wrap.classList.remove("media--playing");
        }
        return;
      }

      /* mode === "unknown": first interaction. Try a real MP4. */
      video = el("video", {
        class: "media__video",
        src: getVideoUrl(item),
        playsinline: "",
        muted: true,
        loop: true,
        preload: "metadata"
      });
      let resolved = false;
      const onReady = () => {
        if (resolved) return;
        resolved = true;
        mode = "video";
        wrap.appendChild(video);
        video.play().catch(startKenBurns);
        wrap.classList.add("media--playing");
      };
      const onFail = () => {
        if (resolved) return;
        resolved = true;
        video = null;
        startKenBurns();
      };
      video.addEventListener("loadeddata", onReady, { once: true });
      video.addEventListener("error", onFail, { once: true });
      /* Safety net for browsers that never fire either event in time. */
      setTimeout(() => !resolved && onFail(), 1500);
    });

    return wrap;
  }

  function itemCard(item) {
    const card = el("article", { class: "card", dataset: { id: item.id } });

    card.appendChild(videoOrImage(item));

    const body = el("div", { class: "card__body" });
    const top = el("div", { class: "card__top" });

    const titleRow = el("div", { class: "card__titlerow" }, [
      el("h3", { class: "card__title", text: getName(item) }),
      el("span", { class: "card__price", text: formatPrice(item) })
    ]);
    top.appendChild(titleRow);

    if (item.tags && item.tags.length) {
      const tags = el("div", { class: "card__tags" });
      item.tags.forEach((t) => {
        const label =
          (DATA.tagLabels[t] && (DATA.tagLabels[t][I18N.get()] || DATA.tagLabels[t].en)) || t;
        tags.appendChild(el("span", { class: "tag tag--" + t, text: label }));
      });
      top.appendChild(tags);
    }

    top.appendChild(
      el("p", { class: "card__desc", text: getDescription(item) })
    );

    body.appendChild(top);

    /* Actions row: heart, info, add */
    const actions = el("div", { class: "card__actions" });

    const fav = el("button", {
      class: "iconbtn" + (isFavorite(item.id) ? " iconbtn--active" : ""),
      type: "button",
      "aria-label": I18N.t("menu.favorite"),
      html: makeIcon(isFavorite(item.id) ? "heart" : "heartLine")
    });
    fav.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFavorite(item.id);
      fav.classList.toggle("iconbtn--active");
      fav.innerHTML = makeIcon(isFavorite(item.id) ? "heart" : "heartLine");
      // Tiny pop animation
      fav.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.25)" },
          { transform: "scale(1)" }
        ],
        { duration: 280, easing: "ease-out" }
      );
    });
    actions.appendChild(fav);

    const info = el("button", {
      class: "iconbtn",
      type: "button",
      "aria-label": "Info",
      html: makeIcon("info")
    });
    info.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      location.hash = "#/item/" + item.id;
    });
    actions.appendChild(info);

    const addBtn = el("button", {
      class: "btn btn--pill",
      type: "button",
      text: I18N.t("menu.add")
    });
    addBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      addToCart(item.id);
      const original = addBtn.textContent;
      addBtn.textContent = "✓ " + I18N.t("menu.added");
      addBtn.classList.add("btn--success");
      setTimeout(() => {
        addBtn.textContent = original;
        addBtn.classList.remove("btn--success");
      }, 1100);
    });
    actions.appendChild(addBtn);

    body.appendChild(actions);
    card.appendChild(body);

    card.addEventListener("click", () => (location.hash = "#/item/" + item.id));
    return card;
  }

  /* ------------------------------ Views ------------------------------ */

  /* Fallback if an old cached i18n.js loads without gateway.* keys. */
  const GATEWAY_COPY = {
    en: {
      tagline: "Scan · See · Crave",
      title: "Video menus\nthat sell themselves.",
      intro:
        "GastoVision turns your menu into a mobile experience guests actually use. Pick one of the cards below and test it yourself — as a diner, as a sales demo, or as the restaurant admin.",
      tryHeading: "Try it yourself",
      scrollHint: "Swipe to explore",
      pricing: {
        cta: "Chat on WhatsApp",
        trial: {
          badge: "Starter",
          price: "Free demo · 30 days",
          desc: "Build your branded menu, share a live link, and show it to guests."
        },
        pro: {
          badge: "Restaurant",
          price: "€99 / month",
          desc: "Full platform, unlimited updates, and priority support for your venue."
        }
      },
      benefits: [
        {
          icon: "🎬",
          title: "Video-first menus",
          text: "Guests see real dishes — not flat PDFs."
        },
        {
          icon: "📈",
          title: "Higher sales",
          text: "Visual menus drive upsells and confidence at the table."
        },
        {
          icon: "🔄",
          title: "One update, every QR",
          text: "Change your menu once; all tables stay in sync."
        },
        {
          icon: "💬",
          title: "Guest engagement",
          text: "Favourites, sharing, and feedback built in."
        }
      ],
      paths: {
        guest: { title: "Guest", text: "Browse the sample restaurant menu." },
        demo: { title: "Demo", text: "Build a branded sample menu in minutes." },
        owner: { title: "Admin", text: "Sign in to manage your restaurant." }
      }
    },
    es: {
      tagline: "Escanea · Ve · Pide",
      title: "Cartas en vídeo\nque venden solas.",
      intro:
        "GastoVision convierte tu carta en una experiencia móvil que el cliente usa de verdad. Elige una tarjeta y pruébala tú mismo — como comensal, demo comercial o admin del local.",
      tryHeading: "Pruébalo tú mismo",
      scrollHint: "Desliza para ver más",
      pricing: {
        cta: "Hablar por WhatsApp",
        trial: {
          badge: "Inicio",
          price: "Demo gratis · 30 días",
          desc: "Crea tu carta con tu marca, comparte un enlace en vivo y muéstralo a tus clientes."
        },
        pro: {
          badge: "Restaurante",
          price: "99 € / mes",
          desc: "Plataforma completa, actualizaciones ilimitadas y soporte prioritario."
        }
      },
      benefits: [
        {
          icon: "🎬",
          title: "Cartas en vídeo",
          text: "Platos reales en pantalla — no PDFs planos."
        },
        {
          icon: "📈",
          title: "Más ventas",
          text: "La carta visual impulsa el ticket y la confianza."
        },
        {
          icon: "🔄",
          title: "Una carta, todos los QR",
          text: "Actualizas una vez; todas las mesas al día."
        },
        {
          icon: "💬",
          title: "Engagement",
          text: "Favoritos, compartir y feedback integrados."
        }
      ],
      paths: {
        guest: { title: "Usuario", text: "Explora el menú de muestra del restaurante." },
        demo: { title: "Demo", text: "Crea una carta de muestra con tu marca." },
        owner: { title: "Admin", text: "Inicia sesión para gestionar tu local." }
      }
    }
  };

  function gatewayGet(path) {
    const raw = I18N.t(path);
    const miss =
      raw == null ||
      raw === path ||
      (typeof raw === "string" && /^gateway\./.test(raw));
    if (!miss) return raw;

    const lang = I18N.get() || "en";
    const dict = GATEWAY_COPY[lang] || GATEWAY_COPY.en;
    const node = path.replace(/^gateway\./, "").split(".").reduce(function (acc, key) {
      return acc && acc[key] !== undefined ? acc[key] : null;
    }, dict);
    return node != null ? node : raw;
  }

  function gatewayBenefits() {
    const items = gatewayGet("gateway.benefits");
    return Array.isArray(items) ? items : GATEWAY_COPY.en.benefits;
  }

  const GATEWAY_HERO_IMAGE = "assets/img/gateway/guest.png";
  const WHATSAPP_SALES_URL = "https://wa.me/3465649853";

  function gatewayPricingPlan(which) {
    const prefix = "gateway.pricing." + which + ".";
    return {
      badge: gatewayGet(prefix + "badge"),
      price: gatewayGet(prefix + "price"),
      desc: gatewayGet(prefix + "desc")
    };
  }

  function appendGatewayBenefits(parent) {
    const grid = el("div", { class: "gateway-benefits" });
    gatewayBenefits().forEach(function (b, i) {
      const card = el("div", {
        class: "gateway-benefit-card",
        style: "animation-delay:" + (180 + i * 60) + "ms"
      });
      card.appendChild(el("span", { class: "gateway-benefit-card__icon", text: b.icon || "✓" }));
      if (b.title) {
        card.appendChild(el("h3", { class: "gateway-benefit-card__title", text: b.title }));
        card.appendChild(el("p", { class: "gateway-benefit-card__text", text: b.text || "" }));
      } else {
        card.appendChild(el("p", { class: "gateway-benefit-card__text", text: b.text || "" }));
      }
      grid.appendChild(card);
    });
    parent.appendChild(grid);
  }

  function appendGatewayPricing(parent) {
    const wrap = el("div", { class: "gateway-pricing" });
    ["trial", "pro"].forEach(function (which) {
      const plan = gatewayPricingPlan(which);
      const card = el("div", {
        class: "gateway-price-card" + (which === "pro" ? " gateway-price-card--featured" : "")
      });
      card.appendChild(el("span", { class: "gateway-price-card__badge", text: plan.badge }));
      card.appendChild(el("p", { class: "gateway-price-card__price", text: plan.price }));
      card.appendChild(el("p", { class: "gateway-price-card__desc", text: plan.desc }));
      const cta = el("a", {
        class: "btn btn--primary gateway-price-card__cta",
        href: WHATSAPP_SALES_URL,
        target: "_blank",
        rel: "noopener noreferrer",
        text: gatewayGet("gateway.pricing.cta")
      });
      card.appendChild(cta);
      wrap.appendChild(card);
    });
    parent.appendChild(wrap);
  }

  function ensureWhatsAppFab() {
    let fab = document.getElementById("whatsappFab");
    if (!fab) {
      fab = document.createElement("a");
      fab.id = "whatsappFab";
      fab.className = "whatsapp-fab";
      fab.href = WHATSAPP_SALES_URL;
      fab.target = "_blank";
      fab.rel = "noopener noreferrer";
      fab.setAttribute("aria-label", "WhatsApp");
      fab.innerHTML =
        '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
      document.body.appendChild(fab);
    }
    fab.href = WHATSAPP_SALES_URL;
  }

  function syncWhatsAppFab() {
    ensureWhatsAppFab();
    const fab = document.getElementById("whatsappFab");
    if (fab) fab.hidden = !document.body.classList.contains("body--gateway");
  }
  const GUEST_MODE_KEY = "gv.guestMode";
  const GUEST_APP_SEGMENTS = ["menu", "item", "cart", "favorites", "video", "feedback"];

  function isGuestMode() {
    return (
      document.body.classList.contains("gv-guest-mode") ||
      sessionStorage.getItem(GUEST_MODE_KEY) === "1"
    );
  }

  function resetMenuDataSilent() {
    Object.keys(DATA).forEach((k) => delete DATA[k]);
    Object.assign(DATA, JSON.parse(JSON.stringify(ORIGINAL_DATA)));
    const ownerSaved = loadJson("gv.owner.editedData", null);
    if (ownerSaved && Array.isArray(ownerSaved.items)) {
      Object.assign(DATA, ownerSaved);
    }
  }

  function enterGuestMode(options) {
    const reset = !options || options.reset !== false;
    sessionStorage.setItem(GUEST_MODE_KEY, "1");
    document.body.classList.add("gv-guest-mode");
    document.body.classList.remove("gv-demo-mode");
    document.body.classList.remove("body--gateway");
    if (reset) resetMenuDataSilent();
    if (window.GV && window.GV.demo && typeof window.GV.demo.resetTheme === "function") {
      window.GV.demo.resetTheme();
    }
  }

  function exitGuestMode() {
    sessionStorage.removeItem(GUEST_MODE_KEY);
    document.body.classList.remove("gv-guest-mode");
  }

  /* From portal, #/guest resets sample data then lands on production home #/. */
  const GATEWAY_PATH_CARDS = [
    {
      id: "guest",
      href: "#/guest",
      icon: "🍽",
      image: "assets/img/gateway/guest.png",
      titleKey: "gateway.paths.guest.title"
    },
    {
      id: "demo",
      href: "#/demo/setup",
      icon: "✨",
      image: "assets/img/gateway/demo.png",
      titleKey: "gateway.paths.demo.title",
      highlight: true
    },
    {
      id: "owner",
      href: "#/owner/login",
      icon: "🏪",
      image: "assets/img/gateway/admin.png",
      titleKey: "gateway.paths.owner.title"
    }
  ];

  /* Product home — welcome-style hero + three path cards (guest / demo / admin). */
  function renderHomeGateway() {
    exitGuestMode();
    document.body.classList.add("body--gateway");
    document.body.classList.remove("body--welcome");
    document.body.classList.remove("gv-demo-mode");
    tabbar.classList.add("tabbar--hidden");
    if (window.GV && window.GV.demo && typeof window.GV.demo.resetTheme === "function") {
      window.GV.demo.resetTheme();
    }

    const wrap = el("section", { class: "welcome welcome--gateway" });
    const hero = el("div", { class: "welcome__hero" });
    hero.appendChild(
      el("div", {
        class: "welcome__bg",
        style: "background-image:url('" + GATEWAY_HERO_IMAGE + "')"
      })
    );
    hero.appendChild(el("div", { class: "welcome__bg-overlay" }));

    const content = el("div", { class: "welcome__content" });
    content.appendChild(
      el("p", { class: "welcome__kicker", text: gatewayGet("gateway.tagline") })
    );

    const titleText = String(gatewayGet("gateway.title") || "");
    const titleEl = el("h1", { class: "welcome__title" });
    titleText.split("\n").forEach((line, i) => {
      const span = el("span", { class: "welcome__title-line", text: line });
      span.style.animationDelay = 120 + i * 90 + "ms";
      titleEl.appendChild(span);
    });
    content.appendChild(titleEl);

    appendGatewayBenefits(content);
    content.appendChild(
      el("p", { class: "gateway-intro", text: gatewayGet("gateway.intro") })
    );
    appendGatewayPricing(content);
    content.appendChild(
      el("h2", { class: "gateway-try-heading", text: gatewayGet("gateway.tryHeading") })
    );

    const carousel = el("div", { class: "carousel" });
    const track = el("div", { class: "carousel__track" });
    GATEWAY_PATH_CARDS.forEach((card, i) => {
      const link = el("a", {
        class: "wcard" + (card.highlight ? " wcard--highlight" : ""),
        href: card.href,
        style: "animation-delay:" + (240 + i * 70) + "ms"
      });
      link.appendChild(
        el("div", {
          class: "wcard__bg",
          style: "background-image:url('" + card.image + "')"
        })
      );
      link.appendChild(el("div", { class: "wcard__shade" }));
      link.appendChild(el("span", { class: "wcard__icon", text: card.icon }));
      link.appendChild(
        el("h3", { class: "wcard__title", text: gatewayGet(card.titleKey) })
      );
      track.appendChild(link);
    });
    carousel.appendChild(track);
    content.appendChild(carousel);
    content.appendChild(
      el("p", { class: "welcome__hint", text: gatewayGet("gateway.scrollHint") })
    );
    wrap.appendChild(hero);
    wrap.appendChild(content);
    view.replaceChildren(wrap);
    syncWhatsAppFab();
  }

  function categoryCardImage(catId) {
    const item = (DATA.items || []).find((it) => it.category === catId);
    const url = item ? getPhotoUrl(item) : null;
    if (url) return url;
    const stock = {
      starters: "assets/img/dishes/ham-croquettes.jpg",
      mains: "assets/img/dishes/prosciutto-pizza.jpg",
      drinks: "assets/img/dishes/smoked-old-fashioned.jpg",
      desserts: "assets/img/dishes/burnt-cheesecake.jpg",
      specials: "assets/img/dishes/mole-tasting.jpg"
    };
    return stock[catId] || "";
  }

  function buildWelcomeView(opts) {
    const isDemo = opts && opts.demo;
    const wrap = el("section", { class: "welcome" });
    const hero = el("div", { class: "welcome__hero" });
    const heroUrl =
      (DATA.restaurant && DATA.restaurant.hero) || categoryCardImage("mains");
    if (heroUrl) {
      hero.appendChild(
        el("div", {
          class: "welcome__bg",
          style: "background-image:url('" + heroUrl + "')"
        })
      );
    }
    hero.appendChild(el("div", { class: "welcome__bg-overlay" }));

    const content = el("div", { class: "welcome__content" });

    const restName =
      (DATA.restaurant && DATA.restaurant.name) || "Restaurant";
    const restTagline = getLocalizedField(
      DATA.restaurant && DATA.restaurant.tagline,
      ""
    );

    if (isDemo) {
      content.appendChild(el("p", { class: "welcome__kicker", text: restName }));
      const demoTitle = restTagline || restName;
      const titleEl = el("h1", { class: "welcome__title" });
      demoTitle.split("\n").forEach((line, i) => {
        const span = el("span", { class: "welcome__title-line", text: line });
        span.style.animationDelay = 120 + i * 90 + "ms";
        titleEl.appendChild(span);
      });
      content.appendChild(titleEl);
    } else {
      content.appendChild(
        el("p", { class: "welcome__kicker", text: I18N.t("welcome.kicker") })
      );
      const titleText = I18N.t("welcome.title");
      const titleEl = el("h1", { class: "welcome__title" });
      titleText.split("\n").forEach((line, i) => {
        const span = el("span", { class: "welcome__title-line", text: line });
        span.style.animationDelay = 120 + i * 90 + "ms";
        titleEl.appendChild(span);
      });
      content.appendChild(titleEl);
    }

    content.appendChild(
      el("p", { class: "welcome__sub", text: I18N.t("welcome.subtitle") })
    );

    /* Category cards carousel */
    const carousel = el("div", { class: "carousel" });
    const track = el("div", { class: "carousel__track" });

    /* One representative AI dish photo per category for the welcome cards. */
    const stockCardImages = {
      starters: "assets/img/dishes/ham-croquettes.jpg",
      mains: "assets/img/dishes/prosciutto-pizza.jpg",
      drinks: "assets/img/dishes/smoked-old-fashioned.jpg",
      desserts: "assets/img/dishes/burnt-cheesecake.jpg",
      specials: "assets/img/dishes/mole-tasting.jpg"
    };

    (DATA.categories || []).forEach((c, i) => {
      const img = isDemo ? categoryCardImage(c.id) : stockCardImages[c.id];
      const link = el("a", {
        class: "wcard",
        href: "#/menu/" + c.id,
        style: "animation-delay:" + (240 + i * 70) + "ms"
      });
      if (img) {
        link.appendChild(
          el("div", {
            class: "wcard__bg",
            style: "background-image:url('" + img + "')"
          })
        );
      }
      link.appendChild(el("div", { class: "wcard__shade" }));
      link.appendChild(el("span", { class: "wcard__icon", text: c.icon }));
      link.appendChild(
        el("h3", {
          class: "wcard__title",
          text: isDemo ? getCategoryLabel(c.id) : I18N.t("welcome.cards." + c.id)
        })
      );
      track.appendChild(link);
    });

    carousel.appendChild(track);

    content.appendChild(carousel);

    content.appendChild(
      el("a", {
        class: "btn btn--primary btn--xl welcome__cta",
        href: "#/menu",
        text: I18N.t("welcome.cta")
      })
    );

    content.appendChild(
      el("p", { class: "welcome__hint", text: I18N.t("welcome.scrollHint") })
    );

    wrap.appendChild(hero);
    wrap.appendChild(content);
    return wrap;
  }

  function renderWelcome() {
    document.body.classList.remove("body--gateway");
    document.body.classList.remove("gv-demo-mode");
    document.body.classList.add("body--welcome");
    document.body.classList.add("gv-guest-mode");
    tabbar.classList.add("tabbar--hidden");
    view.replaceChildren(buildWelcomeView({ demo: false }));
  }

  function renderDemoWelcome() {
    document.body.classList.remove("body--gateway");
    document.body.classList.add("body--welcome");
    document.body.classList.add("gv-demo-mode");
    tabbar.classList.remove("tabbar--hidden");
    view.replaceChildren(buildWelcomeView({ demo: true }));
  }

  function markGuestAppView() {
    document.body.classList.remove("body--gateway");
    document.body.classList.remove("body--welcome");
    if (!document.body.classList.contains("gv-demo-mode")) {
      document.body.classList.add("gv-guest-mode");
    }
  }

  function renderMenu(activeCat) {
    markGuestAppView();
    tabbar.classList.remove("tabbar--hidden");
    setActiveTab("menu");

    const cats = DATA.categories;
    const cat = activeCat || cats[0].id;

    const wrap = el("section", { class: "menu" });

    /* Sticky header with category pills */
    const header = el("div", { class: "menu__header" });
    const headingKids = [];
    if (DATA.restaurant.logoUrl) {
      headingKids.push(
        el("img", {
          class: "menu__logo",
          src: DATA.restaurant.logoUrl,
          alt: DATA.restaurant.name || "Logo"
        })
      );
    }
    headingKids.push(el("p", { class: "menu__rest", text: DATA.restaurant.name }));
    headingKids.push(
      el("h1", {
        class: "menu__title",
        text: getLocalizedField(DATA.restaurant && DATA.restaurant.tagline, "")
      })
    );
    header.appendChild(el("div", { class: "menu__heading" }, headingKids));

    const pills = el("div", { class: "pills" });
    cats.forEach((c) => {
      const pill = el("a", {
        class: "pill" + (c.id === cat ? " pill--active" : ""),
        href: "#/menu/" + c.id,
        text: I18N.t("welcome.cards." + c.id)
      });
      pills.appendChild(pill);
    });
    header.appendChild(pills);
    wrap.appendChild(header);

    /* Items grid */
    const grid = el("div", { class: "grid" });
    DATA.items
      .filter((it) => it.category === cat && !it.hidden)
      .forEach((it) => grid.appendChild(itemCard(it)));

    if (!grid.children.length) {
      grid.appendChild(el("p", { class: "empty", text: I18N.t("menu.empty") }));
    }

    wrap.appendChild(grid);
    view.replaceChildren(wrap);
  }

  function renderItem(id) {
    const item = DATA.items.find((it) => it.id === id);
    if (!item || item.hidden) {
      location.hash = "#/menu";
      return;
    }
    markGuestAppView();
    tabbar.classList.remove("tabbar--hidden");

    const wrap = el("section", { class: "detail" });

    const back = el("button", {
      class: "detail__back",
      type: "button",
      "aria-label": I18N.t("detail.back"),
      html: makeIcon("back") + "<span>" + I18N.t("detail.back") + "</span>"
    });
    back.addEventListener("click", () => history.back());
    wrap.appendChild(back);

    wrap.appendChild(videoOrImage(item, { tall: true }));

    const body = el("div", { class: "detail__body" });

    if (item.tags && item.tags.length) {
      const tags = el("div", { class: "card__tags" });
      item.tags.forEach((t) => {
        const label =
          (DATA.tagLabels[t] && (DATA.tagLabels[t][I18N.get()] || DATA.tagLabels[t].en)) || t;
        tags.appendChild(el("span", { class: "tag tag--" + t, text: label }));
      });
      body.appendChild(tags);
    }

    body.appendChild(
      el("div", { class: "detail__head" }, [
        el("h1", { class: "detail__title", text: getName(item) }),
        el("span", { class: "detail__price", text: formatPrice(item) })
      ])
    );

    body.appendChild(el("p", { class: "detail__desc", text: getDescription(item) }));

    if (item.allergens && item.allergens.length) {
      body.appendChild(
        el("h4", { class: "detail__h4", text: I18N.t("menu.allergens") })
      );
      const al = el("div", { class: "allergens" });
      item.allergens.forEach((a) => {
        const label =
          (DATA.allergenLabels[a] && (DATA.allergenLabels[a][I18N.get()] || DATA.allergenLabels[a].en)) ||
          a;
        al.appendChild(el("span", { class: "chip", text: label }));
      });
      body.appendChild(al);
    }

    /* Action row: favorite + add */
    const actions = el("div", { class: "detail__actions" });
    const fav = el("button", {
      class: "btn btn--ghost" + (isFavorite(item.id) ? " btn--active" : ""),
      type: "button",
      html:
        makeIcon(isFavorite(item.id) ? "heart" : "heartLine") +
        " <span>" +
        (isFavorite(item.id) ? I18N.t("menu.unfavorite") : I18N.t("menu.favorite")) +
        "</span>"
    });
    fav.addEventListener("click", () => {
      toggleFavorite(item.id);
      renderItem(id);
    });
    actions.appendChild(fav);

    const add = el("button", {
      class: "btn btn--primary",
      type: "button",
      text: I18N.t("menu.add")
    });
    add.addEventListener("click", () => {
      addToCart(item.id);
      showToast("✓ " + I18N.t("menu.added"));
    });
    actions.appendChild(add);

    body.appendChild(actions);

    wrap.appendChild(body);
    view.replaceChildren(wrap);
  }

  function renderFavorites() {
    markGuestAppView();
    tabbar.classList.remove("tabbar--hidden");
    setActiveTab("favorites");

    const wrap = el("section", { class: "menu" });
    wrap.appendChild(
      el("div", { class: "menu__header" }, [
        el("h1", { class: "menu__title", text: I18N.t("favorites.title") })
      ])
    );

    const items = DATA.items.filter((it) => isFavorite(it.id) && !it.hidden);
    if (items.length === 0) {
      wrap.appendChild(
        el("div", { class: "empty empty--lg" }, [
          el("p", { text: "❤" }),
          el("p", { text: I18N.t("favorites.empty") })
        ])
      );
    } else {
      const grid = el("div", { class: "grid" });
      items.forEach((it) => grid.appendChild(itemCard(it)));
      wrap.appendChild(grid);
    }
    view.replaceChildren(wrap);
  }

  function renderCart() {
    markGuestAppView();
    tabbar.classList.remove("tabbar--hidden");
    setActiveTab("cart");

    const wrap = el("section", { class: "cart" });
    wrap.appendChild(
      el("header", { class: "menu__header" }, [
        el("h1", { class: "menu__title", text: I18N.t("cart.title") }),
        el("p", { class: "menu__sub", text: I18N.t("cart.subtitle") })
      ])
    );

    if (STATE.cart.length === 0) {
      wrap.appendChild(
        el("div", { class: "empty empty--lg" }, [
          el("p", { text: "🍽" }),
          el("p", { text: I18N.t("cart.empty") })
        ])
      );
      view.replaceChildren(wrap);
      return;
    }

    const list = el("div", { class: "cartlist" });
    let total = 0;

    STATE.cart.forEach((entry) => {
      const item = DATA.items.find((it) => it.id === entry.id);
      if (!item || item.hidden) return;
      total += item.price * entry.qty;

      const row = el("div", { class: "cartrow" });
      row.appendChild(
        el("img", { class: "cartrow__img", src: getPhotoUrl(item), alt: getName(item) })
      );
      const info = el("div", { class: "cartrow__info" });
      info.appendChild(el("h3", { class: "cartrow__title", text: getName(item) }));
      info.appendChild(
        el("p", {
          class: "cartrow__price",
          text: formatPrice(item) + " × " + entry.qty
        })
      );
      row.appendChild(info);

      const qtyBox = el("div", { class: "qty" });
      const minus = el("button", { type: "button", text: "−" });
      const plus = el("button", { type: "button", text: "+" });
      const num = el("span", { text: String(entry.qty) });
      minus.addEventListener("click", () => {
        if (entry.qty <= 1) removeFromCart(entry.id);
        else setQty(entry.id, entry.qty - 1);
        renderCart();
      });
      plus.addEventListener("click", () => {
        setQty(entry.id, entry.qty + 1);
        renderCart();
      });
      qtyBox.appendChild(minus);
      qtyBox.appendChild(num);
      qtyBox.appendChild(plus);
      row.appendChild(qtyBox);
      list.appendChild(row);
    });

    wrap.appendChild(list);

    const summary = el("div", { class: "cart__summary" });
    summary.appendChild(
      el("div", { class: "cart__total" }, [
        el("span", { text: I18N.t("cart.total") }),
        el("strong", {
          text: "€" + total.toFixed(2).replace(".", I18N.get() === "en" ? "." : ",")
        })
      ])
    );

    const ctaRow = el("div", { class: "cart__cta" });
    const clearBtn = el("button", {
      class: "btn btn--ghost",
      type: "button",
      text: I18N.t("cart.clear")
    });
    clearBtn.addEventListener("click", () => {
      clearCart();
      renderCart();
    });
    const orderBtn = el("button", {
      class: "btn btn--primary",
      type: "button",
      text: I18N.t("cart.order")
    });
    orderBtn.addEventListener("click", () => showToast("🔔 " + I18N.t("cart.order")));
    ctaRow.appendChild(clearBtn);
    ctaRow.appendChild(orderBtn);
    summary.appendChild(ctaRow);

    wrap.appendChild(summary);
    view.replaceChildren(wrap);
  }

  function renderVideoFeed() {
    markGuestAppView();
    tabbar.classList.remove("tabbar--hidden");
    setActiveTab("video");

    const wrap = el("section", { class: "videofeed" });
    wrap.appendChild(
      el("div", { class: "videofeed__hint", text: I18N.t("video.hint") })
    );

    const reel = el("div", { class: "reel" });
    DATA.items.filter((it) => !it.hidden).forEach((item) => {
      const slide = el("article", { class: "reel__slide" });

      /* Cinematic Ken Burns photo as the base layer (always present). */
      const photo = el("div", {
        class: "reel__photo",
        style: "background-image:url('" + getPhotoUrl(item) + "')"
      });
      slide.appendChild(photo);

      /* Optional real video on top — only added if the file loads. */
      const v = el("video", {
        class: "reel__video",
        src: getVideoUrl(item),
        poster: getPhotoUrl(item),
        playsinline: "",
        muted: true,
        loop: true,
        preload: "metadata"
      });
      v.addEventListener("error", () => v.remove(), { once: true });
      slide.appendChild(v);

      const info = el("div", { class: "reel__info" });
      info.appendChild(el("h2", { class: "reel__title", text: getName(item) }));
      info.appendChild(
        el("p", { class: "reel__desc", text: getDescription(item) })
      );
      info.appendChild(
        el("p", { class: "reel__price", text: formatPrice(item) })
      );

      const actions = el("div", { class: "reel__actions" });
      const fav = el("button", {
        class: "iconbtn iconbtn--lg" + (isFavorite(item.id) ? " iconbtn--active" : ""),
        type: "button",
        html: makeIcon(isFavorite(item.id) ? "heart" : "heartLine")
      });
      fav.addEventListener("click", () => {
        toggleFavorite(item.id);
        fav.classList.toggle("iconbtn--active");
        fav.innerHTML = makeIcon(isFavorite(item.id) ? "heart" : "heartLine");
      });
      const addBtn = el("button", {
        class: "btn btn--primary btn--pill",
        type: "button",
        text: I18N.t("menu.add")
      });
      addBtn.addEventListener("click", () => {
        addToCart(item.id);
        showToast("✓ " + I18N.t("menu.added"));
      });
      actions.appendChild(fav);
      actions.appendChild(addBtn);
      info.appendChild(actions);

      slide.appendChild(info);
      reel.appendChild(slide);
    });

    wrap.appendChild(reel);
    view.replaceChildren(wrap);

    /* Auto-play the visible slide */
    const videos = reel.querySelectorAll("video");
    if ("IntersectionObserver" in window) {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const v = entry.target;
            if (entry.intersectionRatio > 0.6) v.play().catch(() => {});
            else v.pause();
          });
        },
        { threshold: [0, 0.6, 1], root: reel }
      );
      videos.forEach((v) => obs.observe(v));
    }
  }

  /* ---------------------- Feedback flow (multi-step) ----------------- */

  function renderFeedback(step) {
    markGuestAppView();
    tabbar.classList.add("tabbar--hidden");

    step = parseInt(step || "1", 10);
    if (isNaN(step) || step < 1) step = 1;
    if (step > 5) step = 5;

    const wrap = el("section", { class: "fb" });

    const header = el("div", { class: "fb__header" });
    if (step > 1 && step < 5) {
      const back = el("button", {
        class: "fb__back",
        type: "button",
        "aria-label": I18N.t("feedback.back"),
        html: makeIcon("back")
      });
      back.addEventListener("click", () => (location.hash = "#/feedback/" + (step - 1)));
      header.appendChild(back);
    } else {
      header.appendChild(el("span"));
    }

    if (step < 5) {
      header.appendChild(
        el("p", { class: "fb__step", text: I18N.t("feedback.step") + " " + step + " " + I18N.t("feedback.of") + " 4" })
      );
    } else {
      header.appendChild(el("span"));
    }

    const close = el("button", {
      class: "fb__close",
      type: "button",
      "aria-label": I18N.t("common.close"),
      html: makeIcon("x")
    });
    close.addEventListener("click", () => (location.hash = "#/menu"));
    header.appendChild(close);
    wrap.appendChild(header);

    const progress = el("div", { class: "fb__progress" });
    const fill = el("div", { class: "fb__progress-fill" });
    fill.style.width = Math.min(100, (step / 4) * 100) + "%";
    progress.appendChild(fill);
    wrap.appendChild(progress);

    const body = el("div", { class: "fb__body" });

    if (step === 1) renderFb1(body);
    else if (step === 2) renderFb2(body);
    else if (step === 3) renderFb3(body);
    else if (step === 4) renderFb4(body);
    else if (step === 5) renderFb5(body);

    wrap.appendChild(body);
    view.replaceChildren(wrap);
  }

  function renderFb1(body) {
    body.appendChild(
      el("h1", { class: "fb__title", text: I18N.t("feedback.q1.title") })
    );
    body.appendChild(
      el("p", { class: "fb__sub", text: I18N.t("feedback.q1.subtitle") })
    );

    const opts = [
      { id: "love", emoji: "🤩" },
      { id: "good", emoji: "😋" },
      { id: "ok", emoji: "🙂" },
      { id: "meh", emoji: "😕" },
      { id: "bad", emoji: "😖" }
    ];
    const wrap = el("div", { class: "rating" });
    opts.forEach((o) => {
      const btn = el("button", {
        class: "rating__btn" + (STATE.feedback.rating === o.id ? " rating__btn--active" : ""),
        type: "button"
      });
      btn.appendChild(el("span", { class: "rating__emoji", text: o.emoji }));
      btn.appendChild(
        el("span", { class: "rating__label", text: I18N.t("feedback.q1.options." + o.id) })
      );
      btn.addEventListener("click", () => {
        STATE.feedback.rating = o.id;
        wrap.querySelectorAll(".rating__btn").forEach((b) => b.classList.remove("rating__btn--active"));
        btn.classList.add("rating__btn--active");
        setTimeout(() => (location.hash = "#/feedback/2"), 350);
      });
      wrap.appendChild(btn);
    });
    body.appendChild(wrap);
  }

  function renderFb2(body) {
    body.appendChild(
      el("h1", { class: "fb__title", text: I18N.t("feedback.q2.title") })
    );
    body.appendChild(
      el("p", { class: "fb__sub", text: I18N.t("feedback.q2.subtitle") })
    );

    const grid = el("div", { class: "fb__grid" });
    DATA.items.forEach((item) => {
      const tile = el("button", {
        class:
          "tile" + (STATE.feedback.dishes.includes(item.id) ? " tile--active" : ""),
        type: "button"
      });
      tile.appendChild(
        el("div", {
          class: "tile__img",
          style: "background-image:url('" + getPhotoUrl(item) + "')"
        })
      );
      tile.appendChild(el("div", { class: "tile__shade" }));
      tile.appendChild(el("span", { class: "tile__name", text: getName(item) }));
      tile.appendChild(el("span", { class: "tile__check", html: makeIcon("check") }));
      tile.addEventListener("click", () => {
        const i = STATE.feedback.dishes.indexOf(item.id);
        if (i === -1) STATE.feedback.dishes.push(item.id);
        else STATE.feedback.dishes.splice(i, 1);
        tile.classList.toggle("tile--active");
      });
      grid.appendChild(tile);
    });
    body.appendChild(grid);

    body.appendChild(makeFooter("#/feedback/3", false));
  }

  function renderFb3(body) {
    body.appendChild(
      el("h1", { class: "fb__title", text: I18N.t("feedback.q3.title") })
    );
    body.appendChild(
      el("p", { class: "fb__sub", text: I18N.t("feedback.q3.subtitle") })
    );

    const ta = el("textarea", {
      class: "input input--ta",
      rows: 4,
      placeholder: I18N.t("feedback.q3.placeholder")
    });
    ta.value = STATE.feedback.note || "";
    ta.addEventListener("input", () => (STATE.feedback.note = ta.value));
    body.appendChild(ta);

    body.appendChild(makeFooter("#/feedback/4", true));
  }

  function renderFb4(body) {
    body.appendChild(
      el("div", { class: "reward" }, [
        el("span", { class: "reward__emoji", text: "🍰" }),
        el("h1", { class: "fb__title", text: I18N.t("feedback.q4.title") }),
        el("p", { class: "fb__sub", text: I18N.t("feedback.q4.subtitle") })
      ])
    );

    const form = el("form", { class: "fb__form" });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      submitRecommendation();
    });

    /* Channel toggle */
    const channels = el("div", { class: "channels" });
    const ch = STATE.feedback.recommend?.channel || "email";
    [
      { id: "email", icon: "✉", label: I18N.t("feedback.q4.channelEmail") },
      { id: "whatsapp", icon: "💬", label: I18N.t("feedback.q4.channelWhatsapp") }
    ].forEach((c) => {
      const b = el("button", {
        class: "channel" + (ch === c.id ? " channel--active" : ""),
        type: "button",
        dataset: { channel: c.id }
      });
      b.appendChild(el("span", { class: "channel__icon", text: c.icon }));
      b.appendChild(el("span", { text: c.label }));
      b.addEventListener("click", () => {
        channels.querySelectorAll(".channel").forEach((x) => x.classList.remove("channel--active"));
        b.classList.add("channel--active");
        b.dataset.selected = "1";
        form.dataset.channel = c.id;
        const contactInput = form.querySelector('input[name="friendContact"]');
        contactInput.placeholder =
          c.id === "whatsapp" ? "+34 666 77 88 99" : "friend@email.com";
        contactInput.type = c.id === "whatsapp" ? "tel" : "email";
      });
      channels.appendChild(b);
    });
    form.dataset.channel = ch;
    form.appendChild(channels);

    /* Inputs */
    const fields = [
      { name: "name", placeholder: I18N.t("feedback.q4.name"), required: true, type: "text" },
      { name: "email", placeholder: I18N.t("feedback.q4.email"), required: true, type: "email" },
      { name: "friendName", placeholder: I18N.t("feedback.q4.friendName"), required: true, type: "text" },
      {
        name: "friendContact",
        placeholder: ch === "whatsapp" ? "+34 666 77 88 99" : "friend@email.com",
        required: true,
        type: ch === "whatsapp" ? "tel" : "email"
      }
    ];
    fields.forEach((f) => {
      const input = el("input", {
        class: "input",
        name: f.name,
        type: f.type,
        placeholder: f.placeholder,
        required: f.required ? "required" : false,
        autocomplete: "off"
      });
      form.appendChild(input);
    });

    const msg = el("textarea", {
      class: "input input--ta",
      name: "message",
      rows: 3,
      placeholder: I18N.t("feedback.q4.message")
    });
    form.appendChild(msg);

    /* Submit */
    const submit = el("button", {
      class: "btn btn--primary btn--xl btn--full",
      type: "submit",
      html: "🍰 <span>" + I18N.t("feedback.submit") + "</span>"
    });
    form.appendChild(submit);

    body.appendChild(form);
  }

  function renderFb5(body) {
    /* Confetti animation */
    body.appendChild(buildConfetti());

    body.appendChild(
      el("div", { class: "success" }, [
        el("div", { class: "success__circle", html: makeIcon("check") }),
        el("h1", { class: "fb__title fb__title--center", text: I18N.t("feedback.success.title") }),
        el("p", { class: "fb__sub fb__sub--center", text: I18N.t("feedback.success.subtitle") })
      ])
    );

    /* Voucher */
    const code = generateCode();
    const voucher = el("div", { class: "voucher" });
    voucher.appendChild(el("p", { class: "voucher__kicker", text: I18N.t("feedback.success.voucher") }));
    voucher.appendChild(el("p", { class: "voucher__emoji", text: "🍰" }));
    voucher.appendChild(
      el("div", { class: "voucher__code" }, [
        el("span", { text: I18N.t("feedback.success.code") }),
        el("strong", { text: code })
      ])
    );
    voucher.appendChild(
      el("p", { class: "voucher__expiry", text: I18N.t("feedback.success.expires") })
    );
    voucher.appendChild(
      el("p", { class: "voucher__hint", text: I18N.t("feedback.success.showWaiter") })
    );
    body.appendChild(voucher);

    body.appendChild(
      el("a", {
        class: "btn btn--ghost btn--full",
        href: "#/menu",
        text: I18N.t("feedback.success.back")
      })
    );
  }

  function makeFooter(nextHash, allowSkip) {
    const footer = el("div", { class: "fb__footer" });
    if (allowSkip) {
      const skip = el("a", {
        class: "btn btn--ghost",
        href: nextHash,
        text: I18N.t("feedback.skip")
      });
      footer.appendChild(skip);
    } else {
      footer.appendChild(el("span"));
    }
    const next = el("a", {
      class: "btn btn--primary",
      href: nextHash,
      text: I18N.t("feedback.next")
    });
    footer.appendChild(next);
    return footer;
  }

  function submitRecommendation() {
    const form = view.querySelector(".fb__form");
    const data = new FormData(form);
    const channel = form.dataset.channel || "email";
    const friendName = data.get("friendName") || "friend";
    const friendContact = data.get("friendContact") || "";
    const userMessage = data.get("message");
    const message =
      userMessage && userMessage.trim().length > 0
        ? userMessage
        : I18N.t("feedback.q4.messageDefault", { friend: friendName });

    STATE.feedback.recommend = {
      channel,
      name: data.get("name"),
      email: data.get("email"),
      friendName,
      friendContact,
      message
    };
    saveJson("gv.feedback.last", STATE.feedback);

    /* Fire fake send: opens user's mail or WhatsApp client. */
    const url =
      window.location.origin + window.location.pathname + "#/";
    const fullMessage =
      message + "\n\n" + url;

    if (channel === "whatsapp") {
      const phone = friendContact.replace(/[^0-9+]/g, "");
      const wa =
        "https://wa.me/" +
        encodeURIComponent(phone) +
        "?text=" +
        encodeURIComponent(fullMessage);
      window.open(wa, "_blank");
    } else {
      const subject = "GastoVision — you've gotta try this place";
      const mailto =
        "mailto:" +
        encodeURIComponent(friendContact) +
        "?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(fullMessage);
      window.open(mailto, "_blank");
    }

    location.hash = "#/feedback/5";
  }

  function generateCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "GV-";
    for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  function buildConfetti() {
    const wrap = el("div", { class: "confetti", "aria-hidden": "true" });
    const colors = ["#14B8A6", "#FB923C", "#FDE68A", "#F472B6", "#A78BFA"];
    for (let i = 0; i < 28; i++) {
      const c = el("span");
      c.style.left = Math.random() * 100 + "%";
      c.style.background = colors[i % colors.length];
      c.style.animationDelay = (Math.random() * 0.6).toFixed(2) + "s";
      c.style.animationDuration = (1.6 + Math.random() * 1.2).toFixed(2) + "s";
      wrap.appendChild(c);
    }
    return wrap;
  }

  /* ------------------------------ Router ----------------------------- */

  function setActiveTab(name) {
    tabbar.querySelectorAll(".tab").forEach((t) => {
      t.classList.toggle("tab--active", t.dataset.tab === name);
    });
  }

  function syncBrandHome() {
    const brand = document.getElementById("brandHome");
    if (!brand) return;
    const parts = (location.hash || "").replace(/^#\/?/, "").split("/").filter(Boolean);
    const onPortal = parts[0] === "portal";
    const onGuestApp =
      parts.length === 0 ||
      GUEST_APP_SEGMENTS.indexOf(parts[0]) !== -1 ||
      parts[0] === "item";
    if (document.body.classList.contains("gv-demo-mode")) {
      brand.href = "#/";
      brand.setAttribute("aria-label", "Demo restaurant home");
    } else if (onGuestApp) {
      brand.href = "#/portal";
      brand.setAttribute("aria-label", "Back to GastoVision home");
    } else if (onPortal) {
      brand.href = "#/portal";
      brand.setAttribute("aria-label", "GastoVision home");
    } else {
      brand.href = "#/portal";
      brand.setAttribute("aria-label", "GastoVision home");
    }
  }

  function redirectPublishedDemoIfNeeded() {
    let gvD = null;
    try {
      gvD = new URLSearchParams(location.search).get("gv_d");
    } catch (_) {
      const m = location.search.match(/[?&]gv_d=([^&]*)/);
      gvD = m ? m[1] : null;
    }
    if (!gvD) return false;
    const hash = location.hash || "#/";
    if (/^#\/?portal/.test(hash)) return false;
    /* Demo already loaded — allow #/menu, #/cart, #/item/… without reloading. */
    if (document.body.classList.contains("gv-demo-mode")) return false;
    if (/^#\/?demo\/v/.test(hash)) return false;
    if (hash === "#/" || hash === "#") {
      location.hash = "#/demo/v";
      return true;
    }
    if (!/^#\/?demo\/v/.test(hash)) {
      location.hash = "#/demo/v";
      return true;
    }
    return false;
  }

  function route() {
    if (redirectPublishedDemoIfNeeded()) return;
    logGuestVisitForAnalytics();
    const hash = location.hash || "#/";
    const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    window.scrollTo(0, 0);

    try {
      /* Plug-in routes (e.g. demo mode). The first hook to return true wins. */
      const hooks = (window.GV && window.GV._routeHooks) || [];
      for (let i = 0; i < hooks.length; i++) {
        try {
          if (hooks[i](parts, hash) === true) return;
        } catch (err) {
          console.error("GV route hook threw:", err);
        }
      }

      /* Deep links to the diner app (QR codes, bookmarks) open the full guest experience. */
      if (parts.length > 0 && GUEST_APP_SEGMENTS.indexOf(parts[0]) !== -1) {
        if (!document.body.classList.contains("gv-demo-mode")) {
          sessionStorage.setItem(GUEST_MODE_KEY, "1");
          document.body.classList.add("gv-guest-mode");
        }
      }

      if (parts[0] === "portal") {
        exitGuestMode();
        renderHomeGateway();
        return;
      }
      if (parts[0] === "guest" || parts[0] === "sample") {
        enterGuestMode({ reset: true });
        location.replace(location.pathname + location.search + "#/");
        return;
      }

      /* #/ = production guest welcome (menu, cart, feedback, … use their own hashes). */
      if (parts.length === 0) {
        if (document.body.classList.contains("gv-demo-mode")) {
          renderDemoWelcome();
          return;
        }
        enterGuestMode({ reset: false });
        renderWelcome();
        return;
      }
      if (parts[0] === "menu") {
        renderMenu(parts[1]);
        return;
      }
      if (parts[0] === "item") {
        renderItem(parts[1]);
        return;
      }
      if (parts[0] === "favorites") {
        renderFavorites();
        return;
      }
      if (parts[0] === "cart") {
        renderCart();
        return;
      }
      if (parts[0] === "video") {
        renderVideoFeed();
        return;
      }
      if (parts[0] === "feedback") {
        renderFeedback(parts[1]);
        return;
      }
      enterGuestMode({ reset: false });
      renderWelcome();
    } finally {
      syncBrandHome();
      syncWhatsAppFab();
    }
  }

  /* Last hash we logged for analytics (avoid double-count on I18N re-render). */
  let _analyticsLastHash = null;

  function logGuestVisitForAnalytics() {
    try {
      const h = location.hash || "#/";
      if (h === _analyticsLastHash) return;
      _analyticsLastHash = h;
      if (h.startsWith("#/owner") || h.startsWith("#/demo")) return;
      const log = loadJson("gv.analytics.log", []);
      log.push({ d: new Date().toISOString().slice(0, 10), t: Date.now() });
      saveJson("gv.analytics.log", log.slice(-4000));
    } catch (_) {}
  }

  /* ------------------------- Language picker UI --------------------- */

  function setupLanguagePicker() {
    const btn = document.getElementById("langBtn");
    const menu = document.getElementById("langMenu");
    const flagEl = document.getElementById("langFlag");
    const codeEl = document.getElementById("langCode");

    function syncBtn() {
      flagEl.textContent = I18N.getFlag();
      codeEl.textContent = I18N.get().toUpperCase();
    }
    syncBtn();

    function close() {
      menu.classList.remove("lang-menu--open");
      btn.setAttribute("aria-expanded", "false");
    }
    function open() {
      menu.classList.add("lang-menu--open");
      btn.setAttribute("aria-expanded", "true");
    }

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.contains("lang-menu--open") ? close() : open();
    });

    menu.querySelectorAll("[data-lang]").forEach((li) => {
      li.addEventListener("click", () => {
        I18N.set(li.dataset.lang);
        syncBtn();
        close();
        route(); // Re-render the current view in the new language.
      });
    });

    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && e.target !== btn) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  /* ------------------------ Public API (window.GV) ------------------- */

  /* Snapshot of the original menu so demo mode can reset back to it. */
  const ORIGINAL_DATA = JSON.parse(JSON.stringify(DATA));

  function resetDataSilent() {
    resetMenuDataSilent();
  }

  window.GV = {
    /* DOM helpers */
    el,
    view,
    tabbar,
    showToast,
    makeIcon,

    /* Data helpers */
    get DATA() {
      return DATA;
    },
    setData(newData) {
      Object.keys(DATA).forEach((k) => delete DATA[k]);
      Object.assign(DATA, newData);
      route();
    },
    setDataSilent(newData) {
      Object.keys(DATA).forEach((k) => delete DATA[k]);
      Object.assign(DATA, newData);
    },
    renderDemoWelcome,
    enterGuestMode,
    exitGuestMode,
    isGuestMode,
    resetDataSilent,
    resetData() {
      Object.keys(DATA).forEach((k) => delete DATA[k]);
      Object.assign(DATA, JSON.parse(JSON.stringify(ORIGINAL_DATA)));
      route();
    },
    /** Remove owner-saved overrides and reload bundled menu from disk snapshot. */
    restoreShippedMenu() {
      try {
        localStorage.removeItem("gv.owner.editedData");
      } catch (_) {}
      Object.keys(DATA).forEach((k) => delete DATA[k]);
      Object.assign(DATA, JSON.parse(JSON.stringify(ORIGINAL_DATA)));
      route();
    },
    persistOwnerMenu() {
      saveJson("gv.owner.editedData", JSON.parse(JSON.stringify(DATA)));
    },

    /* Item helpers */
    getName,
    getDescription,
    getCategoryLabel,
    formatPrice,
    getPhotoUrl,
    getVideoUrl,
    videoOrImage,

    /* Navigation */
    navigate(hash) {
      if (location.hash === hash) route();
      else location.hash = hash;
    },
    render: route,

    /* Storage */
    saveJson,
    loadJson,

    /* i18n */
    I18N,

    /* Plug-in route hooks: each is fn(parts, hash) -> bool. */
    _routeHooks: []
  };

  /* -------------------------------- Boot ----------------------------- */

  function boot() {
    /* Owner-saved menu overrides the bundled sample (same shape as GV_DATA). */
    const ownerSaved = loadJson("gv.owner.editedData", null);
    if (ownerSaved && Array.isArray(ownerSaved.items)) {
      Object.keys(DATA).forEach((k) => delete DATA[k]);
      Object.assign(DATA, ownerSaved);
    }
    if (sessionStorage.getItem(GUEST_MODE_KEY) === "1") {
      document.body.classList.add("gv-guest-mode");
    }
    I18N.set(I18N.detect());
    setupLanguagePicker();
    updateCartCount();
    window.addEventListener("hashchange", route);
    /* Bare site URL → product portal; #/ stays the production guest welcome. */
    const h = location.hash;
    if (!h || h === "#") {
      location.replace(location.pathname + location.search + "#/portal");
      return;
    }
    route();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
