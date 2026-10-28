// ========================================
// RENDER_PATH
// substitute :name placeholders in an endpoint template with values
// from a params object. throws if a placeholder is missing. url-
// encodes the values so ids with special chars don't break the path.
// ========================================

export function render_path(
  template: string,
  params: Record<string, string | number> = {},
): string {
  return template.replace(/:([a-z_]+)/gi, (_, key: string) => {
    if (!(key in params)) {
      throw new Error(`render_path: missing param "${key}" for "${template}"`);
    }
    return encodeURIComponent(String(params[key]));
  });
}
// ========================================
// copyright 2026 by sleet.near
