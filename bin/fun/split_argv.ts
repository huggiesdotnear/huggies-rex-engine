// ========================================
// SPLIT_ARGV
// bin primitive that separates positional args from flags in one pass,
// so every bin parses argv the same way. a flag listed in the bin's own
// boolean_flags takes no value; every other --flag takes the next token
// as its value.
//
// booleans are recorded in the `seen` set rather than the flags map, so
// a bin reads `seen.has("--desc")` instead of guessing whether the map
// holds "true" or an empty string.
//
// --- WHY --- the boolean flags are per-bin, not one global set. the
// huggies bins use --include-hidden, and a shared set would make one
// bin's flag swallow the next positional in another bin's argv.
// ========================================

export interface SPLIT_ARGV_OPTIONS {
  // the flags that stand alone with no value.
  boolean_flags?: Iterable<string>;
}

export interface SPLIT_ARGV_RESULT {
  positional: string[];
  flags: Map<string, string>;
  // true when the flag appeared in argv at all, boolean or not.
  seen: Set<string>;
}

export function split_argv(
  argv: string[],
  options: SPLIT_ARGV_OPTIONS = {},
): SPLIT_ARGV_RESULT {
  const boolean_flags = new Set(options.boolean_flags ?? []);
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
    if (boolean_flags.has(token)) continue;

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
