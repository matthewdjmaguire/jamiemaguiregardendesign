import { getCollection } from 'astro:content';

// Projects in display order (lower `order` first). One place for the ordering rule.
export async function getProjects() {
  return (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
}
