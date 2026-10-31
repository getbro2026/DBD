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
  const { role, handle, initials, subtitle, bottomLabel, durationSec, t, playing, uri, muted, narrow, badge } = props;
  const isOriginal = role === 'original';
  const bg = isOriginal ? colors.original : colors.response;
  const chip = isOriginal ? colors.originalChip : colors.responseChip;
  const figure = isOriginal ? colors.originalFigure : colors.responseFigure;
  const avatarBg = isOriginal ? '#BFE9ED' : '#FFD0DD';
  const avatarFg = isOriginal ? colors.originalChip : colors.responseChip;
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

      <View style={styles.meta}>
        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          <Text style={[styles.avatarText, { color: avatarFg }]}>{initials}</Text>
        </View>
        <View style={styles.who}>
          <Text style={styles.handle} numberOfLines={1}>{handle}</Text>
          <Text style={styles.sub} numberOfLines={1}>{subtitle}</Text>
        </View>
      </View>

      <View style={[styles.chip, { backgroundColor: chip }, narrow ? styles.chipNarrow : styles.chipWide]}>
        <Text style={styles.chipText}>
          {formatTime(shown)} / {formatTime(durationSec)}
          {badge ? `  ·  ${badge}` : ''}
        </Text>
      </View>

      <View style={[styles.tag, { backgroundColor: chip }]}>
        <Text style={styles.tagText} numberOfLines={1}>{bottomLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pane: { flex: 1, overflow: 'hidden' },
  figure: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  meta: { position: 'absolute', top: 8, left: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatar: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 11, fontWeight: '700' },
  who: { flex: 1 },
  handle: { color: '#fff', fontSize: 12, fontWeight: '700' },
  sub: { color: '#fff', fontSize: 11, opacity: 0.9 },
  chip: { position: 'absolute', paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.pill },
  chipWide: { right: 8, bottom: 8 },
  chipNarrow: { left: 8, bottom: 36 },
  chipText: { color: '#fff', fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },
  tag: { position: 'absolute', left: 8, bottom: 8, maxWidth: '75%', paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  tagText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
