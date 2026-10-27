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
// browser keeps it for a year and never revalidates it.
//
// so the app asks for `icon_hash` and builds the url from it. the same
// thing the intear wallet does.
//
// --- WHY --- the hash is content addressed: it changes whenever the
// icon does, so a changed icon is a changed url and the old cached
// copy is never shown for a new icon. tokens that share an icon share
// the hash, and so share one cached url.
//
// --- WHY --- the icon is a WEBP and not the original svg. the api
// rasterises svg icons, so a token with an svg icon gets a webp here
// too. the original svg is still available as the `icon` field when a
// caller genuinely wants the source.
const HUGGIES_INTEAR_BASE_URL = "https://api.intea.rs";

// ========================================
// the icon url for an icon hash, or null when there is no hash.
//
// a token with no icon has no hash: the api answers with `null` for
// both. that is a real answer, not a miss, so the caller must not ask
// again for it.
export function token_icon_url_fun(icon_hash: string | null): string | null {
  if (icon_hash === null || icon_hash.length === 0) return null;
  return `${HUGGIES_INTEAR_BASE_URL}/icon/${encodeURIComponent(icon_hash)}.webp`;
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
