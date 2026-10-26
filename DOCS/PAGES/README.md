# PAGES

pages and ui layout

nav

- index.html - FEED
- account.html - PROFILE
- discover.html - DISCOVER

---

#### FEED - frontend/app/index.html

transaction feed

#### DISCOVER - frontend/app/discover.html

searchable token list and links to supported smart contracts

the token list is the whole indexed token set, ordered by 24-hour volume
or market cap in either direction. the default view leads with our own
token — see [`token.md`](./token.md)

#### TOKEN - frontend/app/tokens/token.html

token metadata and indexed holders - ?id=

see [`token.md`](./token.md)

#### $SHIT - frontend/app/tokens/shit-1170.html

the dedicated SHIT-1170 holders page - all indexed holders with the
known-holder type tags and filters

see [`shit-1170.md`](./shit-1170.md)

#### GAME - frontend/app/game.html

the emojifi emoji memory-match game, in the huggies style. linked as a
quiet easter egg at the bottom of the discover page, not in the nav.

see [`game.md`](./game.md)

#### ACCOUNT - frontend/app/account.html

profile/account page - ?id=

see [`account.md`](./account.md)

#### SKILL - frontend/app/skill.html

skill info page

### AUTH - frontend/app/auth.html

auth login page, auto redirects to account page if logged in

multi-account sign in — see [`auth.md`](./auth.md)

#### CONTRACTS - frontend/app/contract/

one html file per smart contract, served under `/app/contract/`:

- `rhea-amm.html`
- `rhea-dcl-v2.html`
- `intear-dex.html`
- `sputnik-dao.html`
- `pumpopoly.html`

smart-contract details, active-account internal balances, and LP positions

each page has its own component and mount id — there is no shared
contract page that switches on a contract key. the three dex pages
(rhea-amm, rhea-dcl-v2, intear-dex) are placeholders for now and say
`COMING SOON`.

see [`contracts.md`](./contracts.md)

=====================
<br/>
copyright 2026 by sleet.near
