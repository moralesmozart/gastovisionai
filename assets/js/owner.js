/* GastoVision — Owner SaaS (login + products + analytics + members)
 * Same DATA as the guest app; edits persist to localStorage (gv.owner.editedData).
 * Demo password (change in production): see README / login screen hint. */
(function () {
  if (!window.GV) return;
  const GV = window.GV;
  const I18N = GV.I18N;
  const el = GV.el;
  const DATA = GV.DATA;

  const SESSION_KEY = "gv.owner.session";
  const DEMO_PASSWORD = "gastovision";
  const LANGS = ["en", "es", "pt", "fr", "de"];
  const FLAGS = { en: "🇬🇧", es: "🇪🇸", pt: "🇵🇹", fr: "🇫🇷", de: "🇩🇪" };

  const DEMO_MEMBERS = [
    { id: "1", name: "Rosi La Loca", email: "rosi@example.com", role: "owner", status: "active" },
    { id: "2", name: "María García", email: "maria@example.com", role: "member", status: "active" },
    { id: "3", name: "Carlos Ruiz", email: "carlos@example.com", role: "member", status: "pending" }
  ];

  let ownerChartInst = null;

  function t(k) {
    return I18N.t("owner." + k);
  }

  function isSession() {
    try {
      return sessionStorage.getItem(SESSION_KEY) === "1";
    } catch (_) {
      return false;
    }
  }
  function setSession() {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch (_) {}
  }
  function clearSession() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (_) {}
  }

  function showOwnerChrome() {
    document.body.classList.add("body--owner");
  }
  function hideOwnerChrome() {
    document.body.classList.remove("body--owner");
  }

  const NAV = [
    { slug: "export", href: "#/owner/export", icon: "📥", key: "navExport" },
    { slug: "analytics", href: "#/owner/analytics", icon: "📊", key: "navAnalytics" },
    { slug: "roles", href: "#/owner/roles", icon: "🛡", key: "navRoles" },
    { slug: "users", href: "#/owner/users", icon: "👥", key: "navUsers" },
    { slug: "restaurants", href: "#/owner/restaurants", icon: "🏪", key: "navRestaurants" },
    { slug: "menu", href: "#/owner/menu", icon: "📋", key: "navMenu" },
    { slug: "sections", href: "#/owner/sections", icon: "▦", key: "navSections" },
    { slug: "products", href: "#/owner/products", icon: "🍽", key: "navProducts" },
    { slug: "campaigns", href: "#/owner/campaigns", icon: "📣", key: "navCampaigns" },
    { slug: "presentations", href: "#/owner/presentations", icon: "🖥", key: "navPresentations" }
  ];

  function shell(activeSlug, inner) {
    const root = el("div", { class: "owner" });
    const side = el("aside", { class: "owner__sidebar" });
    side.appendChild(
      el("div", {
        class: "owner__brand",
        html: "GastoVision<small>" + t("brandSub") + "</small>"
      })
    );
    const nav = el("nav", { class: "owner__nav" });
    NAV.forEach((n) => {
      const link = el("a", {
        href: n.href,
        class:
          "owner__nav-link" + (n.slug === activeSlug ? " owner__nav--active" : ""),
        html: '<span class="owner__nav-ico">' + n.icon + "</span><span>" + t(n.key) + "</span>"
      });
      nav.appendChild(link);
    });
    side.appendChild(nav);

    const main = el("div", { class: "owner__main" });
    const top = el("header", { class: "owner__top" });
    top.appendChild(
      el("div", { class: "owner__top-left" }, [
        el("span", { class: "owner__pill", text: t("tutorials") }),
        el("span", { text: I18N.getFlag() + " " + I18N.get().toUpperCase() })
      ])
    );
    top.appendChild(
      el("div", { class: "owner__user" }, [
        el("a", {
          href: "#/owner/logout",
          style: "font-size:12px;color:#64748b;margin-right:8px;",
          text: t("logout")
        }),
        el("span", { text: t("superAdmin") }),
        el("span", {
          class: "owner__avatar",
          text: "GV",
          title: "GastoVision"
        })
      ])
    );
    main.appendChild(top);
    const content = el("div", { class: "owner__content" });
    content.appendChild(inner);
    main.appendChild(content);

    root.appendChild(side);
    root.appendChild(main);
    return root;
  }

  function renderLogin() {
    hideOwnerChrome();
    const card = el("div", { class: "owner-login__card" });
    card.appendChild(el("h1", { text: t("loginTitle") }));
    card.appendChild(el("p", { text: t("loginSub") }));
    const pw = el("input", {
      type: "password",
      id: "ownerPw",
      placeholder: t("passwordPh"),
      autocomplete: "current-password"
    });
    card.appendChild(
      el("div", { class: "owner-field" }, [
        el("label", { htmlFor: "ownerPw", text: t("password") }),
        pw
      ])
    );
    const err = el("p", {
      id: "ownerLoginErr",
      style: "color:#dc2626;font-size:13px;min-height:18px;margin:0 0 8px;"
    });
    card.appendChild(err);
    const btn = el("button", { class: "owner-btn", type: "button", text: t("signIn") });
    btn.addEventListener("click", () => {
      if (pw.value === DEMO_PASSWORD) {
        setSession();
        GV.navigate("#/owner/products");
      } else {
        err.textContent = t("loginErr");
      }
    });
    pw.addEventListener("keydown", (e) => {
      if (e.key === "Enter") btn.click();
    });
    card.appendChild(btn);
    card.appendChild(
      el("a", {
        href: "#/",
        class: "owner-btn owner-btn--ghost",
        text: t("backPublic")
      })
    );
    const wrap = el("div", { class: "owner-login" }, [card]);
    GV.view.replaceChildren(wrap);
  }

  function categoryLabel(id) {
    return I18N.t("welcome.cards." + id) || id;
  }

  function renderProducts() {
    showOwnerChrome();
    const inner = el("div", {});
    inner.appendChild(el("h1", { class: "owner__h1", text: t("productsTitle") }));
    inner.appendChild(el("p", { class: "owner__sub", text: t("productsSub") }));

    const card = el("div", { class: "owner-card owner-table-wrap" });
    const table = el("table", { class: "owner-table" });
    const thead = el("thead", {});
    thead.appendChild(
      el("tr", {}, [
        el("th", { text: t("colDate") }),
        el("th", { text: t("colId") }),
        el("th", { text: t("colName") }),
        el("th", { text: t("colCategory") }),
        el("th", { text: t("colMenuType") }),
        el("th", { text: t("colRestaurant") }),
        el("th", { text: t("colStatus") }),
        el("th", { text: t("colActions") })
      ])
    );
    table.appendChild(thead);
    const tb = el("tbody", {});
    DATA.items.forEach((item, idx) => {
      const tr = el("tr", {});
      const updated = item.ownerUpdated || "";
      const shortDate = updated ? updated.slice(0, 10) : "—";
      tr.appendChild(el("td", { text: shortDate }));
      tr.appendChild(el("td", { text: String(idx + 1) }));
      tr.appendChild(
        el("td", { text: item.name.en || item.name[I18N.get()] || item.id })
      );
      tr.appendChild(el("td", { text: categoryLabel(item.category) }));
      tr.appendChild(el("td", { text: item.menuType || "CARTA" }));
      const restCell = el("td", {});
      const rowBrand = el("div", { style: "display:flex;align-items:center;gap:8px;" });
      rowBrand.appendChild(el("span", { class: "owner-dot-brand", "aria-hidden": "true" }));
      rowBrand.appendChild(el("span", { text: DATA.restaurant.name || "—" }));
      restCell.appendChild(rowBrand);
      tr.appendChild(restCell);
      const st = el("td", {});
      st.appendChild(
        el("span", {
          class:
            "owner-badge " + (item.hidden ? "owner-badge--off" : "owner-badge--ok"),
          text: item.hidden ? t("statusHidden") : t("statusApproved")
        })
      );
      tr.appendChild(st);

      const act = el("td", {});
      const actions = el("div", { class: "owner-actions" });
      const view = el("button", {
        class: "owner-iconbtn",
        type: "button",
        title: t("preview"),
        text: "👁",
        onClick: (e) => {
          e.preventDefault();
          window.open("#/item/" + item.id, "_blank");
        }
      });
      const del = el("button", {
        class: "owner-iconbtn owner-iconbtn--danger",
        type: "button",
        title: t("delete"),
        text: "🗑",
        onClick: (e) => {
          e.preventDefault();
          if (!confirm(t("confirmDelete"))) return;
          DATA.items = DATA.items.filter((x) => x.id !== item.id);
          GV.persistOwnerMenu();
          GV.showToast(t("saved"));
          GV.navigate("#/owner/products");
        }
      });
      const sw = el("button", {
        class: "owner-switch" + (item.hidden ? "" : " owner-switch--on"),
        type: "button",
        title: t("toggleVisible"),
        "aria-label": t("toggleVisible"),
        onClick: (e) => {
          e.preventDefault();
          item.hidden = !item.hidden;
          GV.persistOwnerMenu();
          GV.navigate("#/owner/products");
        }
      });
      const edit = el("a", {
        class: "owner-iconbtn",
        href: "#/owner/products/" + item.id,
        title: t("edit"),
        text: "✎"
      });
      actions.appendChild(view);
      actions.appendChild(del);
      actions.appendChild(sw);
      actions.appendChild(edit);
      act.appendChild(actions);
      tr.appendChild(act);
      tb.appendChild(tr);
    });
    table.appendChild(tb);
    card.appendChild(table);
    inner.appendChild(card);

    GV.view.replaceChildren(shell("products", inner));
  }

  function compressPhotoFile(file, maxDim, q) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", q));
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  function renderProductEdit(id) {
    const item = DATA.items.find((x) => x.id === id);
    if (!item) {
      GV.navigate("#/owner/products");
      return;
    }
    showOwnerChrome();
    let editLang = I18N.get() || "en";

    const inner = el("div", {});
    inner.appendChild(
      el("a", {
        href: "#/owner/products",
        class: "owner__sub",
        style: "display:inline-block;margin-bottom:12px;text-decoration:none;color:#0d9488;font-weight:600;",
        text: "← " + t("backList")
      })
    );
    inner.appendChild(el("h1", { class: "owner__h1", text: t("editProduct") }));
    inner.appendChild(
      el("p", { class: "owner__sub", text: item.name.en || item.name[editLang] || id })
    );

    inner.appendChild(
      el("div", { class: "owner-hintbox", text: t("editHint") })
    );

    const flags = el("div", { class: "owner-flags" });
    LANGS.forEach((lg) => {
      const b = el("button", {
        type: "button",
        class: "owner-flag" + (editLang === lg ? " owner-flag--on" : ""),
        text: FLAGS[lg] || lg,
        onClick: () => {
          editLang = lg;
          syncFields();
          flags.querySelectorAll(".owner-flag").forEach((x) => x.classList.remove("owner-flag--on"));
          b.classList.add("owner-flag--on");
        }
      });
      flags.appendChild(b);
    });
    inner.appendChild(flags);

    const grid = el("div", { class: "owner-form-grid" });
    const nameIn = el("input", { type: "text", class: "owner-field", id: "ownName" });
    const descIn = el("textarea", { id: "ownDesc" });
    const priceIn = el("input", { type: "number", step: "0.01", id: "ownPrice" });
    const curIn = el("input", { type: "text", maxlength: 3, id: "ownCur", style: "max-width:72px" });
    const catSel = el("select", { id: "ownCat" });
    DATA.categories.forEach((c) => {
      catSel.appendChild(
        el("option", { value: c.id, text: categoryLabel(c.id) })
      );
    });
    const menuTypeIn = el("input", { type: "text", id: "ownMenuType", placeholder: "CARTA" });
    const sectionIn = el("input", { type: "text", id: "ownSection", placeholder: t("sectionPh") });

    const thumb = el("img", {
      class: "owner-media__thumb",
      src: GV.getPhotoUrl(item),
      alt: ""
    });
    const fileIn = el("input", { type: "file", accept: "image/*", id: "ownFile" });
    const media = el("div", { class: "owner-media" });
    media.appendChild(thumb);
    media.appendChild(
      el("label", {}, [
        fileIn,
        document.createTextNode(" " + t("videoImage"))
      ])
    );
    fileIn.addEventListener("change", async () => {
      const f = fileIn.files && fileIn.files[0];
      if (!f) return;
      try {
        item.photoUrl = await compressPhotoFile(f, 900, 0.75);
        thumb.src = item.photoUrl;
        GV.showToast(t("photoOk"));
      } catch (_) {
        GV.showToast(t("imageErr"));
      }
    });

    function syncFields() {
      item.name = item.name || {};
      item.description = item.description || {};
      nameIn.value = item.name[editLang] || "";
      descIn.value = item.description[editLang] || "";
      priceIn.value = String(item.price != null ? item.price : "");
      curIn.value = item.currency || "€";
      catSel.value = item.category || "mains";
      menuTypeIn.value = item.menuType || "CARTA";
      sectionIn.value = item.sectionLabel || categoryLabel(item.category);
    }
    syncFields();

    const count = el("div", {
      id: "ownCount",
      style: "font-size:12px;color:#64748b;text-align:right;margin-top:-8px;"
    });
    function updateCount() {
      const n = (descIn.value || "").length;
      count.textContent = n + " / 3000";
    }
    descIn.addEventListener("input", updateCount);
    updateCount();

    grid.appendChild(el("div", { class: "owner-field" }, [el("label", { text: t("productName") }), nameIn]));
    grid.appendChild(el("div", { class: "owner-field" }, [el("label", { text: t("description") }), descIn, count]));
    grid.appendChild(
      el("div", { style: "display:grid;grid-template-columns:1fr 88px;gap:10px;" }, [
        el("div", { class: "owner-field" }, [el("label", { text: t("price") }), priceIn]),
        el("div", { class: "owner-field" }, [el("label", { text: t("currency") }), curIn])
      ])
    );
    grid.appendChild(el("div", { class: "owner-field" }, [el("label", { text: t("category") }), catSel]));
    grid.appendChild(el("div", { class: "owner-field" }, [el("label", { text: t("menuType") }), menuTypeIn]));
    grid.appendChild(el("div", { class: "owner-field" }, [el("label", { text: t("sectionCol") }), sectionIn]));
    grid.appendChild(el("div", { class: "owner-field" }, [el("label", { text: t("media") }), media]));

    inner.appendChild(grid);

    const save = el("button", {
      class: "owner-btn",
      type: "button",
      style: "max-width:280px;margin-top:18px;",
      text: t("update"),
      onClick: () => {
        item.name[editLang] = nameIn.value;
        item.description[editLang] = descIn.value;
        item.price = parseFloat(priceIn.value) || 0;
        item.currency = curIn.value || "€";
        item.category = catSel.value;
        item.menuType = menuTypeIn.value || "CARTA";
        item.sectionLabel = sectionIn.value || "";
        item.ownerUpdated = new Date().toISOString();
        GV.persistOwnerMenu();
        GV.showToast(t("saved"));
        GV.navigate("#/owner/products");
      }
    });
    inner.appendChild(save);

    GV.view.replaceChildren(shell("products", inner));
  }

  function aggregateVisitsByDay() {
    const log = GV.loadJson("gv.analytics.log", []);
    const by = {};
    log.forEach((row) => {
      const d = row.d || (row.t && new Date(row.t).toISOString().slice(0, 10));
      if (!d) return;
      by[d] = (by[d] || 0) + 1;
    });
    const keys = Object.keys(by).sort();
    return { keys, vals: keys.map((k) => by[k]) };
  }

  function renderAnalytics() {
    showOwnerChrome();
    const inner = el("div", {});
    inner.appendChild(el("h1", { class: "owner__h1", text: t("trafficTitle") }));
    inner.appendChild(el("p", { class: "owner__sub", text: t("trafficSub") }));

    const card = el("div", { class: "owner-card owner-chart-wrap" });
    const canvas = el("canvas", { id: "ownChart", width: 800, height: 320 });
    card.appendChild(canvas);
    inner.appendChild(card);

    GV.view.replaceChildren(shell("analytics", inner));

    function drawChart() {
      if (!window.Chart || !document.getElementById("ownChart")) return;
      const canvas = document.getElementById("ownChart");
      const { keys, vals } = aggregateVisitsByDay();
      if (ownerChartInst) {
        ownerChartInst.destroy();
        ownerChartInst = null;
      }
      ownerChartInst = new window.Chart(canvas.getContext("2d"), {
        type: "line",
        data: {
          labels: keys.length ? keys : [t("noData")],
          datasets: [
            {
              label: t("visitsPerDay"),
              data: keys.length ? vals : [0],
              borderColor: "#0ea5e9",
              backgroundColor: "rgba(14,165,233,0.12)",
              tension: 0.25,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: true } },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0 } }
          }
        }
      });
    }

    if (window.Chart) {
      drawChart();
    } else {
      let s = document.querySelector("script[data-gv-chart]");
      if (!s) {
        s = document.createElement("script");
        s.dataset.gvChart = "1";
        s.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";
        document.head.appendChild(s);
      }
      if (window.Chart) {
        drawChart();
      } else {
        s.addEventListener("load", drawChart, { once: true });
        s.addEventListener(
          "error",
          () => {
            card.appendChild(el("p", { text: t("chartOffline") }));
          },
          { once: true }
        );
      }
    }
  }

  function renderUsers() {
    showOwnerChrome();
    const inner = el("div", {});
    inner.appendChild(el("h1", { class: "owner__h1", text: t("usersTitle") }));
    inner.appendChild(el("p", { class: "owner__sub", text: t("usersSub") }));
    const card = el("div", { class: "owner-card owner-table-wrap" });
    const table = el("table", { class: "owner-table" });
    table.appendChild(
      el("thead", {}, [
        el("tr", {}, [
          el("th", { text: t("memberName") }),
          el("th", { text: t("memberEmail") }),
          el("th", { text: t("memberRole") }),
          el("th", { text: t("colStatus") })
        ])
      ])
    );
    const tb = el("tbody", {});
    DEMO_MEMBERS.forEach((m) => {
      tb.appendChild(
        el("tr", {}, [
          el("td", { text: m.name }),
          el("td", { text: m.email }),
          el("td", { text: m.role === "owner" ? t("roleOwner") : t("roleMember") }),
          el("td", {
            text: m.status === "active" ? t("memberActive") : t("memberPending")
          })
        ])
      );
    });
    table.appendChild(tb);
    card.appendChild(table);
    inner.appendChild(card);
    GV.view.replaceChildren(shell("users", inner));
  }

  function renderExport() {
    showOwnerChrome();
    const inner = el("div", {});
    inner.appendChild(el("h1", { class: "owner__h1", text: t("exportTitle") }));
    inner.appendChild(el("p", { class: "owner__sub", text: t("exportSub") }));
    const blob = new Blob([JSON.stringify(DATA, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    inner.appendChild(
      el("a", {
        class: "owner-btn",
        href: url,
        download: "gastovision-menu.json",
        text: t("downloadJson")
      })
    );
    inner.appendChild(
      el("p", {
        class: "owner__sub",
        style: "margin-top:20px;",
        text: t("exportNote")
      })
    );
    GV.view.replaceChildren(shell("export", inner));
  }

  function renderRestaurants() {
    showOwnerChrome();
    const inner = el("div", {});
    inner.appendChild(el("h1", { class: "owner__h1", text: t("restaurantsTitle") }));
    inner.appendChild(el("p", { class: "owner__sub", text: t("restaurantsSub") }));
    const grid = el("div", { class: "owner-form-grid" });
    const nameIn = el("input", { type: "text", value: DATA.restaurant.name || "" });
    const heroIn = el("input", {
      type: "text",
      value: DATA.restaurant.hero || "",
      placeholder: "URL or path to hero image"
    });
    const tagEn = el("input", {
      type: "text",
      value: (DATA.restaurant.tagline && DATA.restaurant.tagline.en) || ""
    });
    grid.appendChild(el("div", { class: "owner-field" }, [el("label", { text: t("restName") }), nameIn]));
    grid.appendChild(el("div", { class: "owner-field" }, [el("label", { text: t("heroUrl") }), heroIn]));
    grid.appendChild(el("div", { class: "owner-field" }, [el("label", { text: t("taglineEn") }), tagEn]));
    inner.appendChild(grid);
    inner.appendChild(
      el("button", {
        class: "owner-btn",
        type: "button",
        style: "max-width:280px;margin-top:12px;",
        text: t("update"),
        onClick: () => {
          DATA.restaurant.name = nameIn.value;
          DATA.restaurant.hero = heroIn.value;
          DATA.restaurant.tagline = DATA.restaurant.tagline || {};
          DATA.restaurant.tagline.en = tagEn.value;
          LANGS.forEach((lg) => {
            if (lg !== "en") DATA.restaurant.tagline[lg] = tagEn.value;
          });
          GV.persistOwnerMenu();
          GV.showToast(t("saved"));
        }
      })
    );
    GV.view.replaceChildren(shell("restaurants", inner));
  }

  function renderStub(slug) {
    showOwnerChrome();
    const inner = el("div", {});
    inner.appendChild(el("h1", { class: "owner__h1", text: t("comingTitle") }));
    inner.appendChild(
      el("p", { class: "owner__sub", text: t("comingSub").replace("{page}", slug) })
    );
    GV.view.replaceChildren(shell(slug, inner));
  }

  GV._routeHooks.unshift(function (parts) {
    if (parts[0] !== "owner") return false;

    const sub = (parts[1] || "login").split("?")[0];

    if (sub === "login") {
      if (isSession()) {
        GV.navigate("#/owner/products");
        return true;
      }
      renderLogin();
      return true;
    }

    if (!isSession()) {
      GV.navigate("#/owner/login");
      return true;
    }

    if (sub === "logout") {
      clearSession();
      GV.navigate("#/owner/login");
      return true;
    }

    if (sub === "products" && parts[2]) {
      renderProductEdit(parts[2].split("?")[0]);
      return true;
    }
    if (sub === "products") {
      renderProducts();
      return true;
    }
    if (sub === "analytics") {
      renderAnalytics();
      return true;
    }
    if (sub === "users") {
      renderUsers();
      return true;
    }
    if (sub === "export") {
      renderExport();
      return true;
    }
    if (sub === "restaurants") {
      renderRestaurants();
      return true;
    }

    renderStub(sub);
    return true;
  });
})();
