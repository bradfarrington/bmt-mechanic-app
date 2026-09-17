import type { Href } from 'expo-router';

import type { InboxLink } from '@/lib/inbox';

/**
 * Where an inbox row or a tapped notification leads. Earnings, reviews and
 * documents are Account screens; until each exists it falls back to the
 * Account tab rather than to nothing.
 */
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
    case 'reviews':
    case 'documents':
      return '/account';
  }
}
