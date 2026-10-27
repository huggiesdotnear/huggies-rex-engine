# frontend/index.html

SPLASH

<!--
this file contains the source of truth for what is on the page.
do not add classes here as they are something not written in stone.
-->

```html
<main>
  <!--==========================================-->
  <h1>HUGGIES</h1>
  <!--==========================================-->
  <p id="HUGGIES_COMPONENT_RANDOM_SLOGAN_P"></p>
  <!--==========================================-->
</main>
```

the page shows the app's name and one random slogan, then sends the
browser to `frontend/app/index.html` — the FEED — after a 1.5s delay.

## the components

| component                           | what it shows                            |
| ----------------------------------- | ---------------------------------------- |
| `HUGGIES_COMPONENT_RANDOM_SLOGAN_P` | one random slogan from `HUGGIES_SLOGANS` |

the redirect is in `frontend/lib/ts/index.ts`, not in a component.

====================
<br/>
copyright 2026 by sleet.near
