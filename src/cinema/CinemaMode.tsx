/**
 * Cinema mode: the explorer's story as a full-screen animated film. Each chapter plays its own
 * Three.js scene (src/cinema/films.ts lists them) under subtitles, with optional narration. When
 * narration is on, a chapter waits for the voice to finish before moving on.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Artifact } from '../data/types';
import { useLang } from '../i18n';
import { narrationSupported, pickBestVoice, voicesReady } from '../lib/narration';
import { narrationUrl, RECORDED_NARRATION } from './available';
import { buildSimpleRover, faceRoverForward, loadNasaModel } from '../three/marsScene';
import { disposeTree, prefersReducedMotion } from '../three/textures';
import { FILMS, type Caption } from './films';
import type { CinemaScene } from './scenes';

const MIN_SECONDS = 12;
const MAX_SECONDS = 24;
const chapterSeconds = (text: string) =>
  Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, text.length * 0.065));

/** The caption for chapter progress p: the last caption whose `at` has been reached. */
function useCaption() {
  const { t, n, lang } = useLang();
  return (captions: Caption[], p: number): string | null => {
    const current = [...captions].reverse().find((c) => p >= c.at);
    if (!current) return null;
    if ('special' in current) {
      // Opportunity's long drive: years and kilometres counting up to the real totals.
      const year = Math.min(2018, 2004 + Math.floor(p * 15));
      const km = p >= 0.995 ? n(45.16, 2) : n(p * 45.16, 1);
      return `${t('cinema.opp.year', { year: n(year).replace(/,/g, '') })} · ${t('cinema.opp.km', { km })}`;
    }
    return lang === 'bn' ? current.bn : current.en;
  };
}

/** Stand-in Pioneer 10 if the NASA model cannot load: a dish antenna on a small body. */
function buildSimplePioneer(): THREE.Object3D {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xdfe3ea, metalness: 0.6, roughness: 0.3 });
  const dish = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.5, 32, 1, true), mat);
  dish.rotation.x = -Math.PI / 2;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.4, 6), mat);
  body.position.z = -0.4;
  body.rotation.x = Math.PI / 2;
  g.add(dish, body);
  return g;
}

