# AUTH

multi-account sign in.

### WHAT THE WALLET GIVES US

`connect({ signMessageParams })` on the near-connect connector returns ONE
event, `wallet:signInAndSignMessage`, whose `accounts` array holds an
entry PER ACCOUNT the user's wallet exposes — each with its OWN signed
message. the first version of this app kept `accounts[0]` and dropped
the rest, so a second account could never be selected.

the connector's own `signMessage({ signerId })` is the path for signing
as one specific account when no signature is on hand yet. `signerId`
exists in the connector's types precisely for that.

### STORAGE

`frontend/lib/ts/auth_sessions.ts` owns the bytes on disk.

- `HUGGIES_AUTH_SESSIONS` - map of account id -> session. one entry per
  account, so signing in as a second account cannot overwrite the first
  one's signature.
- `HUGGIES_AUTH_ACTIVE` - which account the app is currently acting as.
  a pointer, so switching accounts rewrites no signature.

the pre-multi-account key `HUGGIES_AUTH_SESSION` is migrated into the map
on first read, then dropped. an existing user stays signed in across the
upgrade instead of being bounced back to their wallet.

each session keeps the exact `message` + `nonce` + `recipient` + `network`
that was signed, because a NEP-413 signature is not self-describing: a
server cannot verify it without them.

### NETWORK SCOPING

each session records the network it was made on, and only sessions from
the CURRENT network are selectable. a signature is only meaningful
against the RPC it was made on, so activating a mainnet session while the
app runs on testnet would show a signed-in state the app cannot verify.

switching the network DEACTIVATES the session but keeps it in storage —
toggling back restores the account instantly, with no wallet popup.
`HUGGIES_AUTH.reconcile()` does this, and the network button calls it.

### SWITCHING

- account with a stored signature -> instant, no wallet popup.
- account without one -> one `signMessage({ signerId })` popup, which is
  lighter than a full sign-in but still needs the user.

the url's `?id=` follows the active account, so `account.html` shows the
account the auth button is pointing at.

### UI

`HUGGIES_COMPONENT_AUTH_BUTTON` - "LOGIN" when signed out; the active
account id when signed in. clicking it opens the account menu: every
known account (active one marked with a filled dot), `ADD ACCOUNT`
(re-runs the wallet sign-in, which is how the user's wallet is asked for
another account), and `SIGN OUT` (every account). each account row has a
`✕` that forgets just that one — the wallet stays connected, so the
other accounts keep working.

`frontend/lib/css/auth.css` styles the menu.

=====================
<br/>
copyright 2026 by sleet.near
