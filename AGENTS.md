# AGENTS

see `DOCS/` for docs.

RULES

- one function per a file, clean clear sanke_case nameing for functions. and file name should match function name.
- `========================================` comments at the top of the file between import statemnets, and at the bottom of the file.
- never touch the repo main README.
- please no camel case only snake_case or SCREAMING_SNAKE.
- very important if i have a section of 4 lines of `========================================` as a commnet do not remove that. and follow the pattern on where those are so that when you create new files you add them.
- frontend/lib/ts/import.ts is for components only, no other ts file should be impoted here and no other ts file should import components ts files
- comment style: file headers are ≤ 6 lines (file purpose only, no implementation); functions have a single-line summary comment above them; non-obvious behavior (race conditions, library quirks, irreversible side effects, known-bug workarounds) gets a `// --- WHY ---` block of ≤ 4 lines placed *inline next to the relevant line*, never in the file header. never delete an existing WHY note — if it's already there, it's because the next reader needs the warning.

WORKFLOW

- always pull first.
- undo local chages/commits if commits on the remote that are not local, rather than some rebase/force bullshit, then manually reapply changes if applicable.
- commit and push after making changes.

========================================
<br/>
copyright 2026 by sleet.near
