// Site-wide facts. Change them here and every page updates.
export const site = {
  name: 'Jamie Maguire',
  business: 'Jamie Maguire Garden Design',
  url: 'https://jamiemaguiregardendesign.com',
  email: 'jamiemaguiregardendesign@gmail.com',
  instagram: {
    handle: '@jamiemaguiregardendesign',
    url: 'https://www.instagram.com/jamiemaguiregardendesign/',
  },
  area: 'London and surrounding areas',
  tagline: 'Thoughtful, elegant gardens for modern life',
  description:
    'Garden design in London and surrounding areas by Jamie Maguire: consultations, planting design and full garden design.',
  lcgdPortfolioUrl: 'https://www.lcgd.org.uk/portfolio/jamie-maguire/',
  nav: [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Services', href: '/services' },
    { label: 'Projects', href: '/projects' },
    { label: 'Contact', href: '/contact' },
  ],
  services: [
    {
      id: 'consultation',
      title: 'Consultation',
      summary: 'A focused visit to talk through your garden, what works, what does not, and where to begin.',
    },
    {
      id: 'planting-design',
      title: 'Planting Design',
      summary: 'Seasonal, wildlife-friendly planting schemes chosen for your soil, light and the way you live.',
    },
    {
      id: 'full-garden-design',
      title: 'Full Garden Design',
      summary: 'A complete design from first sketch to detailed plans, layout, materials and planting.',
    },
  ],
} as const;
