import React, { useEffect, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { SplitView } from '../components/SplitView';
import { formatCount } from '../lib/clip';
import { usePlayhead } from '../lib/usePlayhead';
import { useApp } from '../store';
import { colors, radius } from '../theme';

type Props = {
  challengeId: string;
  onAccept: (challengeId: string) => void;
};

export function FeedScreen({ challengeId, onAccept }: Props) {
  const { challenges, side, toggleLayout, toggleLike } = useApp();
  const challenge = challenges.find((c) => c.id === challengeId) ?? challenges[0];
  const [ri, setRi] = useState(0);
  const [playing, setPlaying] = useState(true);

  const count = challenge.responses.length;
  const response = challenge.responses[ri];

  // Jump back to the newest response when the challenge changes or a new response is posted.
  useEffect(() => {
    setRi(0);
  }, [challenge.id, count]);

  const longest = Math.max(challenge.durationSec, response?.durationSec ?? 0);
  const t = usePlayhead(longest, playing, `${challenge.id}:${response?.id ?? 'none'}`);

  const step = (n: number) => {
    if (count === 0) return;
    setRi((i) => (i + n + count) % count);
  };

  const share = () => {
    Share.share({ message: `Try the ${challenge.tag} challenge on Dance Baby Dance.` }).catch(() => {});
  };

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <Text style={styles.word}>
          dance <Text style={styles.wordAccent}>baby</Text> dance
        </Text>
        <Pressable style={styles.pill} onPress={toggleLayout} accessibilityRole="button" accessibilityLabel="Switch split screen layout">
          <Text style={styles.pillText}>{side ? 'Side by side' : 'Stacked'}</Text>
        </Pressable>
      </View>

      <View style={styles.stage}>
        <SplitView
          challenge={challenge}
          response={response}
          responseIndex={ri}
          side={side}
          playing={playing}
          t={t}
          onTogglePlay={() => setPlaying((p) => !p)}
        />
      </View>

      <View style={styles.progress}>
        <View style={[styles.progressFill, { width: `${Math.min(100, (t / longest) * 100)}%` }]} />
      </View>

      <View style={styles.bar}>
        <View style={styles.stepRow}>
          <Pressable style={styles.stepBtn} onPress={() => step(-1)} accessibilityLabel="Previous response">
            <Text style={styles.stepText}>‹</Text>
          </Pressable>
          <Text style={styles.muted}>
            {count === 0 ? 'No responses yet' : `Response ${ri + 1} of ${count}`}
          </Text>
          <Pressable style={styles.stepBtn} onPress={() => step(1)} accessibilityLabel="Next response">
            <Text style={styles.stepText}>›</Text>
          </Pressable>
        </View>

        <View style={styles.actions}>
          {response ? (
            <Pressable
              style={[styles.pill, response.liked && styles.pillOn]}
              onPress={() => toggleLike(challenge.id, response.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: !!response.liked }}
            >
              <Text style={[styles.pillText, response.liked && styles.pillTextOn]}>
                {response.liked ? 'Liked' : 'Like'} · {formatCount(response.likes)}
              </Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.pill} onPress={share} accessibilityRole="button">
            <Text style={styles.pillText}>Share</Text>
          </Pressable>
          <Pressable style={styles.cta} onPress={() => onAccept(challenge.id)} accessibilityRole="button">
            <Text style={styles.ctaText}>Accept challenge</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  word: { color: colors.text, fontSize: 17, fontWeight: '800' },
  wordAccent: { color: colors.accent },
  stage: { flex: 1 },
  progress: { height: 4, backgroundColor: colors.line },
  progressFill: { height: 4, backgroundColor: colors.sun },
  bar: { padding: 12, gap: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  stepText: { color: colors.text, fontSize: 20, lineHeight: 22 },
  muted: { color: colors.muted, fontSize: 13 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: { borderWidth: 1, borderColor: '#4A3D57', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  pillOn: { borderColor: colors.accent },
  pillText: { color: colors.text, fontSize: 13 },
  pillTextOn: { color: colors.accent },
  cta: { marginLeft: 'auto', backgroundColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 10 },
  ctaText: { color: colors.onAccent, fontSize: 14, fontWeight: '700' },
});
