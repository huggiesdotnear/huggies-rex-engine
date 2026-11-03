# frontend/app/skill.html

the skill page. it shows the session management card: the accounts the
browser is signed in with, and the one session key the backend issued
for them.

```html
<body>
  <!--==========================================-->
  <div id="HUGGIES_COMPONENT_LOADING_BAR"></div>
  <!--==========================================-->
  <!--==========================================-->
  <!--==========================================-->
  <!--==========================================-->
  <main>
    <h1>SKILL</h1>
    <div id="HUGGIES_COMPONENT_APP_PAGE_SKILL_SESSION"></div>
    <!--==========================================-->
    <p>
      MORE IS COMING TO THIS PAGE: THE SKILLS THEMSELVES, AND THE ENDPOINTS THAT
      TAKE THE SESSION KEY.
    </p>
    <!--==========================================-->
  </main>
  <!--==========================================-->
  <nav id="HUGGIES_COMPONENT_NAV"></nav>
  <!--==========================================-->
  <div id="HUGGIES_COMPONENT_AUTH_BUTTON"></div>
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

the card shows two things side by side:

- the accounts the browser holds a signed message for
- the session key — ONE per user, the same on every device

the key is shown in full and not masked: the reader is the user, and
they need to copy it. there is a COPY button, because a 64-character hex
key cannot be picked out of a line of text by hand.

## THE COMING SOON NOTE

the note is plain text in the html, not a component and not part of the
card. the card is about session management and the note is about the
page — the skills and the endpoints that will take the key.

=====================
<br/>
copyright 2026 by sleet.near
