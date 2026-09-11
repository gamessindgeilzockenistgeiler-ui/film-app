import type { Movie } from './types';

function todayAsCalendarDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isUpcomingMovie(movie: Pick<Movie, 'release_date' | 'release_year'>): boolean {
  const releaseDate = movie.release_date?.slice(0, 10);
  if (releaseDate && /^\d{4}-\d{2}-\d{2}$/.test(releaseDate)) {
    return releaseDate > todayAsCalendarDate();
  }

  return movie.release_year !== null && movie.release_year > new Date().getFullYear();
}