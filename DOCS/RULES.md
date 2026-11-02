# RULES

🧬 human put rules, do not add this to rules you add yourslef, even if it was something i said.

- 🧬 one function per a file, clean clear sanke_case nameing for functions. and file name should match function name.
- 🧬 `========================================` comments at the top of the file between import statemnets, and at the bottom of the file. and in vaires places in the html files. never remove these comments.
- 🧬 please no camel case only snake_case or SCREAMING_SNAKE.

## the frontend layout is in GOLD.md

the frontend's file tree, the naming prefixes, the css scoping, the
import files and the page pattern are NOT here — they live in the
gold standard, so there is ONE place that says where a file goes:

- [`GOLD.md`](./GOLD.md) — where every file lives, and how it is named
- [`PAGES/PATTERN.md`](./PAGES/PATTERN.md) — how a page with data is built
- [`PAGES/README.md`](./PAGES/README.md) — one spec per page

a rule that is already said there is not said again here. when the
layout changes, GOLD.md changes, not this file.

## naming

- a file's name says what it HOLDS, and two files whose names are one letter apart must not do different jobs. `app_page_discover_token_sort_options.ts` holds the options and `app_page_discover_token_sort_apply.ts` applies them; `token_icon_url.ts` builds the url and `token_icon_fetch.ts` fetches it; `token_amount_format.ts` formats and `token_amount_row.ts` composes the row. when two names nearly collide, the second one gets a word that says its job.
- a name must not say the OPPOSITE of what the file is. a list that is MARKED and not pinned is `app_page_discover_marked_tokens.ts`, not `pinned_tokens.ts`.
- a file's name must not promise a page it does not belong to. when a page has more than one loader, each is named for its own part (`app_page_account_balances.ts`, `app_page_account_transactions.ts`, `app_page_account_tx_details.ts`).

## css

- a class is used ONLY where an element selector cannot say it: when the same element type appears twice with different rules (a card's label span and its value span), when it carries a state (`.is-active`, `.is-revealed`), or when it is a variant (`.is-dev`, `.is-dex`). everything else is a bare element selector — `p`, `a`, `code`, `strong`, `td`, `h2`.

## the layers

- 🧬 i am sure i mentioned this somewhere but we have clean clear spearteion of logic, the middleman should never import form the frontend logic or have any forntend specify logic. when i am working on the frontend and i ask to add features we may need to add backend or middleman logic. if i ask to remove something form a page only stuff in the fornted should be touchd remove the css and logic for that feature. do not touch the middleman or backend logic for that unless i say or ask first.

## the workflow

- 🧬 never put a table in a mardown file. perfer to create .csv files instead.
- if you run "bunx prettier . --write" dont undo the prettier chages, can commit with your work, even if files that you where not working on got touched
- 🧬 dont not touch files with a do not touch comment in them.
  - do not touch the AGENTS.md file unless asked
  - never touch the repo main README

=====================
<br/>
copyright 2026 by sleet.near
