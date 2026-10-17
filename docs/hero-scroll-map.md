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

| #   | id                    | Side      | Fade in      | Hold               | Fade out               | Frames visible            |
| --- | --------------------- | --------- | ------------ | ------------------ | ---------------------- | ------------------------- |
| 1   | `intro`               | left      | on from load | 0 – 0.10 (phones: 0 – 0.04) | 0.10 – 0.14 (phones: 0.04 – 0.07) | `lr2` mouse, then 001–008 |
| 2   | `about`               | top-right (phones: bottom) | on from load (phones: 0.07 – 0.09) | 0 – 0.10 (phones: 0.09 – 0.12) | 0.10 – 0.14 (phones: 0.12 – 0.14) | `lr2` mouse, then 001–008 |
| 2b  | `stack`               | left col (md+) / bottom strip | 0.14 – 0.18 | 0.18 – 0.40 | 0.40 – 0.44 | 008–061 |
| 3   | `now`                 | left      | 0.46 – 0.50  | 0.50 – 0.60        | 0.60 – 0.64            | 061–091                   |
| 4   | `earlier`             | left      | 0.66 – 0.70  | 0.70 – 0.78        | 0.78 – 0.82            | 094–121                   |
| 5   | `skills`              | left      | 0.82 – 0.85  | 0.85 – 0.90        | 0.90 – 0.92            | 121–138                   |
| 6   | `wins` ("Let's talk") | left      | 0.93 – 0.96  | 0.96 – 1.00, holds | none — stays on screen | 139–151                   |

**Phones (< 768px):** `intro` and `about` can't both fit on screen, so each has
a `mobileRange` in `src/data/hero.js` (picked by `chapterRange()` in
`src/lib/sequence.js`): `intro` first, then `about` in the same bottom slot,
before `stack` fades in at 0.14.

**Phone frames:** phones and touch devices skip `lr2` and load
`/frames/t2-m` (76 frames, every 2nd transform frame at 1600px,
`scripts/make-mobile-frames.sh`, ~3.4 MB instead of ~44 MB). The canvas also
caps DPR at 1.5 there and, in portrait, slides the crop from the frame centre
toward 72% across as the story moves right so the character stays in view.

On desktop, `about` shows from the very start alongside `intro` (top-right, `lr2` mouse
sequence then frames 001–008), rather than fading in after `intro` fades out.
It now also shows education (shared `EDUCATION` in `src/data/hero.js`, same
block as `skills`).

`stack` (`src/components/TechCarousel.jsx`, logos in `src/data/techStack.js`)
fills the stretch between `intro`/`about` and `now`. It sits in the empty
left 0–30% of frames 008–061 as a vertical loop on desktop, and as a
horizontal strip along the bottom on phones. The loop only runs while the
chapter is visible, pauses on hover or via its pause button, and becomes a
static list under `prefers-reduced-motion`. It is also directly scrollable:
drag (mouse) or swipe (touch) moves it 1:1 and a flick coasts on with an
exponential decay that starts at the release speed; arrow keys step it when
the region is focused. Touch keeps the page gesture on the other axis
(`touch-pan-y` on the strip, `touch-pan-x` on the column), and the vertical
wheel always scrolls the page, since it drives the hero. Tiles use `.glass-tile` (no
backdrop blur of their own) so the moving track stays cheap over the canvas.

Gaps between a chapter's fade-out and the next chapter's fade-in are
deliberate: frames get a moment on their own with no card over them.

A fixed contact bar (`src/components/ContactBar.jsx`, top-right) sits above
every chapter for the whole runway: email (click copies, falls back to mailto),
LinkedIn (also serves as the resume) and GitHub.

## Visibility math

Scroll decides *whether* a chapter is shown; a timed animation decides *how*,
so no chapter is ever left half-faded at a scroll position.

`chapterActive(progress, range)` in `src/lib/sequence.js`: a chapter switches
**on** at the midpoint of `[inStart, inEnd]` and **off** at the midpoint of
`[outStart, outEnd]`. `inStart = inEnd = 0` means on from load, and
`null` out bounds mean it never switches off (the final "wins" chapter).
`HeroChapters` flips a card's `shown` state only when that changes (tracked in
a ref so it survives `desktop`/`reducedMotion` flipping after first render), and
everything else is Framer Motion (`src/lib/motion.js`):

