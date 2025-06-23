import { loader } from 'fumadocs-core/source';
import { createMDXSource } from 'fumadocs-mdx';
import { icons } from 'lucide-react';
import { createElement } from 'react';

// Import all MDX files from content/docs
const files = import.meta.glob('../content/docs/**/*.mdx', { eager: true });

export const source = loader({
  baseUrl: '/docs',
  source: createMDXSource(files, {
    baseUrl: '/docs',
  }),
  icon(icon) {
    if (icon && icon in icons)
      return createElement(icons[icon as keyof typeof icons]);
  },
});