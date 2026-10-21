// ========================================
// AUTH STATUS
// all sign-in state lives here, deliberately separated from the
// button that displays it. the component is a view; this file is the
// model it renders.
//
// WHY A SEPARATE FILE: sign-in has real state — an account id, a
// pending wallet popup, a stored NEP-413 signature, a network — and
// more than one component will want to read it (the account page, any
// gated feature). keeping that logic out of the button means the next
// component imports a plain function instead of re-implementing the
// wallet handshake.
//
// THE LIBRARY GIVES US NO SYNCHRONOUS STATE. NearConnector keeps its
// selection in localStorage behind an async DataStorage interface,
// and every read (getConnectedWallet / wallet()) can THROW. there is
// no isSignedIn() getter. so `account_id` below is state THIS module
// owns, seeded by the wallet:signIn event and rehydrated from our own
// storage on load. treat it as UI state and never as proof of
// anything — the only proof is a server-side signature check, which
// does not exist yet.
//
// NETWORK HANDLING — near_connect_client() picks a connector per call
// from getStoredNetworkId(), so it does track the network toggle on its
// own. what it does NOT do is migrate a session. the two connectors
// are separate objects with separate wallet selections and separate
// signing state, so signing in on mainnet then flipping the toggle to
// testnet would leave `account_id` pointing at a mainnet session while
// the connector in play is the testnet one. reconcile handles that,
// and each session records the network it was made on so the server
// verifies against the matching RPC.
// ========================================
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
// --- CONFIG -----------------------------
// localStorage key. prefixed so it cannot collide with anything
// near-connect writes (it owns "selected-wallet").
const HUGGIES_AUTH_STORAGE_KEY = "huggies_auth_session";
// ========================================
// ========================================
// --- STATE ------------------------------
// the signed-in account id, or null when signed out. module-level so it
// survives re-renders without every caller storing it.
//
// declared before the connector is used and before listeners attach,
// because the connector can emit wallet:signIn during construction
// when autoConnect finds an injected wallet.
let account_id: string | null = null;
// the network the CURRENT session was signed in on.
let session_network: "mainnet" | "testnet" | null = null;
// the last error from a failed attempt; cleared on the next attempt.
let last_error: string | null = null;
// re-render callbacks. a plain array rather than a Set so
// subscribe/unsubscribe ordering is stable and predictable.
const listeners: Array<() => void> = [];
// ========================================
// ========================================
// --- HELPERS ----------------------------
// notify_fun — tell every subscriber that state moved. each listener
// is isolated so one throwing (or unsubscribing mid-notify) cannot
// break the sign-in flow that triggered it.
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
// subscribe_fun — register a re-render callback; returns an
// unsubscribe function so a component can clean up on unmount instead
// of leaking a listener per render.
function subscribe_fun(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index !== -1) listeners.splice(index, 1);
  };
}
// ========================================
// set_error_fun — clear the last error or set a new one. notifies
// so the component re-renders to show/hide the error <p>.
function set_error_fun(next: string | null): void {
  last_error = next;
  notify_fun();
}
// ========================================
// bytes_to_base64_fun — Uint8Array -> base64, for storing the nonce.
// btoa/atob rather than Buffer so this works in a browser without a
// polyfill. btoa takes a string, so the bytes are assembled in chunks
// instead of spread — String.fromCharCode(...bytes) blows the
// argument limit on large arrays; a nonce is 32 bytes so this is
// belt-and-braces, but the helper stays correct for any length.
function bytes_to_base64_fun(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
// ========================================
// base64_to_bytes_fun — the inverse, for a server that round-trips the
// nonce through JSON.
function base64_to_bytes_fun(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
// ========================================
// make_nonce_fun — build the 32-byte NEP-413 nonce.
//
// THIS IS THE PART MOST LIKELY TO SILENTLY BREAK SERVER VERIFICATION.
// near-kit's generateNonce() writes a big-endian ms timestamp into the
// first 8 bytes and 24 random bytes after it. verifyNep413Signature
// reads those bytes back and REJECTS the signature when the implied
// age falls outside maxAge (5 min default). a hand-rolled
// crypto.getRandomValues(new Uint8Array(32)) nonce therefore reads as
// a timestamp in the year ~57000 — i.e. from the future — and every
// later verification fails. use generateNonce(), never raw random.
function make_nonce_fun(): Uint8Array {
  return generateNonce();
}
// ========================================
// ----------------------------------------
// the shape persisted to localStorage.
//
// CRITICAL: `message`, `nonce` and `recipient` MUST be stored, not
// just the signature. a NEP-413 signature is not self-describing — the
// server cannot verify it without re-deriving the payload from these
// exact values. storing only { accountId, signature } would leave you
// unable to verify anything later.
//
// `network` matters for the same reason: the signature is only
// meaningful against the RPC it was created on.
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
// --- STORAGE ----------------------------
// save_session_fun — persist a completed sign-in.
function save_session_fun(session: HUGGIES_AUTH_SESSION): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(HUGGIES_AUTH_STORAGE_KEY, JSON.stringify(session));
}
// ========================================
// load_session_fun — read it back defensively. this data is
// user-writable and may come from an older build, so a malformed or
// partial record is discarded rather than trusted or thrown on.
function load_session_fun(): HUGGIES_AUTH_SESSION | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(HUGGIES_AUTH_STORAGE_KEY);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<HUGGIES_AUTH_SESSION>;
    // every field below is required to verify later, so a record
    // missing any of them is useless — drop it rather than
    // half-restoring it and failing confusingly at verify time.
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
// clear_session_fun — drop the stored session (sign-out, or a session
// that is no longer valid on the current network).
function clear_session_fun(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(HUGGIES_AUTH_STORAGE_KEY);
}
// ========================================
// ----------------------------------------
// the public read API the component renders from. plain getters so a
// component can read them during render without subscribing to a
// store object it would then have to diff.
//
// these are UI state only — none of it is proof of identity until the
// server checks the signature.
// ----------------------------------------
// get_account_id_fun — the signed-in account, or null.
function get_account_id_fun(): string | null {
  return account_id;
}
// ========================================
// is_signed_in_fun — whether we currently believe someone is signed
// in, for this app session.
function is_signed_in_fun(): boolean {
  return account_id !== null;
}
// ========================================
// get_error_fun — the last failure message, or null.
function get_error_fun(): string | null {
  return last_error;
}
// ========================================
// get_session_fun — the stored session for the later server handoff.
function get_session_fun(): HUGGIES_AUTH_SESSION | null {
  return load_session_fun();
}
// ========================================
// ----------------------------------------
// rollback_connection_fun — undo a connect that did not complete.
//
// clears our state unconditionally, then asks the wallet to sign out.
// the local clear happens FIRST and is not gated on the wallet call:
// connector.disconnect() throws when no wallet is selected, and a
// failed sign-in must never leave a stale account id on screen even
// when the wallet side errors.
//
// used when connect() succeeds but signInAndSignMessage then fails —
// so a declined login message does not leave a connected-but-
// unverifiable session. it also catches the case where autoConnect
// emitted wallet:signIn for an injected wallet before the combined
// call failed; that event adopts into account_id, and without this
// the button would keep showing a signed-in account for a session
// that has NO signature.
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
// sign_in_fun — sign in AND sign the login message in ONE wallet prompt.
//
// uses connect({ signMessageParams }), matching the official example at
// azbang/near-connect example/src/App.tsx ("Connect (With Signed
// Message)"). the message params travel with the sign-in and the wallet
// emits wallet:signInAndSignMessage, so the user approves ONCE.
//
// the sequence:
//   1. snapshot the nonce — the wallet will NOT echo it back
//   2. arm a one-shot listener for the combined event
//   3. connect({ signMessageParams }) — one popup
//   4. store message + nonce + recipient + network + signature
//
// any failure rolls back the wallet session and reports the error.
async function sign_in_fun(): Promise<void> {
  if (last_error !== null) set_error_fun(null);

  const network = getStoredNetworkId();
  const nonce = make_nonce_fun();
  const connector = near_connect_client();

  // arm the one-shot listener BEFORE connect(). connect() emits
  // wallet:signInAndSignMessage synchronously as part of resolving,
  // so a listener attached afterwards would never fire.
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
      // detach immediately so a later sign-in cannot resolve this
      // stale promise.
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
    // ONE popup: connect + sign the message together. this is the
    // official "Connect (With Signed Message)" pattern from
    // azbang/near-connect example/src/App.tsx.
    //
    // signMessageParams omits signerId and network by type
    // (SignMessageDuringSignInParams = Omit<SignMessageParams,
    // "signerId" | "network">) — the connector and wallet fill those in
    // from their own configuration.
    await connector.connect({
      signMessageParams: {
        message: HUGGIES_SIGN_IN_MESSAGE,
        recipient: HUGGIES_SIGN_IN_RECIPIENT,
        nonce,
      },
    });

    // the connector resolves before we necessarily have the payload,
    // so await the event. if the wallet signed in but never produced
    // a signed message, this promise never settles — the guard below
    // keeps that from hanging the UI forever.
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
    // see rollback_connection_fun for why this is needed: connect()
    // may have emitted wallet:signIn before throwing.
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
// --- SIGN OUT ---------------------------
// sign_out_fun — disconnect the wallet and forget the session.
//
// disconnect() resolves the currently-selected wallet and THROWS when
// none is selected, so a signed-out user pressing sign out must not
// produce an error. the local session is cleared regardless of what
// the wallet does, so the UI can never get stuck showing a stale
// account id.
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
// --- INIT -------------------------------
// init_fun — restore state and wire the wallet events.
//
// MUST be called before any connect(). autoConnect defaults to true,
// and an injected wallet can emit wallet:signIn during construction,
// so a listener attached afterwards would miss the very first
// sign-in. calling this at module import time is the safe default.
//
// rehydrates from our own storage rather than asking the wallet,
// because the wallet's read is async and throws when nothing is
// selected. the stored session is trusted for display only.
function init_fun(): void {
  const stored = load_session_fun();
  if (stored !== null) {
    account_id = stored.accountId;
    session_network = stored.network;
  }

  const connector = near_connect_client();

  // autoConnect can sign in on its own for an injected wallet, so
  // when it fires outside our own sign_in_fun there is no signed
  // message — that session is connected but not authenticated, and
  // the button should reflect the wallet rather than a stored
  // session. only adopt the account when we have no session of our
  // own, because a stored session carries a signature this event
  // knows nothing about.
  connector.on("wallet:signIn", (payload) => {
    if (account_id === null && payload.source === "signIn") {
      account_id = payload.accounts[0]?.accountId ?? null;
      notify_fun();
    }
  });

  // the wallet can sign out from outside the app (the wallet UI
  // itself), so mirror that into our state instead of drifting.
  connector.on("wallet:signOut", () => {
    clear_session_fun();
    session_network = null;
    account_id = null;
    notify_fun();
  });

  // reconcile may have cleared state and notified; one final
  // notify is harmless if not, and keeps the API "init() leaves the
  // UI in sync" simple.
  reconcile_fun();
  notify_fun();
}
// ========================================
// reconcile_fun — drop a session that belongs to a different network
// than the one currently selected. without this, toggling mainnet ->
// testnet would leave the button showing a mainnet account id while
// the connector in play is the testnet one.
//
// MUST notify when it changes something. reconcile is called from
// outside the sign-in flow (after the network toggle moves), so
// subscribers get no other chance to repaint.
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
// the public surface, in one place so the component has a single
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
