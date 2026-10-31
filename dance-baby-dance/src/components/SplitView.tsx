import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Challenge, Response } from '../types';
import { colors } from '../theme';
import { ClipPane } from './ClipPane';

type Props = {
  challenge: Challenge;
  response?: Response;
  responseIndex: number;
  /** true = side by side, false = stacked */
  side: boolean;
  playing: boolean;
  t: number;
  onTogglePlay: () => void;
};

/** The core of the app: the original on top (or left) and one response below (or right). */
export function SplitView({ challenge, response, responseIndex, side, playing, t, onTogglePlay }: Props) {
  return (
    <Pressable
      style={[styles.pair, { flexDirection: side ? 'row' : 'column' }]}
      onPress={onTogglePlay}
      accessibilityRole="button"
      accessibilityLabel={playing ? 'Pause both clips' : 'Play both clips'}
    >
      <ClipPane
        role="original"
        handle={challenge.creator.handle}
        initials={challenge.creator.initials}
        subtitle="Original challenge"
        bottomLabel={challenge.tag}
        durationSec={challenge.durationSec}
        t={t}
        playing={playing}
        uri={challenge.uri}
        muted={false}
        narrow={side}
      />

      {response ? (
        <ClipPane
          role="response"
          handle={response.creator.handle}
          initials={response.creator.initials}
          subtitle="Accepted and tagged"
          bottomLabel={`Response ${responseIndex + 1} of ${challenge.responses.length}`}
          durationSec={response.durationSec}
          t={t}
          playing={playing}
          uri={response.uri}
          muted
          narrow={side}
          badge={response.accuracy ? `${response.accuracy}%` : undefined}
        />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Your turn</Text>
          <Text style={styles.emptyBody}>Nobody has answered this challenge yet. Tap Accept challenge to be first.</Text>
        </View>
      )}

      {!playing && (
        <View style={styles.pausedWrap} pointerEvents="none">
          <View style={styles.pausedBadge}>
            <View style={styles.triangle} />
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pair: { flex: 1, gap: 3 },
  empty: { flex: 1, backgroundColor: colors.response, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 6 },
  emptyTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  emptyBody: { color: '#fff', fontSize: 14, textAlign: 'center', opacity: 0.92 },
  pausedWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  pausedBadge: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(20,12,28,0.78)', alignItems: 'center', justifyContent: 'center' },
  triangle: {
    marginLeft: 4,
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftWidth: 16,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#fff',
  },
});
