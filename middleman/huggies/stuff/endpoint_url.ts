// ========================================
// ENDPOINT_URL
// compose a full fetch url from an endpoint key + params. thin glue
// over ENDPOINT_PATHS + render_path. returns just the path so the
// caller still controls the base url.
// ========================================

import { ENDPOINT_PATHS, type EndpointKey } from "./endpoint_paths";
import { render_path } from "./render_path";

export function endpoint_url(
  key: EndpointKey,
  params: Record<string, string | number> = {},
): string {
  return render_path(ENDPOINT_PATHS[key], params);
}
// ========================================
// copyright 2026 by sleet.near
