// The two hero photos, imported once here (Astro/Vite needs a static import to optimise an image;
// this is that one static import, so pages needing the same photo don't each repeat the file path).
import homeHero from '../assets/photos/hero.jpg';
import secondaryHero from '../assets/photos/about.jpg'; // reused by every page except Home

export { homeHero, secondaryHero };
