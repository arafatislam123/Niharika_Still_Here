import { useT } from '../../lib/prefs';
import type { Status, Tag } from '../../lib/schema';
import { statusIconPaths } from '../../lib/statusIcons';

export function StatusIcon({ status, size = 20 }: { status: Status; size?: number }) {
  return (
    <svg
      className={`status-icon status-${status}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: statusIconPaths(status) }}
    />
  );
}

/** Icon + text label, never color alone (NFR-A11Y-4). Tags render as secondary chips (§5.4). */
export function StatusBadge({ status, tags = [] }: { status: Status; tags?: Tag[] }) {
  const t = useT();
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className={`badge badge-${status}`}>
        <StatusIcon status={status} size={18} />
        {t(`status.${status}`)}
      </span>
      {tags.map((tag) => (
        <span key={tag} className="tag-chip">
          {t(`tag.${tag}`)}
        </span>
      ))}
    </span>
  );
}
