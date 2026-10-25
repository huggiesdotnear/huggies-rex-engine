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

the board keeps the emojifi shape — a four-by-four grid of square cards —
but every colour comes from the app's own palette, so the game reads as part
of the site rather than a pasted-in page. the emojifi light background was
dropped because it fought the app's red.

## THE GAME LINK

the game is not in the nav. it is linked from the bottom of the discover
page, under the auth button, as a quiet easter egg — see
`lib/components/game_link.tsx`.
