// Site-wide facts. Change them here and every page updates.
//
// headerStyle switches the top menu design:
//   'solid'   white banner with the links on it, hero image below
//   'overlay' hero image runs to the very top of the page with white links on top of it (default)
export type HeaderStyle = 'solid' | 'overlay';

// reviewMode: true lets a reviewer add ?mode=edit to any URL to see numbered pins on every element
// and write notes against them. TURN THIS OFF AT LAUNCH (public visitors shouldn't get it).

export const site = {
  headerStyle: 'overlay' as HeaderStyle,
  reviewMode: true,
  // logo: where the logo image is used. Switch any of these off to fall back to the plain-text name
  // (header, footer) or the simple leaf icon (favicon). Files live in public/brand/.
  logo: { header: true, footer: true, favicon: true },
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
      body: 'A good place to start if you are unsure where to begin, or want a fresh pair of eyes before committing to a full design.',
      points: ['A visit to your garden to look at the space, light and soil', 'A conversation about how you want to use it', 'Practical advice on layout, planting and materials'],
    },
    {
      id: 'planting-design',
      title: 'Planting Design',
      summary: 'Seasonal, wildlife-friendly planting schemes chosen for your soil, light and the way you live.',
      body: 'Planting brings a garden to life. I design schemes that look good across the seasons, suit your conditions and support pollinators and wildlife.',
      points: ['Plant selection matched to your soil and aspect', 'Layered, seasonal interest with a clear structure', 'A planting plan you or your contractor can follow'],
    },
    {
      id: 'full-garden-design',
      title: 'Full Garden Design',
      summary: 'A complete design from first sketch to detailed plans, layout, materials and planting.',
      body: 'For a whole garden, a complete design that brings layout, materials and planting together into one considered scheme.',
      points: ['A concept design to explore ideas with you', 'Detailed plans for construction and planting', 'Guidance as the garden is built'],
    },
  ],
} as const;
