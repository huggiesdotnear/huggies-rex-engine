# frontend/index.html

the page shows the app's name and one random slogan, then sends the
browser to `frontend/app/index.html` — the FEED — after a 1.5s delay.

the redirect is in `frontend/lib/ts/index.ts`, not in a component.

```html
<main>
  <!--==========================================-->
  <h1>HUGGIES</h1>
  <!--==========================================-->
  <p id="HUGGIES_COMPONENT_RANDOM_SLOGAN_P"></p>
  <!--==========================================-->
</main>
```

====================
<br/>
copyright 2026 by sleet.near
