/** Real Apollo 11 recordings from NASA's audio collection, each with a visible transcript. */
import { useLang } from '../i18n';
import { SourceLink } from './ui';

const CLIPS = [
  { file: 'audio/eagle-has-landed.mp3', title: 'audio.eagle', text: 'audio.eagleText' },
  { file: 'audio/one-small-step.mp3', title: 'audio.step', text: 'audio.stepText' },
] as const;

export default function AudioClips() {
  const { t } = useLang();
  return (
    <section className="card" aria-labelledby="audio-title">
      <h2 id="audio-title" className="font-display text-xl font-bold">
        {t('audio.title')}
      </h2>
      <p className="mt-1 text-sm text-muted">{t('audio.lead')}</p>
      <ul className="mt-4 grid gap-4">
        {CLIPS.map((c) => (
          <li key={c.file} className="rounded-xl bg-raised/60 p-3">
            <p className="font-bold">{t(c.title)}</p>
            {/* Never autoplays; the transcript is always visible. */}
            <audio
              controls
              preload="none"
              className="mt-2 w-full"
              src={`${import.meta.env.BASE_URL}${c.file}`}
            />

            <p className="mt-2 text-sm">
              <span className="font-semibold text-accent">{t('audio.transcript')}: </span>
              {t(c.text)}
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <SourceLink sourceId="src-nasa-audio" compact />
      </div>
    </section>
  );
}
