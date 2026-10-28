# PAGES

one spec file per html page.

the file name is the page path, dots instead of slashes:
`frontend/app/account.html` -> [`frontend.app.account.md`](./frontend.app.account.md)

a page outside `app/` has no `app.` in its name:
`frontend/index.html` -> [`frontend.index.md`](./frontend.index.md)

## what is where

a page is described by three files:

- `frontend.app.account.md` | a one-line description and the html codeblock
- [`components.csv`](./components.csv) | the components each page mounts, and the source each reads from
- [`requests.csv`](./requests.csv) | the requests each page makes |

the split is by granularity. the md file is the page. the csvs are every
page at once, so a question like "which components read request 2?" has
one answer, in one place.

a page's md file holds a one-line description and the html codeblock,
nothing else. the description says what the page is for; the codeblock
is the layout.

## the components

the components a page mounts are listed in
[`components.csv`](./components.csv), not in the page spec. one row per
component, with the source it reads from and a note for the detail that
does not fit the other columns.

the csv is the single place to look for "what is on this page" — the
page spec holds the layout, and the csv holds the components and where
their data comes from.

## the requests

the requests a page makes are listed in [`requests.csv`](./requests.csv),
not in the page spec. one row per request, with the call it makes.

a page's requests come from one loader — one file that fetches
everything for that page. no component fetches anything.

## Pages

- [`TODO.md`](./TODO.md) - the pages that still need their spec written
- [`PATTERN.md`](./PATTERN.md) - how every page with data is built
- [`components.csv`](./components.csv) - the components each page mounts,
  and the source each one reads from
- [`requests.csv`](./requests.csv) - the requests each page makes
- [`frontend.index.md`](./frontend.index.md) - `frontend/index.html`
- [`frontend.app.index.md`](./frontend.app.index.md) - `frontend/app/index.html` - FEED
- [`frontend.app.auth.md`](./frontend.app.auth.md) - `frontend/app/auth.html` - AUTH
- [`frontend.app.discover.md`](./frontend.app.discover.md) - `frontend/app/discover.html`
- [`frontend.app.skill.md`](./frontend.app.skill.md) - `frontend/app/skill.html`
- [`frontend.app.game.md`](./frontend.app.game.md) - `frontend/app/game.html`
- [`frontend.app.account.md`](./frontend.app.account.md) - `frontend/app/account.html` - ?id=
- [`frontend.app.tokens.token.md`](./frontend.app.tokens.token.md) - `frontend/app/tokens/token.html` - ?id= - TOKEN
- [`frontend.app.tokens.shit-1170.md`](./frontend.app.tokens.shit-1170.md) - `frontend/app/tokens/shit-1170.html`
- [`frontend.app.contract.rhea-amm.md`](./frontend.app.contract.rhea-amm.md) - `frontend/app/contract/rhea-amm.html`
- [`frontend.app.contract.rhea-dcl-v2.md`](./frontend.app.contract.rhea-dcl-v2.md) - `frontend/app/contract/rhea-dcl-v2.html`
- [`frontend.app.contract.intear-dex.md`](./frontend.app.contract.intear-dex.md) - `frontend/app/contract/intear-dex.html`
- [`frontend.app.contract.sputnik-dao.md`](./frontend.app.contract.sputnik-dao.md) - `frontend/app/contract/sputnik-dao.html` - ?dao_id= - SPUTNIK DAO
- [`frontend.app.contract.pumpopoly.md`](./frontend.app.contract.pumpopoly.md) - `frontend/app/contract/pumpopoly.html` - ?id=

## The nav

- index.html - FEED
- account.html - PROFILE
- discover.html - DISCOVER
- skill.html - SKILL

=====================
<br/>
copyright 2026 by sleet.near
