// ========================================
// HUGGIES_SLOGANS
// the raw copy pool the random slogan component draws from
// (see frontend/lib/components/random_slogan_p.tsx). kept in its
// own file so editing the copy never means touching component
// logic.
//
// entries are plain strings with no interpolation — the $SHIT /
// $NEAR / #HUGGIES tokens are literal text, not template
// variables, so a slogan can be dropped in verbatim.
//
// the list is `readonly` so no consumer can sort/shuffle it in
// place; a component that wants a different order should copy it
// first.
// ========================================
export const HUGGIES_SLOGANS: readonly string[] = [
  "DIAPER HANDS ONLY", // index 0
  "$SHIT - The world is full of it.",
  "$SHIT - it's everywhere",
  "#HUGGIES the number 1 $SHIT factory!!!",
  "#HUGGIES DOES $SHIT BEST",
  "#HUGGIES, only on $NEAR",
  "only #HUGGIES, only on $NEAR",
  "Get a job, from #HUGGIES with love.",
  "#HUGGIES the diaper for all mankind",
  "#HUGGIES in your feed. $SHIT in your bag.",
  "The ticker is $SHIT - The diaper is #HUGGIES",
  "#HUGGIES the only diaper company in crypto.",
  "$NEAR the chain for AI, #HUGGIES the diaper for people.",
  "#HUGGIES by HUMANS FOR HUMANS",
  "#HUGGIES done with the $SHIT",
  "#HUGGIES where the world come for shit",
  "BELIEVE IN $SHIT, BELIEVE IN SOMETHING",
  "$SHIT $SHIT $SHIT $SHIT $SHIT $SHIT $SHIT",
  "the ultimate hedge against inflation. $SHIT",
];
// ========================================
