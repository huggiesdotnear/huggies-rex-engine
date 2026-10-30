// ========================================
// persistent store for EVERY signed-in account, keyed by account id.
// one file, one job: read/write the session map + the active id.
// auth_status.ts owns the wallet handshake; this file owns the bytes
// on disk.
// ========================================
// --- WHY --- a map keyed by account id, not one session object: a
// single object meant signing in as a second account overwrote the
// first one's signature. the active id says which one the UI is
// currently acting as.
// --- WHY --- the keys are prefixed with HUGGIES_ so they cannot
// collide with anything near-connect writes (it owns "selected-wallet").
// --- WHY --- the legacy single-session key is folded into the map on
// read so a signed-in user upgrading the app keeps their session
// instead of being bounced to the wallet.
// --- WHY --- the session still records its network even though the app
// is mainnet-only, so a session left over from a testnet-era build
// stays recognisable as such.
export interface HUGGIES_AUTH_SESSION {
  accountId: string;
  publicKey: string;
  signature: string;
  message: string;
  nonce: string;
  recipient: string;
  network: "mainnet" | "testnet";
  createdAt: number;
}
// ========================================
// ========================================
// --- CONFIG -----------------------------
// map of account id -> session. one key per account.
const HUGGIES_SESSIONS_STORAGE_KEY = "HUGGIES_AUTH_SESSIONS";
// which account the UI is currently acting as.
const HUGGIES_ACTIVE_STORAGE_KEY = "HUGGIES_AUTH_ACTIVE";
// the pre-multi-account key. read once for migration, then removed —
// see load_sessions_fun for why it must not stay.
const HUGGIES_LEGACY_STORAGE_KEY = "HUGGIES_AUTH_SESSION";
// ========================================
// ========================================
// ========================================
// --- HELPERS ----------------------------
// a session is only usable when it carries the fields a server-side
// NEP-413 verify needs: the account, the signature, and the exact
// message + nonce + recipient that were signed.
function is_valid_session_fun(value: unknown): value is HUGGIES_AUTH_SESSION {
  if (typeof value !== "object" || value === null) return false;
  const session = value as Partial<HUGGIES_AUTH_SESSION>;
  return (
    typeof session.accountId === "string" &&
    typeof session.signature === "string" &&
    typeof session.nonce === "string" &&
    typeof session.message === "string" &&
    typeof session.recipient === "string"
  );
}
// normalize one parsed entry, dropping anything malformed.
// --- WHY --- localStorage is user-writable, so a hand-edited or
// half-written entry must not be able to crash the app or be handed to
// a verifier as if it were valid.
function normalize_session_fun(value: unknown): HUGGIES_AUTH_SESSION | null {
  if (!is_valid_session_fun(value)) return null;
  return {
    accountId: value.accountId,
    publicKey: typeof value.publicKey === "string" ? value.publicKey : "",
    signature: value.signature,
    message: value.message,
    nonce: value.nonce,
    recipient: value.recipient,
    network: value.network === "testnet" ? "testnet" : "mainnet",
    createdAt: typeof value.createdAt === "number" ? value.createdAt : 0,
  };
}
// ========================================
// read the legacy single-session key, if it is still there.
function read_legacy_session_fun(): HUGGIES_AUTH_SESSION | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(HUGGIES_LEGACY_STORAGE_KEY);
  if (raw === null) return null;
  try {
    return normalize_session_fun(JSON.parse(raw));
  } catch {
    return null;
  }
}
// ========================================
// ========================================
// --- STORAGE ----------------------------
// read every stored session, migrating the legacy key on the way.
function load_sessions_fun(): Record<string, HUGGIES_AUTH_SESSION> {
  if (typeof localStorage === "undefined") return {};
  let sessions: Record<string, HUGGIES_AUTH_SESSION> = {};
  const raw = localStorage.getItem(HUGGIES_SESSIONS_STORAGE_KEY);
  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      for (const [account_id, value] of Object.entries(parsed)) {
        const session = normalize_session_fun(value);
        if (session !== null) sessions[account_id] = session;
      }
    } catch {
      sessions = {};
    }
  }
  const legacy = read_legacy_session_fun();
  if (legacy !== null && sessions[legacy.accountId] === undefined) {
    sessions[legacy.accountId] = legacy;
    write_sessions_fun(sessions);
    // the legacy key is now consumed — drop it so a later
    // remove_session() is not undone by the next read.
    // --- WHY --- the migration re-adds the legacy account on every
    // read; leaving the key in place would resurrect it right after
    // the user removed it from the account list.
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(HUGGIES_LEGACY_STORAGE_KEY);
    }
  }
  return sessions;
}
// ========================================
// write the whole map back.
function write_sessions_fun(
  sessions: Record<string, HUGGIES_AUTH_SESSION>,
): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(HUGGIES_SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
}
// ========================================
// store one session, replacing any previous one for that account.
function save_session_fun(session: HUGGIES_AUTH_SESSION): void {
  const sessions = load_sessions_fun();
  sessions[session.accountId] = session;
  write_sessions_fun(sessions);
}
// ========================================
// drop one account's session, leaving the others untouched.
function remove_session_fun(account_id: string): void {
  const sessions = load_sessions_fun();
  if (sessions[account_id] === undefined) return;
  delete sessions[account_id];
  write_sessions_fun(sessions);
}
// ========================================
// drop every session (full sign-out of all accounts).
function clear_sessions_fun(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(HUGGIES_SESSIONS_STORAGE_KEY);
  localStorage.removeItem(HUGGIES_ACTIVE_STORAGE_KEY);
}
// ========================================
// the account the UI is currently acting as, or null.
function load_active_fun(): string | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(HUGGIES_ACTIVE_STORAGE_KEY);
  if (raw === null) return null;
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed;
}
// ========================================
// set the active account id.
function save_active_fun(account_id: string | null): void {
  if (typeof localStorage === "undefined") return;
  if (account_id === null) {
    localStorage.removeItem(HUGGIES_ACTIVE_STORAGE_KEY);
    return;
  }
  localStorage.setItem(HUGGIES_ACTIVE_STORAGE_KEY, account_id);
}
// ========================================
// ========================================
// --- READ ------------------------------
// every stored account id, in insertion order.
function list_account_ids_fun(): string[] {
  return Object.keys(load_sessions_fun());
}
// ========================================
// one account's session, or null when it has none.
function get_session_fun(account_id: string): HUGGIES_AUTH_SESSION | null {
  return load_sessions_fun()[account_id] ?? null;
}
// ========================================
// public surface, in one place so callers have a single import.
export const HUGGIES_AUTH_SESSIONS = {
  load_sessions: load_sessions_fun,
  save_session: save_session_fun,
  remove_session: remove_session_fun,
  clear_sessions: clear_sessions_fun,
  load_active: load_active_fun,
  save_active: save_active_fun,
  list_account_ids: list_account_ids_fun,
  get_session: get_session_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
