# SHIT-1170 API KEYS

`POST /api/shit-1170/api-keys` - turn signed messages into api keys.

the browser sends every account it holds a signed message for. the
backend verifies each signature and hands back **ONE KEY PER ACCOUNT**.

it is the sign-in route. it is the only way an api key is ever made.

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

the accounts come from the browser's own signed messages - the ones the
wallet made when the reader signed in.

## THE ANSWER

`200` with one entry per account:

```json
{
  "keys": [
    {
      "accountId": "alice.near",
      "apiKey": "shit_1170_ab7fca21168a6961f47677dee81dc178cd0aa9b7146c38fa9c87c3bd1e0f8fc2",
      "created": true
    },
    {
      "accountId": "bob.near",
      "apiKey": "shit_1170_e752d71b129754be1072a1c413d894c82974788c2eae8232f140cf1c6cf45dac",
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
- `500` - `db_unavailable` when the db could not be reached

## THE KEY'S SHAPE

a key is the `shit_1170_` prefix followed by 32 random bytes hex
encoded - 10 characters of prefix and 64 of hex.

the prefix is BRANDING, not security: it is a known string, it adds no
entropy, and it protects nothing. it is there so a key that is ours is
recognisable at a glance, and so a key pasted into the wrong place is
noticed.

only NEW keys carry it. the read path hashes the WHOLE key, prefix and
all, and the db is looked up by that hash - so a key of either shape
finds its account.

## WHY IT IS CALLED AN API KEY

the key is not a browser session. the user signs in once, hands the key
to an agent, and the agent holds it as a bearer token for as long as it
lives. a "session" describes the browser's short use of it; an "api
key" describes what it actually is - a long-lived credential for
calling this backend, held by a third party.

that is why the header it travels in is `x-api-key`, and why the old
`x-session-token` name is only kept as a fallback during the beta. see
[`shit-1170-api-key-me.md`](./shit-1170-api-key-me.md) for the header
rule in full.

## ONE KEY PER ACCOUNT

an account has exactly one key, on every device. signing in on a second
device hands back the SAME key, so the first device keeps working.

there is no linking between accounts and no account list: an account
belongs to itself. the account id is the row's primary key, so there is
no question of which person an account belongs to, nothing to merge and
nothing to keep in agreement.

the key's sha-256 is stored next to it, so a request is looked up by the
hash and the read path never compares against every row's key.

## THE VERIFICATION

each account's signature is checked against the exact message, nonce and
recipient that were signed. the check is near-kit-rs's
`nep413::verify_signature` - the same project the browser signs with,
so the two agree byte for byte.

> --- WHY --- all the accounts are verified BEFORE any key is made. a body
> with one good signature and one forged one is a body that must be
> refused as a whole. handing out a key for the good half would make the
> forged half pointless to forge.

> --- WHY --- the nonce's AGE is not checked. the browser's signed message
> was made when the reader signed in, which may have been days ago, and
> it is sent to us whenever a page opens. the timestamp is still checked
> for sanity, but an api key does not expire.

> --- WHY --- a duplicate account id is refused and not ignored. the body
> would carry two signatures for one account, and which one wins would be
> a coin toss. a wallet that exposes an account twice is a wallet that is
> confused.

## NO PRIVATE KEY, EVER

the app never holds the reader's NEAR private key. the wallet keeps it
and only ever signs. what the browser sends is the PUBLIC key and the
signature, and neither can sign anything - so a leaked browser storage
or a leaked db row cannot be used to act as that user.

the only secret the app holds is the api key, which is ours.

## CLIENT

the typed client lives in `middleman/src/`, published as
`@huggies/shit-1170-rex-engine-middleman`:
`api_shit_1170_api_keys_post(base_url, { accounts })`.

it takes NO api key in the header — the signed message is the proof, so
there is nothing to attach.

the base url is the first argument, not a constant: the frontend passes
the origin of the page it is served from, and a bin passes whatever
backend it was told to talk to.

=====================
<br/>
copyright 2026 by sleet.near
