# frontend/app/skill.html

the skill page. it shows the session management card: the accounts the
browser is signed in with, and the one api key the backend issued
for them.

```html
<body>
  <!--==========================================-->
  <div id="SHIT_1170_COMPONENT_LOADING_BAR"></div>
  <!--==========================================-->
  <!--==========================================-->
  <!--==========================================-->
  <!--==========================================-->
  <main>
    <h1>SKILL</h1>
    <div id="SHIT_1170_COMPONENT_APP_PAGE_SKILL_SESSION"></div>
    <!--==========================================-->
    <p>
      MORE IS COMING TO THIS PAGE: THE SKILLS THEMSELVES, AND THE ENDPOINTS THAT
      TAKE THE API KEY.
    </p>
    <!--==========================================-->
  </main>
  <!--==========================================-->
  <nav id="SHIT_1170_COMPONENT_NAV"></nav>
  <!--==========================================-->
  <div id="SHIT_1170_COMPONENT_AUTH_BUTTON"></div>
  <!--==========================================-->
  <!--<footer>COPYRIGHT 2026</footer>-->
  <!--==========================================-->
  <!--script-->
  <script src="../lib/ts/import-skill.ts"></script>
  <!--script-->
  <!--==========================================-->
</body>
```

## THE SESSION CARD

the card shows ONE CARD PER SIGNED-IN ACCOUNT. every account has its
own api key, because a key has to be narrowable to one wallet.

each card carries:

- the account id, with the active one marked by a filled dot
- the account's api key, in full — the reader is the user, and they
  need to copy it
- a COPY KEY button — a 74-character key cannot be picked out of a
  line of text by hand
- a ROTATE button — a key that has been seen by somebody else should be
  replaceable

a COPY ALL KEYS button sits under the cards, so a reader with several
accounts does one copy-paste and not ten.

## THE COMING SOON NOTE

the note is plain text in the html, not a component and not part of the
card. the card is about session management and the note is about the
page — the skills and the endpoints that will take the key.

=====================
<br/>
copyright 2026 by sleet.near