export default function CinemaMode({
  artifact,
  onClose,
}: {
  artifact: Artifact;
  onClose: () => void;
}) {
  const { t, lang } = useLang();
  const config = FILMS[artifact.id];
  const chapters = artifact.chapters;
  const caption = useCaption();

  const rootRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const [loading, setLoading] = useState(true);
  const [chapter, setChapter] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [sound, setSound] = useState(
    narrationSupported() || (RECORDED_NARRATION[artifact.id] ?? []).length > 0,
  );
  const [ended, setEnded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);

  // Mirror of the player state for the animation loop (which lives outside React renders).
  const ctl = useRef({
    chapter: 0,
    playing: true,
    ended: false,
    elapsed: 0,
    speaking: false,
    sound,
  });
  ctl.current.sound = sound;

  const goTo = useCallback(
    (index: number) => {
      if (index < 0) return;
      if (index >= chapters.length) {
        ctl.current.ended = true;
        setEnded(true);
        return;
      }
      ctl.current.chapter = index;
      ctl.current.elapsed = 0;
      ctl.current.ended = false;
      setEnded(false);
      setChapter(index);
      setProgress(0);
      setFading(true);
      window.setTimeout(() => setFading(false), 450);
    },
    [chapters.length],
  );

  // Human recordings for this language, if the team has added them.
  const recorded = (RECORDED_NARRATION[artifact.id] ?? []).includes(lang);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [voiceKind, setVoiceKind] = useState<'human' | 'device' | 'none'>(
    recorded ? 'human' : 'device',
  );

  const togglePlay = useCallback(() => {
    const next = !ctl.current.playing;
    ctl.current.playing = next;
    setPlaying(next);
    const audio = audioRef.current;
    if (audio) {
      if (next) void audio.play().catch(() => {});
      else audio.pause();
    } else if (narrationSupported()) {
      if (next) window.speechSynthesis.resume();
      else window.speechSynthesis.pause();
    }
  }, []);

  // ---- narration: a human recording if we have one, otherwise the best device voice ----
  useEffect(() => {
    ctl.current.speaking = false;
    if (!sound || ended || loading) return;

    if (recorded) {
      const audio = new Audio(narrationUrl(artifact.id, lang, chapter));
      audioRef.current = audio;
      audio.onplaying = () => (ctl.current.speaking = true);
      audio.onended = () => (ctl.current.speaking = false);
      audio.onerror = () => (ctl.current.speaking = false);
      if (ctl.current.playing) void audio.play().catch(() => (ctl.current.speaking = false));
      return () => {
        audio.pause();
        audioRef.current = null;
      };
    }

    if (!narrationSupported()) return;
    const synth = window.speechSynthesis;
    let cancelled = false;
    synth.cancel();
    void voicesReady().then(() => {
      if (cancelled) return;
      const voice = pickBestVoice(lang);
      // No Bengali voice on this device: stay silent rather than read Bengali with an English voice.
      setVoiceKind(voice ? 'device' : 'none');
      if (!voice) return;
      const c = chapters[chapter];
      const u = new SpeechSynthesisUtterance(`${c.title.replace(/^[^:]+:\s*/, '')}. ${c.text}`);
      u.lang = voice.lang;
      u.voice = voice;
      u.rate = 0.95;
      u.onstart = () => (ctl.current.speaking = true);
      u.onend = u.onerror = () => (ctl.current.speaking = false);
      synth.speak(u);
      if (!ctl.current.playing) synth.pause();
    });
    return () => {
      cancelled = true;
      synth.cancel();
    };
  }, [chapter, sound, ended, loading, lang, chapters, recorded, artifact.id]);

  // ---- three.js: renderer, scenes and the animation loop ------------------------------
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !config) return;
    let disposed = false;
    let frame = 0;
    const scenes: CinemaScene[] = [];
    const reduced = prefersReducedMotion();

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.setAttribute('aria-hidden', 'true');
    mount.appendChild(renderer.domElement);
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      camera.aspect = w / h;
      camera.fov = w < h ? 68 : 50; // wider view on portrait phones
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    // Load only the NASA models this film uses; fall back to simple stand-ins on failure.
    const needs = (m: 'rover' | 'pioneer') => config.models.includes(m);
    Promise.all([
      needs('rover')
        ? loadNasaModel('models/mars-exploration-rover.glb', 2.6)
            .then((model) => faceRoverForward(model.clone()))
            .catch(() => buildSimpleRover())
        : Promise.resolve(buildSimpleRover()),
      needs('pioneer')
        ? loadNasaModel('models/pioneer-10.glb', 3.2).catch(() => buildSimplePioneer())
        : Promise.resolve(buildSimplePioneer()),
    ]).then(([rover, pioneer]) => {
      if (disposed) return;
      for (const chapter of config.chapters) scenes.push(chapter.build({ rover, pioneer }));
      setLoading(false);

      const timer = new THREE.Timer();
      let uiTick = 0;
      let held = 0;
      const loop = (ts: number) => {
        frame = requestAnimationFrame(loop);
        timer.update(ts);
        const dt = Math.min(timer.getDelta(), 0.05);
        const c = ctl.current;
        const duration = chapterSeconds(chapters[c.chapter].text);

        if (c.playing && !c.ended) {
          c.elapsed += dt;
          if (c.elapsed >= duration) {
            // With narration on, wait for the voice to finish (up to 30 extra seconds).
            held += dt;
            if (!(c.sound && c.speaking) || held > 30) {
              held = 0;
              goTo(c.chapter + 1);
            }
          }
        }
        const p = Math.min(1, c.elapsed / duration);
        const scene = scenes[c.chapter];
        scene.update(reduced ? 0.85 : p, camera, timer.getElapsed());
        renderer.render(scene.scene, camera);

        uiTick += dt;
        if (uiTick > 0.1) {
          uiTick = 0;
          setProgress(p);
        }
      };
      frame = requestAnimationFrame(loop);
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      for (const s of scenes) disposeTree(s.scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
    // Scenes are built once per opening; language changes only affect the text layer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  // ---- full screen, keyboard, focus and scroll lock -------------------------------------
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    document.body.style.overflow = 'hidden';
    rootRef.current?.requestFullscreen?.().catch(() => {
      /* not allowed or not supported (e.g. iPhone): the fixed overlay still fills the screen */
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === ' ' && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowRight') goTo(ctl.current.chapter + 1);
      else if (e.key === 'ArrowLeft') goTo(ctl.current.chapter - 1);
    };
    const onFullscreenExit = () => {
      // Leaving browser full screen (e.g. with Esc) also closes the film.
      if (!document.fullscreenElement) onClose();
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFullscreenExit);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFullscreenExit);
      document.body.style.overflow = '';
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      if (narrationSupported()) window.speechSynthesis.cancel();
      audioRef.current?.pause();
      previous?.focus();
    };
  }, [onClose, togglePlay, goTo]);

  if (!config) return null;
  const c = chapters[chapter];
  const cap =
    !loading && !ended ? caption(config.chapters[chapter]?.captions ?? [], progress) : null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] bg-black text-white"
      role="dialog"
      aria-modal="true"
      aria-label={t('cinema.dialog', { name: artifact.shortName })}
    >
      <div ref={mountRef} className="absolute inset-0" />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-black transition-opacity duration-500 ${fading || loading ? 'opacity-100' : 'opacity-0'}`}
      />

      {loading && (
        <p className="absolute inset-0 flex items-center justify-center text-lg" role="status">
          {t('cinema.loading')}
        </p>
      )}

      {/* top bar: chapter progress, caption, close */}
      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent p-3 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-white/70">{artifact.name}</p>
            <p className="font-display text-lg font-bold md:text-2xl">{c.title}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/25"
          >
            {t('cinema.close')}
          </button>
        </div>
        <div className="mt-3 flex gap-1.5" aria-hidden>
          {chapters.map((_, i) => (
            <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full bg-accent"
                style={{
                  width: `${i < chapter || ended ? 100 : i === chapter ? progress * 100 : 0}%`,
                }}
              />
            </div>
          ))}
        </div>
        {cap && (
          <p className="mt-3 inline-block rounded-full bg-black/55 px-4 py-1.5 text-sm font-semibold text-accent md:text-base">
            {cap}
          </p>
        )}
      </div>

      {/* subtitles + controls */}
      {!ended && !loading && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/60 to-transparent px-4 pb-4 pt-16 md:px-10 md:pb-6">
          <p
            className="mx-auto max-w-4xl text-center text-lg leading-relaxed md:text-2xl"
            aria-live="polite"
          >
            “{c.text}”
          </p>
          <div className="mx-auto mt-4 flex max-w-4xl flex-wrap items-center justify-center gap-2 text-sm">
            <button
              type="button"
              className="rounded-full bg-white/15 px-4 py-2 hover:bg-white/25 disabled:opacity-40"
              onClick={() => goTo(chapter - 1)}
              disabled={chapter === 0}
            >
              {t('cinema.prev')}
            </button>
            <button
              type="button"
              className="rounded-full bg-accent px-5 py-2 font-bold text-space"
              onClick={togglePlay}
            >
              {playing ? t('cinema.pause') : t('cinema.play')}
            </button>
            <button
              type="button"
              className="rounded-full bg-white/15 px-4 py-2 hover:bg-white/25"
              onClick={() => goTo(chapter + 1)}
            >
              {t('cinema.next')}
            </button>
            {(narrationSupported() || recorded) && (
              <button
                type="button"
                className="rounded-full bg-white/15 px-4 py-2 hover:bg-white/25"
                aria-pressed={sound}
                onClick={() => setSound((s) => !s)}
              >
                {sound ? t('cinema.soundOn') : t('cinema.soundOff')}
              </button>
            )}
          </div>
          {/* Only shown when Bengali narration can't play, so silence is explained. */}
          {sound && voiceKind === 'none' && (
            <p className="mt-2 text-center text-xs text-white/70">{t('cinema.voiceNone')}</p>
          )}
        </div>
      )}

      {ended && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/75 p-6 text-center">
          <p className="font-display text-5xl font-bold text-accent">{t('cinema.end')}</p>
          <p className="max-w-xl text-xl">{t('cinema.endText')}</p>
          <p className="text-sm text-white/60">
            {artifact.name} · {artifact.missionPeriod}
          </p>
          <div className="mt-2 flex gap-2">
            <button type="button" className="btn-primary" onClick={() => goTo(0)}>
              {t('cinema.replay')}
            </button>
            <button
              type="button"
              className="rounded-full bg-white/15 px-5 py-2.5 font-semibold hover:bg-white/25"
              onClick={onClose}
            >
              {t('cinema.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
