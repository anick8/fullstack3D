# Hero scroll map

The home page hero (`app/page.jsx`) is a single `h-[900vh]` section. A sticky
full-viewport canvas (`src/components/HeroSequenceCanvas.jsx`) plays two image
sequences and six glass "chapters" (`src/components/HeroChapters.jsx`) fade in
over the empty space in each frame.

**`src/data/hero.js` is the source of truth for the ranges below.** If you
change a chapter's `range`, update this table to match.

## Progress → frame

Section scroll progress `p` is 0–1, computed by `sectionProgress()` in
`src/lib/sequence.js` from the section's `getBoundingClientRect().top`.

- **`p` 0 – 0.10**: mouse-driven, `/frames/lr2` (91 frames). Frame 51 is rest;
  mouse left eases toward frame 1, right toward frame 91.
- **`p` 0.10 – 1.0**: scroll-driven, `/frames/transform` (151 frames).
  `frame = 1 + (p − 0.10) / 0.90 × 150`. Frame 1 of this sequence is the same
  rest pose as frame 51 of `lr2`, so the handoff between the two is
  invisible (`src/components/HeroSequenceCanvas.jsx`, `HANDOFF_EPS`).

Both the frame index and the chapter opacity/transform are eased toward their
target every animation frame with `SCROLL_LERP = 0.16`
(`src/data/heroSequence.js`), so text and imagery stay in sync.

## Frame composition (sampled 001, 025, 050, 075, 100, 125, 151)

| Frames  | Composition                             | Free space                        |
| ------- | --------------------------------------- | --------------------------------- |
| 001–045 | Head centred, slow zoom out             | Left ~0–30%, right ~70–100%       |
| 045–090 | Cubicle builds, character drifts right  | Left side opens up past ~frame 70 |
| 090–151 | Full cubicle on the right, 45–97% width | Left 0–43% fully empty            |

## Chapters

| #   | id        | Side  | Fade in      | Hold               | Fade out               | Frames visible            |
| --- | --------- | ----- | ------------ | ------------------ | ---------------------- | ------------------------- |
| 1   | `intro`   | left  | on from load | 0 – 0.10           | 0.10 – 0.14            | `lr2` mouse, then 001–008 |
| 2   | `about`   | right | 0.16 – 0.20  | 0.20 – 0.34        | 0.34 – 0.38            | 011–048                   |
| 3   | `now`     | left  | 0.46 – 0.50  | 0.50 – 0.60        | 0.60 – 0.64            | 061–091                   |
| 4   | `earlier` | left  | 0.66 – 0.70  | 0.70 – 0.78        | 0.78 – 0.82            | 094–121                   |
| 5   | `skills`  | left  | 0.82 – 0.85  | 0.85 – 0.90        | 0.90 – 0.92            | 121–138                   |
| 6   | `wins`    | left  | 0.93 – 0.96  | 0.96 – 1.00, holds | none — stays on screen | 139–151                   |

Gaps between a chapter's fade-out and the next chapter's fade-in are
deliberate: frames get a moment on their own with no card over them.

## Visibility math

`chapterVisibility(progress, range)` in `src/lib/sequence.js`: smoothstep
fade-in over `[inStart, inEnd]`, smoothstep fade-out over `[outStart, outEnd]`
(the minimum of the two), and `1` for the whole range when `outStart`/`outEnd`
are `null` (used for the final "wins" chapter, which holds to the end).

## Content & privacy

All copy lives in `src/data/hero.js` (`PROFILE`, `CHAPTERS`) — none is
hard-coded in JSX. Deliberately excluded from the site: the phone number and
the resume's third-party references (their names, phone numbers and emails).
Only the owner's own email and LinkedIn are shown, in the final chapter.
