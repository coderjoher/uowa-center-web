import type { SiteContent } from "@/types/content";

const P = "/en";

export const EN: SiteContent = {
  brand: {
    name: "Computer",
    suffix: "Center",
    university: "University of Warith Al-Anbiyaa",
    logoAlt: "University of Warith Al-Anbiyaa emblem",
  },

  nav: {
    links: [
      { label: "About", href: `${P}#overview` },
      { label: "Services", href: `${P}#services`, hasDropdown: true },
      { label: "Structure", href: `${P}#structure` },
      { label: "Training", href: `${P}#courses` },
      { label: "News", href: `${P}#news` },
    ],
    contact: "Contact Us",
    menu: [
      { label: "Homepage", href: `${P}`, current: true },
      { label: "The Center in Brief", href: `${P}#about` },
      { label: "Director's Word", href: `${P}#director` },
      { label: "Vision, Mission & Objectives", href: `${P}#overview` },
      {
        label: "Services",
        href: `${P}#services`,
        children: [
          { label: "Network & Internet", href: `${P}#services` },
          { label: "Systems & Databases", href: `${P}#services` },
          { label: "Web & Digital Publishing", href: `${P}#services` },
          { label: "Maintenance & Support", href: `${P}#services` },
          { label: "Cybersecurity", href: `${P}#services` },
          { label: "Training & Capacity Building", href: `${P}#services` },
        ],
      },
      { label: "Department Structure", href: `${P}#structure` },
      { label: "Courses & Workshops", href: `${P}#courses` },
      { label: "Gallery", href: `${P}#gallery` },
      { label: "Milestones", href: `${P}#milestones` },
      { label: "FAQ", href: `${P}#faq` },
      { label: "News", href: `${P}#news` },
      { label: "Contact", href: `${P}#contact` },
    ],
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },

  hero: {
    heading: "The Digital Backbone of Our University",
    body: "The Electronic Computer Center runs the networks, systems and technical support that every college and department relies on each day.",
    cta: "Our Services",
    imageAlt: "The campus of the University of Warith Al-Anbiyaa",
  },

  about: {
    label: "About",
    heading: ["We keep the university's", "systems and network running"],
    body: "The Electronic Computer Center was established to own the university's IT infrastructure — from the campus network and data center to the academic and administrative systems and the people who use them.",
    link: "Learn More",
    buildingAlt: "The science building at the University of Warith Al-Anbiyaa",
    walkwayAlt: "Students on the university campus",
  },

  features: [
    {
      icon: "network",
      title: "Reliable Infrastructure",
      body: "A wired and wireless campus network and a data center that stay available around the clock.",
      offsetY: 50,
    },
    {
      icon: "team",
      title: "Specialised Staff",
      body: "Engineers, developers and network and information-security specialists supporting every college.",
      offsetY: -50,
    },
    {
      icon: "support",
      title: "Continuous Support",
      body: "A help desk that receives reports from staff and students and tracks them to resolution.",
      offsetY: 50,
    },
  ],

  director: {
    label: "Director",
    heading: "A word from the director",
    body: [
      "Welcome to the official page of the Electronic Computer Department at the University of Warith Al-Anbiyaa — the department responsible for building, running and sustaining the university's digital infrastructure.",
      "Over the past years we have made real progress in extending the network, automating academic and administrative work, protecting our data and developing our staff. A great deal remains ahead of us, and we pursue it in partnership with every college and department.",
      "I invite the university's staff and students to reach out to us on anything concerning our services. Your feedback is the foundation we build our work on.",
    ],
    name: "Eng. Abbas Nouri",
    role: "Director, Electronic Computer Department",
    image: "/images/director.jpg",
    imageAlt: "Eng. Abbas Nouri, Director of the Electronic Computer Department",
  },

  overview: {
    label: "About the department",
    heading: ["Vision, mission", "and objectives"],
    pillars: [
      {
        title: "Vision",
        body: "To be the trusted technical reference inside the university, with its academic and administrative services delivered on a secure, stable digital infrastructure that meets recognised higher-education standards.",
      },
      {
        title: "Mission",
        body: "To provide an IT infrastructure that serves teaching, research and administration; to build and protect the university's electronic systems and data; and to grow the digital capability of its staff and students.",
      },
    ],
    objectivesTitle: "Objectives",
    objectives: [
      "Operate the campus network and internet service and keep them available throughout the academic year.",
      "Automate academic and administrative procedures and reduce reliance on paper processes.",
      "Build and maintain the university's systems and databases, and consolidate its sources of data.",
      "Protect data and systems in line with the university's approved information-security policies.",
      "Provide technical support and hardware maintenance to colleges and departments within defined response times.",
      "Train staff and students through courses and workshops in networking, databases and information security.",
    ],
  },

  structure: {
    label: "Structure",
    heading: ["Department structure", "and its divisions"],
    intro: "The department reports to the university presidency, and its work is distributed across six specialised divisions that together cover infrastructure, systems, support and training.",
    rootTitle: "Head of Department",
    rootNote: "Reports to: University Presidency",
    divisions: [
      {
        title: "Network & Communications",
        scope: "Runs the wired and wireless network, connects colleges and departments, and manages internet service.",
      },
      {
        title: "Systems & Databases",
        scope: "Builds academic and administrative systems, and manages databases and their backups.",
      },
      {
        title: "Web & Digital Publishing",
        scope: "Manages the official site and college pages, and publishes content and public data.",
      },
      {
        title: "Maintenance & Technical Support",
        scope: "Maintains hardware and peripherals, receives fault reports and tracks them to resolution.",
      },
      {
        title: "Information Security",
        scope: "Applies protection policies, reviews access rights and monitors security incidents.",
      },
      {
        title: "Training & Development",
        scope: "Designs and delivers digital courses and workshops for university staff and students.",
      },
    ],
  },

  services: {
    label: "Services",
    heading: ["Services for university", "staff and students"],
    items: [
      {
        title: "Network & Internet",
        description:
          "Running the wired and wireless campus network, connecting every college and department, and keeping the service continuous.",
        image: "/images/service-network.jpg",
        imageAlt: "A computer lab at the University of Warith Al-Anbiyaa",
      },
      {
        title: "Systems & Databases",
        description:
          "Building and running the academic and administrative systems, and managing the databases and their scheduled backups.",
        image: "/images/service-systems.jpg",
        imageAlt: "A student working on a tablet on campus",
      },
      {
        title: "Web & Digital Publishing",
        description:
          "Managing the official site and the college pages, and publishing and updating news and public data as it lands.",
        image: "/images/service-web.jpg",
        imageAlt: "Students following digital content on campus",
      },
      {
        title: "Maintenance & Support",
        description:
          "Receiving fault reports and maintaining hardware and peripherals across colleges and departments within defined response times.",
        image: "/images/service-support.jpg",
        imageAlt: "University staff coordinating together",
      },
      {
        title: "Cybersecurity",
        description:
          "Applying data-protection policies, managing access rights, and monitoring and responding to security incidents.",
        image: "/images/service-security.jpg",
        imageAlt: "A supervised electronic examination hall",
      },
      {
        title: "Training & Capacity Building",
        description:
          "Running courses and workshops in networking, databases and information security for university staff and students.",
        image: "/images/service-training.jpg",
        imageAlt: "A participant in one of the training courses",
      },
    ],
  },

  banner: { imageAlt: "The campus-life sign at the university entrance" },

  events: {
    label: "Training",
    heading: ["Upcoming courses", "and workshops"],
    link: "Contact Us",
    items: [
      {
        title: "Information Security Workshop",
        date: "14 - 15 September 2026",
        venue: "Training Hall - Computer Center",
        image: "/images/event-lecture.jpg",
        href: `${P}#contact`,
      },
      {
        title: "Network Administration Course",
        date: "6 October 2026",
        venue: "Computer Lab - College of Engineering",
        image: "/images/event-workshop.jpg",
        href: `${P}#contact`,
      },
      {
        title: "Electronic Examination System Course",
        date: "18 November 2026",
        venue: "Conference Hall - University Presidency",
        image: "/images/event-exam.jpg",
        href: `${P}#contact`,
      },
    ],
  },

  gallery: {
    label: "Gallery",
    heading: ["Life at the center", "and on campus"],
    body: "Snapshots from the courses, workshops and digital initiatives the center runs across the university campus.",
    cta: "About the University",
    items: [
      { title: "Training & Workshops", image: "/images/gallery-training.jpg" },
      { title: "Campus Life", image: "/images/gallery-campus.jpg" },
    ],
  },

  milestones: {
    label: "Milestones",
    heading: ["Milestones in", "the center's work"],
    prev: "Previous milestone",
    next: "Next milestone",
    items: [
      {
        year: "2019",
        title: "Student Portal",
        summary: "First release for registration and grade tracking.",
        image: "/images/milestone-1.jpg",
      },
      {
        year: "2021",
        title: "Campus Network",
        summary: "Wireless coverage extended across every college.",
        image: "/images/milestone-2.jpg",
      },
      {
        year: "2023",
        title: "Electronic Exams",
        summary: "The platform adopted for monthly and final exams.",
        image: "/images/milestone-3.jpg",
      },
      {
        year: "2026",
        title: "Digital Services Portal",
        summary: "Student and staff services unified in one place.",
        image: "/images/milestone-4.jpg",
      },
    ],
  },

  faq: {
    label: "Faq",
    heading: ["Answers to your questions"],
    items: [
      {
        question: "How do I get a university email account?",
        answer:
          "Apply through the administrative unit in your college. The center creates the account within two working days and sends the credentials back to that unit.",
      },
      {
        question: "How do I report a technical fault?",
        answer:
          "Through the center's help desk or by writing to the official address, stating your college, the device number and a description of the fault.",
      },
      {
        question: "How do I connect to the campus wireless network?",
        answer:
          "Use your existing university account after selecting the university network from the list available inside the campus.",
      },
      {
        question: "Does the center run training courses?",
        answer:
          "Yes. The center runs courses in networking, databases and information security for university staff and students.",
      },
      {
        question: "What are the center's working hours?",
        answer:
          "Sunday to Thursday, 8:00 AM to 2:00 PM, excluding official holidays.",
      },
    ],
  },

  cta: {
    heading: "Need technical support from the center?",
    body: "Our team is ready to receive your request and follow it through to resolution.",
    button: "Contact Us",
  },

  news: {
    label: "News",
    heading: ["Our latest news"],
    link: "See all articles",
    items: [
      {
        date: "12 August 2026",
        author: "Network Unit",
        title: "Center completes the campus wireless network expansion",
        image: "/images/news-1.jpg",
        href: `${P}#news`,
      },
      {
        date: "28 July 2026",
        author: "Systems Unit",
        title: "Updated release of the digital services portal goes live",
        image: "/images/news-2.jpg",
        href: `${P}#news`,
      },
      {
        date: "9 July 2026",
        author: "Training Unit",
        title: "Information security course concludes for college staff",
        image: "/images/news-3.jpg",
        href: `${P}#news`,
      },
    ],
  },

  newsletter: {
    heading: ["Stay Updated", "with the Center"],
    label: "Email address",
    placeholder: "Enter your email",
    submit: "Submit",
  },

  footer: {
    tagline:
      "We develop the university's digital infrastructure and support its staff and students in everything related to information technology.",
    columns: [
      {
        title: "Links",
        links: [
          { label: "Homepage", href: `${P}` },
          { label: "Director's Word", href: `${P}#director` },
          { label: "Vision & Mission", href: `${P}#overview` },
          { label: "Structure", href: `${P}#structure` },
          { label: "Courses & Workshops", href: `${P}#courses` },
          { label: "FAQ", href: `${P}#faq` },
        ],
      },
      {
        title: "Services",
        links: [
          { label: "Network & Internet", href: `${P}#services` },
          { label: "Systems & Databases", href: `${P}#services` },
          { label: "Web & Digital Publishing", href: `${P}#services` },
          { label: "Maintenance & Support", href: `${P}#services` },
          { label: "Cybersecurity", href: `${P}#services` },
          { label: "Training & Capacity Building", href: `${P}#services` },
        ],
      },
    ],
    addressTitle: "Address",
    address:
      "Iraq - Holy Karbala, Baghdad-Karbala road (opposite pole 119)",
    phone: "07734896226 (short number 5751)",
    phoneHref: "tel:+9647734896226",
    email: "info@uowa.edu.iq",
    socials: [
      {
        label: "WEB",
        title: "Official university website",
        href: "https://uowa.edu.iq/",
      },
      {
        label: "YT",
        title: "University YouTube channel",
        href: "https://www.youtube.com/channel/UCJuC2L8xYFBJUyDMu2-TMCw",
      },
      { label: "@", title: "Email us", href: "mailto:info@uowa.edu.iq" },
    ],
    copyright:
      "Copyright © Electronic Computer Center - University of Warith Al-Anbiyaa 2026. All rights reserved.",
  },

  meta: {
    title: "Electronic Computer Center | University of Warith Al-Anbiyaa",
    description:
      "The Electronic Computer Center at the University of Warith Al-Anbiyaa: campus network, systems and data center operations, technical support and training for staff and students.",
  },
};
