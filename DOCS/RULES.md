# RULES

- one function per a file, clean clear sanke_case nameing for functions. and file name should match function name.
- `========================================` comments at the top of the file between import statemnets, and at the bottom of the file.
- never touch the repo main README.
- please no camel case only snake_case or SCREAMING_SNAKE.
- very important if i have a section of 4 lines of `========================================` as a commnet do not remove that. and follow the pattern on where those are so that when you create new files you add them.
- frontend/lib/ts/import.ts is for components only, no other ts file should be impoted here and no other ts file should import components ts files
- a ts file that belongs to ONE page is named `app_page_<pagename>_<what>.ts` — e.g. `app_page_account.ts`, `app_page_account_store.ts`. the same prefix carries into the exported symbols: `HUGGIES_APP_PAGE_ACCOUNT`. a ts file used by more than one page keeps a plain name (`token_info.ts`, `balance_row.tsx`).
- every page has ONE loader: a `app_page_<pagename>.ts` that does all of that page's fetching. the components read the loaded data and fetch nothing themselves, so the page's request list is knowable by reading one file.

=====================
<br/>
copyright 2026 by sleet.near