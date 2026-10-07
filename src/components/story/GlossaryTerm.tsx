import { useId, useState } from 'react';
import { glossaryFor } from '../../lib/i18n';
import { usePrefs } from '../../lib/prefs';

/** Tap-to-define word (glossary.json). Unknown slugs render as plain text. */
export function GlossaryTerm({ slug, display }: { slug: string; display?: string }) {
  const { locale } = usePrefs();
  const [open, setOpen] = useState(false);
  const id = useId();
  const entry = glossaryFor(locale)[slug];
  const label = display ?? entry?.term ?? slug;

  if (!entry) return <>{label}</>;

  return (
    <span className="glossary">
      <button
        type="button"
        className="glossary-term"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => event.key === 'Escape' && setOpen(false)}
      >
        {label}
      </button>
      {open && (
        <span id={id} role="note" className="glossary-pop">
          <strong>{entry.term}</strong> {entry.definition}
        </span>
      )}
    </span>
  );
}
