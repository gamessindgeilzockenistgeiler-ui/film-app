// Kuratierte "Must-Watch"-Liste. Wir speichern hier bewusst nur Titel + Jahr,
// die tatsächlichen Metadaten (Poster, Genres, Regisseur, TMDB-ID, Beschreibung)
// werden live über die TMDB API nachgeladen (siehe app/api/classics/route.ts).
// Das garantiert immer aktuelle & korrekte Original-Poster.

export interface ClassicSeed {
  title: string;
  year: number;
}

const classicReasons: Record<string, string> = {
  'The Godfather': 'Ein meisterhaftes Familiendrama über Macht, Loyalität und die Kosten des Erbes.',
  'Pulp Fiction': 'Nichtlineares Erzählen, ikonische Dialoge und ein Film, der seine eigene Sprache geschaffen hat.',
  'The Matrix': 'Ein stilprägender Sci-Fi-Klassiker über Realität, Freiheit und die Macht von Entscheidungen.',
  'Inception': 'Ein visuell präziser Mind-Bender, der Traumlogik in großes Blockbuster-Kino verwandelt.',
  'The Shawshank Redemption': 'Eine zeitlose Geschichte über Hoffnung, Freundschaft und Durchhaltevermögen.',
  'Dune': 'Ein modernes Science-Fiction-Epos mit gewaltiger Welt, politischer Tiefe und starken Bildern.',
  'Parasite': 'Ein scharfer Genre-Mix über soziale Ungleichheit, der bis zur letzten Minute überrascht.',
  'Spirited Away': 'Ein poetisches Animationsmeisterwerk über Mut, Identität und eine magische Zwischenwelt.',
  'The Dark Knight': 'Ein intensives Comic-Drama, das moralische Fragen und großes Spannungskino verbindet.',
  'Whiplash': 'Ein elektrisierendes Duell über Talent, Ehrgeiz und die Grenzen von Perfektion.',
};

export function getClassicReason(title: string, year: number): string {
  return classicReasons[title] ?? `Ein prägender Film aus ${year}, den man als Filmfan gesehen haben sollte.`;
}

export const CLASSICS: ClassicSeed[] = [
  { title: 'The Godfather', year: 1972 },
  { title: 'The Godfather Part II', year: 1974 },
  { title: 'Pulp Fiction', year: 1994 },
  { title: 'The Matrix', year: 1999 },
  { title: 'Fight Club', year: 1999 },
  { title: 'The Lord of the Rings: The Fellowship of the Ring', year: 2001 },
  { title: 'The Lord of the Rings: The Two Towers', year: 2002 },
  { title: 'The Lord of the Rings: The Return of the King', year: 2003 },
  { title: 'Inception', year: 2010 },
  { title: 'Forrest Gump', year: 1994 },
  { title: 'The Shawshank Redemption', year: 1994 },
  { title: 'Dune', year: 2021 },
  { title: 'Interstellar', year: 2014 },
  { title: 'Star Wars', year: 1977 },
  { title: 'The Empire Strikes Back', year: 1980 },
  { title: 'Jaws', year: 1975 },
  { title: 'Taxi Driver', year: 1976 },
  { title: 'Parasite', year: 2019 },
  { title: 'Goodfellas', year: 1990 },
  { title: 'Jurassic Park', year: 1993 },
  { title: 'Spirited Away', year: 2001 },
  { title: 'The Dark Knight', year: 2008 },
  { title: 'Se7en', year: 1995 },
  { title: 'The Silence of the Lambs', year: 1991 },
  { title: "Schindler's List", year: 1993 },
  { title: 'Casablanca', year: 1942 },
  { title: 'Citizen Kane', year: 1941 },
  { title: 'Psycho', year: 1960 },
  { title: '2001: A Space Odyssey', year: 1968 },
  { title: 'Apocalypse Now', year: 1979 },
  { title: 'Back to the Future', year: 1985 },
  { title: 'Alien', year: 1979 },
  { title: 'Blade Runner', year: 1982 },
  { title: 'Gladiator', year: 2000 },
  { title: 'Titanic', year: 1997 },
  { title: 'The Green Mile', year: 1999 },
  { title: 'American History X', year: 1998 },
  { title: 'The Departed', year: 2006 },
  { title: 'Whiplash', year: 2014 },
  { title: 'La La Land', year: 2016 },
  { title: 'Joker', year: 2019 },
  { title: 'Django Unchained', year: 2012 },
  { title: 'Inglourious Basterds', year: 2009 },
  { title: 'The Prestige', year: 2006 },
  { title: 'Memento', year: 2000 },
  { title: 'No Country for Old Men', year: 2007 },
  { title: 'There Will Be Blood', year: 2007 },
  { title: 'Léon: The Professional', year: 1994 },
  { title: 'Amélie', year: 2001 },
  { title: 'Spider-Man: Into the Spider-Verse', year: 2018 },
];
