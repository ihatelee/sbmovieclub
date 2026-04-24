// Mock data placeholder. Replace with Supabase queries when backend is connected.

export type Movie = {
  id: string;
  title: string;
  year: number;
  director: string;
  posterUrl: string;
  backdropUrl?: string;
  synopsis: string;
  runtime: number;
  watchedAt: string; // ISO date
  rating?: number; // club average 0–10
  pickedBy?: string;
};

const poster = (seed: string) =>
  `https://picsum.photos/seed/${seed}/600/900`;
const backdrop = (seed: string) =>
  `https://picsum.photos/seed/${seed}-bd/1600/900`;

export const movies: Movie[] = [
  {
    id: "current",
    title: "The Conversation",
    year: 1974,
    director: "Francis Ford Coppola",
    posterUrl: poster("conversation"),
    backdropUrl: backdrop("conversation"),
    synopsis:
      "A paranoid surveillance expert is hired to record a couple's private conversation, only to suspect the recording will lead to murder.",
    runtime: 113,
    watchedAt: new Date().toISOString(),
    rating: 8.4,
    pickedBy: "Lena",
  },
  ...Array.from({ length: 9 }).map((_, i) => {
    const titles = [
      { title: "Stalker", year: 1979, director: "Andrei Tarkovsky", picker: "Marco" },
      { title: "In the Mood for Love", year: 2000, director: "Wong Kar-wai", picker: "Aya" },
      { title: "Paris, Texas", year: 1984, director: "Wim Wenders", picker: "Jonas" },
      { title: "Mulholland Drive", year: 2001, director: "David Lynch", picker: "Iris" },
      { title: "Burning", year: 2018, director: "Lee Chang-dong", picker: "Sam" },
      { title: "Persona", year: 1966, director: "Ingmar Bergman", picker: "Lena" },
      { title: "Chungking Express", year: 1994, director: "Wong Kar-wai", picker: "Aya" },
      { title: "The Master", year: 2012, director: "Paul Thomas Anderson", picker: "Marco" },
      { title: "Drive My Car", year: 2021, director: "Ryusuke Hamaguchi", picker: "Iris" },
    ];
    const t = titles[i];
    const seed = t.title.toLowerCase().replace(/\s+/g, "-");
    return {
      id: seed,
      title: t.title,
      year: t.year,
      director: t.director,
      posterUrl: poster(seed),
      backdropUrl: backdrop(seed),
      synopsis:
        "A modern classic discussed at length over wine and snacks. Replace this synopsis with real data once Supabase is connected.",
      runtime: 100 + i * 5,
      watchedAt: new Date(Date.now() - (i + 1) * 1000 * 60 * 60 * 24 * 14).toISOString(),
      rating: 6 + Math.random() * 3,
      pickedBy: t.picker,
    };
  }),
];

export const getCurrentMovie = () => movies[0];
export const getRecentMovies = () => movies.slice(1, 10);
export const getMovieById = (id: string) => movies.find((m) => m.id === id);
