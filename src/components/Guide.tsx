/**
 * Orbi, the friendly robot guide, and the speech-bubble tip it gives on each page.
 * Drawn as inline SVG (no image files) so it stays sharp and works offline.
 */
import type { ReactNode } from 'react';
import { useLang } from '../i18n';

export function Orbi({
  className = 'h-20 w-20',
  wave = false,
}: {
  className?: string;
  wave?: boolean;
}) {
  return (
    <svg viewBox="0 0 120 120" className={`${className} orbi-float`} aria-hidden>
      {/* antenna */}
      <line x1="60" y1="22" x2="60" y2="8" stroke="#ffc94d" strokeWidth="4" strokeLinecap="round" />
      <circle cx="60" cy="7" r="6" fill="#ff7a45" className="orbi-blink" />
      {/* arms */}
      <path
        d="M24 72 Q10 68 12 54"
        stroke="#8fa8ff"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={wave ? 'M96 70 Q112 60 108 40' : 'M96 72 Q110 68 108 54'}
        stroke="#8fa8ff"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
        className={wave ? 'orbi-wave' : undefined}
      />
      {/* body */}
      <rect
        x="26"
        y="62"
        width="68"
        height="46"
        rx="18"
        fill="#1a2142"
        stroke="#8fa8ff"
        strokeWidth="4"
      />
      <circle cx="60" cy="85" r="8" fill="#ffc94d" />
      {/* head (helmet) */}
      <circle cx="60" cy="44" r="26" fill="#f2f4ff" />
      <rect x="40" y="32" width="40" height="26" rx="13" fill="#070a17" />
      <circle cx="51" cy="45" r="5" fill="#7df9ff" />
      <circle cx="69" cy="45" r="5" fill="#7df9ff" />
      <path
        d="M52 53 Q60 58 68 53"
        stroke="#7df9ff"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A speech bubble from Orbi. Used under page titles to tell children what to do. */
export function GuideTip({ children, big = false }: { children: ReactNode; big?: boolean }) {
  const { t } = useLang();
  return (
    <div className="flex items-end gap-3">
      <Orbi
        className={big ? 'h-24 w-24 shrink-0 md:h-32 md:w-32' : 'h-16 w-16 shrink-0'}
        wave={big}
      />
      <div className="speech relative rounded-3xl rounded-bl-md border-2 border-deep/60 bg-raised px-4 py-3 shadow-lg shadow-black/30">
        <p className="text-xs font-extrabold uppercase tracking-wider text-deep">
          🤖 {t('guide.says')}
        </p>
        <p className={big ? 'mt-1 text-lg md:text-xl' : 'mt-1'}>{children}</p>
      </div>
    </div>
  );
}
