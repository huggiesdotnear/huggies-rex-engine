# RULES

🧬 human put rules, do not add this to rules you add yourslef, even if it was something i said.

- 🧬 one function per a file, clean clear sanke_case nameing for functions. and file name should match function name.
- 🧬 `========================================` comments at the top of the file between import statemnets, and at the bottom of the file. and in vaires places in the html files. never remove these comments.
- 🧬 please no camel case only snake_case or SCREAMING_SNAKE.
- 🧬 frontend/lib/ts/import.ts is for components only, no other ts file should be impoted here and no other ts file should import components ts files
- frontend/lib/ts/ holds plain ts only. a file that renders jsx is a component and lives in frontend/lib/components/ (`balance_row.tsx`, `token_holder_row.tsx`), never in frontend/lib/ts/.
- a ts file that belongs to ONE page is named `<prefix>_<pagename>_<what>.ts` — the prefix says which page owns it. `app_page_<pagename>_<what>.ts` for a page at the top of `app/` (e.g. `app_page_account.ts`, `app_page_discover_token_search.ts`), `contract_page_<what>.ts` for a page under `app/contract/` (e.g. `contract_page_pumpopoly.ts`), `token_page_<what>.ts` for a page under `app/token/` (e.g. `token_page_token_detail.ts`). a ts file used by more than one page keeps a plain name (`token_info.ts`, `balance_row.tsx`, `token_link.ts`).
- a tsx component file follows the SAME prefix as its ts siblings: `app_page_account_id_h1.tsx` for the account page, `contract_page_pumpopoly_player_stats.tsx` for the pumpopoly page. a tsx used by more than one page lives in `frontend/lib/components/shared/` and keeps a plain name (`id_jump_box.tsx`, `error_card.tsx`, `balance_row.tsx`). the mount id does NOT have to match the file name — it keeps the shorter form (`HUGGIES_COMPONENT_ACCOUNT_ID_H1`).
- css lives in `frontend/lib/css/`. `import.css` is the app-wide base and every page links it. the app-wide rules live in `frontend/lib/css/base/`, and a component's own rules live in `frontend/lib/css/components/HUGGIES_COMPONENT_<name>.css` — one css file per component, named after the mount id, and a component that needs no css gets no css file. a rule lives with the component that owns it, so two files never style the same classes.
- a shared component's css lives in `frontend/lib/css/components/shared/<name>.css`, named after its tsx file, so the tsx and its css match one to one.
- a component's css file `@import`s the shared css it uses: `@import url(./shared/balance_table.css);`. the shared css then arrives with the component that needs it, and a page's `import-<page>.css` lists only the page's own components.
- css is scoped by the mount id. a page component's rules are written `#HUGGIES_COMPONENT_<name> <selector>`, so a rule reaches only the markup inside that component's own mount. a shared component has no mount id — it carries one class on its root (`.balance-table`) and its rules nest under that class.
- an element's BASE rules live in `frontend/lib/css/base/<element>.css` — one file per element (`a.css`, `code.css`), holding what EVERY instance of that element shares. a component that wants an element to look different writes its own rule under its mount id, and the id selector beats the base, so the override wins. never repeat a base rule in a component css.
- `base/code.css` owns the code chip: monospace, the text color, small, and breaking long ids. a code chip is NEVER dimmed with `opacity` — opacity blends the chip with whatever sits behind it, so on the red background it turns muddy. the font and the size tell the chip apart, not a faded color.
- `base/a.css` owns the link: the page text color and no underline. the bottom nav is a `nav a` rule, so it keeps its own look.
- a class is used ONLY where an element selector cannot say it: when the same element type appears twice with different rules (a card's label span and its value span), when it carries a state (`.is-active`, `.is-revealed`), or when it is a variant (`.is-dev`, `.is-dex`). everything else is a bare element selector — `p`, `a`, `code`, `strong`, `td`, `h2`.
- a page links the base and then `frontend/lib/css/import-<page>.css`, which holds only import statements. a page with nothing of its own gets no import file and links the base only.
- page content sits directly inside `<main>`. no wrapper div, no classes on the page's own markup — the page's html holds only the mount ids, and `main` is the column.
- every page has ONE loader: a `<prefix>_<pagename>.ts` that does all of that page's fetching. the components read the loaded data and fetch nothing themselves, so the page's request list is knowable by reading one file. see [PAGES/PATTERN.md](./PAGES/PATTERN.md) for the whole shape — the store, the start script and the one hook.
- 🧬 i am sure i mentioned this somewhere but we have clean clear spearteion of logic, the middleman should never import form the frontend logic or have any forntend specify logic. when i am working on the frontend and i ask to add features we may need to add backend or middleman logic. if i ask to remove something form a page only stuff in the fornted should be touchd remove the css and logic for that feature. do not touch the middleman or backend logic for that unless i say or ask first.
- 🧬 never put a table in a mardown file. perfer to create .csv files instead.
- if you run "bunx prettier . --write" dont undo the prettier chages, can commit with your work, even if files that you where not working on got touched
- 🧬 dont not touch files with a do not touch comment in them.
  - do not touch the AGENTS.md file unless asked
  - never touch the repo main README

=====================
<br/>
copyright 2026 by sleet.near
