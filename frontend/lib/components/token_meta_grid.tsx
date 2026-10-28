// ========================================
// the metadata grid — the rows of LABEL and VALUE that a token's page
// shows.
//
// it is shared: the token page and the $SHIT page both show one, so
// the grid lives here and both pages render it. the grid's rules live
// in lib/css/components/HUGGIES_COMPONENT_TOKEN_META_GRID.css.
// ========================================
// one row of the grid: the label above the value.
function token_meta_row_fun(label: string, value: string): preact.JSX.Element {
  return (
    <div class="huggies-token-meta-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
// ========================================
// the grid itself, filled with the rows it is given.
export function huggies_token_meta_grid_fun(
  rows: ReadonlyArray<{ label: string; value: string }>,
): preact.JSX.Element {
  return (
    <div class="huggies-token-meta">
      {rows.map((row) => token_meta_row_fun(row.label, row.value))}
    </div>
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
