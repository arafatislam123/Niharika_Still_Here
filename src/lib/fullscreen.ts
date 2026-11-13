/**
 * Full screen for one element. Browsers only allow it right after a click/tap, so call
 * `enter()` from an event handler. Where the Fullscreen API is missing or refused (e.g. iPhone
 * Safari), the element instead fills the window ("fake" mode). Esc leaves either mode.
 */
import { useCallback, useEffect, useState, type RefObject } from 'react';

export type FullscreenMode = 'none' | 'native' | 'fake';

export function useFullscreen(ref: RefObject<HTMLElement>) {
  const [mode, setMode] = useState<FullscreenMode>('none');

  const enter = useCallback(() => {
    const el = ref.current;
    if (el?.requestFullscreen) {
      el.requestFullscreen()
        .then(() => setMode('native'))
        .catch(() => setMode('fake'));
    } else {
      setMode('fake');
    }
  }, [ref]);

  const exit = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    setMode('none');
  }, []);

  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setMode((m) => (m === 'native' ? 'none' : m));
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMode((m) => (m === 'fake' ? 'none' : m));
    };
    document.addEventListener('fullscreenchange', onChange);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mode === 'fake' ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mode]);

  // Leave full screen if the component goes away (e.g. navigating to another page).
  useEffect(
    () => () => {
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    },
    [],
  );

  return { mode, enter, exit, active: mode !== 'none' };
}
