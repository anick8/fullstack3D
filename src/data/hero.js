/**
 * Hero content. Everything shown in the scroll chapters lives here — none of
 * it is hard-coded in JSX. Ranges are section-scroll progress (0–1) and are
 * the source of truth for `docs/hero-scroll-map.md`; keep that file in sync
 * if these change.
 *
 * Deliberately left off the site: phone number, and reference names/contacts
 * from the resume — those don't belong on a public page.
 */

import { TECH_STACK } from "./techStack";

export const PROFILE = {
  name: "Aniketh AK",
  role: "Software Engineer",
  tagline:
    "Full-stack and AI engineer with 7+ years shipping web, mobile and backend products.",
  availability: "Open to freelance projects and full-time roles.",
  location: "Bangalore, India",
  email: "anick8ak@gmail.com",
  linkedin: "https://www.linkedin.com/in/aniketh-ak",
  github: "https://github.com/anick8",
};

/** Shared with both the About and Skills chapters. */
export const EDUCATION = {
  degree: "CSE Grad",
  school: "Reva University",
  period: "2014 – 2018 · Bangalore",
};

/** Contact paths shared by the persistent contact bar and the final chapter. */
export const CONTACT = {
  email: PROFILE.email,
  links: [
    {
      label: "LinkedIn",
      ariaLabel: "LinkedIn profile and resume",
      href: PROFILE.linkedin,
    },
    { label: "GitHub", ariaLabel: "GitHub profile", href: PROFILE.github },
  ],
};

/**
 * @typedef {object} Chapter
 * @property {string} id
 * @property {'left'|'right'|'top-right'|'stack'} side
 * @property {{ inStart: number, inEnd: number, outStart: number|null, outEnd: number|null }} range
 * @property {string} eyebrow
 * @property {string} title
 */

export const CHAPTERS = [
  {
    id: "intro",
    side: "left",
    range: { inStart: 0, inEnd: 0, outStart: 0.1, outEnd: 0.14 },
    name: PROFILE.name,
    role: PROFILE.role,
    tagline: PROFILE.tagline,
    availability: PROFILE.availability,
    location: PROFILE.location,
    ctaPrimary: { label: "Email me", href: `mailto:${PROFILE.email}` },
    ctaSecondary: { label: "See my work", target: 0.2 },
  },
  {
    id: "about",
    side: "top-right",
    range: { inStart: 0, inEnd: 0, outStart: 0.1, outEnd: 0.14 },
    eyebrow: "About",
    title: "Fullstack, Mobile & AI",
    summary:
      "Full Stack Engineer with 7+ years building web and mobile products"+
      "across e-commerce, blockchain, and IoT. Specializes in Node.js, React/React Native,"+
      " and Python, with recent focus on shipping AI-assisted development workflows  independently"+
      " architected and delivered a production MERN platform end-to-end in 3 months.",
    stats: ["7+ years experience", "Web · Mobile · AI", "AWS Certified"],
    education: EDUCATION,
  },
  {
    id: "stack",
    side: "stack",
    range: { inStart: 0.14, inEnd: 0.18, outStart: 0.4, outEnd: 0.44 },
    title: "Tools I ship with",
    pauseLabel: "Pause logo carousel",
    playLabel: "Play logo carousel",
    items: TECH_STACK,
  },
  {
    id: "now",
    side: "left",
    range: { inStart: 0.46, inEnd: 0.5, outStart: 0.6, outEnd: 0.64 },
    eyebrow: "Currently",
    title: "Recent work",
    jobs: [
      {
        role: "Freelance Fullstack Developer",
        company: "Flowshaala",
        url: "https://www.flowshaala.com", // public URL pending from Aniketh
        period: "02/2026 – Present · Remote",
        bullets: [
          "Sole architect of a fullstack MERN platform for movement class discovery and booking.",
          "Built Authentication, Payments, and Admin dashboards from scratch.",
        ],
      },
      {
        role: "Software Developer (Mobile Lead)",
        company: "StoreHippo",
        period: "05/2022 – 01/2026 · (Remote)",
        bullets: [
          "Led the migration of a legacy Cordova codebase to React Native, improving maintainability and performance.",
          "Managed Android/iOS release cycles and production deployments end to end.",
        ],
      },
    ],
  },
  {
    id: "earlier",
    side: "left",
    range: { inStart: 0.66, inEnd: 0.7, outStart: 0.78, outEnd: 0.82 },
    eyebrow: "Earlier",
    title: "Backend & systems",
    jobs: [
      {
        role: "Backend Developer",
        company: "Hashx",
        period: "08/2021 – 01/2022 · Bengaluru",
        bullets: [
          "Built RESTful APIs with Node.js, Express and PostgreSQL in a distributed system.",
          "Designed scalable microservices that made a distributed system more reliable.",
        ],
      },
      {
        role: "Systems Engineer",
        company: "Intellicar Telematics",
        period: "07/2018 – 07/2021 · Bangalore",
        bullets: [
          "Reverse-engineered vehicle ECU data across multiple automobile manufacturers.",
          "Automated debugging and data validation for IoT telemetry using Python.",
        ],
      },
    ],
  },
  {
    id: "skills",
    side: "left",
    range: { inStart: 0.82, inEnd: 0.85, outStart: 0.9, outEnd: 0.92 },
    eyebrow: "Skills",
    title: "Toolbox",
    groups: [
      { label: "Frontend", items: ["React", "Angular", "Next.js"] },
      { label: "Backend", items: ["Node.js", "Express", "Python"] },
      {
        label: "Mobile",
        items: ["React Native", "Apache Cordova", "iOS", "Android"],
      },
      {
        label: "Data",
        items: ["PostgreSQL", "MongoDB", "MySQL", "Cassandra", "SupaBase"],
      },
      { label: "Cloud", items: ["AWS", "Git", "Linux", "Railway", "Vercel"] },
    ],
    education: EDUCATION,
  },
  {
    id: "wins",
    side: "left",
    range: { inStart: 0.93, inEnd: 0.96, outStart: null, outEnd: null },
    title: "Let's build something",
    availability: PROFILE.availability,
    email: CONTACT.email,
    links: CONTACT.links,
    achievementsLabel: "Recognition",
    achievements: [
      'Hackathon awards for "IRIS", an IoT solution, at multiple hackathons including Rajasthan.',
      "First place at a Makeathon for a carbon-reducing home automation concept.",
    ],
  },
];
