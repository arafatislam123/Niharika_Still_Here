/** Story narration using the browser's built-in speech synthesis (no audio files needed). */
import { useCallback, useEffect, useState } from 'react';

export const narrationSupported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window;

function pickVoice(lang: 'en' | 'bn'): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  if (lang === 'bn') return voices.find((v) => v.lang.toLowerCase().startsWith('bn'));
  return (
    voices.find((v) => v.lang.startsWith('en') && /natural|google|samantha/i.test(v.name)) ??
    voices.find((v) => v.lang.startsWith('en'))
  );
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
      const voice = pickVoice(lang);
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
