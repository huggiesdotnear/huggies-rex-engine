// ========================================
// INTEAR_BUILD_QUERY
// turn a params object into an intear query string. the encoding
// rules are intear's, not generic url ones, so this cannot be
// replaced by URLSearchParams.
// ========================================

// render a single scalar. numbers and booleans keep their literal js
// form; everything else is stringified.
function encode_scalar_fun(value: unknown): string {
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number")
    return Number.isFinite(value) ? String(value) : "null";
  return String(value);
}

function is_record_fun(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// --- WHY --- the three special cases below are not conveniences, they
// are workarounds for how intear parses the query string:
//   * `where` keys are unprefixed at the top level, not `where.x`.
//   * a list is comma separated, not repeated (`fields=a&fields=b`).
//   * sort.desc must become the `-field` form; url-encoded booleans
//     arrive as the string "true", which the server rejects.
export function intear_build_query(params: Record<string, unknown>): string {
  const parts: string[] = [];

  const append = (key: string, value: unknown): void => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      const csv = value
        .filter((v) => v !== undefined && v !== null)
        .map((v) => encode_scalar_fun(v))
        .join(",");
      if (csv.length > 0) {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(csv)}`);
      }
      return;
    }

    if (is_record_fun(value)) {
      for (const [nested_key, nested_value] of Object.entries(value)) {
        append(`${key}.${nested_key}`, nested_value);
      }
      return;
    }

    parts.push(
      `${encodeURIComponent(key)}=${encodeURIComponent(encode_scalar_fun(value))}`,
    );
  };

  for (const [key, value] of Object.entries(params)) {
    if (key === "where" && is_record_fun(value)) {
      for (const [where_key, where_value] of Object.entries(value)) {
        append(where_key, where_value);
      }
      continue;
    }
    if (
      key === "sort" &&
      is_record_fun(value) &&
      typeof value["by"] === "string"
    ) {
      append("sort", value["desc"] === true ? `-${value["by"]}` : value["by"]);
      continue;
    }
    append(key, value);
  }

  return parts.join("&");
}
// ========================================
// copyright 2026 by sleet.near
