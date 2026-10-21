# PAGES

pages and ui layout

nav

- index.html - FEED
- swap.html - SWAP
- account-router.html - PROFILE
- skill.html - SKILL

---

#### FEED - frontend/app/index.html

transaction feed

#### SWAP - frontend/app/swap.html

swap componenet

#### ACCOUNT - frontend/app/account.html

profile/account page - ?id=

the account id comes from the `?id=` url parameter, NOT from auth —
any account renders for anyone. components read it through
`frontend/lib/ts/account_id.ts` and render nothing when there is no
`?id=`.

- `HUGGIES_COMPONENT_ACCOUNT_ID_H1` - <h1> of the account id, left
  aligned with a bottom border.
- `HUGGIES_COMPONENT_ACCOUNT_DIRECT_BALANCE_TABLE` - table of the
  account's direct token balances from the intear api. `direct` source
  only; `native` and `rhea` (LP positions) are not shown here.

#### SKILL - frontend/app/skill.html

skill info page

### AUTH - frontend/app/auth.html

auth login page, auto redirects to account page if logged in

=====================
<br/>
copyright 2026 by sleet.near
