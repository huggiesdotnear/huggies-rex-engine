# frontend/app/account.html ?id={account_id} ?tab={balances|transactions}

the page shows one account. the balances tab shows what the account holds and the transactions tab shows what it has done.

<!--
this file contains the source of truth for what is on the page.
do not add classes here as they are something not written in stone.
do not add this comment to other files.
a page's md file should only contain the html codeblock, nothing else.
-->

```html
<body>
  <!--==========================================-->
  <div id="HUGGIES_COMPONENT_LOADING_BAR"></div>
  <!--==========================================-->
  <main>
    <!--==========================================-->
    <h1 id="HUGGIES_COMPONENT_ACCOUNT_ID_H1"></h1>
    <!--==========================================-->
    <div id="HUGGIES_COMPONENT_ACCOUNT_TABS"></div>
    <!--==========================================-->
    <div id="HUGGIES_COMPONENT_ACCOUNT_DIRECT_BALANCE_TABLE"></div>
    <!--==========================================-->
    <div id="HUGGIES_COMPONENT_ACCOUNT_RHEA_AMM_BALANCE_TABLE"></div>
    <!--==========================================-->
    <div id="HUGGIES_COMPONENT_ACCOUNT_RHEA_DCL_BALANCE_TABLE"></div>
    <!--==========================================-->
    <div id="HUGGIES_COMPONENT_ACCOUNT_INTEAR_BALANCE_TABLE"></div>
    <!--==========================================-->
    <div id="HUGGIES_COMPONENT_ACCOUNT_TX_CARDS"></div>
    <!--==========================================-->
    <div id="HUGGIES_COMPONENT_ACCOUNT_TRANSACTIONS_TABLE"></div>
    <!--==========================================-->
  </main>
  <!--==========================================-->
  <nav id="HUGGIES_COMPONENT_NAV"></nav>
  <!--==========================================-->
  <div id="HUGGIES_COMPONENT_AUTH_BUTTON"></div>
  <!--==========================================-->
  <!--<footer>COPYRIGHT 2026</footer>-->
  <!--==========================================-->
  <!--==========================================-->
  <!--script-->
  <script src="../lib/ts/hello.ts"></script>
  <script src="../lib/ts/account/app_page_account_route.ts"></script>
  <script src="../lib/ts/account/app_page_account_start.ts"></script>
  <script src="../lib/ts/import-account.ts"></script>
  <!--script-->
  <!--==========================================-->
</body>
```

====================
<br/>
copyright 2026 by sleet.near
