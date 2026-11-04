# frontend/app/skill.html

the skill page. it shows the api key card for the signed-in accounts and
cards for installing the NEAR contract skills and the shit-1170 rex
engine skills.

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
    <div id="SHIT_1170_COMPONENT_APP_PAGE_SKILL_INSTALLS"></div>
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

## THE API KEY CARD

the card shows ONE CARD PER SIGNED-IN ACCOUNT. every account has its
own api key, because a key has to be narrowable to one wallet.

each card carries:

- the account id
- the account's api key, in full — the reader is the user, and they
  need to copy it
- a COPY FOR AGENT button — copies the key with instructions telling
  the agent to use the shit-1170 rex engine skills to propose and queue
  transactions
- a ROTATE button — a key that has been seen by somebody else should be
  replaceable

a COPY ALL FOR AGENT button sits under the cards, so a reader with
several accounts does one copy-paste and not ten.

## THE SKILL INSTALL CARDS

the page has one card for the general NEAR contract skills and one for
the shit-1170 rex engine skills. each card links to the skill
repository, shows the add and list commands in a code block, and has one
copy button that copies the commands together with a short message.

=====================
<br/>
copyright 2026 by sleet.near
