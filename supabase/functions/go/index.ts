/**
 * Optional short redirect: GET /functions/v1/go/{short_code}
 * → 302 to https://your-site.github.io/gastovisionai/#/d/{short_code}
 *
 * Deploy: supabase functions deploy go --project-ref zhscpcfgcctdhkpcmdmg
 * Set secret: supabase secrets set PUBLIC_SITE_URL=https://moralesmozart.github.io/gastovisionai
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SITE =
  Deno.env.get("PUBLIC_SITE_URL") ||
  "https://moralesmozart.github.io/gastovisionai";

Deno.serve((req) => {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const code = parts[parts.length - 1];
  if (!code || code === "go") {
    return new Response("Missing short code", { status: 400 });
  }
  const target = SITE.replace(/\/$/, "") + "/#/d/" + encodeURIComponent(code);
  return Response.redirect(target, 302);
});
