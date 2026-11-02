/** Everything about the site that isn't content. Edit here, not in components. */
export const site = {
  name: "Daniel Prol",
  shortName: "Dani Prol",
  role: "Software & AI engineer",
  location: "Santiago de Compostela, Galicia",
  email: "prolcambados@gmail.com",
  /** One or two lines shown under "Now" on the home page. */
  now: "Building local-first tools for AI agents in Rust and Python, and writing about how they work.",
  socials: {
    github: "https://github.com/daniprol",
    linkedin: "https://www.linkedin.com/in/", // TODO: full LinkedIn URL
  },
  nav: [
    { key: "nav.writing", href: "/writing" },
    { key: "nav.snacks", href: "/snacks" },
    { key: "nav.projects", href: "/projects" },
    { key: "nav.about", href: "/about" },
  ],
} as const;

/** Shown on the About page. TODO: confirm schools and dates. */
export const experience = [
  {
    role: "Software & AI Engineer",
    company: "DXC Technology",
    period: "2023 – present",
    summary: "Full-stack and AI engineering: LLM applications, agents and the services around them.",
  },
] as const;

export const education = [
  { degree: "Degree in Mathematics", school: "TODO", period: "" },
  { degree: "Degree in Economics", school: "TODO", period: "" },
] as const;
