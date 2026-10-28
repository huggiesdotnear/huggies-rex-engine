// ========================================
// the DAO page's state: the loaded dao, the daos the reader can pick
// from, and the errors.
//
// one store, because the page is split into components — the selector,
// the header, the roles and the proposals — and they all read the same
// load. the loader writes here and the components subscribe, so no
// component fetches anything itself.
//
// the shape is the same as lib/ts/page_account_id.ts: plain module
// state, a subscribe/unsubscribe pair, and a notify that a throwing
// subscriber cannot break.
// ========================================
import { HUGGIES_CONTRACT_SPUTNIK_DAO_PAGE } from "./contract_page_sputnik_dao";
import { HUGGIES_CONTRACT_SPUTNIK_DAO_BALANCES } from "./contract_page_sputnik_dao_balances";
import { HUGGIES_AUTH } from "./auth_status";
import { HUGGIES_URL_ID } from "./url_id";
import type { HUGGIES_DAO_INFO } from "./contract_page_sputnik_dao";
import type { HUGGIES_DAO_BALANCE } from "./contract_page_sputnik_dao_balances";
import type { TREZU_TREASURY } from "../../../middleman/huggies";
// ========================================
// --- TYPES ------------------------------
export interface HUGGIES_DAO_PAGE_STATE {
  // the dao being shown, or null while it loads.
  dao: HUGGIES_DAO_INFO | null;
  // the dao's own token holdings.
  balances: ReadonlyArray<HUGGIES_DAO_BALANCE>;
  // the daos the signed-in account is a member of.
  treasuries: TREZU_TREASURY[];
  // the account whose daos are listed. null when nobody is signed in.
  account_id: string | null;
  // true while the page is loading.
  loading: boolean;
  // one message per thing that failed.
  errors: string[];
}
// ========================================
// --- STATE ------------------------------
// the page's state. the empty state is what the page holds before the
// first load answers.
let state: HUGGIES_DAO_PAGE_STATE = {
  dao: null,
  balances: [],
  treasuries: [],
  account_id: null,
  loading: false,
  errors: [],
};
// plain array so subscribe/unsubscribe ordering is stable.
const listeners: Array<() => void> = [];
// ========================================
// --- HELPERS ----------------------------
// broadcast a change to every subscriber; one throwing (or
// unsubscribing mid-notify) cannot break the flow that notified.
function notify_fun(): void {
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch (err) {
      console.error("[contract_page_sputnik_dao_state] listener failed", err);
    }
  }
}
// ========================================
// --- WRITE ------------------------------
// replace the page's state and tell the subscribers.
function set_state_fun(next: HUGGIES_DAO_PAGE_STATE): void {
  state = next;
  notify_fun();
}
// ========================================
// --- READ ------------------------------
// the page's state, as it is right now.
function get_state_fun(): HUGGIES_DAO_PAGE_STATE {
  return state;
}
// ========================================
// --- SUBSCRIBE -------------------------
// register a re-render callback; returns an unsubscribe so components
// can clean up on unmount instead of leaking.
function subscribe_fun(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index !== -1) listeners.splice(index, 1);
  };
}
// ========================================
// --- LOAD -------------------------------
// load the dao the page is about.
//
// --- WHY --- the daos the reader can pick from are asked for first,
// because they decide which dao the page shows when the url carries
// none. a reader who is signed in and has daos is sent to their first
// one; a reader who is signed in and has none is asked for an id; a
// reader who is not signed in is asked for an id too.
//
// --- WHY --- the dao and its balances are asked for together, so the
// page is as slow as its slowest one rather than the sum of the two.
async function dao_page_state_load_fun(): Promise<void> {
  HUGGIES_AUTH.init();

  // --- WHY --- the shared lib/ts/url_id.ts does the reading: the trim
  // and the blank-means-absent rule live there, so this loader and the
  // selector box cannot drift apart on which dao is shown. a padded id
  // used to reach load_dao untrimmed and match nothing.
  const url_dao_id = HUGGIES_URL_ID.read();
  const account_id = HUGGIES_AUTH.get_account_id();

  HUGGIES_DAO_PAGE_STATE.set({
    dao: null,
    balances: [],
    treasuries: [],
    account_id,
    loading: true,
    errors: [],
  });

  // the daos the reader is a member of.
  let treasuries: Awaited<
    ReturnType<typeof HUGGIES_CONTRACT_SPUTNIK_DAO_PAGE.list_dao_treasuries>
  > = [];
  if (account_id !== null) {
    try {
      treasuries =
        await HUGGIES_CONTRACT_SPUTNIK_DAO_PAGE.list_dao_treasuries(account_id);
    } catch (err: unknown) {
      HUGGIES_DAO_PAGE_STATE.set({
        dao: null,
        balances: [],
        treasuries: [],
        account_id,
        loading: true,
        errors: [
          `treasuries: ${err instanceof Error ? err.message : String(err)}`,
        ],
      });
    }
  }

  HUGGIES_DAO_PAGE_STATE.set({
    dao: null,
    balances: [],
    treasuries,
    account_id,
    loading: true,
    errors: [],
  });

  // which dao to show.
  //
  // --- WHY --- the url wins. a link to a dao must show that dao,
  // not the reader's first one. only when the url carries none
  // does the reader's own list decide.
  let dao_id = url_dao_id;
  // --- WHY --- the null check is enough: url_id.ts already treats a
  // blank id as absent, so there is no second blank check to make.
  if (dao_id === null) {
    const first = treasuries[0];
    if (first !== undefined) {
      dao_id = first.daoId;
      // --- WHY --- the chosen dao goes into the url so the reader
      // can share the page and so a reload keeps the same dao.
      const url = new URL(window.location.href);
      url.searchParams.set("id", dao_id);
      window.history.replaceState({}, "", url.toString());
    }
  }

  if (dao_id === null) {
    // nothing to show: the reader has to pick one.
    HUGGIES_DAO_PAGE_STATE.set({
      dao: null,
      balances: [],
      treasuries,
      account_id,
      loading: false,
      errors: [],
    });
    return;
  }

  // the dao and its balances.
  try {
    const [dao, balances] = await Promise.all([
      HUGGIES_CONTRACT_SPUTNIK_DAO_PAGE.load_dao(dao_id),
      HUGGIES_CONTRACT_SPUTNIK_DAO_BALANCES.load(dao_id),
    ]);
    HUGGIES_DAO_PAGE_STATE.set({
      dao,
      balances: balances.rows,
      treasuries,
      account_id,
      loading: false,
      errors: [...dao.errors, ...balances.errors],
    });
  } catch (err: unknown) {
    HUGGIES_DAO_PAGE_STATE.set({
      dao: null,
      balances: [],
      treasuries,
      account_id,
      loading: false,
      errors: [err instanceof Error ? err.message : String(err)],
    });
  }
}
// ========================================
// public surface, in one place so components have a single import.
export const HUGGIES_DAO_PAGE_STATE = {
  get: get_state_fun,
  set: set_state_fun,
  subscribe: subscribe_fun,
  load: dao_page_state_load_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
