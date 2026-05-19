/**
 * GastoVision — Supabase-backed published demos
 * Requires window.GV_SUPABASE_URL and window.GV_SUPABASE_ANON_KEY
 */
(function () {
  const TABLE = "published_demos";
  const CODE_LEN = 7;
  const CODE_CHARS = "abcdefghijklmnopqrstuvwxyz23456789";

  let _clientPromise = null;

  function config() {
    const url =
      (typeof window !== "undefined" && window.GV_SUPABASE_URL) || "";
    const key =
      (typeof window !== "undefined" && window.GV_SUPABASE_ANON_KEY) || "";
    return { url: url.replace(/\/$/, ""), key: key.trim() };
  }

  function isConfigured() {
    const c = config();
    return !!(c.url && c.key && !/your-anon-key/i.test(c.key));
  }

  async function getClient() {
    if (!isConfigured()) throw new Error("Supabase not configured");
    if (!_clientPromise) {
      _clientPromise = import(
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.8/+esm"
      ).then(function (mod) {
        return mod.createClient(config().url, config().key);
      });
    }
    return _clientPromise;
  }

  function randomShortCode() {
    let s = "";
    for (let i = 0; i < CODE_LEN; i++) {
      s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    return s;
  }

  function appBasePath() {
    const path = location.pathname.replace(/\/$/, "/");
    return location.origin + path;
  }

  function buildAppUrl(shortCode) {
    return appBasePath() + "#/d/" + encodeURIComponent(shortCode);
  }

  function buildShortRedirectUrl(shortCode) {
    const base =
      (typeof window !== "undefined" && window.GV_SUPABASE_SHORT_BASE) || "";
    if (!base) return null;
    return base.replace(/\/$/, "") + "/" + encodeURIComponent(shortCode);
  }

  async function savePublishedDemo(data, restaurantName) {
    const supabase = await getClient();
    const payload = JSON.parse(JSON.stringify(data));

    for (let attempt = 0; attempt < 8; attempt++) {
      const shortCode = randomShortCode();
      const row = {
        short_code: shortCode,
        restaurant_name: restaurantName || null,
        payload: payload
      };
      const { error } = await supabase.from(TABLE).insert(row);
      if (!error) {
        const appUrl = buildAppUrl(shortCode);
        const shortUrl = buildShortRedirectUrl(shortCode) || appUrl;
        return {
          shortCode: shortCode,
          appUrl: appUrl,
          shortUrl: shortUrl,
          id: shortCode
        };
      }
      if (error.code !== "23505") throw error;
    }
    throw new Error("Could not allocate a unique short code");
  }

  async function fetchPublishedDemo(shortCode) {
    const supabase = await getClient();
    const code = String(shortCode || "")
      .split("?")[0]
      .trim()
      .toLowerCase();
    if (!code) throw new Error("missing code");

    const { data, error } = await supabase
      .from(TABLE)
      .select("payload, restaurant_name, short_code")
      .eq("short_code", code)
      .maybeSingle();

    if (error) throw error;
    if (!data || !data.payload) throw new Error("not found");
    return data.payload;
  }

  window.GVSupabaseDemo = {
    isConfigured,
    savePublishedDemo,
    fetchPublishedDemo,
    buildAppUrl,
    buildShortRedirectUrl
  };
})();
