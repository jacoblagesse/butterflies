import { useEffect } from 'react';

const audioModules = import.meta.glob('/src/assets/audio/*.mp3', { eager: true });
const TRACKS = Object.values(audioModules).map((m) => m.default ?? m);

function pickRandom(exclude) {
  if (TRACKS.length === 0) return null;
  if (TRACKS.length === 1) return TRACKS[0];
  const pool = exclude ? TRACKS.filter((t) => t !== exclude) : TRACKS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function useBackgroundAudio({ volume = 0.4 } = {}) {
  useEffect(() => {
    if (TRACKS.length === 0) return undefined;

    const audio = new Audio();
    audio.volume = volume;
    audio.preload = 'auto';

    let currentTrack = null;
    let removeGestureListeners = null;

    const tryPlay = () => {
      const result = audio.play();
      if (result && typeof result.catch === 'function') {
        result.catch(() => {
          // Autoplay blocked — wait for first user gesture, then retry.
          const onGesture = () => {
            audio.play().catch(() => {});
          };
          document.addEventListener('pointerdown', onGesture, { once: true });
          document.addEventListener('keydown', onGesture, { once: true });
          removeGestureListeners = () => {
            document.removeEventListener('pointerdown', onGesture);
            document.removeEventListener('keydown', onGesture);
          };
        });
      }
    };

    const playRandom = () => {
      currentTrack = pickRandom(currentTrack);
      if (!currentTrack) return;
      audio.src = currentTrack;
      tryPlay();
    };

    audio.addEventListener('ended', playRandom);
    playRandom();

    return () => {
      audio.pause();
      audio.removeEventListener('ended', playRandom);
      audio.src = '';
      if (removeGestureListeners) removeGestureListeners();
    };
  }, [volume]);
}
