import { useEffect, useState } from 'react';

/**
 * Shared playhead for the split screen. Both clips start together and the
 * playhead loops at the length of the longer one, so the shorter clip holds
 * its last frame until the loop restarts.
 *
 * For clips with real video, expo-video plays on its own clock. This playhead
 * only drives the timer chips and the placeholder dancers, and is replaced by
 * the player's own time when the backend and real clips are connected.
 */
export function usePlayhead(maxSec: number, playing: boolean, resetKey: string): number {
  const [t, setT] = useState(0);

  useEffect(() => {
    setT(0);
  }, [resetKey, maxSec]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setT((prev) => (prev + 0.25 >= maxSec ? 0 : prev + 0.25));
    }, 250);
    return () => clearInterval(id);
  }, [playing, maxSec]);

  return t;
}
