/**
 * Demo warm-up (§9.3): `/?warm=1` fetches every model, narration and teacher file so the service
 * worker caches them. Run it on the demo device after the final deploy, then test in airplane mode.
 */
import { loadMachine, machinesFor, publicUrl } from './content';

export async function warmOfflineCache(
  locale: string,
  onProgress: (done: number, total: number) => void,
): Promise<{ total: number; failed: number }> {
  const urls = new Set<string>();
  for (const entry of machinesFor(locale)) {
    const machine = await loadMachine(locale, entry.id);
    if (machine.model) {
      urls.add(machine.model.glb);
      urls.add(machine.model.poster);
      urls.add(machine.model.fallbackImage);
    }
    if (machine.letter.audio) {
      urls.add(machine.letter.audio.src);
      urls.add(machine.letter.audio.captions);
    }
    if (machine.teacherSheet) urls.add(machine.teacherSheet);
  }

  let done = 0;
  let failed = 0;
  await Promise.all(
    [...urls].map(async (url) => {
      try {
        const response = await fetch(publicUrl(url));
        if (!response.ok) failed++;
        await response.arrayBuffer();
      } catch {
        failed++;
      } finally {
        onProgress(++done, urls.size);
      }
    }),
  );
  return { total: urls.size, failed };
}
