// ========================================
// RESOLVE_BASE_URL
// bin primitive that picks the backend base URL for a bin run. scan argv
// for an explicit `--base-url <url>` flag; when present the flag value
// wins, otherwise the bin's own DEFAULT_BASE_URL is returned.
//
// argv layout expected:
//   ["--base-url", "http://my-host:54733", ...other args...]
// only the FIRST `--base-url` flag wins here. NOTE: this differs from
// split_argv, where a repeated flag is last-write-wins.
//
// exit-1 on a present-but-empty `--base-url` (a typo is more likely
// than a deliberate empty override). does NOT validate the URL beyond
// "non-empty" — the fetch in api_call() surfaces a malformed URL as a
// network error.
//
// --- WHY --- the flag wins over the default and there is no env-var
// fallback. every invocation must be explicit about which backend it
// talks to, because the docker-mounted production vault and the local
// dev backend are different boxes.
// ========================================

export function resolve_base_url(
  argv: string[],
  default_base_url: string,
): string {
  // ========================================
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (tok === "--base-url") {
      const value = argv[i + 1];
      if (value === undefined || value === "") {
        console.error(
          "resolve_base_url: --base-url was passed without a value",
        );
        process.exit(1);
      }
      return value;
    }
  }
  return default_base_url;
  // ========================================
}
// ========================================
// copyright 2026 by sleet.near
