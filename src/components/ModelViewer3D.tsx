/**
 * Real NASA 3D model with augmented reality, using Google's <model-viewer>.
 * AR: WebXR / Scene Viewer on Android, Quick Look on iPhone/iPad (USDZ is generated on the fly).
 * The NASA models are Draco-compressed; the decoder is served from our own site (public/draco).
 */
import { useEffect, useState } from 'react';
import { useLang } from '../i18n';

declare global {
  interface Window {
    ModelViewerElement?: { dracoDecoderLocation?: string };
  }
}

let loader: Promise<unknown> | null = null;
function loadModelViewer() {
  if (!loader) {
    // Must be set before <model-viewer> is defined.
    window.ModelViewerElement = {
      ...window.ModelViewerElement,
      dracoDecoderLocation: new URL(`${import.meta.env.BASE_URL}draco/`, window.location.href).href,
    };
    loader = import('@google/model-viewer');
  }
  return loader;
}

export default function ModelViewer3D({
  src,
  name,
  note,
}: {
  src: string;
  name: string;
  note: string;
}) {
  const { t } = useLang();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    loadModelViewer().then(
      () => setReady(true),
      () => setFailed(true),
    );
  }, []);

  const url = `${import.meta.env.BASE_URL}${src}`;

  return (
    <div>
      <div className="relative h-[380px] overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-raised to-space">
        {ready ? (
          <model-viewer
            src={url}
            alt={t('ar.alt', { name })}
            camera-controls=""
            auto-rotate=""
            touch-action="pan-y"
            shadow-intensity="1"
            exposure="1.1"
            ar=""
            ar-modes="webxr scene-viewer quick-look"
            ar-scale="auto"
            style={{ width: '100%', height: '100%', background: 'transparent' }}
          >
            <button
              slot="ar-button"
              type="button"
              className="btn-primary absolute bottom-3 left-1/2 -translate-x-1/2"
            >
              {t('ar.button')}
            </button>
            <div slot="progress-bar" />
          </model-viewer>
        ) : (
          <p className="flex h-full items-center justify-center text-muted" role="status">
            {failed ? t('gallery.error') : t('ar.loading')}
          </p>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">
        {note} · {t('ar.credit')}
      </p>
    </div>
  );
}
