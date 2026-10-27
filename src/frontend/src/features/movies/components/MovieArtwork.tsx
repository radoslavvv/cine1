import { useState } from 'react';
import { getMoviePresentation } from '../presentation';

interface MovieArtworkProps {
  title: string;
  variant?: 'poster' | 'backdrop';
  showTitle?: boolean;
}

export function MovieArtwork({ title, variant = 'poster', showTitle = true }: MovieArtworkProps) {
  const presentation = getMoviePresentation(title);
  const url = variant === 'poster' ? presentation.posterUrl : presentation.backdropUrl;
  const [failedUrl, setFailedUrl] = useState<string>();
  const isBackdrop = variant === 'backdrop';

  return (
    <div className={`absolute inset-0 overflow-hidden ${presentation.artwork === 'hotel' ? 'bg-[#291926]' : presentation.artwork === 'lantern' ? 'bg-[#112a2b]' : 'bg-[#171929]'}`} aria-hidden="true">
      <div className="ceiling-lights absolute inset-0 opacity-65" />
      {presentation.artwork === 'orbit' && (
        <div className={`absolute ${isBackdrop ? 'inset-y-0 right-0 w-full sm:w-3/4' : 'inset-0'}`}>
          <div className="absolute top-[24%] left-[22%] aspect-square w-[58%] rounded-full bg-[#0e101a] shadow-[-16px_-8px_70px_#c1a28630,inset_-12px_-8px_26px_#60507940]" />
          <div className="absolute top-[38%] -left-[15%] h-[23%] w-[135%] -rotate-30 rounded-[50%] border border-amber/45 shadow-[0_-2px_16px_#e9b67520]" />
          <div className="absolute top-[39%] -left-[15%] h-[20%] w-[135%] -rotate-30 rounded-[50%] border-t border-amber/20" />
        </div>
      )}
      {presentation.artwork === 'lantern' && (
        <div className="absolute inset-0">
          <div className="absolute top-[15%] left-[40%] h-[40%] w-px bg-amber/30" />
          <div className="absolute top-[25%] left-[28%] aspect-[3/4] w-[25%] rounded-[40%] border border-amber/50 bg-amber/15 shadow-[0_0_65px_#e9b67530]" />
          <div className="absolute right-[14%] bottom-[16%] h-[40%] w-[25%] rounded-t-full bg-[#0b191e]" />
          <div className="absolute right-[22%] bottom-[43%] h-[2%] w-[4%] rounded-full bg-ivory/60" />
        </div>
      )}
      {presentation.artwork === 'hotel' && (
        <div className="absolute inset-x-[16%] top-[25%] bottom-[16%] rounded-t-3xl border border-rose/30 bg-[#513143] shadow-[0_0_60px_#c58a9e18]">
          <div className="absolute -top-8 left-1/3 h-10 w-1/3 rounded-t-full border border-rose/30 bg-[#513143]" />
          <div className="grid h-full grid-cols-3 gap-x-5 gap-y-5 p-5 sm:p-7">
            {Array.from({ length: 9 }, (_, index) => <span key={index} className="rounded-t-full bg-amber/30 shadow-[0_0_12px_#e9b67518]" />)}
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-linear-to-t from-lobby/90 via-transparent to-transparent" />
      {!isBackdrop && showTitle && <span className="absolute inset-x-5 bottom-6 font-display text-3xl leading-tight text-ivory/85 sm:text-4xl">{title}</span>}
      {url && failedUrl !== url && (
        <img className="absolute inset-0 size-full object-cover" src={url} alt="" loading={isBackdrop ? 'eager' : 'lazy'} onError={() => setFailedUrl(url)} />
      )}
    </div>
  );
}
