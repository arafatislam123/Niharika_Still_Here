import type { ReactNode } from 'react';
import { useT } from '../../lib/prefs';

/** Every external link opens in a new tab, safely, and says so to screen readers. */
export function ExternalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const t = useT();
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className ?? 'link'}>
      {children}
      <span className="sr-only">{t('common.newTab')}</span>
    </a>
  );
}
