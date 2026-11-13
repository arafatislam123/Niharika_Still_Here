/** Story narration using the browser's built-in speech synthesis (no audio files needed). */
import { useCallback, useEffect, useState } from 'react';

export const narrationSupported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window;

/**
 * Picks the most human-sounding voice the device offers for a language. Cloud "Natural" /
 * "Neural" voices (e.g. Microsoft Edge's Bengali voices) and Google voices sound far more natural
 * than older system voices, so they are preferred. Returns undefined if there is no voice for
 * the language at all.
 */
export function pickBestVoice(lang: 'en' | 'bn'): SpeechSynthesisVoice | undefined {
  if (!narrationSupported()) return undefined;
  const score = (v: SpeechSynthesisVoice) => {
    const code = v.lang.toLowerCase().replace('_', '-');
    if (!code.startsWith(lang)) return -1;
    let s = 0;
    if (/natural|neural|online/i.test(v.name)) s += 10;
    if (/google/i.test(v.name)) s += 6;
    if (!v.localService) s += 1;
    if (lang === 'bn' && code === 'bn-bd') s += 2;
    if (lang === 'en' && /en-(us|gb)/.test(code)) s += 1;
    if (/samantha|aria|jenny|nabanita|pradeep/i.test(v.name)) s += 2;
    return s;
  };
  return window.speechSynthesis
    .getVoices()
    .map((v) => ({ v, s: score(v) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s)[0]?.v;
}

/** Resolves once the browser has loaded its voice list (Chrome loads it asynchronously). */
export function voicesReady(): Promise<void> {
  if (!narrationSupported() || window.speechSynthesis.getVoices().length) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => resolve();
    window.speechSynthesis.addEventListener('voiceschanged', done, { once: true });
    window.setTimeout(done, 1500);
  });
}

export function useNarration(lang: 'en' | 'bn' = 'en') {
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  const stop = useCallback(() => {
    if (!narrationSupported()) return;
    window.speechSynthesis.cancel();
    setSpeakingIndex(null);
  }, []);

  /** Reads the parts one after another, reporting which part is being spoken. */
  const play = useCallback(
    (parts: string[], startAt = 0) => {
      if (!narrationSupported()) return;
      window.speechSynthesis.cancel();
      const voice = pickBestVoice(lang);
      parts.slice(startAt).forEach((text, offset) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.92;
        utterance.pitch = 1.05;
        utterance.lang = lang === 'bn' ? 'bn-BD' : 'en-US';
        if (voice) utterance.voice = voice;
        const index = startAt + offset;
        utterance.onstart = () => setSpeakingIndex(index);
        utterance.onend = () => {
          if (index === parts.length - 1) setSpeakingIndex(null);
        };
        utterance.onerror = () => setSpeakingIndex(null);
        window.speechSynthesis.speak(utterance);
      });
    },
    [lang],
  );

  // Never keep talking after the page changes.
  useEffect(() => stop, [stop]);

  return { play, stop, speakingIndex, supported: narrationSupported() };
}
