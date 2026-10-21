# FILES

some files/folders

- `frontend/` frontend
- `src/` backend
- `middleman/` - ts library for interacting with my backend
- `bin/` - ts files that i can run with bun

### frontend components

each component self-mounts into an element with a matching id from
`frontend/lib/ts/mount_ids.ts`. a component only mounts when that id is
actually on the page, so the same import works everywhere.

- `frontend/lib/components/nav.tsx` — top-level nav
- `frontend/lib/components/random_slogan_p.tsx` — random slogan line
- `frontend/lib/components/network_button.tsx` — mainnet/testnet toggle
- `frontend/lib/components/auth_button.tsx` — sign in / sign out

### frontend auth

sign-in state lives outside the button so other components can read it
without re-implementing the wallet handshake.

- `frontend/lib/ts/auth_status.ts` — all sign-in state, the NEP-413
  signed-message flow, and session persistence. exports `HUGGIES_AUTH`.
- `frontend/lib/ts/sign_in_messages.ts` — the fixed NEP-413 message and
  recipient, plus the random session phrases shown during sign-in.

the signed message is stored under `huggies_auth_session` in
localStorage together with the `message`, `nonce`, `recipient` and
`network` it depends on. all four are required later: a NEP-413
signature is not self-describing, so the server has to rebuild the
exact payload to verify it.

the nonce comes from near-kit's `generateNonce()`, NOT raw
`crypto.getRandomValues`. `generateNonce()` puts a big-endian ms
timestamp in the first 8 bytes; `verifyNep413Signature` reads that back
and rejects anything older than `maxAge` (5 min default). a raw random
nonce decodes as a timestamp centuries in the future and silently fails
verification forever after.

server-side verification, once it exists:

```ts
import { verifyNep413Signature } from "near-kit";

const ok = await verifyNep413Signature(
  { accountId, publicKey, signature },
  { message, recipient, nonce: base64_to_bytes(nonce) },
  { near, network },
);
```

### running it

`cargo run` binds `0.0.0.0` (a wildcard, not a URL you can open) and
prints the addresses you can actually use:

```
open in a browser:
  http://localhost:54733   <- use this for wallet login
  http://192.168.1.20:54733 <- LAN, wallet login will NOT work here
```

**always open `localhost` for wallet work.** a LAN address over plain
HTTP is not a secure context, so the browser withholds WebCrypto
Ed25519 from the wallet's sandbox iframe and sign-in fails with
`Cannot read properties of undefined (reading 'generateKey')`.
`https`, `http://localhost` and `http://127.0.0.1` are all treated as
secure.

bind somewhere else with `HUGGIES_HOST` / `HUGGIES_PORT`
(defaults `0.0.0.0` and `54733`).

=========================
<br/>
copyright 2026 by sleet.near
