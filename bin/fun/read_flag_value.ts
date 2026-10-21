// ========================================
// READ_FLAG_VALUE
// bin primitive that pulls a `--flag <value>` pair out of an argv
// array a bin is already looping over. returns undefined when the
// flag is absent, and exits 1 when it is present with no value (a
// typo is far more likely than a deliberate empty string).
// ========================================

export function read_flag_value(
  argv: string[],
  index: number,
  flag: string,
): string | undefined {
  const value = argv[index + 1];
  if (value === undefined || value === "") {
    console.error(`read_flag_value: ${flag} was passed without a value`);
    process.exit(1);
  }
  return value;
}
// ========================================
// copyright 2026 by sleet.near
