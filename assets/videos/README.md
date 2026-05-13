# Real dish videos go here

Drop short MP4 clips in this folder named after the dish `id`:

```
assets/videos/ham-croquettes.mp4
assets/videos/prosciutto-pizza.mp4
assets/videos/seafood-paella.mp4
…
```

The app will pick them up automatically. **No code changes needed.**

## How the fallback works

For every dish the app tries to load `assets/videos/<id>.mp4` the first time
the user taps the play button. If the file exists, it plays. If it doesn't,
the play button switches into **Ken Burns mode** — a slow cinematic
pan/zoom on the dish photo at `assets/img/dishes/<id>.jpg` — so the
"video" is always perfectly on-topic.

## Recommended specs

- **Length:** 4–8 seconds, no cuts (it loops).
- **Aspect ratio:** 16:9 or 4:5 (matches the cards).
- **Resolution:** 720p is plenty (saves bandwidth on 4G).
- **Audio:** muted is fine — videos auto-play silently to satisfy mobile autoplay rules.
- **Format:** `.mp4` (H.264). For best browser support use baseline profile.

## Generating clips with AI

These models are great for short food b-roll:

- **Veo 3** — Google AI Studio. Free tier with daily quota. Best free option.
- **Runway Gen-3 / Gen-4** — paid, fastest workflow, easy MP4 export.
- **Pika 2.x**, **Luma Dream Machine**, **Kling AI** — all good alternatives.
- **Sora** (ChatGPT Pro) — best quality, gated.

### A solid prompt template

> Cinematic restaurant food shot of [DISH], [ANGLE: top-down / 45 degrees / eye-level], dramatic moody side-lighting, warm tungsten tone, dark walnut wood table, shallow depth of field, slow [push-in / orbit / dolly] motion, slight steam rising, photorealistic, 4k, 24fps, 5 seconds, no cuts, looping.

### Per-dish ideas

| Dish id                 | Suggested motion                                         |
| ----------------------- | -------------------------------------------------------- |
| `ham-croquettes`        | Slow push-in on a hand cutting a croquette in half       |
| `tomato-salad`          | Top-down rotation as olive oil is drizzled               |
| `pulled-pork-quesadilla`| Macro pull-apart of melting cheese                       |
| `prosciutto-pizza`      | Top-down pizza spinning slowly fresh out of the oven     |
| `matured-angus`         | Slow dolly along a sizzling cast iron pan                |
| `seafood-paella`        | Top-down zoom out from prawn to whole pan                |
| `house-vermouth`        | Slow tilt up as ice cube splashes into vermouth          |
| `smoked-old-fashioned`  | Glass dome lifting, smoke billowing                      |
| `burnt-cheesecake`      | Cake being sliced, custard interior revealed             |
| `chocolate-coulant`     | Knife cuts coulant, molten chocolate flows out           |
| `mole-tasting`          | Top-down orbit around the molcajete                      |
