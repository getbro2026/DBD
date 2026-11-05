import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { formatTime } from '../lib/clip';
import { colors, radius } from '../theme';
import { Dancer } from './Dancer';

type Props = {
  role: 'original' | 'response';
  handle: string;
  initials: string;
  subtitle: string;
  bottomLabel: string;
  durationSec: number;
  /** Shared playhead in seconds */
  t: number;
  playing: boolean;
  uri?: string;
  /** Only the original plays sound in the split screen */
  muted?: boolean;
  /** Smaller type and the time chip moves up when panes sit side by side */
  narrow?: boolean;
  /** Extra chip text such as the accuracy score */
  badge?: string;
};

function VideoClip({ uri, playing, muted }: { uri: string; playing: boolean; muted: boolean }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = muted;
  });

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  useEffect(() => {
    if (playing) player.play();
    else player.pause();
  }, [playing, player]);

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

export function ClipPane(props: Props) {
  const { role, handle, initials, durationSec, t, playing, uri, muted, narrow, badge } = props;
  const isOriginal = role === 'original';
  const bg = isOriginal ? colors.original : colors.response;
  const figure = isOriginal ? colors.originalFigure : colors.responseFigure;
  const avatarBg = isOriginal ? '#9FE9F1' : '#FFC3D4';
  const shown = Math.min(t, durationSec);
  const dancing = playing && t < durationSec;

  return (
    <View style={[styles.pane, { backgroundColor: bg }]}>
      {uri ? (
        <VideoClip uri={uri} playing={playing} muted={muted ?? true} />
      ) : (
        <View style={styles.figure}>
          <Dancer color={figure} size={narrow ? 96 : 112} playing={dancing} delayMs={isOriginal ? 0 : 150} />
        </View>
      )}

      <View style={[styles.chip, styles.who, { left: 8, bottom: 8, maxWidth: narrow ? '92%' : '58%' }]}>
        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.handle} numberOfLines={1}>{handle}</Text>
      </View>

      <View style={[styles.chip, styles.time, narrow ? { left: 8, top: 8 } : { right: 8, bottom: 14 }]}>
        <Text style={styles.chipText}>
          {formatTime(shown)} / {formatTime(durationSec)}
          {badge ? `  ·  ${badge}` : ''}
        </Text>
      </View>

      {isOriginal ? (
        <View style={styles.original}><Text style={styles.originalText}>ORIGINAL</Text></View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pane: { flex: 1, overflow: 'hidden' },
  figure: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  chip: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.92)' },
  who: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingLeft: 4, paddingRight: 12, borderRadius: 19 },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 11, fontWeight: '800', color: colors.text },
  handle: { color: colors.text, fontSize: 12, fontWeight: '700', flexShrink: 1 },
  time: { height: 26, paddingHorizontal: 10, borderRadius: 13, justifyContent: 'center' },
  chipText: { color: colors.text, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  original: { position: 'absolute', right: 8, top: 8, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: colors.text, paddingHorizontal: 6, paddingVertical: 3 },
  originalText: { color: colors.text, fontSize: 11, fontWeight: '800' },
});
