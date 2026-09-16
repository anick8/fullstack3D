# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three audiences, all deciding whether to work with Aniketh:

- **Freelance clients**, often arriving from an Upwork (or similar) proposal link, deciding whether to book a call.
- **Recruiters and hiring managers** evaluating him for a full-time role, usually skimming quickly.
- **Founders and startups** looking for a technical partner or contract lead for a product build.

The visitor's job is to judge, in one short visit, whether he can be trusted with real product work.

## Product Purpose

A personal portfolio for Aniketh A Keshava, a software engineer with 7+ years across full-stack web, mobile (React Native) and AI-driven development. It exists to turn a visit into contact.

Success is the visitor emailing or booking a call. Every section serves that outcome.

## Positioning

The site is itself the proof of craft. A cinematic, scroll-driven image sequence with Liquid Glass content panels shows a level of front-end execution that a template portfolio cannot claim. That is paired with verifiable production experience: shipped client apps and a long record of maintaining apps in production.

## Operating Context

- Visitors commonly land from an outbound link (freelance proposal, resume, LinkedIn), not from search.
- A visit is a short evaluation, often a skim, before deciding to reach out.
- Contact paths today: email (mailto), LinkedIn, GitHub.

## Capabilities and Constraints

- Single long scroll page. One hero section drives both the image sequence and six content "chapters" (see `docs/hero-scroll-map.md`; ranges live in `src/data/hero.js`).
- All copy lives in `src/data/hero.js`, never in JSX.
- Must respect `prefers-reduced-motion` and keep hidden chapters out of keyboard focus.
- Privacy: no phone number and no third-party reference contacts on the public site.
- The Ethereum / wagmi / react-three-fiber scaffold (`src/scene/`, `src/services/contract.js`, `src/store/useWalletStore.js`) is leftover and not part of the product. `CLAUDE.md` still describes the project as a dApp; that description is out of date.

## Brand Commitments

- **Cinematic frame sequence** (mouse-driven `lr2` + scroll-driven `transform`, in `public/frames/`) stays as the centerpiece.
- **Liquid Glass panels** are the required presentation for content (`.liquid-glass`, `.glass-pill`, `.glass-chip` in `app/globals.css`).
- **Single scroll page**: one continuous story, not multiple routes.
- Name as shown: Aniketh A Keshava. Based in Bangalore, India.

## Evidence on Hand

- Resume-derived roles, bullets, skills, education and hackathon wins (`src/data/hero.js`; source resume `~/MyProjects/jobSearch/AnikethResume_May_2026_Fixed.pdf`).
- **Named client apps**: mobile apps built at StoreHippo for brands including Amul and Syngenta. Confirm exact public-facing figures (user counts, ratings) with Aniketh before publishing any metric.
- **Project links / repos**: available to link as case studies. Flowshaala's public URL is pending; `src/data/hero.js` has a `url: null` slot that renders a link once filled.
- **Withdrawn**: the Hashx "improved system reliability by 45%" figure is not to be published.
- **Resume**: LinkedIn serves as the public resume; no PDF (the resume PDF contains a phone number and references).
- **Absent, do not fabricate**: testimonials or video testimonials, client quotes, logos used without permission, invented metrics.

## Product Principles

1. **Everything leads to contact.** A section that doesn't move the visitor closer to emailing or calling needs a reason to exist.
2. **Proof over claims.** Prefer shipped apps, links and specifics to adjectives.
3. **The craft is the pitch**, but never at the cost of a fast skim: a recruiter must get name, role and a contact path without scrolling the whole film.
4. **Truthful and private.** Only confirmed facts and figures; no personal contact details beyond email and public profiles.

## Accessibility & Inclusion

- Reduced-motion users get an opacity-only path with no scroll-scrubbed motion.
- Content hidden by scroll position must not be keyboard-reachable; visible interactive elements need a visible focus state.
