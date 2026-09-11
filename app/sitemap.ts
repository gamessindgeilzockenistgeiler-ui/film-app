import type { MetadataRoute } from 'next';
import { CLASSICS } from '@/lib/classics';
import { searchMovie } from '@/lib/tmdb';

const siteUrl = 'https://cinegrid.de';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const classicPages = await Promise.all(
    CLASSICS.map(async (classic) => {
      const movie = await searchMovie(classic.title, classic.year);
      if (!movie) return null;

      return {
        url: `${siteUrl}/movie/${movie.id}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      };
    })
  );

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/impressum`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/datenschutz`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    ...classicPages.filter((page): page is NonNullable<typeof page> => page !== null),
  ];
}