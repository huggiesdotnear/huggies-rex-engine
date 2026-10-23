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

### NETWORK

this app is MAINNET ONLY. there is no network toggle.

`frontend/lib/ts/network.ts` owns that decision. it calls the package's
`setNetwork_mainnet()` on import, so the stored `network_id` is mainnet
before anything reads it.

the pin matters because the package's `getStoredNetworkId()` defaults to
mainnet only when the key is ABSENT — a returning user who once toggled to
testnet still has "testnet" stored and would land on the testnet
connector.

mainnet-only also removes a whole class of near-connect trouble: the
package keeps a separate connector per network, and those two connectors
share the `selected-wallet` key and the wallet's own storage namespace
(`<walletId>:`). near-connect's `signOut()` wipes that whole namespace
regardless of network, so a toggle could take the other network's wallet
session down with it. one network means one connector, one wallet
session, nothing to reason about.

each session still records the network it was made on, because a
signature is only meaningful against the RPC it was made on — a
server-side verify needs to know which one to check against.

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
