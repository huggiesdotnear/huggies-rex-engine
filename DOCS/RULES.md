# RULES

- one function per a file, clean clear sanke_case nameing for functions. and file name should match function name.
- `========================================` comments at the top of the file between import statemnets, and at the bottom of the file.
- never touch the repo main README.
- please no camel case only snake_case or SCREAMING_SNAKE.
- very important if i have a section of 4 lines of `========================================` as a commnet do not remove that. and follow the pattern on where those are so that when you create new files you add them.
- frontend/lib/ts/import.ts is for components only, no other ts file should be impoted here and no other ts file should import components ts files
- frontend/lib/ts/ holds plain ts only. a file that renders jsx is a component and lives in frontend/lib/components/ (`balance_row.tsx`, `token_holder_row.tsx`), never in frontend/lib/ts/.
- a ts file that belongs to ONE page is named `<prefix>_<pagename>_<what>.ts` — the prefix says which page owns it. `app_page_<pagename>_<what>.ts` for a page at the top of `app/` (e.g. `app_page_account.ts`, `app_page_discover_token_search.ts`), `contract_page_<what>.ts` for a page under `app/contract/` (e.g. `contract_page_pumpopoly.ts`), `tokens_page_<what>.ts` for a page under `app/tokens/` (e.g. `tokens_page_token_detail.ts`). a ts file used by more than one page keeps a plain name (`token_info.ts`, `balance_row.tsx`, `token_link.ts`).
- every page has ONE loader: a `<prefix>_<pagename>.ts` that does all of that page's fetching. the components read the loaded data and fetch nothing themselves, so the page's request list is knowable by reading one file.

=====================
<br/>
copyright 2026 by sleet.near