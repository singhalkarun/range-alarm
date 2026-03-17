import type { MetadataRoute } from 'next';
import { WEBSITE_URL } from '@/lib/constants';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: WEBSITE_URL, lastModified: new Date(), priority: 1.0 },
    { url: `${WEBSITE_URL}/privacy`, lastModified: new Date(), priority: 0.5 },
    { url: `${WEBSITE_URL}/terms`, lastModified: new Date(), priority: 0.5 },
  ];
}
