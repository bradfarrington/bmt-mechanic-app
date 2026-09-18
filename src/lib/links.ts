import type { Href } from 'expo-router';

import type { InboxLink } from '@/lib/inbox';

/** Where an inbox row or a tapped notification leads. */
export function hrefFor(link: InboxLink): Href {
  switch (link.type) {
    case 'thread':
      return { pathname: '/jobs/[id]/messages', params: { id: link.id } };
    case 'job':
      return { pathname: '/jobs/[id]', params: { id: link.id } };
    case 'dispute':
      return { pathname: '/disputes/[id]', params: { id: link.id } };
    case 'case':
      return { pathname: '/cases/[id]', params: { id: link.id } };
    case 'earnings':
      return '/earnings';
    case 'reviews':
      return '/reviews';
    case 'documents':
      return '/documents';
  }
}
