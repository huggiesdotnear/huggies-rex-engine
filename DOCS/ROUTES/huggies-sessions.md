# HUGGIES SESSIONS

`POST /api/huggies/sessions` - turn signed messages into session keys.

the browser sends every account it holds a signed message for. the
backend verifies each signature and hands back **ONE KEY PER ACCOUNT**.

## THE REQUEST

a json body with one field:

```json
{
  "accounts": [
    {
      "accountId": "alice.near",
      "publicKey": "ed25519:FrtUfbY74kXpBiWmqeQMtn7jKCX3zJhmwyg32ZqANj3c",
      "signature": "9hN3lqANSh3bCxWWDwAsE7kayGw2K/oq/MWhQK/E9gUtyrqnxguNUmheVetaaLPYqe/SJIpSzXH69g45GSAJDQ==",
      "message": "I verify I have diaper hands and own this NEAR account.",
      "nonce": "AAABoZ/RpNoPXmyGFCEWPhy8OwvLPmyTUBkmfGlTt7o=",
      "recipient": "huggies.near"
    }
  ]
}
```

the accounts come from the browser's own session map — the signed
messages the wallet made when the reader signed in.

## THE ANSWER

`200` with one entry per account:

```json
{
  "keys": [
    {
      "accountId": "alice.near",
      "sessionKey": "ab7fca21168a6961f47677dee81dc178cd0aa9b7146c38fa9c87c3bd1e0f8fc2",
      "created": true
    },
    {
      "accountId": "bob.near",
      "sessionKey": "e752d71b129754be1072a1c413d894c82974788c2eae8232f140cf1c6cf45dac",
      "created": true
    }
  ]
}
```

`created` is true when the call made the key and false when the key
already existed and the same one was handed back.

on failure it answers json in the shape
`{ "error": { "code", "message" } }`:

- `400` - `no_accounts` when the body carried no accounts,
  `signature_invalid` when one account's signature did not verify, or
  `duplicate_account` when the same account was sent twice
- `500` - `db_unavailable` when the db could not be reached, or
  `session_key_unreadable` / `session_key_unencryptable` when the key
  could not be read back or written

## ONE KEY PER ACCOUNT

an account has exactly one key, on every device. signing in on a second
device hands back the SAME key, so the first device keeps working.

there is no linking between accounts and no account list: an account
belongs to itself. the account id is the row's primary key, so there is
no question of which person an account belongs to, nothing to merge and
nothing to keep in agreement.

the key is stored ENCRYPTED in the db, and its sha-256 is stored next to
it so a request can be looked up without decrypting every row. the plain
key is never in the db.

## THE VERIFICATION

each account's signature is checked against the exact message, nonce and
recipient that were signed. the check is near-kit-rs's
`nep413::verify_signature` — the same project the browser signs with,
so the two agree byte for byte.

> --- WHY --- all the accounts are verified BEFORE any key is made. a body
> with one good signature and one forged one is a body that must be
> refused as a whole. handing out a key for the good half would make the
> forged half pointless to forge.

> --- WHY --- the nonce's AGE is not checked. the browser's session was
> signed when the reader signed in, which may have been days ago, and it
> is sent to us whenever a page opens. the timestamp is still checked
> for sanity, but a session does not expire.

## NO PRIVATE KEY, EVER

the app never holds the reader's NEAR private key. the wallet keeps it
and only ever signs. what the browser sends is the PUBLIC key and the
signature, and neither can sign anything — so a leaked browser storage
or a leaked db row cannot be used to act as that user.

the only secret the app holds is the session key, which is ours.

## CLIENT

the typed client lives in `middleman/src/`, published as
`@huggies/huggies-rex-engine-middleman`:
`api_huggies_sessions_post(base_url, { accounts })`.

the base url is the first argument, not a constant: the frontend passes
the origin of the page it is served from, and a bin passes whatever
backend it was told to talk to.

=====================
<br/>
copyright 2026 by sleet.near
