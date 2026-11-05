# frontend/app/index.html ?hide_sent=1 ?sort={<date_added|most_popular>} ?type={<all|calls|swaps>} ?contracts={<ids>} ?accounts={<ids>} ?dir={<asc|desc>}

the feed. the app's front door, and a social feed of the work that is
queued and waiting to be signed: one post per queued batch of
transactions, one post per queued swap, a filter bar above them, and the
reader's own status on each one.

the filter bar has a TOP ROW - the hide-sent switch, the FILTERS button
and the direction button - and a PANEL behind the FILTERS button, and the
panel has FOUR groups: the sort, the type, the contracts and the
accounts. the url holds all of them, so a filtered feed is a link
somebody can paste. `hide_sent` drops what the reader has sent, `sort` is
DATE ADDED or MOST POPULAR, `dir` is the way round the sort, `type` is
ALL, FUNCTION CALL or SWAPS, and `contracts` and `accounts` are the
picked contract and account filters. the contract and account filters are
LISTS - they go out to the api as comma separated values, and the api
reads them as an OR. the api pages the feed with an opaque cursor, so the
next page is asked for when the reader nears the bottom.

a param at its default is LEFT OFF the url, so a link to the plain feed
opens the plain feed.

the ACCOUNTS group offers the reader's OWN account first, as a ME button
with the account id in its tooltip, so a reader can pick their own queues
without recognising their id in a long row of ids. it is there even when
the reader has no queued work of their own, because an account with no
queued work is not in the facets.

the filters can also be SAVED, and they are restored from the browser's
own storage when the feed opens. the saved filter holds the switch, the
sort, the direction, the type and the two lists - a reader who saved
"just my account" saved that in the accounts list, and the accounts list
IS saved. the url wins over the saved filters, so a link somebody pasted
is the link's view and not the reader's saved one, and the saved filters
only fill in what the url does not say.

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
