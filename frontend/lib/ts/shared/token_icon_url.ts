// ========================================
// the url of a token's icon.
//
// --- WHY --- the api's `icon` field is the icon as a full inline data
// uri — an svg or a base64 webp, a couple of kilobytes per token.
// asking for it on a page of 300 tokens costs ~880KB of the response,
// uncompressed, and ~630KB gzipped.
//
// the api also exposes `icon_hash`: 16 characters of url-safe base64
// from the icon's SHA-256. the icon itself is served at
// `/icon/<icon_hash>.webp` — a small webp of up to 128x128 — and that
// url is `Cache-Control: public, max-age=31536000, immutable`, so the
// browser keeps it for a year and never revalidates it. so the app asks
// for `icon_hash` and builds the url from it. the same thing the intear
// wallet does.
//
// --- WHY --- the hash is content addressed: it changes whenever the icon
// does, so a changed icon is a changed url and the old cached copy is
// never shown for a new icon. tokens that share an icon share the hash,
// and so share one cached url.
//
// --- WHY --- the icon is a WEBP and not the original svg: the api
// rasterises svg icons, so a token with an svg icon gets a webp here too.
// the original svg is still available as the `icon` field when a caller
// genuinely wants the source.
const HUGGIES_INTEAR_BASE_URL = "https://api.intea.rs";

// ========================================
// --- FALLBACKS -------------------------
// the icons the api cannot serve.
//
// --- WHY --- a token can have an icon and still have no `icon_hash`: the
// api rasterises the icon and hashes the RESULT, and a source svg it
// cannot rasterise — a truncated path, say — leaves it with nothing to
// hash. the api then answers `icon_hash: null` and the icon is
// unreachable through `/icon/<hash>.webp`.
//
// the case we know of is `pussy.laboratory.jumpfinance.near`: its inline
// svg is cut off mid-path at 1024 characters, so the api has no hash for
// it. the icon below is the one the token is known by.
//
// --- WHY --- the fallback lives HERE and not in each page: this function
// is the one funnel every icon url passes through, so a fallback here
// reaches every page at once — the discover list, the token page, the
// account balance tables, the game and the burn page.
//
// --- WHY --- a hardcoded url and not the api's inline icon: the inline
// icon for one of these tokens is itself the broken artifact, so using it
// would show the reader the same truncated shape.
//
// to add a token: put its account id here and the url of an image that
// shows it.
const HUGGIES_ICON_FALLBACKS: Readonly<Record<string, string>> = {
  "pussy.laboratory.jumpfinance.near": "https://i.imgur.com/zjkBYpA.jpeg",
};
// ========================================
// ========================================
// --- PUBLIC -----------------------------
// the icon url for a token, or null when the token has no icon at all.
// the api's hash first, then the fallback for a token the api cannot
// serve.
//
// --- WHY --- the token id is a parameter and not only the hash: the
// fallback is keyed by the token, so the caller has to say WHICH token it
// is asking about.
export function token_icon_for_fun(
  token_id: string,
  icon_hash: string | null | undefined,
): string | null {
  const url = token_icon_url_fun(icon_hash);
  if (url !== null) return url;
  return HUGGIES_ICON_FALLBACKS[token_id] ?? null;
}
// ========================================
// the icon url for an icon hash, or null when there is no hash.
//
// --- WHY --- a token with no icon has no hash: the api answers with
// `null` for both. that is a real answer, not a miss, so the caller must
// not ask again for it.
export function token_icon_url_fun(
  icon_hash: string | null | undefined,
): string | null {
  // the cache may still hold the old inline icon from before the hash
  // migration. old records have `icon`, not `icon_hash`, so they must
  // keep working instead of crashing on an undefined hash.
  if (typeof icon_hash === "string" && icon_hash.length > 0) {
    return `${HUGGIES_INTEAR_BASE_URL}/icon/${encodeURIComponent(icon_hash)}.webp`;
  }
  return null;
}

// ========================================
// the icon hash of an api cell, or null.
//
// the cell is `string | null` and an empty string means the same as
// null: no icon.
export function icon_hash_of_fun(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  return value;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
