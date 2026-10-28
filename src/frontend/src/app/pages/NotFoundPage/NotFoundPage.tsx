import { Link } from 'react-router-dom';
import { Wordmark } from '../../../shared/components/Wordmark/Wordmark';
import { notFoundPageTheme as theme } from './NotFoundPage.theme';
import { Tumbleweed } from '../../components/Tumbleweed/Tumbleweed';

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
