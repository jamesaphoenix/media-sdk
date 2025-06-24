'use client';

import Link from 'next/link';

interface TocItem {
  title: string;
  href: string;
  level: number;
}

interface TableOfContentsProps {
  items: TocItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-gray-900 text-sm">On this page</h4>
      <nav className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block text-sm text-gray-600 hover:text-gray-900 transition-colors ${
              item.level === 2 ? 'pl-0' : 'pl-4'
            }`}
          >
            {item.title}
          </Link>
        ))}
      </nav>
    </div>
  );
}