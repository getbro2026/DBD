import React, { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { formatTime, MAX_CLIP_SEC, MIN_CLIP_SEC } from '../lib/clip';
import { colors, radius } from '../theme';
import { Dancer } from './Dancer';

type Props = {
  /** Set when accepting a challenge. Shows the reference clip and a ghost outline. */
  challenge?: { tag: string };
  onRecorded: (clip: { uri: string; durationSec: number }) => void;
  onCancel: () => void;
};

/** Small allowance so the measured clip never lands just under the minimum. */
const STOP_ALLOWED_AFTER = MIN_CLIP_SEC + 0.5;

export function RecorderStep({ challenge, onRecorded, onCancel }: Props) {
  const [camPerm, askCam] = useCameraPermissions();
  const [micPerm, askMic] = useMicrophonePermissions();
  const camRef = useRef<CameraView>(null);

  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'count' | 'rec'>('idle');
  const [count, setCount] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [hint, setHint] = useState('');

  const startedAt = useRef(0);
  const discard = useRef(false);
  const countTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (countTimer.current) clearInterval(countTimer.current);
    if (tickTimer.current) clearInterval(tickTimer.current);
    countTimer.current = null;
    tickTimer.current = null;
  };

  // Leaving the screen mid-recording: stop the camera and throw the clip away.
  useEffect(
    () => () => {
      discard.current = true;
      clearTimers();
      camRef.current?.stopRecording();
    },
    [],
  );

  const beginRecording = () => {
    setPhase('rec');
    setHint('');
    discard.current = false;
    startedAt.current = Date.now();
    tickTimer.current = setInterval(() => {
      setElapsed((Date.now() - startedAt.current) / 1000);
    }, 250);

    camRef.current
      ?.recordAsync({ maxDuration: MAX_CLIP_SEC })
      .then((video) => {
        clearTimers();
        const seconds = Math.min((Date.now() - startedAt.current) / 1000, MAX_CLIP_SEC);
        setPhase('idle');
        setElapsed(0);
        if (!discard.current && video?.uri) onRecorded({ uri: video.uri, durationSec: seconds });
      })
      .catch(() => {
        clearTimers();
        setPhase('idle');
        setElapsed(0);
        setHint('Recording failed. Try again.');
      });
  };

  const start = () => {
    if (!ready) {
      setHint('The camera is still starting.');
      return;
    }
    setPhase('count');
    setCount(3);
    let n = 3;
    countTimer.current = setInterval(() => {
      n -= 1;
      if (n > 0) {
        setCount(n);
        return;
      }
      if (countTimer.current) clearInterval(countTimer.current);
      countTimer.current = null;
      beginRecording();
    }, 800);
  };

  const stop = () => {
    if (elapsed < STOP_ALLOWED_AFTER) {
      setHint(`Keep dancing until ${formatTime(MIN_CLIP_SEC)}.`);
      return;
    }
    camRef.current?.stopRecording();
  };

  const cancel = () => {
    if (phase === 'idle') {
      onCancel();
      return;
    }
    // Cancel during the countdown or recording returns to the ready state.
    discard.current = true;
    clearTimers();
    if (phase === 'rec') camRef.current?.stopRecording();
    setPhase('idle');
    setElapsed(0);
    setHint('');
  };

  const askAccess = async () => {
    // Ask one at a time. Android drops the second dialog when both open at once.
    const cam = camPerm?.granted ? camPerm : await askCam();
    if (!cam.granted && !cam.canAskAgain) {
      Linking.openSettings();
      return;
    }
    const mic = micPerm?.granted ? micPerm : await askMic();
    if (!mic.granted && !mic.canAskAgain) Linking.openSettings();
  };

  if (!camPerm || !micPerm) return <View style={styles.root} />;

  if (!camPerm.granted || !micPerm.granted) {
    const blocked = (!camPerm.granted && !camPerm.canAskAgain) || (!micPerm.granted && !micPerm.canAskAgain);
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.title}>Camera and microphone</Text>
        <Text style={styles.body}>
          {blocked
            ? 'Access was turned off. Open Settings and allow the camera and microphone for this app.'
            : 'Allow both so you can record your dance with sound.'}
        </Text>
        <Pressable style={styles.cta} onPress={askAccess} accessibilityRole="button">
          <Text style={styles.ctaText}>{blocked ? 'Open Settings' : 'Allow access'}</Text>
        </Pressable>
        <Pressable style={styles.ghost} onPress={onCancel}>
          <Text style={styles.ghostText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  const recording = phase === 'rec';

  return (
    <View style={styles.root}>
      <CameraView
        ref={camRef}
        style={StyleSheet.absoluteFill}
        facing="front"
        mode="video"
        onCameraReady={() => setReady(true)}
      />

      {challenge ? (
        <>
          <View style={styles.ghostFigure} pointerEvents="none">
            <Dancer color="#17A2AE" size={160} playing={phase !== 'idle'} opacity={0.35} />
          </View>
          <View style={styles.note}>
            <Text style={styles.noteText}>Ghost overlay on · {challenge.tag}</Text>
          </View>
          <View style={styles.ref}>
            <Dancer color={colors.originalFigure} size={54} playing={phase !== 'idle'} />
            <Text style={styles.refText}>Reference</Text>
          </View>
        </>
      ) : null}

      {phase === 'count' ? (
        <View style={styles.count}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      ) : null}

      <View style={styles.controls}>
        <Pressable style={styles.ghost} onPress={cancel} accessibilityRole="button">
          <Text style={styles.ghostText}>{phase === 'idle' ? 'Back' : 'Cancel'}</Text>
        </Pressable>

        <Pressable
          style={styles.recOuter}
          onPress={recording ? stop : phase === 'idle' ? start : undefined}
          accessibilityRole="button"
          accessibilityLabel={recording ? 'Stop recording' : 'Start recording'}
        >
          <View style={[styles.recCore, recording && styles.recCoreOn]} />
        </Pressable>

        <Text style={styles.time}>
          {formatTime(elapsed)} / {formatTime(MAX_CLIP_SEC)}
        </Text>
      </View>

      <Text style={styles.hint}>
        {hint || `Record ${formatTime(MIN_CLIP_SEC)} to ${formatTime(MAX_CLIP_SEC)}. Recording stops by itself at ${formatTime(MAX_CLIP_SEC)}.`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFE3EC' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  body: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  cta: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: 20, paddingVertical: 12 },
  ctaText: { color: colors.onAccent, fontWeight: '700', fontSize: 14 },
  ghost: { borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 10 },
  ghostText: { color: colors.text, fontSize: 14 },
  ghostFigure: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  note: { position: 'absolute', top: 12, left: 12, backgroundColor: colors.originalChip, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  noteText: { color: colors.text, fontSize: 12 },
  ref: { position: 'absolute', right: 12, bottom: 150, width: 84, height: 112, borderRadius: 10, borderWidth: 2, borderColor: '#fff', backgroundColor: colors.original, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  refText: { position: 'absolute', bottom: 4, color: colors.text, fontSize: 11, fontWeight: '700' },
  count: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,241,246,0.6)' },
  countText: { color: colors.text, fontSize: 120, fontWeight: '800' },
  controls: { position: 'absolute', left: 16, right: 16, bottom: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recOuter: { width: 84, height: 84, borderRadius: 42, borderWidth: 5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  recCore: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent },
  recCoreOn: { width: 28, height: 28, borderRadius: 6 },
  time: { color: colors.text, fontSize: 13, minWidth: 80, textAlign: 'right', fontVariant: ['tabular-nums'] },
  hint: { position: 'absolute', left: 16, right: 16, bottom: 16, color: colors.muted, fontSize: 12, textAlign: 'center' },
});
