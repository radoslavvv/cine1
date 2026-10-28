import { tumbleweedTheme as theme } from './Tumbleweed.theme';

export function Tumbleweed({ animated }: { animated: boolean }) {
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
