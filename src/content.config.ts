import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One Markdown file per portfolio project. The first image is the cover shown in grids.
// `image()` makes Astro check the file exists and optimise it at build time.
const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      location: z.string(),
      summary: z.string().optional(), // shown after the location in the expanded view; omit if there's nothing to add yet
      order: z.number().default(100), // lower numbers appear first
      images: z.array(z.object({ src: image(), alt: z.string() })).min(1),
    }),
});

export const collections = { projects };
