// ========================================
// the skill page's session check: ask the backend who our session key
// belongs to.
//
// this is the page's one request that NEEDS the session key, so it is
// the example of how a route that requires the key is called: the
// loader asks for the options, and the options carry the key.
//
// --- WHY --- the call goes through `session_options_fun` and not by
// reading the key directly: the key may not be known yet, and this
// fetches it in the background. a loader that read the key itself would
// send the request with no key on the very first page load — which the
// backend answers with a 401.
// ========================================
import { api_huggies_session_me_get } from "@huggies/huggies-rex-engine-middleman";
import { HUGGIES_BASE_URL } from "../shared/base_url";
import { session_options_fun } from "../shared/session_token";
// ========================================
// --- TYPES ------------------------------
// who the session key belongs to.
export interface HUGGIES_APP_PAGE_SKILL_SESSION_ME {
  user_id: string;
  accounts: string[];
}
// ========================================
// --- LOAD ------------------------------
// ask the backend who we are.
//
// --- WHY --- the key is REQUIRED here: a route that needs the key
// cannot work without it, so the call is not made at all when there is
// none.
export async function app_page_skill_session_me_load_fun(): Promise<HUGGIES_APP_PAGE_SKILL_SESSION_ME> {
  const options = await session_options_fun(true);
  const result = await api_huggies_session_me_get(HUGGIES_BASE_URL, options);
  return {
    user_id: result.userId,
    accounts: result.accounts,
  };
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
