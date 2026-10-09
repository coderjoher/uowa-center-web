import type { HideableSection } from "@/config/sections";

export interface NavLink {
  label: string;
  href: string;
  /** Sub-pages shown in a dropdown under the link on desktop. */
  children?: { label: string; href: string }[];
}

export interface MobileMenuItem {
  label: string;
  href: string;
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
  /** Route segment under `/[lang]/courses/`. */
  slug: string;
  title: string;
  date: string;
  venue: string;
  image: string;
  imageAlt: string;
  /** Lead paragraph on the detail page, and its meta description. */
  excerpt: string;
  /** What the course covers, one entry per bullet. */
  outline: string[];
  /** Practical facts rendered as a definition list. */
  details: { label: string; value: string }[];
  body: string[];
  href: string;
}

/** A home-page mosaic tile. `title` is alt text only — nothing renders it. */
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
  /** Route segment under `/[lang]/news/`. */
  slug: string;
  date: string;
  /** The division that issued the item. */
  author: string;
  title: string;
  image: string;
  imageAlt: string;
  /** Lead paragraph on the article, and the page's meta description. */
  excerpt: string;
  /** Article body, one entry per paragraph. */
  body: string[];
  href: string;
}

/** Shared shape for every secondary page's header and <head> tags. */
export interface PageMeta {
  /** Breadcrumb + nav label. */
  label: string;
  title: string;
  intro: string;
  metaTitle: string;
  metaDescription: string;
}

export interface ContactCard {
  title: string;
  lines: string[];
  /** Makes the first line a link (tel: or mailto:). */
  href?: string;
}

export interface GalleryPhoto {
  image: string;
  caption: string;
}

/** A playable video with a poster and a play button. */
export interface VideoBlock {
  label: string;
  heading: string[];
  body: string;
  src: string;
  /** Optional WebM copy, offered after the MP4 for browsers without H.264. */
  srcWebm?: string;
  /**
   * Optional YouTube video (a link or the 11-character ID). When set it is
   * played in the themed frame instead of the uploaded file.
   */
  youtube?: string;
  poster: string;
  /** Accessible name of the play button. */
  play: string;
  /** Accessible names for the player's own controls. */
  controls: {
    pause: string;
    mute: string;
    unmute: string;
    volume: string;
    fullscreen: string;
    exitFullscreen: string;
    seek: string;
  };
}

/** One planned activity in the annual plan table. */
export interface PlanRow {
  month: string;
  date: string;
  activity: string;
  type: string;
  venue: string;
  /** Optional link to the activity's own page. */
  href?: string;
}

export interface AnnualPlan {
  label: string;
  heading: string[];
  intro: string;
  columns: { month: string; date: string; activity: string; type: string; venue: string };
  /** Label of the per-row link to the activity's page. */
  details: string;
  rows: PlanRow[];
}

/**
 * A block of content that editors add in the admin, on their own pages or
 * on the home page. `type` is the display: how the block is laid out.
 */
export type Block =
  | { type: "text"; title?: string; content: string }
  | { type: "cards"; title?: string; intro?: string; items: { title: string; text: string; image?: string; href?: string }[] }
  | { type: "links"; title?: string; intro?: string; items: { title: string; description?: string; href?: string; file?: string }[] }
  | { type: "accordion"; title?: string; items: { question: string; answer: string }[] }
  | { type: "stats"; title?: string; items: { value: string; label: string }[] }
  | { type: "announcements"; title?: string; items: { badge: string; date: string; title: string; text: string }[] }
  | { type: "cta"; title: string; content: string; button: string; href: string; image?: string }
  | { type: "image"; image: string; caption?: string };

/** A page editors create in the admin, at /<lang>/<slug>. */
export interface CustomPage {
  slug: string;
  title: string;
  intro: string;
  image: string;
  blocks: Block[];
}

export interface SiteContent {
  /** Pages created in the admin, each at /<lang>/<slug>. */
  customPages?: CustomPage[];
  /** Blocks added in the admin to the home page, right after the hero and just before the footer. */
  homeBlocks?: { afterHero?: Block[]; beforeFooter?: Block[] };
  /** Section switches (from the CMS settings, or settings.json). */
  sections?: Record<HideableSection, boolean>;
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
    /** Label of the menu that collects links past the ones that fit. */
    more: string;
    contact: string;
    menu: MobileMenuItem[];
    openMenu: string;
    closeMenu: string;
  };
  hero: {
    /** Eyebrow above the heading: the centre's name. */
    label: string;
    heading: string;
    body: string;
    cta: string;
    ctaHref: string;
    secondaryCta: string;
    secondaryCtaHref: string;
    imageAlt: string;
    /** What the photo shows; sits on the navy plaque over its corner. */
    imageCaption: string;
    /** Heading for the row of service areas under the composition. */
    areasLabel: string;
  };
  about: SectionHead & {
    body: string;
    link: string;
    linkHref: string;
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
  services: SectionHead & {
    items: Service[];
    /** Phone-only slider controls. */
    prev: string;
    next: string;
  };
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
  video: VideoBlock;
  plan: AnnualPlan;
  events: SectionHead & {
    items: TrainingEvent[];
    link: string;
    /** Phone-only slider controls. */
    prev: string;
    next: string;
  };
  gallery: SectionHead & {
    cta: string;
    ctaHref: string;
    items: GalleryCard[];
  };
  milestones: SectionHead & {
    items: Milestone[];
    prev: string;
    next: string;
  };
  faq: SectionHead & { items: FaqItem[] };
  cta: { heading: string; body: string; button: string; href: string };
  news: SectionHead & {
    items: NewsPost[];
    link: string;
    linkHref: string;
    /** Phone-only slider controls. */
    prev: string;
    next: string;
  };
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
  common: {
    home: string;
    breadcrumb: string;
  };
  pages: {
    about: PageMeta;
    services: PageMeta;
    courses: PageMeta;
    courseDetail: {
      back: string;
      related: string;
      outline: string;
      details: string;
      register: string;
    };
    gallery: PageMeta & {
      photos: GalleryPhoto[];
      lightbox: { open: string; close: string; prev: string; next: string };
    };
    news: PageMeta;
    newsDetail: {
      back: string;
      related: string;
    };
    faq: PageMeta;
    plan: PageMeta;
    contact: PageMeta & {
      cards: ContactCard[];
      form: {
        legend: string;
        name: string;
        email: string;
        subject: string;
        message: string;
        submit: string;
        note: string;
      };
    };
  };
  meta: { title: string; description: string };
}
