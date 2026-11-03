// ========================================
// the metadata grid — the rows of LABEL and VALUE that a token's page
// shows.
//
// it is shared: the token page and the $SHIT page both show one, so the grid
// lives here and both pages render it. the grid's rules live in
// lib/css/components/shared/token_meta_grid.css.
//
// --- WHY --- THE ROW IS EXPORTED: the token page's card shows the name
// and the id as LABEL and VALUE rows too, and they must be the SAME
// element as the grid's rows — a reader who sees a label above a value
// in the grid must see the same label above a value in the card. a
// second row with its own class would be a second shape for the same
// thing.
export function shit_1170_token_meta_row_fun(
  label: string,
  value: string,
): preact.JSX.Element {
  return (
    <div class="meta-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
// ========================================
export function shit_1170_token_meta_grid_fun(
  rows: ReadonlyArray<{ label: string; value: string }>,
): preact.JSX.Element {
  return (
    <div class="token-meta">
      {rows.map((row) => shit_1170_token_meta_row_fun(row.label, row.value))}
    </div>
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
