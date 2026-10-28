import { Link } from 'react-router-dom';
import { Wordmark } from '../../../shared/components/Wordmark/Wordmark';
import { notFoundPageTheme as theme } from './NotFoundPage.theme';

export function NotFoundPage() {
  return (
    <div className={theme.page}>
      <header className={theme.header}>
        <Link to="/" aria-label="cinemaR — home" className={theme.brand}>
          <Wordmark />
        </Link>
      </header>

      <div className={theme.content}>
        <p className={theme.code} aria-hidden="true">
          404
        </p>
        <h1 className={theme.heading}>This scene is missing.</h1>
        <p className={theme.eyebrow}>Nothing showing here</p>
      </div>

      <div className={theme.desert} aria-hidden="true">
        <svg
          className={theme.ridge}
          viewBox="0 0 1440 240"
          preserveAspectRatio="none"
        >
          <path
            d="M0 170 110 150 185 155 270 105 350 110 395 80 470 83 520 135 640 155 760 135 890 160 980 116 1060 115 1130 65 1220 67 1280 130 1440 150V240H0Z"
            fill="currentColor"
          />
        </svg>
        <div className={theme.ground} />
        <svg className={theme.drift}>
          <Tumbleweed animated />
          <Tumbleweed animated={false} />
        </svg>
      </div>
    </div>
  );
}

function Tumbleweed({ animated }: { animated: boolean }) {
  return (
    <svg
      x={animated ? '-15%' : '65%'}
      y="20"
      width="100"
      height="120"
      viewBox="0 0 120 144"
      className={animated ? theme.movingWeed : theme.stillWeed}
    >
      {animated && (
        <animate
          attributeName="x"
          from="-15%"
          to="115%"
          dur="18s"
          repeatCount="indefinite"
        />
      )}
      <ellipse cx="60" cy="128" rx="37" ry="4" className={theme.shadow} />
      <g>
        {animated && (
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0;0 -15;0 -3;0 0"
            keyTimes="0;0.45;0.75;1"
            dur="1.4s"
            repeatCount="indefinite"
          />
        )}
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
        >
          {animated && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 60 60"
              to="360 60 60"
              dur="3s"
              repeatCount="indefinite"
            />
          )}
          {[0, 47, 96, 148, 203, 257, 308].map((angle) => (
            <g key={angle} transform={`rotate(${angle} 60 60)`}>
              <path d="M29 86C12 65 23 36 46 25c21-10 48 1 51 25 3 22-15 41-34 42-16 1-34-11-32-28 2-16 23-24 34-14 13 12 1 30-13 25" />
              <path d="m46 25-5-11m7 12 11-12M26 43l-13-3m15 9-12 8m17 23-9 14m61-62 10-10m0 31 13-6M71 89l4 15M47 60l-5-14m23 7 12-11" />
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}
