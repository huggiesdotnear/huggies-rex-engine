// ========================================
// SPLIT_ARGV
// bin primitive that separates positional args from flags in one
// pass, so every bin parses argv the same way.
//
// a flag listed in BOOLEAN_FLAGS (e.g. --desc) stands alone with no
// value; every other --flag takes the next token as its value.
//
// booleans are tracked by index rather than stored in the map, so a
// bin reads `has_flag(argv, "--desc")` instead of guessing whether
// the map holds "true" or an empty string.
// ========================================

// --- WHY --- these flags take no value. treating them as
// value-taking would swallow the next positional as their value, so
// they must be listed here rather than handled by convention.
export const BOOLEAN_FLAGS = new Set(["--desc"]);

export interface SPLIT_ARGV_RESULT {
  positional: string[];
  flags: Map<string, string>;
  // true when the flag appeared in argv at all, boolean or not.
  seen: Set<string>;
}

export function split_argv(argv: string[]): SPLIT_ARGV_RESULT {
  const positional: string[] = [];
  const flags = new Map<string, string>();
  const seen = new Set<string>();

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }
    seen.add(token);
    if (BOOLEAN_FLAGS.has(token)) continue;

    const value = argv[i + 1];
    // --- WHY --- a trailing flag with no value is a typo far more
    // often than a deliberate empty string, and a value-taking flag
    // must never swallow the next positional.
    if (value === undefined || value.startsWith("--")) {
      console.error(`split_argv: ${token} was passed without a value`);
      process.exit(1);
    }
    flags.set(token, value);
    i++;
  }

  return { positional, flags, seen };
}
// ========================================
// copyright 2026 by sleet.near
