# PAGES

one spec file per html page.

the file name is the page path, dots instead of slashes:
`frontend/app/account.html` -> [`frontend.app.account.md`](./frontend.app.account.md)

a page outside `app/` has no `app.` in its name:
`frontend/index.html` -> [`frontend.index.md`](./frontend.index.md)

every spec starts with the page path as its h1, then the layout: the
page heading, then the components, top to bottom, in the order they
appear on screen. a component is written as its mount id, so the spec
can be read straight against the html.

a page with no layout yet says `page spec coming soon`.

## Pages

- [`frontend.index.md`](./frontend.index.md) - `frontend/index.html`
- [`frontend.app.index.md`](./frontend.app.index.md) - `frontend/app/index.html` - FEED
- [`frontend.app.auth.md`](./frontend.app.auth.md) - `frontend/app/auth.html`
- [`frontend.app.discover.md`](./frontend.app.discover.md) - `frontend/app/discover.html`
- [`frontend.app.skill.md`](./frontend.app.skill.md) - `frontend/app/skill.html`
- [`frontend.app.game.md`](./frontend.app.game.md) - `frontend/app/game.html`
- [`frontend.app.account.md`](./frontend.app.account.md) - `frontend/app/account.html` - ?id=
  - [`frontend.app.account.requests.md`](./frontend.app.account.requests.md) - what the account page fetches
- [`frontend.app.tokens.token.md`](./frontend.app.tokens.token.md) - `frontend/app/tokens/token.html` - ?id=
- [`frontend.app.tokens.shit-1170.md`](./frontend.app.tokens.shit-1170.md) - `frontend/app/tokens/shit-1170.html`
- [`frontend.app.contract.rhea-amm.md`](./frontend.app.contract.rhea-amm.md) - `frontend/app/contract/rhea-amm.html`
- [`frontend.app.contract.rhea-dcl-v2.md`](./frontend.app.contract.rhea-dcl-v2.md) - `frontend/app/contract/rhea-dcl-v2.html`
- [`frontend.app.contract.intear-dex.md`](./frontend.app.contract.intear-dex.md) - `frontend/app/contract/intear-dex.html`
- [`frontend.app.contract.sputnik-dao.md`](./frontend.app.contract.sputnik-dao.md) - `frontend/app/contract/sputnik-dao.html`
- [`frontend.app.contract.pumpopoly.md`](./frontend.app.contract.pumpopoly.md) - `frontend/app/contract/pumpopoly.html` - ?id=
  - [`frontend.app.contract.pumpopoly.requests.md`](./frontend.app.contract.pumpopoly.requests.md) - what the pumpopoly page fetches

## The nav

- index.html - FEED
- account.html - PROFILE
- discover.html - DISCOVER
- skill.html - SKILL

=====================
<br/>
copyright 2026 by sleet.near
