// ========================================
// REQUEST_OPTIONS
// per-call bag for things that aren't part of the request payload
// itself: session tokens, encryption passwords, and an optional
// header passthrough.
//
// `build_headers` turns an options bag + caller-supplied headers into
// the final header map. keys it knows about:
//
//   session_token       -> X-Session-Token: <token>
//   encryption_password -> Encryption-Password: <password>
//
// any other header the caller supplies is passed through verbatim.
// ========================================

export interface REQUEST_OPTIONS {
  session_token?: string;
  encryption_password?: string;
  headers?: Record<string, string>;
}

export function build_headers(
  options: REQUEST_OPTIONS = {},
  extra: Record<string, string> = {},
): Record<string, string> {
  const out: Record<string, string> = {};
  if (options.session_token) {
    out["x-session-token"] = options.session_token;
  }
  if (options.encryption_password) {
    out["encryption-password"] = options.encryption_password;
  }
  Object.assign(out, extra, options.headers ?? {});
  return out;
}

// ========================================
// copyright 2026 by sleet.near
