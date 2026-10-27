# TODO

the pages that still need their spec written. one page at a time — the
stuff on a page is often wrong, so the page gets looked at before its
spec gets written.

a page is done when:
- the md file holds the description and the html codeblock (no placeholder)
- `components.csv` has a row for every component the page mounts
- `requests.csv` has a row for every request the page makes
- the html matches the spec (drop the `.huggies-page` wrapper — `main`
  does that job now)

## the pages

- [ ] `frontend/app/index.html` — FEED
  - [ ] the page is a placeholder right now (`HUGGIES` + `COMING SOON!`),
        so decide what the feed shows before anything else — then the spec
        describes that, not the placeholder
  - [ ] drop the `.huggies-page` wrapper from the html
- [ ] `frontend/app/skill.html` — SKILL
  - [ ] the page is empty apart from the `SKILL` heading — decide what
        the page is for and what it shows, then write the spec
  - [ ] drop the `.huggies-page` wrapper from the html
- [ ] `frontend/app/game.html` — GAME
  - [ ] one component, `HUGGIES_COMPONENT_EMOJI_MATCH_GAME` (the
        eight-pair emoji memory match game); the emoji-to-token list is
        a constant (`app_page_game_emoji_tokens.ts`) and each card links
        to a token page, so the page makes no requests
  - [ ] drop the `.huggies-page` wrapper from the html
- [ ] `frontend/app/tokens/token.html` — TOKEN ?id=
  - [ ] one component, `HUGGIES_COMPONENT_TOKEN_DETAIL_PAGE`; the loader
        `tokens_page_token_detail_fetch.ts` makes two calls — the token
        metadata (`GET /tokens`) and one page of holders
        (`GET /holders`) — so the page needs two `requests.csv` rows
  - [ ] drop the `.huggies-page` wrapper from the html
- [ ] `frontend/app/tokens/shit-1170.html` — $SHIT
  - [ ] one component, `HUGGIES_COMPONENT_SHIT_1170_PAGE`; the loaders
        make three calls — the token summary (`GET /tokens`), the holders
        (`GET /holders`) and a near contract view for the price ref
  - [ ] drop the `.huggies-page` wrapper from the html
- [ ] `frontend/app/contract/rhea-amm.html` — RHEA AMM
  - [ ] the page is a `COMING SOON` placeholder by design
        (`contract_coming_soon.tsx` — the pool data it used to show is
        wrong) — the spec should say so, and the page needs no requests
  - [ ] drop the `.huggies-page` wrapper from the html
- [ ] `frontend/app/contract/rhea-dcl-v2.html` — RHEA DCL V2
  - [ ] same `COMING SOON` placeholder as rhea-amm, contract id
        `dclv2.ref-labs.near` — spec it, no requests
  - [ ] drop the `.huggies-page` wrapper from the html
- [ ] `frontend/app/contract/intear-dex.html` — INTEAR DEX
  - [ ] same `COMING SOON` placeholder, contract id `dex.intear.near` —
        spec it, no requests
  - [ ] drop the `.huggies-page` wrapper from the html
- [ ] `frontend/app/contract/sputnik-dao.html` — SPUTNIK DAO
  - [ ] the only contract page with real data — the loader
        `contract_page_sputnik_dao.ts` makes four near contract view
        calls (config, policy, proposals, available amount) plus one
        `near.rpc.getAccount` for the native balance, and the page reads
        the trezu treasuries list, so it needs the most `requests.csv`
        rows of any page
  - [ ] the page takes an optional `?dao_id=` — say so in the spec, the
        same way `?id=` is said on the other pages
  - [ ] drop the `.huggies-page` wrapper from the html

## done

- [x] `frontend/index.html` — the splash, one random slogan then a
      redirect to the feed
- [x] `frontend/app/auth.html` — the login button, bounces a signed-in
      reader to `account.html`
- [x] `frontend/app/account.html` — one account's balances from `?id=`
- [x] `frontend/app/discover.html` — the contract cards and the token
      list
- [x] `frontend/app/contract/pumpopoly.html` — one player from `?id=`

=====================
<br/>
copyright 2026 by sleet.near
