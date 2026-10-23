// ========================================
// auth state model: account_id, session_network, last_error,
// subscribers. UI components (auth_button, account_route, etc.)
// read through HUGGIES_AUTH; this file owns the wallet handshake.
// ========================================
// --- WHY --- @hot-labs/near-connect exposes no synchronous
// isSignedIn() — its reads are async and can throw when no
// wallet is selected — so account_id here is UI state seeded
// by wallet:signIn and rehydrated from our own localStorage on
// load. treat as UI state, never as proof of identity: the
// real check is a server-side signature verify (not built yet).
//
// --- WHY --- near_connect_client() picks a connector per call
// from getStoredNetworkId(), but the two networks have separate
// wallet selections and signing state; toggling the network
// while signed in would leave account_id pointing at a session
// the active connector knows nothing about. reconcile_fun()
// deactivates the cross-network session, and each session records
// the network it was made on so a future server verify uses the
// matching RPC.
// --- WHY --- a wallet can expose SEVERAL accounts at once (the
// near-connect sign-in event carries one signed message per
// account). the first version of this file kept only accounts[0]
// and threw the rest away, so a second account could never be
// selected. every account the wallet returns is now kept, each
// with its own signature, and the active one is just a pointer.
import {
  near_connect_client,
  getStoredNetworkId,
} from "@near-kit-tool-box/web";
import type { NearConnector } from "@hot-labs/near-connect";
import { generateNonce } from "near-kit";
import {
  HUGGIES_SIGN_IN_MESSAGE,
  HUGGIES_SIGN_IN_RECIPIENT,
} from "./sign_in_messages";
import {
  HUGGIES_AUTH_SESSIONS,
  type HUGGIES_AUTH_SESSION,
} from "./auth_sessions";
// ========================================
// ========================================
// ========================================
// --- CONFIG -----------------------------
// the per-account session map and the active-account pointer live in
// frontend/lib/ts/auth_sessions.ts, which also owns the migration
// from the old single-session key.
// ========================================
// ========================================
// ========================================
// --- STATE ------------------------------
// module-level so they survive re-renders without every caller
// re-storing. declared before any connector use because the
// connector can emit wallet:signIn during construction when
// autoConnect finds an injected wallet.
let account_id: string | null = null;
// the network the CURRENT session was signed in on.
let session_network: "mainnet" | "testnet" | null = null;
// the last error from a failed attempt; cleared on next attempt.
let last_error: string | null = null;
// plain array, not Set, so subscribe/unsubscribe ordering is
// stable and predictable.
const listeners: Array<() => void> = [];
// ========================================
// ========================================
// ========================================
// --- HELPERS ----------------------------
// broadcast state changes to every subscriber; one throwing
// (or unsubscribing mid-notify) cannot break the flow that
// triggered the notify.
function notify_fun(): void {
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch (err) {
      console.error("[auth] listener failed", err);
    }
  }
}
// ========================================
// register a re-render callback; returns an unsubscribe so
// components can clean up on unmount instead of leaking.
function subscribe_fun(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index !== -1) listeners.splice(index, 1);
  };
}
// ========================================
// clear or set the last error and notify so the component
// re-renders the error <p>.
function set_error_fun(next: string | null): void {
  last_error = next;
  notify_fun();
}
// ========================================
// Uint8Array -> base64 via btoa. byte-by-byte instead of
// String.fromCharCode(...bytes) so large arrays don't blow the
// argument limit (32-byte nonces are fine either way; the
// helper stays correct for any length).
function bytes_to_base64_fun(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
// ========================================
// base64 -> Uint8Array for a server that round-trips the nonce
// through JSON.
function base64_to_bytes_fun(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
// ========================================
// build the 32-byte NEP-413 nonce via near-kit's helper.
// --- WHY --- generateNonce() prefixes the bytes with a ms
// timestamp so verifyNep413Signature can age-check them;
// raw crypto.getRandomValues would look like a year-57000
// timestamp and every later verify would reject.
function make_nonce_fun(): Uint8Array {
  return generateNonce();
}
// ========================================
// ========================================
// ========================================
// --- STORAGE ----------------------------
// persist a completed sign-in for one account.
// --- WHY --- one entry per account id, so signing in as a second
// account cannot overwrite the first one's signature.
function save_session_fun(session: HUGGIES_AUTH_SESSION): void {
  HUGGIES_AUTH_SESSIONS.save_session(session);
}
// ========================================
// read one account's session back.
function load_session_fun(account_id: string): HUGGIES_AUTH_SESSION | null {
  return HUGGIES_AUTH_SESSIONS.get_session(account_id);
}
// ========================================
// drop the stored sessions (sign-out or cross-network drift).
function clear_session_fun(): void {
  HUGGIES_AUTH_SESSIONS.clear_sessions();
}
// ========================================
// ----------------------------------------
// public read API. plain getters so a component reads them
// during render without subscribing to a store object it would
// then have to diff. UI state only — proof of identity comes
// from a server-side signature check (not built yet).
// ----------------------------------------
function get_account_id_fun(): string | null {
  return account_id;
}
// ========================================
function is_signed_in_fun(): boolean {
  return account_id !== null;
}
// ========================================
function get_error_fun(): string | null {
  return last_error;
}
// ========================================
function get_session_fun(): HUGGIES_AUTH_SESSION | null {
  if (account_id === null) return null;
  return load_session_fun(account_id);
}
// ========================================
// every account we hold a session for, active one first.
// --- WHY --- the dropdown lists them in this order: the account
// the user is currently acting as belongs at the top, the rest
// keep the order the wallet returned them in.
// --- WHY --- only sessions made on the CURRENT network are listed.
// a session from the other network cannot be verified against the
// RPC the app is running on, so offering it as a switch target
// would land the user on an account the app cannot use.
function list_accounts_fun(): string[] {
  const current = getStoredNetworkId();
  const sessions = HUGGIES_AUTH_SESSIONS.load_sessions();
  const ids = Object.keys(sessions).filter(
    (id) => sessions[id].network === current,
  );
  if (account_id === null || !ids.includes(account_id)) return ids;
  return [account_id, ...ids.filter((id) => id !== account_id)];
}
// ========================================
// true when the account already holds a signature we can verify
// later, so selecting it needs no wallet popup.
function has_session_fun(account_id: string): boolean {
  return HUGGIES_AUTH_SESSIONS.get_session(account_id) !== null;
}
// ========================================
// ----------------------------------------
// undo a connect that did not complete. clears our state first
// and unconditionally, then asks the wallet to disconnect.
// --- WHY --- connector.disconnect() throws when no wallet is
// selected, but a failed sign-in must never leave a stale
// account id on screen even when the wallet side errors. also
// catches autoConnect's wallet:signIn adoption — that event
// would otherwise leave the button showing a signed-in account
// for a session that has NO signature (declined login message,
// wallet crashed, etc.).
// ----------------------------------------
async function rollback_connection_fun(
  connector: NearConnector,
): Promise<void> {
  clear_session_fun();
  session_network = null;
  account_id = null;
  try {
    await connector.disconnect();
  } catch (err) {
    console.info("[auth] no wallet session to disconnect during rollback", err);
  }
  notify_fun();
}
// ========================================
// ========================================
// ========================================
// --- SIGN IN ----------------------------
// sign in AND sign the login message in ONE wallet popup via
// connect({ signMessageParams }) — azbang/near-connect
// example/src/App.tsx's "Connect (With Signed Message)".
async function sign_in_fun(): Promise<void> {
  if (last_error !== null) set_error_fun(null);

  const network = getStoredNetworkId();
  const nonce = make_nonce_fun();
  const connector = near_connect_client();

  // arm the one-shot listener BEFORE connect().
  // --- WHY --- connect() emits wallet:signInAndSignMessage
  // synchronously, so a listener attached afterwards would
  // never fire.
  const signed = new Promise<
    Array<{
      accountId: string;
      publicKey: string;
      signature: string;
    }>
  >((resolve) => {
    const handler = (payload: {
      accounts: Array<{
        accountId: string;
        signedMessage: { publicKey?: string; signature: string };
      }>;
    }) => {
      // detach immediately so a later sign-in can't resolve
      // this stale promise.
      connector.off("wallet:signInAndSignMessage", handler);
      resolve(
        payload.accounts.map((entry) => ({
          accountId: entry.accountId,
          publicKey: entry.signedMessage.publicKey ?? "",
          signature: entry.signedMessage.signature,
        })),
      );
    };
    connector.on("wallet:signInAndSignMessage", handler);
  });

  try {
    await connector.connect({
      signMessageParams: {
        message: HUGGIES_SIGN_IN_MESSAGE,
        recipient: HUGGIES_SIGN_IN_RECIPIENT,
        nonce,
      },
    });

    // the connector resolves before we necessarily have the
    // payload; the race below caps the wait at 60s so a wallet
    // that signs in without producing a message can't hang the
    // UI forever.
    const results = await Promise.race([
      signed,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 60_000)),
    ]);
    if (results === null || results.length === 0) {
      set_error_fun("Wallet signed in but returned no signed message.");
      console.warn("[auth] wallet:signInAndSignMessage never arrived");
      await rollback_connection_fun(connector);
      return;
    }

    // --- WHY --- a wallet that exposes several accounts signs the
    // message for EACH of them and returns them all in one event.
    // keeping every one means the account dropdown can switch
    // between them without another wallet popup. the first entry
    // is the active one, matching the wallet's own ordering.
    const encoded_nonce = bytes_to_base64_fun(nonce);
    for (const result of results) {
      save_session_fun({
        accountId: result.accountId,
        publicKey: result.publicKey,
        signature: result.signature,
        message: HUGGIES_SIGN_IN_MESSAGE,
        nonce: encoded_nonce,
        recipient: HUGGIES_SIGN_IN_RECIPIENT,
        network,
        createdAt: Date.now(),
      });
    }

    session_network = network;
    account_id = results[0].accountId;
    HUGGIES_AUTH_SESSIONS.save_active(account_id);
    notify_fun();
    console.info(
      `[auth] signed in as ${account_id} (${results.length} account(s))`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    set_error_fun(message);
    await rollback_connection_fun(connector);
    console.warn("[auth] sign in failed", {
      error: message,
      raw: err,
      network,
    });
  }
}
// ========================================
// point the page at the account that is now active.
// --- WHY --- account.html reads its subject from the `?id=` url
// parameter, so switching accounts while sitting on that page
// would otherwise leave the old account's data on screen while
// the auth button claims to be the new one. only pages that
// already show an `?id=` are touched — a page without one is not
// an account page, so there is nothing to re-point.
function sync_url_account_fun(next_account_id: string): void {
  if (typeof window === "undefined" || typeof window.location === "undefined") {
    return;
  }
  const current_id = new URLSearchParams(window.location.search).get("id");
  if (current_id === null) return;
  const url = new URL(window.location.href);
  url.searchParams.set("id", next_account_id);
  window.history.replaceState(null, "", url.toString());
}
// ========================================
// ========================================
// ========================================
// --- SWITCH ACCOUNT --------------------
// make another account the active one.
// --- WHY --- a NEP-413 signature belongs to ONE account's key, so
// switching to an account we hold no signature for needs a fresh
// signature. near-connect's own path for that is
// wallet.signMessage({ signerId }) — the wallet approves a message
// for one chosen account, which is a lighter popup than a full
// sign-in but still needs the user. an account we DO hold a
// signature for switches instantly, with no popup at all.
async function switch_account_fun(next_account_id: string): Promise<void> {
  if (last_error !== null) set_error_fun(null);
  if (next_account_id === account_id) return;

  const existing = load_session_fun(next_account_id);
  if (existing !== null) {
    account_id = next_account_id;
    session_network = existing.network;
    HUGGIES_AUTH_SESSIONS.save_active(next_account_id);
    sync_url_account_fun(next_account_id);
    notify_fun();
    console.info(`[auth] switched to ${next_account_id} (stored session)`);
    return;
  }

  const connector = near_connect_client();
  const network = getStoredNetworkId();
  const nonce = make_nonce_fun();
  try {
    const wallet = await connector.wallet();
    const signed_message = await wallet.signMessage({
      message: HUGGIES_SIGN_IN_MESSAGE,
      recipient: HUGGIES_SIGN_IN_RECIPIENT,
      nonce,
      network,
      signerId: next_account_id,
    });
    // --- WHY --- the signature is bound to whichever account the
    // wallet actually signed for, so store it under the account id
    // the WALLET reported, not the one we asked for. a wallet that
    // signs with a different account would otherwise leave a
    // signature filed under an account it cannot be verified for.
    const signed_account_id = signed_message.accountId ?? next_account_id;
    save_session_fun({
      accountId: signed_account_id,
      publicKey: signed_message.publicKey,
      signature: signed_message.signature,
      message: HUGGIES_SIGN_IN_MESSAGE,
      nonce: bytes_to_base64_fun(nonce),
      recipient: HUGGIES_SIGN_IN_RECIPIENT,
      network,
      createdAt: Date.now(),
    });
    account_id = signed_account_id;
    session_network = network;
    HUGGIES_AUTH_SESSIONS.save_active(signed_account_id);
    sync_url_account_fun(signed_account_id);
    notify_fun();
    console.info(`[auth] switched to ${signed_account_id} (fresh signature)`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    set_error_fun(message);
    console.warn("[auth] switch account failed", {
      error: message,
      raw: err,
      account: next_account_id,
    });
    notify_fun();
  }
}
// ========================================
// ========================================
// ========================================
// --- SIGN OUT ---------------------------
// disconnect + forget the session. the local clear is in a
// finally so the UI never gets stuck on a stale account id
// even if the wallet disconnects throws.
async function sign_out_fun(): Promise<void> {
  try {
    await near_connect_client().disconnect();
  } catch (err) {
    console.info("[auth] disconnect had no wallet to close", err);
  } finally {
    clear_session_fun();
    session_network = null;
    account_id = null;
    set_error_fun(null);
    notify_fun();
  }
}
// ========================================
// pick the account to become active after the current one goes away.
// --- WHY --- an account whose session was made on the OTHER
// network must not be picked: its signature is only meaningful
// against the RPC it was made on, so activating it while the app
// runs on a different network would show a signed-in state the
// app cannot actually verify. the network filter keeps the active
// account and the current network in agreement.
function pick_fallback_account_fun(
  network: "mainnet" | "testnet",
): string | null {
  const sessions = HUGGIES_AUTH_SESSIONS.load_sessions();
  const ids = Object.keys(sessions);
  const matching = ids.find((id) => sessions[id].network === network);
  return matching ?? null;
}
// ========================================
// ========================================
// ========================================
// --- REMOVE ACCOUNT ---------------------
// forget ONE account without touching the others. the wallet stays
// connected, so the remaining accounts keep working.
// --- WHY --- signing out of account A must not sign the user out
// of account B — the sessions are per account, so only A's entry
// is removed. the wallet-side disconnect is deliberately NOT
// called: it would end the shared wallet session for every account.
function remove_account_fun(target_account_id: string): void {
  HUGGIES_AUTH_SESSIONS.remove_session(target_account_id);
  if (account_id === target_account_id) {
    // the active one went away — fall back to any remaining
    // account so the UI is never left pointing at nothing.
    const network = getStoredNetworkId();
    account_id = pick_fallback_account_fun(network);
    session_network = account_id === null ? null : network;
    HUGGIES_AUTH_SESSIONS.save_active(account_id);
    if (account_id !== null) sync_url_account_fun(account_id);
  }
  notify_fun();
}
// ========================================
// ========================================
// ========================================
// --- INIT -------------------------------
// MUST run before any connect() — autoConnect defaults to true
// and an injected wallet can emit wallet:signIn during
// construction, so a listener attached afterwards would miss
// the very first event.
function init_fun(): void {
  // --- WHY --- the state is cleared first. init() can run more
  // than once (the redirect pages and the button component both
  // call it), and a second run must re-derive the state from
  // storage rather than keep whatever the first run decided — a
  // network switch between the two runs must not leave a stale
  // account id behind.
  account_id = null;
  session_network = null;

  // --- WHY --- the active account is a pointer we store separately
  // from the sessions, so switching accounts does not rewrite any
  // signature. fall back to the first stored account when the
  // pointer is missing (fresh install, or the pointer was cleared
  // by an older build).
  const sessions = HUGGIES_AUTH_SESSIONS.load_sessions();
  const stored_ids = Object.keys(sessions);
  const active = HUGGIES_AUTH_SESSIONS.load_active();
  const current = getStoredNetworkId();
  // --- WHY --- only an account whose session was made on the
  // CURRENT network can be adopted here. a session left over from
  // the other network is kept in storage (switching back restores
  // it) but must not be activated, since its signature is only
  // verifiable against the RPC it was made on.
  const chosen =
    active !== null &&
    sessions[active] !== undefined &&
    sessions[active].network === current
      ? active
      : (stored_ids.find((id) => sessions[id].network === current) ?? null);
  if (chosen !== null) {
    account_id = chosen;
    session_network = sessions[chosen].network;
    HUGGIES_AUTH_SESSIONS.save_active(chosen);
  }

  const connector = near_connect_client();
  // --- WHY --- autoConnect's wallet:signIn outside our own
  // sign_in_fun carries no signed message — that session is
  // connected but not authenticated, so only adopt it when
  // there's no stored session (which carries a signature this
  // event knows nothing about).
  connector.on("wallet:signIn", (payload) => {
    if (account_id === null && payload.source === "signIn") {
      account_id = payload.accounts[0]?.accountId ?? null;
      notify_fun();
    }
  });

  // mirror external sign-out (from the wallet UI itself).
  connector.on("wallet:signOut", () => {
    clear_session_fun();
    session_network = null;
    account_id = null;
    notify_fun();
  });

  reconcile_fun();
  notify_fun();
}
// ========================================
// drop a session that belongs to a network other than the one
// currently selected.
// --- WHY --- reconcile runs from outside sign-in (after a
// network toggle), so subscribers get no other chance to
// repaint — must notify when it changes something.
// --- WHY --- the sessions are NOT deleted here. they were made on
// the other network, but each is still a valid signature — it is
// just not usable while the app runs on a different network.
// dropping them would throw away the user's login, so switching
// the network back restores the accounts instantly.
function reconcile_fun(): void {
  const current = getStoredNetworkId();
  if (session_network !== null && session_network !== current) {
    // --- WHY --- the session is NOT deleted here. it was made on
    // the other network, but it is still a valid signature — it is
    // just not usable while the app runs on a different network.
    // dropping it would throw away the user's login, so switching
    // the network back restores the account instantly.
    // --- WHY --- the fallback is filtered by the CURRENT network,
    // so a session made on the old network can never be activated
    // here — its signature is only verifiable against the RPC it
    // was made on.
    account_id = pick_fallback_account_fun(current);
    session_network = account_id === null ? null : current;
    HUGGIES_AUTH_SESSIONS.save_active(account_id);
    notify_fun();
  }
}
// ========================================
// public surface, in one place so the component has a single
// import to read.
export const HUGGIES_AUTH = {
  sign_in: sign_in_fun,
  sign_out: sign_out_fun,
  switch_account: switch_account_fun,
  remove_account: remove_account_fun,
  subscribe: subscribe_fun,
  reconcile: reconcile_fun,
  init: init_fun,
  get_account_id: get_account_id_fun,
  is_signed_in: is_signed_in_fun,
  get_error: get_error_fun,
  get_session: get_session_fun,
  list_accounts: list_accounts_fun,
  has_session: has_session_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
