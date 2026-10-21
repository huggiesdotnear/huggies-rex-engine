// ========================================
// PRINT_SUMMARY
// bin primitive that prints the one-line result summary a bin ends
// on. api_intear_get already logs the framed request/response block,
// so this only adds the short human-readable line underneath it.
// ========================================

export function print_summary(label: string, summary: string): void {
  console.log(label, summary);
}
// ========================================
// copyright 2026 by sleet.near
