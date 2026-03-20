export type HotspotId =
  | 'about'
  | 'featured-projects'
  | 'project-archive'
  | 'skills'
  | 'experience'
  | 'achievements'
  | 'contact';

export type PortfolioPanel = {
  id: HotspotId;
  title: string;
  kicker: string;
  body: string;
  highlights: string[];
  ctaLabel: string;
  ctaHref: string;
};

export const portfolioPanels: Record<HotspotId, PortfolioPanel> = {
  about: {
    id: 'about',
    title: 'About Debjit',
    kicker: 'Performance-first engineering, scalable frontend architecture, and user-centric delivery',
    body:
      'Full-stack engineer with 10+ years of experience building high-performance web applications at scale. Specialized in optimizing user experience on constraint-heavy platforms and leading cross-functional teams. Proven track record of delivering measurable impact: 51% LCP reduction, 2x impressions growth, and 60% organic traffic increase across major OTT platforms.',
    highlights: [
      'Performance optimization and web vitals excellence across consumer and enterprise platforms',
      'Full-stack development: React, Next.js, Node.js, Java, with focus on scalability',
      'Team leadership and technical architecture for fast-growing products with millions of daily users',
    ],
    ctaLabel: 'Open LinkedIn',
    ctaHref: 'https://www.linkedin.com/in/frontend-ninja/',
  },
  'featured-projects': {
    id: 'featured-projects',
    title: 'Featured Projects Console',
    kicker: 'High-impact platforms built at scale with measurable outcomes',
    body:
      'Flagship work includes architectural leadership on India\'s largest OTT platforms and redesigns for performance-constrained environments. Each project demonstrates full-stack expertise, from low-level performance optimization to team-scale impact.',
    highlights: [
      'JioCinema Web Platform: Complete rewrite using Next.js and SSR, achieving 51% LCP reduction and 2x impressions growth',
      'JioHotstar LG webOS Redesign: Performance-critical architecture for smart TV platforms handling millions of daily users',
      'Oracle SRE Platform: Full-stack web app (Java + React) for database fleet management, automating critical operations',
    ],
    ctaLabel: 'Open LinkedIn',
    ctaHref: 'https://www.linkedin.com/in/frontend-ninja/',
  },
  'project-archive': {
    id: 'project-archive',
    title: 'Project Archive Wall',
    kicker: 'Supporting work across healthcare, fintech, and fantasy sports',
    body:
      'Earlier-career projects and supporting builds that demonstrate breadth across domains. Includes healthcare platforms, admin dashboards, e-commerce systems, and API backends using diverse stacks.',
    highlights: [
      'Ayva Healthcare Platform: Lead frontend development with React component library and multi-language support',
      'Real Fantasy Teams: Full-stack admin interface and Node.js/MongoDB REST APIs for player management and scoring',
      'E-commerce systems, Joomla/WordPress customization, and responsive SPAs across multiple B2B and B2C products',
    ],
    ctaLabel: 'Browse Repositories',
    ctaHref: 'https://github.com/debjits1',
  },
  skills: {
    id: 'skills',
    title: 'Skills Lab',
    kicker: 'Full-stack expertise with specialization in performance and scalability',
    body:
      'Hands-on capabilities across modern frontend frameworks, backend systems, and DevOps tooling. Deep expertise in web performance optimization, architectural patterns, and team-scale best practices.',
    highlights: [
      'Frontend: React, Next.js, Angular, TypeScript, Tailwind CSS, Redux, Material UI, responsive design',
      'Backend: Node.js, Java, REST APIs, MongoDB, server-side rendering, architectural patterns',
      'DevOps & Tooling: Git, Docker, Webpack, Babel, Maven, performance profiling, web vitals optimization',
    ],
    ctaLabel: 'Open Resume',
    ctaHref: '#',
  },
  experience: {
    id: 'experience',
    title: 'Experience Archive',
    kicker: 'Career progression from UI developer to technical staff engineer',
    body:
      'Decade of growth across startups and tech leaders. Started with frontend optimization and evolved into leadership roles, managing large teams and driving architectural decisions for platforms serving millions of users.',
    highlights: [
      'Staff Engineer (JioHotstar, 2025): Performance-critical smartTV platform redesign',
      'Principal Member of Technical Staff (Oracle, 2024-25): Led multiple features for SRE platform, improved critical INP',
      'Senior SDE2 (Viacom18, 2021-24): JioCinema platform lead, 51% LCP reduction, 60% organic growth, team of 10',
    ],
    ctaLabel: 'View Experience',
    ctaHref: 'https://www.linkedin.com/in/frontend-ninja/',
  },
  achievements: {
    id: 'achievements',
    title: 'Achievements Shelf',
    kicker: 'Awards, metrics, and measurable impact across commercial platforms',
    body:
      'Recognition for technical excellence and business impact. Achievements highlight both individual contributions (web vitals improvements, feature delivery) and team outcomes (revenue growth, user engagement increases).',
    highlights: [
      'Technical: 51% LCP reduction on JioCinema, improved INP on Oracle critical features, 95% page load scores',
      'Business Impact: 2x daily impressions growth, 60% organic traffic increase, 9% payment conversion uplift',
      'Awards: Made a Difference (2x), Technical Excellence Award, Performer of the Month (multiple quarters)',
    ],
    ctaLabel: 'Open Highlights',
    ctaHref: 'https://www.linkedin.com/in/frontend-ninja/',
  },
  contact: {
    id: 'contact',
    title: 'Contact Terminal',
    kicker: 'Available for full-time roles, contract work, and technical collaboration',
    body:
      'Actively open to discussions about high-impact engineering roles, architectural consulting, and open-source collaboration. Prefer organizations focused on performance, scalability, and measurable user outcomes.',
    highlights: [
      'Open for full-time senior/staff engineer roles in web and system architecture',
      'Available for high-impact contract and advisory work',
      'GitHub, LinkedIn, and email—pick your channel',
    ],
    ctaLabel: 'Send Email',
    ctaHref: 'mailto:hello@example.com',
  },
};