import { usePrefs, useT } from '../../lib/prefs';
import type { Letter as LetterContent } from '../../lib/schema';
import { AudioPlayer } from '../media/AudioPlayer';
import { RichText } from './RichText';

/** The imagined letter, always labeled and visually separate from the facts (spec 3.3). */
export function Letter({ letter, name }: { letter: LetterContent; name: string }) {
  const t = useT();
  const { readingMode } = usePrefs();

  return (
    <article className="letter" aria-labelledby="letter-heading">
      <p className="letter-label">{t('letter.label')}</p>
      <h2 id="letter-heading" className="sr-only">
        {t('letter.heading', { name })}
      </h2>
      {letter.audio && <AudioPlayer audio={letter.audio} />}
      <div className="letter-body">
        <RichText text={letter[readingMode]} />
      </div>
      <p className="letter-note">{t('letter.note')}</p>
    </article>
  );
}
