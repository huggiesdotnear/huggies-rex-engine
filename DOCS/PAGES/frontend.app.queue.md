# frontend/app/queue.html ?queue={queue_id}

the page shows one queued batch: what it is, every call it makes, every
account it is for, and where the reader stands on it.

the page's sections are STATUS, SUMMARY, TRANSFERS, FILES, CALLS,
ACCOUNTS and ACTIONS. TRANSFERS and FILES are the queue page's WIDGETS
— the sections that show one kind of thing the batch asks for, and only
when it asks for it — and they sit where the transaction page puts its
own: the files come after the transfers and before the raw calls, so
what the batch will DO is above and what it WILL CALL is below. the
registry in `frontend/lib/components/queue/widgets/queue_widgets.ts`
decides WHICH widgets apply and the page's divs decide WHERE they go.

```html
<body>
  <!--==========================================-->
  <div id="SHIT_1170_COMPONENT_LOADING_BAR"></div>
  <!--==========================================-->
  <!--==========================================-->
  <!--==========================================-->
  <!--==========================================-->
  <!--==========================================-->
  <main>
    <h1>QUEUE</h1>
    <!--==========================================-->
    <div id="SHIT_1170_COMPONENT_QUEUE_STATUS"></div>
    <!--==========================================-->
    <div id="SHIT_1170_COMPONENT_QUEUE_SUMMARY"></div>
    <!--==========================================-->
    <div id="SHIT_1170_COMPONENT_QUEUE_TRANSFERS"></div>
    <!--==========================================-->
    <div id="SHIT_1170_COMPONENT_QUEUE_FASTFS"></div>
    <!--==========================================-->
    <div id="SHIT_1170_COMPONENT_QUEUE_TRANSACTIONS"></div>
    <!--==========================================-->
    <div id="SHIT_1170_COMPONENT_QUEUE_ACCOUNTS"></div>
    <!--==========================================-->
    <div id="SHIT_1170_COMPONENT_QUEUE_ACTIONS"></div>
    <!--==========================================-->
  </main>
  <!--==========================================-->
  <!--==========================================-->
  <!--==========================================-->
  <nav id="SHIT_1170_COMPONENT_NAV"></nav>
  <!--==========================================-->
  <div id="SHIT_1170_COMPONENT_AUTH_BUTTON"></div>
  <!--==========================================-->
  <div id="SHIT_1170_COMPONENT_TOAST_LAYER"></div>
  <!--==========================================-->
  <!--<footer>COPYRIGHT 2026</footer>-->
  <!--==========================================-->
  <!--==========================================-->
  <!--script-->
  <script src="../lib/ts/import-queue.ts"></script>
  <!--script-->
  <!--==========================================-->
</body>
```

=====================
<br/>
copyright 2026 by sleet.near
