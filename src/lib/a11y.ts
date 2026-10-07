import { useEffect, useState, type RefObject } from 'react';

const APP_NAME = 'STILL HERE';

export function useTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
  }, [title]);
}

/** True once the element has scrolled into view. Always true under reduced motion. */
export function useRevealOnScroll(ref: RefObject<HTMLElement>, reducedMotion: boolean): boolean {
  const [visible, setVisible] = useState(reducedMotion);

  useEffect(() => {
    const el = ref.current;
    if (reducedMotion || !el || !('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, reducedMotion]);

  return visible;
}

export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (ch) => HTML_ENTITIES[ch] ?? ch);
