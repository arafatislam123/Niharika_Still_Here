import { useState } from 'react';
import { publicUrl } from '../../lib/content';
import { usePrefs, useT } from '../../lib/prefs';
import type { Letter } from '../../lib/schema';

/**
 * Narration (FR-AUD). Never autoplays; preload="none" keeps it lazy. The on-screen letter is the
 * transcript, so if the audio fails the player simply disappears.
 */
export function AudioPlayer({ audio }: { audio: NonNullable<Letter['audio']> }) {
  const t = useT();
  const { locale } = usePrefs();
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <figure className="audio-player">
      <figcaption className="text-sm muted">{t('audio.label')}</figcaption>
      <audio
        controls
        preload="none"
        src={publicUrl(audio.src)}
        onError={() => setFailed(true)}
        className="w-full"
      >
        <track
          kind="captions"
          src={publicUrl(audio.captions)}
          srcLang={locale}
          label={t('audio.captions')}
          default
        />
      </audio>
    </figure>
  );
}
