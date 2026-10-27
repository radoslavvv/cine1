interface MoviePresentation {
  artwork: 'orbit' | 'lantern' | 'hotel';
  posterUrl?: string;
  backdropUrl?: string;
}

// Local artwork is optional. Vite discovers files in assets/ without an
// external image service or a change to the backend contract.
const assets = import.meta.glob<string>('./assets/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
});

function localArtwork(name: string): string | undefined {
  return Object.entries(assets).find(([path]) =>
    path.replace('./assets/', '').replace(/\.[^.]+$/, '') === name,
  )?.[1];
}

const presentations: Record<string, MoviePresentation> = {
  Interstellar: {
    artwork: 'orbit',
    posterUrl: localArtwork('interstellar-poster'),
    backdropUrl: localArtwork('interstellar-backdrop'),
  },
  'Spirited Away': {
    artwork: 'lantern',
    posterUrl: localArtwork('spirited-away-poster'),
    backdropUrl: localArtwork('spirited-away-backdrop'),
  },
  'The Grand Budapest Hotel': {
    artwork: 'hotel',
    posterUrl: localArtwork('grand-budapest-poster'),
    backdropUrl: localArtwork('grand-budapest-backdrop'),
  },
};

export function getMoviePresentation(title: string): MoviePresentation {
  return presentations[title] ?? {
    artwork: 'orbit',
  };
}
