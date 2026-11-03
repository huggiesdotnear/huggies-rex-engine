# SHIT_1170 SESSION ROTATE

`POST /api/shit-1170/session/rotate` - give an account a NEW session key.

the old key stops working at once, and the new one takes its place.

## THE REQUEST

the same body the sessions route takes, with **one** account — the one
being rotated:

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

## THE ANSWER

`200`:

```json
{
  "accountId": "alice.near",
  "sessionKey": "shit_1170_8c711c7ca8c208017203dcfa9e5f83f7cb9814cb575225afe8bc6fcaf95e21bc",
  "created": true
}
```

on failure it answers json in the shape
`{ "error": { "code", "message" } }`:

- `400` - `no_accounts`, `too_many_accounts` when more than one account
  was sent, or `signature_invalid` when the signature did not verify
- `404` - `no_session` when the account has no session to rotate
- `500` - `db_unavailable`

## WHY THE SIGNED MESSAGE AND NOT THE OLD KEY

the old key is what a thief has. if a rotation only needed the old key,
a thief could rotate it — getting a fresh key and locking the owner out
at the same time.

so a rotation carries the account's **signed message**: it proves the
owner still holds the account's NEAR key.

no wallet popup is needed. the browser already holds the signed message
in its local storage from the sign-in, and the signature covers the
message + nonce + recipient. the reader asked for the rotation on
purpose.

## THE OLD KEY DIES AT ONCE

there is no grace window. the point of a rotation is that the old key
stops working, and a grace window would mean a stolen key keeps working
for that window.

the new key's hash is written with it, so the old key no longer finds
the row — a rotate that kept the old hash would still be found by the
old key, which is exactly what a rotation must stop.

## CLIENT

the typed client lives in `middleman/src/`, published as
`@huggies/shit_1170-middleman`:
`api_shit_1170_session_rotate_post(base_url, { accounts }, options)`.

=====================
<br/>
copyright 2026 by sleet.near
