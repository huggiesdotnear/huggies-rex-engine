# GAME

## EMOJI MEMORY MATCH - frontend/app/game.html

An eight-pair memory match game using the meme token emoji set. The game
shuffles sixteen cards into a four-by-four grid, reveals one card per click,
and flips mismatched cards back after 800ms. Matching pairs stay revealed,
the score counts matched pairs, and the move counter records every reveal.

The page also lists the meme tokens. Each token links to its token detail
page, and the page includes the original game's disclaimer that this is not
financial advice.

`frontend/lib/css/game.css` styles the game and must be imported by
`frontend/lib/css/import.css`.

the game page is visually isolated from the rest of the app: the page body
carries the `huggies-emoji-game-body` class and the game board uses its own
light palette (`--game-bg`, `--game-primary`, `--game-accent`, `--game-matched`),
so the shared theme rules cannot leak into the board. the layout follows the
original emojifi project — a rounded light card with a four-by-four grid,
one accent color for revealed cards and one for matched cards.

=====================
<br/>
copyright 2026 by sleet.near
