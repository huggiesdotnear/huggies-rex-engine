// ========================================
// map an INTEAR token row to a name-keyed record. the api always
// prepends `account_id` to the returned columns, even when it was not
// among the requested fields, so a row read by fixed index is off by
// one. mapping by the response's own column names removes the guess.
// ========================================

// ========================================
// --- SHAPE ------------------------------
// one token row keyed by column name.
export type HUGGIES_TOKEN_ROW_BY_NAME = Record<string, unknown>;
// ========================================
// --- MAP -------------------------------
// zip a row with its column names into a name-keyed record.
export function token_row_by_name_fun(
  columns: ReadonlyArray<string>,
  row: ReadonlyArray<unknown>,
): HUGGIES_TOKEN_ROW_BY_NAME {
  const out: HUGGIES_TOKEN_ROW_BY_NAME = {};
  for (let index = 0; index < columns.length; index += 1) {
    out[columns[index]] = row[index];
  }
  return out;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
