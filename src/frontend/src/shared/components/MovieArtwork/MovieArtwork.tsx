import { movieArtworkTheme as theme } from './MovieArtwork.theme';
import { useState } from 'react';
import { getMoviePresentation } from './artwork/presentation';

interface MovieArtworkProps {
  title: string;
  variant?: 'poster' | 'backdrop';
  showTitle?: boolean;
}

export function MovieArtwork({
  title,
  variant = 'poster',
  showTitle = true,
}: MovieArtworkProps) {
  const presentation = getMoviePresentation(title);
  const url =
    variant === 'poster' ? presentation.posterUrl : presentation.backdropUrl;
  const [failedUrl, setFailedUrl] = useState<string>();
  const isBackdrop = variant === 'backdrop';

  return (
    <div
      className={`${theme.root} ${theme.backgrounds[presentation.artwork]}`}
      aria-hidden="true"
    >
      <div className={theme.lights} />
      {presentation.artwork === 'orbit' && (
        <div className={isBackdrop ? theme.backdropOrbit : theme.posterOrbit}>
          <div className={theme.planet} />
          <div className={theme.orbitRing} />
          <div className={theme.orbitHighlight} />
        </div>
      )}
      {presentation.artwork === 'lantern' && (
        <div className={theme.lanternScene}>
          <div className={theme.cord} />
          <div className={theme.lantern} />
          <div className={theme.silhouette} />
          <div className={theme.eye} />
        </div>
      )}
      {presentation.artwork === 'hotel' && (
        <div className={theme.hotel}>
          <div className={theme.roof} />
          <div className={theme.windows}>
            {Array.from({ length: 9 }, (_, index) => (
              <span key={index} className={theme.window} />
            ))}
          </div>
        </div>
      )}
      <div className={theme.shade} />
      {!isBackdrop && showTitle && <span className={theme.title}>{title}</span>}
      {url && failedUrl !== url && (
        <img
          className={theme.image}
          src={url}
          alt=""
          loading={isBackdrop ? 'eager' : 'lazy'}
          onError={() => setFailedUrl(url)}
        />
      )}
    </div>
  );
}
