export interface NavLink {
  label: string;
  href: string;
  hasDropdown?: boolean;
}

export interface MobileMenuItem {
  label: string;
  href: string;
  /** Rendered in #e4f0f9 rather than white — marks the live page. */
  current?: boolean;
  children?: { label: string; href: string }[];
}

/** Shared shape for the label + two-line heading every section opens with. */
export interface SectionHead {
  label: string;
  /** Split across lines on desktop exactly where the design breaks. */
  heading: string[];
}

export interface Feature {
  icon: "network" | "team" | "support";
  title: string;
  body: string;
  /** Vertical design offset in px (the strip is deliberately zig-zagged). */
  offsetY: number;
}

/** The director's word: a signed message with a supporting photo. */
export interface DirectorMessage {
  label: string;
  heading: string;
  /** Paragraphs of the message, in order. */
  body: string[];
  name: string;
  role: string;
  image: string;
  imageAlt: string;
}

/** Vision and mission read as a matched pair, so they share a shape. */
export interface OverviewPillar {
  title: string;
  body: string;
}

/**
 * A person on the team. `name` and `image` are optional because the roster is
 * filled in over time — a member without them renders as the role plus a
 * monogram tile rather than disappearing.
 */
export interface TeamMember {
  name?: string;
  role: string;
  image?: string;
}

export interface Division {
  title: string;
  scope: string;
}

export interface Service {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
}

export interface TrainingEvent {
  title: string;
  date: string;
  venue: string;
  image: string;
  href: string;
}

export interface GalleryCard {
  title: string;
  image: string;
}

/** The carousel: a dated milestone in the centre's history. */
export interface Milestone {
  year: string;
  title: string;
  summary: string;
  image: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface NewsPost {
  date: string;
  author: string;
  title: string;
  image: string;
  href: string;
}

export interface SiteContent {
  brand: {
    /** Bold half of the wordmark. */
    name: string;
    /** Light half of the wordmark. */
    suffix: string;
    university: string;
    logoAlt: string;
  };
  nav: {
    links: NavLink[];
    contact: string;
    menu: MobileMenuItem[];
    openMenu: string;
    closeMenu: string;
  };
  hero: {
    heading: string;
    body: string;
    cta: string;
    imageAlt: string;
  };
  about: SectionHead & {
    body: string;
    link: string;
    buildingAlt: string;
    walkwayAlt: string;
  };
  features: Feature[];
  director: DirectorMessage;
  overview: SectionHead & {
    pillars: [OverviewPillar, OverviewPillar];
    objectivesTitle: string;
    objectives: string[];
  };
  services: SectionHead & { items: Service[] };
  team: SectionHead & {
    intro: string;
    /** Shown in place of a name that has not been supplied yet. */
    pendingName: string;
    members: TeamMember[];
  };
  structure: SectionHead & {
    intro: string;
    rootTitle: string;
    rootNote: string;
    divisions: Division[];
  };
  banner: { imageAlt: string };
  events: SectionHead & { items: TrainingEvent[]; link: string };
  gallery: SectionHead & { body: string; cta: string; items: GalleryCard[] };
  milestones: SectionHead & {
    items: Milestone[];
    prev: string;
    next: string;
  };
  faq: SectionHead & { items: FaqItem[] };
  cta: { heading: string; body: string; button: string };
  news: SectionHead & { items: NewsPost[]; link: string };
  newsletter: {
    heading: string[];
    label: string;
    placeholder: string;
    submit: string;
  };
  footer: {
    tagline: string;
    columns: { title: string; links: NavLink[] }[];
    addressTitle: string;
    address: string;
    phone: string;
    phoneHref: string;
    email: string;
    socials: { label: string; title: string; href: string }[];
    copyright: string;
  };
  meta: { title: string; description: string };
}
