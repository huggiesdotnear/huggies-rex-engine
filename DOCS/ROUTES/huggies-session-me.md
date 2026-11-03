# HUGGIES SESSION ME

`GET /api/huggies/session/me` - who does this session key belong to.

the first route that REQUIRES the session key. the key travels in the
`x-session-token` header, and the answer is the user the key belongs
to.

## THE HEADER

```
x-session-token: 0c97945f73913108222fe70ef6c41bd0f88edb2d5592c8868fd728a989b7e165
```

the key is in a HEADER and not in a query parameter: a url ends up in
logs, in the browser's history, and in the `referer` of the next page. a
bearer token belongs in a header.

## THE ANSWER

`200`:

```json
{
  "userId": "alice.near",
  "accounts": ["alice.near", "bob.near"],
  "createdAt": 1793683430726
}
```

on failure it answers json in the shape
`{ "error": { "code", "message" } }`:

- `401` - `no_session_key` when the header is missing, or
  `unknown_session_key` when the key is not one of ours
- `500` - `db_unavailable` when the db could not be reached

## HOW THE KEY IS FOUND

the key is hashed with sha-256 and the hash is what is looked up. the
db holds the hash and the encrypted key — never the plain key — so the
request's key is never compared against anything in the db and no row
has to be decrypted to find the match.

## CLIENT

the typed client lives in `middleman/src/`, published as
`@huggies/huggies-rex-engine-middleman`:
`api_huggies_session_me_get(base_url, options)` — where `options` is
`{ session_token }`.

the middleman cannot know the reader's key on its own: it is a plain
client with no browser state. the frontend attaches the key — see
`frontend/lib/ts/shared/session_token.ts`.

> --- WHY --- the frontend asks for the key through one helper rather
> than reading it directly. the key may not be known yet on the very
> first page load, and a loader that read it directly would send the
> request with no key at all — which the backend answers with a 401.

=====================
<br/>
copyright 2026 by sleet.near
