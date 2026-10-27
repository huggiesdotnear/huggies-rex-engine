// ========================================
// the DAO page's load: it fills the page's store so the components
// below can read it.
//
// the load lives in this one place. the components read the loaded
// data from the store and fetch nothing themselves.
//
// the page's html declares the mount divs. they are in the html, not
// in this component, because each component self-mounts on import and
// so the div has to be in the document before the module runs.
// ========================================
import { render } from "preact";
import { useEffect as use_effect } from "preact/hooks";
import { HUGGIES_MOUNT_ID } from "../ts/mount_ids";
import { HUGGIES_AUTH } from "../ts/auth_status";
import { HUGGIES_CONTRACT_SPUTNIK_DAO_PAGE } from "../ts/contract_page_sputnik_dao";
import { HUGGIES_CONTRACT_SPUTNIK_DAO_BALANCES } from "../ts/contract_page_sputnik_dao_balances";
import { HUGGIES_DAO_PAGE_STATE } from "../ts/contract_page_sputnik_dao_state";
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_PAGE_FUN() {
  // the one load.
  //
  // --- WHY --- the daos the reader can pick from are asked for first,
  // because they decide which dao the page shows when the url carries
  // none. a reader who is signed in and has daos is sent to their
  // first one; a reader who is signed in and has none is asked for an
  // id; a reader who is not signed in is asked for an id too.
  //
  // --- WHY --- the dao and its balances are asked for together, so
  // the page is as slow as its slowest one rather than the sum of the
  // two.
  use_effect(() => {
    let cancelled = false;
    HUGGIES_AUTH.init();

    const url_dao_id = new URLSearchParams(window.location.search).get("id");
    const account_id = HUGGIES_AUTH.get_account_id();

    const load_fun = async () => {
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
            await HUGGIES_CONTRACT_SPUTNIK_DAO_PAGE.list_dao_treasuries(
              account_id,
            );
        } catch (err: unknown) {
          if (cancelled) return;
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
      if (cancelled) return;

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
      if (dao_id === null || dao_id.trim().length === 0) {
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

      if (dao_id === null || dao_id.trim().length === 0) {
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
        if (cancelled) return;
        HUGGIES_DAO_PAGE_STATE.set({
          dao,
          balances: balances.rows,
          treasuries,
          account_id,
          loading: false,
          errors: [...dao.errors, ...balances.errors],
        });
      } catch (err: unknown) {
        if (cancelled) return;
        HUGGIES_DAO_PAGE_STATE.set({
          dao: null,
          balances: [],
          treasuries,
          account_id,
          loading: false,
          errors: [err instanceof Error ? err.message : String(err)],
        });
      }
    };

    void load_fun();
    return () => {
      cancelled = true;
    };
  }, []);

  return <></>;
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
const SELF_MOUNT_ID =
  HUGGIES_MOUNT_ID.HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_PAGE;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null)
    render(<HUGGIES_COMPONENT_CONTRACT_SPUTNIK_DAO_PAGE_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
