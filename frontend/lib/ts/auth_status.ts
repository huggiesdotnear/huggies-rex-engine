// ========================================
// auth state model: account_id, session_network, last_error,
// subscribers. UI components (auth_button, account_router, etc.)
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
// drops cross-network sessions, and each session records the
// network it was made on so a future server verify uses the
// matching RPC.
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
// ========================================
// ========================================
// ========================================
// --- CONFIG -----------------------------
// localStorage key for the persisted session. prefixed so it
// cannot collide with anything near-connect writes (it owns
// "selected-wallet").
const HUGGIES_AUTH_STORAGE_KEY = "HUGGIES_AUTH_SESSION";
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
// ----------------------------------------
// shape persisted to localStorage.
// --- WHY --- a NEP-413 signature is not self-describing: a
// server cannot verify it without the exact message + nonce +
// recipient the wallet signed. storing only
// { accountId, signature } would leave the server unable to
// verify anything later. `network` matters for the same reason
// — a signature is only meaningful against the RPC it was
// made on.
// ----------------------------------------
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
// --- STORAGE ----------------------------
// persist a completed sign-in.
function save_session_fun(session: HUGGIES_AUTH_SESSION): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(HUGGIES_AUTH_STORAGE_KEY, JSON.stringify(session));
}
// ========================================
// read it back defensively — user-writable data from older
// builds gets dropped rather than half-restored.
function load_session_fun(): HUGGIES_AUTH_SESSION | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(HUGGIES_AUTH_STORAGE_KEY);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<HUGGIES_AUTH_SESSION>;
    if (
      typeof parsed.accountId !== "string" ||
      typeof parsed.signature !== "string" ||
      typeof parsed.nonce !== "string" ||
      typeof parsed.message !== "string" ||
      typeof parsed.recipient !== "string"
    ) {
      return null;
    }
    return {
      accountId: parsed.accountId,
      publicKey: typeof parsed.publicKey === "string" ? parsed.publicKey : "",
      signature: parsed.signature,
      message: parsed.message,
      nonce: parsed.nonce,
      recipient: parsed.recipient,
      network: parsed.network === "testnet" ? "testnet" : "mainnet",
      createdAt: typeof parsed.createdAt === "number" ? parsed.createdAt : 0,
    };
  } catch {
    return null;
  }
}
// ========================================
// drop the stored session (sign-out or cross-network drift).
function clear_session_fun(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(HUGGIES_AUTH_STORAGE_KEY);
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
  return load_session_fun();
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
  const signed = new Promise<{
    accountId: string;
    publicKey: string;
    signature: string;
  }>((resolve) => {
    const handler = (payload: {
      accounts: Array<{
        accountId: string;
        signedMessage: { publicKey?: string; signature: string };
      }>;
    }) => {
      // detach immediately so a later sign-in can't resolve
      // this stale promise.
      connector.off("wallet:signInAndSignMessage", handler);
      const first = payload.accounts[0];
      if (first === undefined) return;
      resolve({
        accountId: first.accountId,
        publicKey: first.signedMessage.publicKey ?? "",
        signature: first.signedMessage.signature,
      });
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
    const result = await Promise.race([
      signed,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 60_000)),
    ]);
    if (result === null) {
      set_error_fun("Wallet signed in but returned no signed message.");
      console.warn("[auth] wallet:signInAndSignMessage never arrived");
      await rollback_connection_fun(connector);
      return;
    }

    save_session_fun({
      accountId: result.accountId,
      publicKey: result.publicKey,
      signature: result.signature,
      message: HUGGIES_SIGN_IN_MESSAGE,
      nonce: bytes_to_base64_fun(nonce),
      recipient: HUGGIES_SIGN_IN_RECIPIENT,
      network,
      createdAt: Date.now(),
    });

    session_network = network;
    account_id = result.accountId;
    notify_fun();
    console.info(`[auth] signed in as ${result.accountId}`);
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
// ========================================
// ========================================
// --- INIT -------------------------------
// MUST run before any connect() — autoConnect defaults to true
// and an injected wallet can emit wallet:signIn during
// construction, so a listener attached afterwards would miss
// the very first event.
function init_fun(): void {
  const stored = load_session_fun();
  if (stored !== null) {
    account_id = stored.accountId;
    session_network = stored.network;
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
function reconcile_fun(): void {
  const current = getStoredNetworkId();
  if (session_network !== null && session_network !== current) {
    clear_session_fun();
    session_network = null;
    account_id = null;
    notify_fun();
  }
}
// ========================================
// public surface, in one place so the component has a single
// import to read.
export const HUGGIES_AUTH = {
  sign_in: sign_in_fun,
  sign_out: sign_out_fun,
  subscribe: subscribe_fun,
  reconcile: reconcile_fun,
  init: init_fun,
  get_account_id: get_account_id_fun,
  is_signed_in: is_signed_in_fun,
  get_error: get_error_fun,
  get_session: get_session_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================
