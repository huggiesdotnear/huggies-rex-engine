// ========================================
// JSON_IO
// printing JSON, and keeping stdout clean.
//
// the middleman logs its request and response with `console.log`, which
// lands on STDOUT. a tool that promises pure JSON on stdout cannot have
// that banner mixed into it — a shell pipeline doing
// `JSON.parse(stdout)` breaks on it.
//
// so there are two pieces here:
//
//   * `quiet_fun` — runs a call with the middleman's logging moved to
//     stderr, so stdout holds nothing but the answer.
//   * `print_json_fun` / `print_error_fun` — write the answer to stdout
//     and the error to stderr, both as JSON.
//
// --- WHY --- THE ERRORS GO TO STDERR AND EXIT NON ZERO: a bin that
// fails still prints a JSON error, so a caller can read the reason
// without scraping prose, and the exit code says it failed.
// ========================================

/**
 * run a call with the middleman's logging moved to stderr.
 *
 * the middleman prints a banner with console.log, which lands on
 * stdout. the bins promise pure JSON on stdout, so a shell pipeline
 * doing JSON.parse(stdout) would break without this.
 */
export async function quiet_fun<T>(fn: () => Promise<T>): Promise<T> {
  const original = console.log;
  console.log = (...args: unknown[]) => {
    process.stderr.write(`${args.map((arg) => String(arg)).join(" ")}\n`);
  };
  try {
    return await fn();
  } finally {
    console.log = original;
  }
}

/**
 * write the answer to stdout, as JSON.
 */
export function print_json_fun(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

/**
 * write the reason to stderr, as JSON.
 */
export function print_error_fun(message: string): void {
  process.stderr.write(`${JSON.stringify({ ok: false, error: message })}\n`);
}
// ========================================
// copyright 2026 by sleet.near
