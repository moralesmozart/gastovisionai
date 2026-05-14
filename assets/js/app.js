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
  function getPhotoUrl(item) {
    /* Demo dishes ship their own user-uploaded photo as a data URL or a
     * remote http(s) URL — use it directly. Otherwise fall back to the
     * built-in cinematic AI photo for the original 11 items. */
    if (item.photoUrl) return item.photoUrl;
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

    const img = el("img", {
      class: "media__img",
      src: getPhotoUrl(item),
      alt: getName(item),
      loading: "lazy"
    });
    img.addEventListener("error", () => img.classList.add("media__img--failed"));
    wrap.appendChild(img);

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

  function renderWelcome() {
    document.body.classList.add("body--welcome");
    tabbar.classList.add("tabbar--hidden");

    const wrap = el("section", { class: "welcome" });

    const hero = el("div", { class: "welcome__hero" });
    hero.appendChild(
      el("div", {
        class: "welcome__bg",
        style: "background-image:url('" + DATA.restaurant.hero + "')"
      })
    );
    hero.appendChild(el("div", { class: "welcome__bg-overlay" }));

    const content = el("div", { class: "welcome__content" });

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

    content.appendChild(
      el("p", { class: "welcome__sub", text: I18N.t("welcome.subtitle") })
    );

    /* Category cards carousel */
    const carousel = el("div", { class: "carousel" });
    const track = el("div", { class: "carousel__track" });

    /* One representative AI dish photo per category for the welcome cards. */
    const cardImages = {
      starters: "assets/img/dishes/ham-croquettes.jpg",
      mains: "assets/img/dishes/prosciutto-pizza.jpg",
      drinks: "assets/img/dishes/smoked-old-fashioned.jpg",
      desserts: "assets/img/dishes/burnt-cheesecake.jpg",
      specials: "assets/img/dishes/mole-tasting.jpg"
    };

    DATA.categories.forEach((c, i) => {
      const link = el("a", {
        class: "wcard",
        href: "#/menu/" + c.id,
        style: "animation-delay:" + (240 + i * 70) + "ms"
      });
      link.appendChild(
        el("div", {
          class: "wcard__bg",
          style: "background-image:url('" + cardImages[c.id] + "')"
        })
      );
      link.appendChild(el("div", { class: "wcard__shade" }));
      link.appendChild(el("span", { class: "wcard__icon", text: c.icon }));
      link.appendChild(
        el("h3", { class: "wcard__title", text: I18N.t("welcome.cards." + c.id) })
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

    view.replaceChildren(wrap);
  }

  function renderMenu(activeCat) {
    document.body.classList.remove("body--welcome");
    tabbar.classList.remove("tabbar--hidden");
    setActiveTab("menu");

    const cats = DATA.categories;
    const cat = activeCat || cats[0].id;

    const wrap = el("section", { class: "menu" });

    /* Sticky header with category pills */
    const header = el("div", { class: "menu__header" });
    header.appendChild(
      el("div", { class: "menu__heading" }, [
        el("p", { class: "menu__rest", text: DATA.restaurant.name }),
        el("h1", {
          class: "menu__title",
          text:
            DATA.restaurant.tagline[I18N.get()] || DATA.restaurant.tagline.en
        })
      ])
    );

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
      .filter((it) => it.category === cat)
      .forEach((it) => grid.appendChild(itemCard(it)));

    if (!grid.children.length) {
      grid.appendChild(el("p", { class: "empty", text: I18N.t("menu.empty") }));
    }

    wrap.appendChild(grid);
    view.replaceChildren(wrap);
  }

  function renderItem(id) {
    const item = DATA.items.find((it) => it.id === id);
    if (!item) {
      location.hash = "#/menu";
      return;
    }
    document.body.classList.remove("body--welcome");
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
    document.body.classList.remove("body--welcome");
    tabbar.classList.remove("tabbar--hidden");
    setActiveTab("favorites");

    const wrap = el("section", { class: "menu" });
    wrap.appendChild(
      el("div", { class: "menu__header" }, [
        el("h1", { class: "menu__title", text: I18N.t("favorites.title") })
      ])
    );

    const items = DATA.items.filter((it) => isFavorite(it.id));
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
    document.body.classList.remove("body--welcome");
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
      if (!item) return;
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
    document.body.classList.remove("body--welcome");
    tabbar.classList.remove("tabbar--hidden");
    setActiveTab("video");

    const wrap = el("section", { class: "videofeed" });
    wrap.appendChild(
      el("div", { class: "videofeed__hint", text: I18N.t("video.hint") })
    );

    const reel = el("div", { class: "reel" });
    DATA.items.forEach((item) => {
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
    document.body.classList.remove("body--welcome");
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

  function route() {
    const hash = location.hash || "#/";
    const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    window.scrollTo(0, 0);

    /* Plug-in routes (e.g. demo mode). The first hook to return true wins. */
    const hooks = (window.GV && window.GV._routeHooks) || [];
    for (let i = 0; i < hooks.length; i++) {
      try {
        if (hooks[i](parts, hash) === true) return;
      } catch (err) {
        console.error("GV route hook threw:", err);
      }
    }

    if (parts.length === 0) return renderWelcome();
    if (parts[0] === "menu") return renderMenu(parts[1]);
    if (parts[0] === "item") return renderItem(parts[1]);
    if (parts[0] === "favorites") return renderFavorites();
    if (parts[0] === "cart") return renderCart();
    if (parts[0] === "video") return renderVideoFeed();
    if (parts[0] === "feedback") return renderFeedback(parts[1]);
    return renderWelcome();
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
      /* Replace DATA's contents in place so existing references stay live. */
      Object.keys(DATA).forEach((k) => delete DATA[k]);
      Object.assign(DATA, newData);
      route();
    },
    resetData() {
      Object.keys(DATA).forEach((k) => delete DATA[k]);
      Object.assign(DATA, JSON.parse(JSON.stringify(ORIGINAL_DATA)));
      route();
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
    I18N.set(I18N.detect());
    setupLanguagePicker();
    updateCartCount();
    window.addEventListener("hashchange", route);
    route();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
