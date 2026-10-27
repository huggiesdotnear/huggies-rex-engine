# frontend/app/account.html ?id={account_id}

<!--
this file contains the source of truth for what is on the page.
do not add classes here as they are something not written in stone.
-->

```html
<main>
  <!--==========================================-->
  <h1 id="HUGGIES_COMPONENT_ACCOUNT_ID_H1"></h1>
  <!--==========================================-->
  <div id="HUGGIES_COMPONENT_ACCOUNT_DIRECT_BALANCE_TABLE"></div>
  <!--==========================================-->
  <div id="HUGGIES_COMPONENT_ACCOUNT_RHEA_AMM_BALANCE_TABLE"></div>
  <!--==========================================-->
  <div id="HUGGIES_COMPONENT_ACCOUNT_RHEA_DCL_BALANCE_TABLE"></div>
  <!--==========================================-->
  <div id="HUGGIES_COMPONENT_ACCOUNT_INTEAR_BALANCE_TABLE"></div>
  <!--==========================================-->
</main>
<nav id="HUGGIES_COMPONENT_NAV"></nav>
<div id="HUGGIES_COMPONENT_AUTH_BUTTON"></div>
```

## the css

the page links two stylesheets: the app-wide base
(`frontend/lib/css/import.css`) and its own
(`frontend/lib/css/import-account.css`).

the import file pulls in `frontend/lib/css/pages/account.css` — the
page's own rules — plus the shared balance table and sort rules, which
the contract pages share too.

====================
<br/>
copyright 2026 by sleet.near
