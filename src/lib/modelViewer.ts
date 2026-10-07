import { publicUrl } from './content';

let ready: Promise<void> | null = null;

/**
 * Loads <model-viewer> on demand (FR-3D-1) and points it at the self-hosted meshopt decoder
 * before any element exists, so it never fetches from a third-party CDN (§8.3).
 */
export function loadModelViewer(): Promise<void> {
  ready ??= import('@google/model-viewer')
    .then(({ ModelViewerElement }) => {
      (ModelViewerElement as unknown as { meshoptDecoderLocation: string }).meshoptDecoderLocation =
        publicUrl('decoders/meshopt/meshopt_decoder.js');
    })
    .catch((error: unknown) => {
      ready = null;
      throw error;
    });
  return ready;
}
