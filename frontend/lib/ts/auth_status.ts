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
  pick_session_phrase_fun,
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
// true while a wallet popup is open, so the button can show a pending
// state instead of letting the user double-submit.
let busy = false;
// the last error from a failed attempt; cleared on the next attempt.
let last_error: string | null = null;
// re-render callbacks. a plain array rather than a Set so
// subscribe/unsubscribe ordering is stable and predictable.
const listeners: Array<() => void> = [];
// the nonce for an in-flight sign-in. the wallet echoes back the
// signature but NOT the nonce we passed in, so we must hold on to our
// own copy — the server needs those exact bytes to re-derive the
// payload. cleared once stored or failed.
let in_flight_nonce: Uint8Array | null = null;
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
// set_busy_fun / set_error_fun — the remaining state writes, each
// notifying so the button can react without polling.
function set_busy_fun(next: boolean): void {
  busy = next;
  notify_fun();
}
// ========================================
function set_error_fun(next: string | null): void {
  last_error = next;
  notify_fun();
}
// ========================================
// bytes_to_base64_fun — Uint8Array -> base64, for storing the nonce.
// btoa/atob rather than Buffer so this works in a browser without a
// polyfill. chunked because String.fromCharCode(...bytes) blows the
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
  phrase: string;
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
      phrase: typeof parsed.phrase === "string" ? parsed.phrase : "",
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
// get_busy_fun — true while a wallet popup is open.
function get_busy_fun(): boolean {
  return busy;
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
// ----------------------------------------
// log_wallet_diagnostics_fun — explain WHY a sign in failed.
//
// near-connect hides the real cause at two points:
//   1. _loadManifest() does `.catch(() => ({ wallets: [] }))`, so a
//      blocked or offline manifest fetch looks identical to an empty
//      wallet list. the picker then shows nothing to click, and the
//      connect that follows reports a bare "Failed to sign in".
//   2. connect() collapses every failure into that same message.
//
// this logs the things that actually distinguish the cases: how many
// wallets loaded, whether that list is empty, whether any of them
// support the signInAndSignMessage feature this flow needs, and which
// network the connector is pointed at.
//
// it logs INSTEAD of throwing. diagnostics must never be the reason
// sign-in breaks.
// ----------------------------------------
async function log_wallet_diagnostics_fun(connector: NearConnector): Promise<void> {
  try {
    // whenManifestLoaded always resolves — it already caught the
    // fetch failure — so this only waits for wallet registration.
    await connector.whenManifestLoaded;
    const wallets = connector.wallets;
    console.info(
      `[auth] connector network=${connector.network} wallets=${wallets.length}`,
      wallets.map((wallet) => wallet.manifest.id),
    );
    if (wallets.length === 0) {
      console.warn(
        "[auth] no wallets loaded — the wallet manifest fetch probably failed " +
          "(offline, blocked, or CORS). the wallet picker will be empty.",
      );
      return;
    }
    // the one-shot flow calls signInAndSignMessage, so a wallet that
    // only supports the standalone signMessage feature will be
    // filtered out of the picker even though it can sign messages.
    const can_sign_in_and_sign = wallets.filter(
      (wallet) => wallet.manifest.features?.signInAndSignMessage === true,
    );
    console.info(
      `[auth] wallets supporting signInAndSignMessage: ${can_sign_in_and_sign.length}/${wallets.length}`,
      can_sign_in_and_sign.map((wallet) => wallet.manifest.id),
    );
    if (can_sign_in_and_sign.length === 0) {
      console.warn(
        "[auth] no loaded wallet advertises signInAndSignMessage — every wallet " +
          "in the picker will be filtered out and connect() will throw " +
          "'Failed to sign in'.",
      );
    }
  } catch (err) {
    console.warn("[auth] diagnostics failed", err);
  }
}
// ----------------------------------------
// ensure_random_uuid_fun — guarantee crypto.randomUUID exists.
//
// WHY THIS IS NEEDED: crypto.randomUUID is only exposed in a SECURE
// CONTEXT — HTTPS, or http://localhost / 127.0.0.1. Loading the app
// from a LAN address (http://192.168.x.x:54733) leaves it undefined,
// and any code that calls it unguarded throws
// "crypto.randomUUID is not a function".
//
// near-connect's own helper guards for this and falls back to a
// Math.random-based uuid, so near-connect alone will not throw. the
// error comes from code that calls it directly — most likely a wallet
// executor running inside the sandboxed iframe that near-connect
// creates when you pick a wallet, which is third-party code this
// module cannot patch.
//
// installing a real getRandomValues-backed polyfill here means the API
// exists on insecure origins too. getRandomValues IS available on
// insecure origins (it is not secure-context gated), so the polyfill
// is cryptographically sound, not a downgrade. it only fills in what
// the platform withheld.
//
// this is intentionally NOT a security boundary — near-connect uses
// these uuids for iframe message correlation, not for signing. the
// actual NEP-413 signature comes from the wallet over ed25519, and
// the nonce comes from near-kit's generateNonce(), which uses
// getRandomValues and is unaffected.
// ----------------------------------------
function ensure_random_uuid_fun(): void {
  if (typeof crypto === "undefined") return;
  const target = crypto as Crypto & { randomUUID?: () => string };
  if (typeof target.randomUUID === "function") {
    // secure context — nothing to do
    if (typeof window !== "undefined" && window.isSecureContext === false) {
      console.info(
        "[auth] origin is not a secure context but randomUUID exists — " +
          `origin=${window.location.origin}`,
      );
    }
    return;
  }
  console.warn(
    "[auth] crypto.randomUUID is unavailable on this origin — installing a " +
      `getRandomValues polyfill. origin=${typeof window !== "undefined" ? window.location.origin : "(no window)"} ` +
      "secureContext=" +
      `${typeof window !== "undefined" ? window.isSecureContext : "?"}. ` +
      "This is expected on a LAN IP over http:// and usually harmless; " +
      "loading from http://localhost avoids it entirely.",
  );
  // assigned through a loose cast: the DOM lib types randomUUID as
  // returning a template-literal uuid, which a runtime-built string
  // cannot satisfy without an `as` on every return.
  target.randomUUID = (() => {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    // RFC 4122 version 4 layout: version nibble 4, variant 10xx.
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0"));
    return (
      `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-` +
      `${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-` +
      `${hex.slice(10, 16).join("")}`
    );
  }) as Crypto["randomUUID"];
}
// ========================================
// ========================================
// ========================================
// --- HELPERS ----------------------------
// rollback_connection_fun — undo a connect that did not complete.
//
// clears our state unconditionally, then asks the wallet to sign out.
// the local clear happens FIRST and is not gated on the wallet call:
// connector.disconnect() throws when no wallet is selected, and a
// failed sign-in must never leave a stale account id on screen even
// when the wallet side errors.
//
// used when connect() succeeds but signMessage() fails, so a declined
// login message does not leave a connected-but-unverifiable session.
async function rollback_connection_fun(connector: NearConnector): Promise<void> {
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
// sign_in_fun — sign in, then sign a login message.
//
// two wallet prompts, deliberately:
//   1. connect()                          — pick a wallet, sign in
//   2. wallet.signMessage({ ... })        — approve the login message
//
// this replaced connect({ signMessageParams }), which does both in a
// single popup and is the tidier API, but it throws "Failed to sign in"
// against real wallets: the combined wallet:signInAndSignMessage call
// comes back with no accounts. paying for one extra prompt is worth it
// when the alternative does not work at all.
//
// the sequence:
//   1. snapshot the nonce — the wallet will NOT echo it back
//   2. connect()
//   3. read the account id via wallet().getAccounts()
//   4. sign the message with the same nonce
//   5. store message + nonce + recipient + network + signature
//
// any failure clears the in-flight nonce, because a nonce that is
// never persisted is useless and a leaked one is a replay liability.
async function sign_in_fun(): Promise<void> {
  if (busy) return;
  set_error_fun(null);
  set_busy_fun(true);

  const network = getStoredNetworkId();
  const nonce = make_nonce_fun();
  in_flight_nonce = nonce;
  const phrase = pick_session_phrase_fun();
  // logged for support/debugging only — the phrase is NOT part of the
  // signed payload, so it never affects verification.
  console.info(`[auth] signing in on ${network} — phrase: ${phrase}`);

  const connector = near_connect_client();

  // diagnose why a connect fails. near-connect swallows most of the
  // useful detail: _loadManifest() catches its own fetch failure and
  // falls back to an empty wallet list, and connect() collapses every
  // failure mode into a bare "Failed to sign in".
  //
  // logged before the attempt so a silent failure still leaves a trail.
  ensure_random_uuid_fun();
  log_wallet_diagnostics_fun(connector);

  try {
    // STEP 1 — sign in, with NO signMessageParams.
    //
    // this deliberately does NOT use connect({ signMessageParams }),
    // which folds both steps into one popup. that path calls
    // wallet.signInAndSignMessage() and throws "Failed to sign in" in
    // practice — the wallet returns no accounts for the combined call,
    // and near-connect reports the same generic error whether the user
    // declined, the popup closed, or the wallet does not implement the
    // combined call well.
    //
    // plain connect() is what the reference implementation in
    // sleet-js/intear-dex-aggregator-tool-box uses (html/src/auth.ts)
    // and is the most widely supported across wallets. the cost is one
    // extra wallet prompt, paid in exchange for sign-in working at all.
    await connector.connect();

    const wallet = await connector.wallet();

    // account id from getAccounts() rather than the sign-in event: same
    // call the reference implementation uses, and it reflects the
    // wallet's real state.
    const accounts = await wallet.getAccounts();
    const signed_account = accounts[0];
    if (signed_account === undefined) {
      set_error_fun("Wallet returned no accounts.");
      console.warn("[auth] wallet connected but reported zero accounts", {
        network,
        accounts,
      });
      return;
    }

    // STEP 2 — sign the message. this is the widely supported
    // standalone signMessage feature (12/14 manifest wallets, versus
    // 11/14 for the combined path), and it is the call server-side
    // NEP-413 verification is built around.
    const signed = await wallet.signMessage({
      message: HUGGIES_SIGN_IN_MESSAGE,
      recipient: HUGGIES_SIGN_IN_RECIPIENT,
      nonce,
      network,
    });

    save_session_fun({
      accountId: signed_account.accountId,
      publicKey: signed.publicKey ?? "",
      signature: signed.signature,
      message: HUGGIES_SIGN_IN_MESSAGE,
      nonce: bytes_to_base64_fun(nonce),
      recipient: HUGGIES_SIGN_IN_RECIPIENT,
      network,
      phrase,
      createdAt: Date.now(),
    });

    session_network = network;
    account_id = signed_account.accountId;
    console.info(`[auth] signed in as ${signed_account.accountId}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // a rejected or closed popup is a normal outcome, not a crash —
    // report it and leave the app signed out.
    set_error_fun(message);
    // ROLL BACK THE WALLET CONNECTION.
    //
    // the two-step flow means connect() can succeed and signMessage()
    // then fail — the user connects, then declines the login message.
    // connect() emits wallet:signIn, which the listener in init()
    // adopts into account_id, so without this the button would keep
    // showing a signed-in account for a session that has NO signature
    // and can therefore never be verified server-side.
    //
    // this clears our local view AND tells the wallet to drop the
    // session, so retrying starts from a clean slate instead of
    // silently re-using a half-finished connection.
    await rollback_connection_fun(connector);
    // "Failed to sign in" is near-connect's catch-all: it means the
    // wallet returned an empty account list, which covers a closed
    // popup, a blocked manifest, a wallet that cannot sign messages,
    // and a genuine wallet-side failure. spell that out so the console
    // is not the same single useless line the user just saw.
    console.warn("[auth] sign in failed", {
      error: message,
      network,
      walletsLoaded: connector.wallets.length,
      walletIds: connector.wallets.map((wallet) => wallet.manifest.id),
      hint:
        message === "Failed to sign in"
          ? "The wallet returned no accounts. This is thrown by connector.connect() " +
            "when the wallet's sign-in returns an empty list — usually the user " +
            "dismissed or closed the popup. The manifest loaded fine, so this is " +
            "wallet-side. Retry, or pick a different wallet."
          : undefined,
    });
  } finally {
    in_flight_nonce = null;
    set_busy_fun(false);
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
  if (busy) return;
  set_busy_fun(true);
  try {
    await near_connect_client().disconnect();
  } catch (err) {
    console.info("[auth] disconnect had no wallet to close", err);
  } finally {
    clear_session_fun();
    session_network = null;
    account_id = null;
    set_error_fun(null);
    set_busy_fun(false);
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

  // log the raw wallet lifecycle. near-connect emits nothing on
  // failure, so these are the only positive signals that a connect
  // actually reached the wallet. they are the fastest way to tell
  // "the popup never opened" from "the user declined".
  //
  // autoConnect can sign in on its own for an injected wallet, so
  // when it fires outside our own sign_in_fun there is no signed
  // message — that session is connected but not authenticated, and the
  // button should reflect the wallet rather than a stored session.
  connector.on("wallet:signIn", (payload) => {
    console.info(
      `[auth] wallet sign in — source=${payload.source} accounts=${payload.accounts.length}`,
    );
    // only adopt the wallet's account when we have no session of our
    // own; an existing session carries a signature this event knows
    // nothing about.
    if (account_id === null && payload.source === "signIn") {
      account_id = payload.accounts[0]?.accountId ?? null;
      notify_fun();
    }
  });
  connector.on("selector:walletsChanged", () => {
    console.info(`[auth] wallet list changed — ${connector.wallets.length} available`);
  });

  // the wallet can sign out from outside the app (the wallet UI
  // itself), so mirror that into our state instead of drifting.
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
// reconcile_fun — drop a session that belongs to a different network
// than the one currently selected. without this, toggling mainnet ->
// testnet would leave the button showing a mainnet account id while
// the connector in play is the testnet one.
//
// MUST notify when it changes something. reconcile is called from
// outside the sign-in flow (after the network toggle moves), so
// subscribers get no other chance to repaint — without the notify the
// state clears correctly but the button keeps rendering the old
// account id.
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
  get_busy: get_busy_fun,
  get_error: get_error_fun,
  get_session: get_session_fun,
};
// ========================================
// copyright 2026 by sleet.near
// ========================================