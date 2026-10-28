// ========================================
// HUGGIES_BUILD_QUERY
// turn a params object into a query string for our own backend routes.
//
// --- WHY --- the params of our routes are plain: an account id, a
// boolean, a couple of numbers. URLSearchParams would do the same
// job, but it hides one rule this repo cares about — a param that is
// `undefined` is NOT sent at all, while `false` and `0` ARE sent.
// getting that wrong silently drops a query param the route reads.
//
// --- WHY --- unlike intear's builder (middleman/intear/stuff/), the
// encoding here is generic: no nested keys, no csv lists, no special
// sort syntax. our routes take flat params only, so a flat builder
// is enough.
// ========================================

function is_record_fun(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// render a single scalar. booleans become "true"/"false", numbers
// keep their literal form, everything else is stringified.
function encode_scalar_fun(value: unknown): string {
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number")
    return Number.isFinite(value) ? String(value) : "null";
  return String(value);
}

// build the query string (no leading "?"). an empty param set gives
// an empty string, so the caller can decide whether to append "?".
export function huggies_build_query(params: Record<string, unknown>): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    // undefined and null mean "not sent". false and 0 are real
    // values and DO get sent.
    if (value === undefined || value === null) continue;

    if (is_record_fun(value)) {
      // a nested object is not a shape our routes take, so it is
      // flattened one level: { a: { b: 1 } } -> "a.b=1".
      for (const [nested_key, nested_value] of Object.entries(value)) {
        if (nested_value === undefined || nested_value === null) continue;
        parts.push(
          `${encodeURIComponent(`${key}.${nested_key}`)}=${encodeURIComponent(
            encode_scalar_fun(nested_value),
          )}`,
        );
      }
      continue;
    }

    if (Array.isArray(value)) {
      const csv = value
        .filter((v) => v !== undefined && v !== null)
        .map((v) => encode_scalar_fun(v))
        .join(",");
      if (csv.length > 0) {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(csv)}`);
      }
      continue;
    }

    parts.push(
      `${encodeURIComponent(key)}=${encodeURIComponent(encode_scalar_fun(value))}`,
    );
  }

  return parts.join("&");
}
// ========================================
// copyright 2026 by sleet.near
