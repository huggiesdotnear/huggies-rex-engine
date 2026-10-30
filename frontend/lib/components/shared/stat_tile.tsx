// ========================================
// the stat tile: a label, a value, and an optional sub-label.
//
// the pumpopoly page shows six of these — land, board position, credit
// score, invites, invited by, last move — and the nft section shows one more
// for the count. they are all the same shape, so they are one component and
// not six ad-hoc blocks of markup.
//
// the tile carries a neutral class for its own look and a page prefix for
// the parts, so a page can restyle a tile without restating the whole
// shape.
//
// this component does NOT fetch. it renders what it is given.
// ========================================
// ========================================
// --- PROPS ------------------------------
export interface HUGGIES_STAT_TILE_PROPS {
  // the small label on top, e.g. "LAND".
  label: string;
  // the value in the middle. a number or a short string.
  value: string;
  // the small label under the value, e.g. "IN-GAME PLOTS". null when
  // the tile has no sub-label.
  sub?: string | null;
  // the css class prefix for the page, e.g. "pumpopoly".
  class_prefix: string;
  // true when the value is text rather than a number. a text value
  // renders smaller, because a name like "sputnik-dao.near" at number
  // size would not fit the tile.
  is_text?: boolean;
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function huggies_stat_tile_fun(
  props: HUGGIES_STAT_TILE_PROPS,
): preact.JSX.Element {
  return (
    <>
      <article class="stat-tile">
        <span class={`${props.class_prefix}-label`}>{props.label}</span>
        <strong
          class={
            props.is_text === true
              ? `${props.class_prefix}-text`
              : `${props.class_prefix}-value`
          }
        >
          {props.value}
        </strong>
        {props.sub !== null && props.sub !== undefined && (
          <span class={`${props.class_prefix}-sub`}>{props.sub}</span>
        )}
      </article>
    </>
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
