// ========================================
// shared discover-card definitions for supported smart contracts.
// ========================================
export interface HUGGIES_CONTRACT_CARD {
  key: string;
  title: string;
  contract_id: string;
  page: string;
}
// ========================================
// list contract links for discover surfaces.
export function list_contract_cards_fun(): HUGGIES_CONTRACT_CARD[] {
  return [
    {
      key: "rhea-amm",
      title: "Rhea AMM",
      contract_id: "v2.ref-finance.near",
      page: "rhea-amm.html",
    },
    {
      key: "rhea-dcl-v2",
      title: "Rhea DCL v2",
      contract_id: "dclv2.ref-labs.near",
      page: "rhea-dcl-v2.html",
    },
    {
      key: "intear-dex",
      title: "INTEAR DEX engine",
      contract_id: "dex.intear.near",
      page: "intear-dex.html",
    },
    {
      key: "sputnik-dao",
      title: "Sputnik DAO",
      contract_id: "huggies.sputnik-dao.near",
      page: "sputnik-dao.html",
    },
    {
      key: "pumpopoly",
      title: "Pumpopoly",
      contract_id: "world.pumpopoly.near",
      page: "pumpopoly.html",
    },
  ];
}
// ========================================
// the directory of the current page below frontend/app/, as a path
// segment list. [] means the page sits directly in frontend/app/.
// --- WHY --- the contract pages live in frontend/app/contracts/, so a
// link to one has to be relative to the page you are ON, not to a
// fixed depth. a depth-only rule breaks the moment the same component
// is mounted from a third directory.
function current_app_dir_segments_fun(): string[] {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return [];
  }
  const marker = "/app/";
  const marker_index = window.location.pathname.lastIndexOf(marker);
  if (marker_index === -1) return [];
  const after_app = window.location.pathname.slice(
    marker_index + marker.length,
  );
  const slash_index = after_app.lastIndexOf("/");
  if (slash_index === -1) return [];
  return after_app
    .slice(0, slash_index)
    .split("/")
    .filter((part) => part.length > 0);
}
// ========================================
// build a relative href from one directory (below frontend/app/) to
// another. both are given as segment lists.
function relative_href_fun(
  from_dir: readonly string[],
  to_dir: readonly string[],
  file_name: string,
): string {
  let shared = 0;
  while (
    shared < from_dir.length &&
    shared < to_dir.length &&
    from_dir[shared] === to_dir[shared]
  ) {
    shared += 1;
  }
  const up = from_dir.length - shared;
  const down = to_dir.slice(shared);
  const parts = ["..".repeat(up), ...down, file_name].filter(
    (part) => part.length > 0,
  );
  return parts.join("/");
}
// ========================================
// build the href for one contract page, relative to the page the link
// is rendered on. the contract pages live in frontend/app/contracts/,
// so the href is that directory relative to the current page.
export function contract_page_href_fun(page: string): string {
  return relative_href_fun(current_app_dir_segments_fun(), ["contracts"], page);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
