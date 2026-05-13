# GastoVision

> Video menus for restaurants. Scan the QR, see the dish, tell a friend, win a free dessert.

GastoVision is a lightweight video-first digital menu webapp for restaurants — a modern alternative to PDF QR menus, inspired by products like [Gourmeats](https://www.gourmeatsapp.com/). It's a static, framework-free single-page app that runs straight on GitHub Pages.

This is **v1**: it ships the core diner experience and a post-meal feedback flow that doubles as a viral loop (recommend a friend → get a free dessert).

---

## What's inside

### 1. Diner experience (the `/menu`, `/item/:id`, `/video` routes)

- **Welcome screen.** Hero image, swipeable category cards (Starters, Mains, Drinks, Desserts, Today's Specials).
- **Categorized menu.** Sticky pill-tab navigation, photo + price + 2-line description per dish.
- **"Tap to play" videos** on every card. The app first tries `assets/videos/<dish-id>.mp4` — if that file doesn't exist, it falls back to a cinematic **Ken Burns** pan/zoom on the dish photo, so the play button is always on-topic. See `assets/videos/README.md` for prompts and recommended specs to generate real clips with Veo / Runway / Pika.
- **Item detail page** with full description, allergens, favorites toggle, and "Add to my list".
- **Vertical video reel** (`#/video`) — TikTok-style auto-playing dish reel, swipe up for the next one.
- **Favorites + "My list"** persisted to `localStorage`, with a quantity selector and a "Call the waiter" CTA.

### 2. Multi-language

- 5 languages: **English, Spanish, Portuguese, French, German**.
- Flag picker top-right; selection is remembered between sessions.
- All UI strings, dish names and descriptions are translated (see `assets/js/i18n.js` and `assets/js/data.js`).
- Browser language is auto-detected on first visit.

### 3. Post-meal feedback + viral loop (the `/feedback` flow)

A 4-step flow with progress bar, smooth transitions and a final reward:

1. **How was your meal?** — emoji rating (Loved it → Bad).
2. **Which dishes blew your mind?** — multi-select grid.
3. **Anything for the chef?** — optional one-line note.
4. **Recommend a friend.** — name, email, friend's name + email/phone, channel toggle (Email or WhatsApp), personal message. On submit, opens the user's mail client or WhatsApp with the prefilled message + link.
5. **Reward screen** — confetti, a "free dessert" voucher with a generated code, expiry and "show this to your waiter" prompt.

Submissions are intentionally **fake**: the email/WhatsApp client opens locally, no backend is required for the demo. A real deployment would post to a serverless function.

---

## Run it locally

It's pure HTML/CSS/JS, no build step:

```bash
# Any static server works. Two quick options:
python3 -m http.server 8000
# or
npx serve .
```

Open `http://localhost:8000`.

## Deploy to GitHub Pages

The repo is configured to deploy automatically on push to `main` via the included GitHub Actions workflow (`.github/workflows/pages.yml`).

To enable it the first time:

1. Push the repo: `git push -u origin main`.
2. Go to **Settings → Pages** in the GitHub repo.
3. Set **Source** to **GitHub Actions**.
4. The next push will deploy. Your menu will be live at `https://<user>.github.io/gastovisionai/`.

The QR code on each restaurant table would point to a URL like:

```
https://<user>.github.io/gastovisionai/?r=el-patio
```

(`?r=` is reserved for future per-restaurant theming — v1 ships a single demo restaurant.)

---

## Project structure

```
.
├── index.html               # SPA shell (top bar + view + tab bar)
├── assets/
│   ├── css/styles.css       # Visual system, animations, responsive
│   └── js/
│       ├── i18n.js          # 5-language dictionaries + helpers
│       ├── data.js          # Demo restaurant + menu items
│       └── app.js           # Hash router, views, feedback flow
├── .github/workflows/pages.yml  # Auto-deploy to GitHub Pages
├── .nojekyll                # Disable Jekyll (lets `_` paths through)
└── README.md
```

## Roadmap (v2 ideas)

- Multi-restaurant support driven by `?r=<slug>` and a JSON manifest.
- Admin/manager view for editing menu, prices and availability.
- Real backend for feedback (e.g. Cloudflare Worker → Postgres / Resend / WhatsApp API).
- "Order & pay" flow on top of "My list".
- A/B test of welcome layouts to measure scan→browse→add-to-list conversion.
- Per-dish analytics: views, plays, adds, favorites.

---

Made for restaurants that want their menu to stop being a PDF.
