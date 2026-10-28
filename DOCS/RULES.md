# RULES

🧬 human put rules, do not add this to rules you add yourslef

- 🧬 one function per a file, clean clear sanke_case nameing for functions. and file name should match function name.
- 🧬 `========================================` comments at the top of the file between import statemnets, and at the bottom of the file. and in vaires places in the html files. never remove these comments.
- 🧬 never touch the repo main README.
- 🧬 please no camel case only snake_case or SCREAMING_SNAKE.
- 🧬 frontend/lib/ts/import.ts is for components only, no other ts file should be impoted here and no other ts file should import components ts files
- frontend/lib/ts/ holds plain ts only. a file that renders jsx is a component and lives in frontend/lib/components/ (`balance_row.tsx`, `token_holder_row.tsx`), never in frontend/lib/ts/.
- a ts file that belongs to ONE page is named `<prefix>_<pagename>_<what>.ts` — the prefix says which page owns it. `app_page_<pagename>_<what>.ts` for a page at the top of `app/` (e.g. `app_page_account.ts`, `app_page_discover_token_search.ts`), `contract_page_<what>.ts` for a page under `app/contract/` (e.g. `contract_page_pumpopoly.ts`), `tokens_page_<what>.ts` for a page under `app/tokens/` (e.g. `tokens_page_token_detail.ts`). a ts file used by more than one page keeps a plain name (`token_info.ts`, `balance_row.tsx`, `token_link.ts`).
- a tsx component file follows the SAME prefix as its ts siblings: `app_page_account_id_h1.tsx` for the account page, `contract_page_pumpopoly_player_stats.tsx` for the pumpopoly page. a tsx used by more than one page keeps a plain name (`id_jump_box.tsx`, `error_card.tsx`, `balance_row.tsx`). the mount id does NOT have to match the file name — it keeps the shorter form (`HUGGIES_COMPONENT_ACCOUNT_ID_H1`).
- css lives in `frontend/lib/css/`. `import.css` is the app-wide base and every page links it. a page's own rules live in `frontend/lib/css/pages/<page>.css`, a shared component's rules in `frontend/lib/css/shared/<component>.css`, and the app-wide rules in `frontend/lib/css/base/`. a rule lives with the page that owns the component, so two files never style the same classes.
- a page links the base and then `frontend/lib/css/import-<page>.css`, which holds only import statements. a page with nothing of its own gets no import file and links the base only.
- page content sits directly inside `<main>`. there is no `.huggies-page` wrapper div — `main` does that job now.
- every page has ONE loader: a `<prefix>_<pagename>.ts` that does all of that page's fetching. the components read the loaded data and fetch nothing themselves, so the page's request list is knowable by reading one file. see [PAGES/PATTERN.md](./PAGES/PATTERN.md) for the whole shape — the store, the start script and the one hook.
- 🧬 i am sure i mentioned this somewhere but we have clean clear spearteion of logic, the middleman should never import form the frontend logic or have any forntend specify logic. when i am working on the frontend and i ask to add features we may need to add backend or middleman logic. if i ask to remove something form a page only stuff in the fornted should be touchd remove the css and logic for that feature. do not touch the middleman or backend logic for that unless i say or ask first.
- 🧬 never put a table in a mardown file. perfer to create .csv files instead.

=====================
<br/>
copyright 2026 by sleet.near
