# frontend/app/index.html ?view={<all|mine>} ?account={<id>} ?hide_sent=1 ?sort={<date_added|most_popular>} ?type={<all|calls|swaps>} ?contracts={<ids>} ?accounts={<ids>} ?dir={<asc|desc>}

the feed. the app's front door, and a social feed of the work that is
queued and waiting to be signed: one post per queued batch of
transactions, one post per queued swap, a filter bar above them, and the
reader's own status on each one.

the filter bar has a TOP ROW - the view, the account and the hide-sent
switch - and a PANEL behind the FILTERS button, and the panel has FOUR
groups: the sort, the type, the contracts and the accounts. the url holds
all of them, so a filtered feed is a link somebody can paste. `view` is
ALL or MINE, `account` is the account the MINE view is about,
`hide_sent` drops what the reader has sent, `sort` is DATE ADDED or MOST
POPULAR, `dir` is the way round the sort, `type` is ALL, FUNCTION CALL or
SWAPS, and `contracts` and `accounts` are the picked contract and account
filters. the contract and account filters are LISTS - they go out to the
api as comma separated values, and the api reads them as an OR. the api
pages the feed with an opaque cursor, so the next page is asked for when
the reader nears the bottom.

a param at its default is LEFT OFF the url, so a link to the plain feed
opens the plain feed.

the filters can also be SAVED, and they are restored from the browser's
own storage when the feed opens. the url wins over the saved filters, so
a link somebody pasted is the link's view and not the reader's saved one.

the feed's LIST requests need NO api key - the queue list and the swap
list are OPEN, and a reader who is not signed in reads them like
anybody else. the key is only needed for the things a reader ACTS on.

the TYPE group says which kind of post is FETCHED: FUNCTION CALL asks
for the queued batches only, SWAPS asks for the queued swaps only, and
ALL asks for both. one kind is half the requests.

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
    <h1>SHIT-1170</h1>
    <!--==========================================-->
    <div id="SHIT_1170_COMPONENT_APP_PAGE_FEED_FILTERS"></div>
    <!--==========================================-->
    <div id="SHIT_1170_COMPONENT_APP_PAGE_FEED_POST"></div>
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
  <script src="../lib/ts/import-feed.ts"></script>
  <!--script-->
  <!--==========================================-->
</body>
```

=====================
<br/>
copyright 2026 by sleet.near
