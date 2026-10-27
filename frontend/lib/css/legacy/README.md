# legacy css

this folder holds the css for the pages that have not been migrated to
the per-page css files yet.

a file here styles one page (or, for `token_amount.css`, a piece
shared by two). when its page migrates, the file moves to `../pages/`
as that page's own rules, and the page's `../import-<page>.css` points
at the new home instead.

do not add new rules to a file here. add them to the page's own file
in `../pages/`, or to `../shared/` when the component is shared.

===================================
<br/>
copyright 2026 by sleet.near
