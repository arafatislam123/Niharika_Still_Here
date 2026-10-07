import { useEffect, useRef, useState } from 'react';
import { hasWebGL } from '../../lib/a11y';
import { publicUrl } from '../../lib/content';
import { loadModelViewer } from '../../lib/modelViewer';
import { useT } from '../../lib/prefs';
import type { Model } from '../../lib/schema';
import { HotspotImage } from '../common/HotspotImage';

type Phase = 'closed' | 'loading' | 'ready' | 'fallback';
const MODEL_TIMEOUT_MS = 20_000;

/** "Look closer" (FR-3D, §8.3). Loads model-viewer only on click; falls back to a static image. */
export function ModelViewerPanel({ model }: { model: Model }) {
  const t = useT();
  const [phase, setPhase] = useState<Phase>('closed');
  const [active, setActive] = useState<string | null>(null);
  const viewerRef = useRef<HTMLElement>(null);

  async function open() {
    if (!hasWebGL()) return setPhase('fallback');
    setPhase('loading');
    try {
      await loadModelViewer();
      setPhase('ready');
    } catch {
      setPhase('fallback');
    }
  }

  useEffect(() => {
    const el = viewerRef.current;
    if (phase !== 'ready' || !el) return;
    const timer = window.setTimeout(() => setPhase('fallback'), MODEL_TIMEOUT_MS);
    const onLoad = () => window.clearTimeout(timer);
    const onError = () => {
      window.clearTimeout(timer);
      setPhase('fallback');
    };
    el.addEventListener('load', onLoad);
    el.addEventListener('error', onError);
    return () => {
      window.clearTimeout(timer);
      el.removeEventListener('load', onLoad);
      el.removeEventListener('error', onError);
    };
  }, [phase]);

  const current = model.hotspots.find((h) => h.id === active);

  return (
    <section className="card" aria-labelledby="look-heading">
      <h2 id="look-heading">{t('model.heading')}</h2>

      {phase === 'closed' && (
        <button type="button" className="btn btn-primary" onClick={open}>
          {t('model.open')}
        </button>
      )}

      {phase === 'loading' && (
        <div className="skeleton aspect-square w-full" aria-busy="true">
          <span className="sr-only">{t('common.loading')}</span>
        </div>
      )}

      {phase === 'ready' && (
        <>
          <model-viewer
            ref={viewerRef}
            src={publicUrl(model.glb)}
            poster={publicUrl(model.poster)}
            alt={model.alt}
            camera-controls=""
            touch-action="pan-y"
            ar=""
            ar-modes="webxr scene-viewer quick-look"
            class="model-viewer"
          >
            {model.hotspots.map((hotspot) => (
              <button
                key={hotspot.id}
                type="button"
                slot={`hotspot-${hotspot.id}`}
                data-position={hotspot.position}
                data-normal={hotspot.normal}
                className="hotspot-3d"
                aria-pressed={active === hotspot.id}
                onClick={() => setActive(hotspot.id)}
              >
                {hotspot.label}
              </button>
            ))}
          </model-viewer>
          <p className="credit">{t('common.credit', { credit: model.credit })}</p>
          <p aria-live="polite" className="hotspot-text">
            {current && (
              <>
                <strong>{current.label}</strong> {current.text}
              </>
            )}
          </p>
        </>
      )}

      {phase === 'fallback' && (
        <>
          <p role="status" className="muted">
            {t('model.fallback')}
          </p>
          <HotspotImage
            src={model.fallbackImage}
            alt={model.alt}
            credit={model.credit}
            hotspots={model.hotspots}
          />
        </>
      )}

      {(phase === 'ready' || phase === 'fallback') && (
        <details className="mt-4">
          <summary>{t('model.allParts')}</summary>
          <dl className="mt-2 space-y-2">
            {model.hotspots.map((hotspot) => (
              <div key={hotspot.id}>
                <dt className="font-semibold">{hotspot.label}</dt>
                <dd>{hotspot.text}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </section>
  );
}
