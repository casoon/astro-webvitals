import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const docsSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  /** Position inside its sidebar group; lower comes first. */
  order: z.number().default(100),
  /** Label in the sidebar, if shorter than the title. */
  sidebarLabel: z.string().optional(),
});

/**
 * The `docs` collection. Sources live in the project repository's docs/ folder,
 * next to site/, so documentation is versioned and reviewed with the code.
 */
export function docsCollection({ base = '../docs' }: { base?: string } = {}) {
  return defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base }),
    schema: docsSchema,
  });
}
