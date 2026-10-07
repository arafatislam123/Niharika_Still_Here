import { usePrefs, useT, type ReadingMode } from '../../lib/prefs';

const MODES: ReadingMode[] = ['quick', 'deep'];

/** "Quick read / Go deeper" (FR-LND-4), kept in sessionStorage for the session. */
export function ReadingToggle() {
  const t = useT();
  const { readingMode, setReadingMode } = usePrefs();
  return (
    <div role="group" aria-label={t('reading.label')} className="segmented">
      {MODES.map((mode) => (
        <button
          key={mode}
          type="button"
          aria-pressed={readingMode === mode}
          onClick={() => setReadingMode(mode)}
        >
          {t(`reading.${mode}`)}
        </button>
      ))}
    </div>
  );
}
