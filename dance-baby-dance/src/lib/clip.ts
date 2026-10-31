/** Every dance clip must run from 30 seconds to 1 minute. */
export const MIN_CLIP_SEC = 30;
export const MAX_CLIP_SEC = 60;

export function formatTime(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${m}:${rest < 10 ? '0' : ''}${rest}`;
}

export type ClipCheck = { ok: boolean; message: string };

export function checkClipLength(durationSec: number): ClipCheck {
  if (durationSec < MIN_CLIP_SEC) {
    return {
      ok: false,
      message: `This clip is ${formatTime(durationSec)}. Dances need at least ${formatTime(MIN_CLIP_SEC)}.`,
    };
  }
  if (durationSec > MAX_CLIP_SEC) {
    return {
      ok: false,
      message: `This clip is ${formatTime(durationSec)}. Trim it to ${formatTime(MAX_CLIP_SEC)} or less.`,
    };
  }
  return { ok: true, message: `Length ${formatTime(durationSec)} is within 0:30 to 1:00.` };
}

export function formatCount(n: number): string {
  return n >= 1000 ? `${Math.round(n / 100) / 10}k` : String(n);
}
