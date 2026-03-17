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
    title: 'About The Builder',
    kicker: 'Systems thinking, product care, and calm execution',
    body:
      'I build reliable software with a focus on product clarity, maintainable architecture, and clean execution. This studio is designed as a spatial portfolio: each zone represents a different part of how I ship software.',
    highlights: [
      'Backend and frontend development with production-minded tradeoffs',
      'Strong bias toward performance, simplicity, and clear UX',
      'Comfortable shipping from prototype to deployment',
    ],
    ctaLabel: 'Open LinkedIn',
    ctaHref: 'https://www.linkedin.com/',
  },
  'featured-projects': {
    id: 'featured-projects',
    title: 'Featured Project Console',
    kicker: 'Flagship work, strongest outcomes, best craft',
    body:
      'This hero station is meant for the projects that best represent my thinking and execution. In the final version, each project can include gameplay-like transitions, architecture notes, stack badges, and live/demo links.',
    highlights: [
      '1-3 flagship projects with visuals and concise technical storytelling',
      'Clear role, problem, constraints, and impact for each build',
      'Links to code, demos, and deeper case studies',
    ],
    ctaLabel: 'Open GitHub',
    ctaHref: 'https://github.com/',
  },
  'project-archive': {
    id: 'project-archive',
    title: 'Project Archive Wall',
    kicker: 'Breadth of work beyond the headline pieces',
    body:
      'This zone is for the wider body of work: experiments, utilities, client work, internal tools, and ideas that still matter even if they are not flagship case studies.',
    highlights: [
      'Smaller builds, prototypes, and supporting projects',
      'Fast filters by stack, domain, or year',
      'A denser visual index instead of long scrolling lists',
    ],
    ctaLabel: 'Browse Repositories',
    ctaHref: 'https://github.com/',
  },
  skills: {
    id: 'skills',
    title: 'Skills Lab',
    kicker: 'Tools, frameworks, and practical strengths',
    body:
      'This area is for capabilities rather than just a keyword dump. The goal is to show what I can reliably deliver, not to turn the portfolio into an icon wall.',
    highlights: [
      'Frontend systems, interaction design, and polished UI delivery',
      'Backend APIs, data modeling, and production-oriented architecture',
      'Performance tuning, debugging, and shipping discipline',
    ],
    ctaLabel: 'Open Resume',
    ctaHref: '#',
  },
  experience: {
    id: 'experience',
    title: 'Experience Archive',
    kicker: 'Timeline, roles, and measurable growth',
    body:
      'This station can become an explorable timeline with roles, responsibilities, and meaningful outcomes. It should show progression without forcing the viewer through a dense resume block.',
    highlights: [
      'Career timeline presented as a readable spatial artifact',
      'Focus on ownership, scope, and results rather than title inflation',
      'Space for leadership, collaboration, and delivery context',
    ],
    ctaLabel: 'View Experience',
    ctaHref: 'https://www.linkedin.com/',
  },
  achievements: {
    id: 'achievements',
    title: 'Achievements Shelf',
    kicker: 'Recognition, milestones, and social proof',
    body:
      'Use this area for awards, certifications, speaking, open-source highlights, testimonials, or meaningful metrics. It works best when treated as evidence, not decoration.',
    highlights: [
      'Selected metrics, awards, or trust signals',
      'Room for testimonials or notable collaborators',
      'Can double as a social links showcase',
    ],
    ctaLabel: 'Open Highlights',
    ctaHref: 'https://github.com/',
  },
  contact: {
    id: 'contact',
    title: 'Contact Terminal',
    kicker: 'Open channel for roles, freelance, and collaboration',
    body:
      'Use this area for email, social links, scheduling, and a short call-to-action. In the full version, this terminal can expand into a polished contact experience with animated messages and direct links.',
    highlights: [
      'Available for software engineering roles and collaborations',
      'Can include email, resume, and social links',
      'Simple interaction now, richer terminal UI later',
    ],
    ctaLabel: 'Send Email',
    ctaHref: 'mailto:hello@example.com',
  },
};