- **Card:** `chapterReveal(side, desktop)` is a spring (stiffness 170, damping
  24). On desktop a card slides 40px in from the side it is anchored to
  (left/stack from the left, About from the right); on phones it rises 40px.
  It leaves the same way, quicker (0.25 s). A 0.12 s entry delay lets a card
  that is leaving clear the shared phone slot first.
- **Content:** inside the card, `contentContainer` staggers its children
  (`revealItem`: rise + blur-to-sharp, 70 ms apart, starting 0.25 s in). Chip
  lists pop in one by one on a spring (`chipList`/`chipItem`) and lift on
  hover; the intro name rises word by word out of masks (`wordItem`); CTAs and
  links use `pillMotion` hover/press feedback. The tech carousel's header and
  track take part in the same stagger.
- **Drift:** while a card is showing, each paint writes a per-card
  `motionValue` (no React state) that moves an inner wrapper from +14px to
  -14px as you scroll through the card's stretch (`chapterHold()` in
  `src/lib/sequence.js`), so held cards never feel pinned. It sits on an inner
  element so it never fights the card's own enter/exit `x`/`y`.
- **Reduced motion:** opacity-only 0.2 s fade, no stagger, no drift; every
  `*Reduced` variant pins `x`/`y`/`scale`/`filter` so no offset lingers.
- No `filter` on the card wrapper: it would become a backdrop root and flatten
  the glass panel inside. (Blur on content children is fine.)

| id        | On at (desktop) | Off at (desktop) | On at (phones) | Off at (phones) |
| --------- | --------------- | ---------------- | -------------- | --------------- |
| `intro`   | load            | 0.12             | load           | 0.055           |
| `about`   | load            | 0.12             | 0.08           | 0.13            |
| `stack`   | 0.16            | 0.42             | 0.16           | 0.42            |
| `now`     | 0.48            | 0.62             | 0.48           | 0.62            |
| `earlier` | 0.68            | 0.80             | 0.68           | 0.80            |
| `skills`  | 0.835           | 0.91             | 0.835          | 0.91            |
| `wins`    | 0.945           | never            | 0.945          | never           |

The fade-in/hold/fade-out columns in the Chapters table above give the ranges
these points are the midpoints of.

## Motion layer

> **Status note:** `src/components/HeroChapters.jsx` currently renders plain
> (non-`m.*`) JSX — the content-reveal wiring described below isn't in that
> file right now, even though `src/lib/motion.js`,
> `src/components/MotionProvider.jsx`, `ScrollProgress.jsx` and `ScrollCue.jsx`
> still exist and `MotionProvider` still wraps `app/layout.jsx`. The progress
> bar and scroll cue below are unaffected; only the per-card content reveal
> described here is not currently wired up.

Framer Motion (`src/lib/motion.js`, `src/components/MotionProvider.jsx`)
animates what's _inside_ each card once it's shown; it never drives the card
fade/rise itself, which stays the direct-DOM rAF loop above so it can't drift
from the canvas.

- **Content reveal:** `HeroChapters.jsx` tracks a per-chapter `active` flag
  inside the same `paint()` loop, with hysteresis to avoid flicker: a chapter
  activates once its `chapterVisibility` crosses `0.35`, and deactivates
  below `0.02`. Heading, paragraphs, chips and buttons stagger in via
  `revealContainer`/`revealItem` when `active` flips true, and reset when it
  flips false so scrolling back replays the reveal.
- **Progress bar:** `ScrollProgress.jsx` reads `useScroll()`'s page-level
  `scrollYProgress` (the hero is the only section, so this equals story
  progress) through a spring, drawn as a thin bar fixed to the top.
- **Scroll cue:** `ScrollCue.jsx`, bottom-center, desktop-only. Fades out
  over the first 3% of scroll via the same `scrollYProgress`.
- **Reduced motion:** `MotionConfig reducedMotion="user"` in
  `MotionProvider.jsx` disables transform-based motion (rise, word-slide,
  hover lift, the bobbing cue) for `prefers-reduced-motion: reduce`, while
  opacity fades still play. This is separate from the existing
  `reducedMotion` state in `HeroChapters.jsx`/`HeroSequenceCanvas.jsx`, which
  governs the card fade/rise loop and the canvas's frame stepping.

## Content & privacy

All copy lives in `src/data/hero.js` (`PROFILE`, `CHAPTERS`) — none is
hard-coded in JSX. Deliberately excluded from the site: the phone number and
the resume's third-party references (their names, phone numbers and emails).
Only the owner's own email, LinkedIn and GitHub are shown, in the contact bar and the final chapter.

