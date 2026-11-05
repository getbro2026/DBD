import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChallengeCard, ResponseItem } from '../types';
import { colors } from '../theme';
import { ClipPane } from './ClipPane';

type Props = {
  challenge: ChallengeCard;
  response?: ResponseItem;
  responseIndex: number;
  responseCount: number;
  /** true = side by side, false = stacked */
  side: boolean;
  playing: boolean;
  t: number;
  onTogglePlay: () => void;
  onOpenProfile?: (handle: string) => void;
};

const initials = (name: string) => name.slice(0, 2).toUpperCase();

/** The core of the app: the original on top (or left) and one response below (or right). */
export function SplitView({ challenge, response, responseIndex, responseCount, side, playing, t, onTogglePlay, onOpenProfile }: Props) {
  return (
    <Pressable
      style={[styles.pair, { flexDirection: side ? 'row' : 'column' }]}
      onPress={onTogglePlay}
      accessibilityRole="button"
      accessibilityLabel={playing ? 'Pause both clips' : 'Play both clips'}
    >
      <ClipPane
        role="original"
        handle={`@${challenge.creator.handle}`}
        initials={initials(challenge.creator.displayName)}
        subtitle="Original challenge"
        bottomLabel={challenge.tag}
        durationSec={challenge.durationSec}
        t={t}
        playing={playing}
        uri={challenge.videoUrl}
        muted={false}
        narrow={side}
      />
      {response ? (
        <ClipPane
          role="response"
          handle={`@${response.creator.handle}`}
          initials={initials(response.creator.displayName)}
          subtitle="Accepted and tagged"
          bottomLabel={`Response ${responseIndex + 1} of ${responseCount}`}
          durationSec={response.durationSec}
          t={t}
          playing={playing}
          uri={response.videoUrl}
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
      <View style={[styles.vs, side && { alignSelf: 'auto', left: '50%', marginLeft: -23 }]} pointerEvents="none"><Text style={styles.vsText}>VS</Text></View>
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
  pair: { flex: 1 },
  vs: { position: 'absolute', alignSelf: 'center', top: '50%', marginTop: -15, width: 46, height: 30, borderRadius: 15, backgroundColor: '#fff', borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#783C64', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  vsText: { color: colors.text, fontSize: 14, fontWeight: '800' },
  empty: { flex: 1, backgroundColor: colors.response, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 6 },
  emptyTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  emptyBody: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  pausedWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  pausedBadge: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' },
  triangle: {
    marginLeft: 4,
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftWidth: 16,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#1C1424',
  },
});
