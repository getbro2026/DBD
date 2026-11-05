import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../lib/backend';
import { useNav } from '../nav';
import { colors, radius } from '../theme';
import { ChallengeCard } from '../types';
import { Btn, Muted, Title } from '../components/ui';

const SORTS = [
  ['hot', 'Hot'],
  ['new', 'New'],
  ['sponsored', 'Sponsored'],
] as const;

export function ChallengeRow({ c, onPress }: { c: ChallengeCard; onPress: () => void }) {
  return (
    <Pressable style={[styles.row, c.sponsor ? { borderColor: colors.sun } : null]} onPress={onPress} accessibilityRole="button">
      {c.posterUrl ? <Image source={{ uri: c.posterUrl }} style={styles.thumb} /> : <View style={[styles.thumb, { backgroundColor: colors.original }]} />}
      <View style={{ flex: 1, gap: 2 }}>
        {c.sponsor ? <Text style={styles.spon}>{c.sponsor}</Text> : null}
        <Text style={styles.tag}>{c.tag}</Text>
        <Text style={styles.meta}>@{c.creator.handle} · {c.responseCount} {c.responseCount === 1 ? 'answer' : 'answers'}</Text>
      </View>
    </Pressable>
  );
}

export function TrendingScreen() {
  const { go } = useNav();
  const [sort, setSort] = useState<'hot' | 'new' | 'sponsored'>('hot');
  const data = useQuery(api.challenges.list, { sort }) as ChallengeCard[] | undefined;

  return (
    <View style={styles.root}>
      <Title>Trending</Title>
      <Muted>Open a challenge to see how people answered it.</Muted>
      <View style={styles.chips}>
        {SORTS.map(([k, label]) => (
          <Pressable key={k} onPress={() => setSort(k)} style={[styles.chip, sort === k && styles.chipOn]} accessibilityRole="button" accessibilityState={{ selected: sort === k }}>
            <Text style={[styles.chipText, sort === k && { color: colors.onAccent }]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {data === undefined ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : data.length === 0 ? (
        <View style={styles.empty}>
          <Muted>{sort === 'sponsored' ? 'No sponsored challenges yet.' : 'No challenges yet. Be the first to start one.'}</Muted>
          <Btn label="Start a challenge" onPress={() => go({ name: 'create' })} />
        </View>
      ) : (
        <FlatList data={data} keyExtractor={(c) => c.id} contentContainerStyle={{ gap: 10, paddingBottom: 24 }} renderItem={({ item }) => <ChallengeRow c={item} onPress={() => go({ name: 'challenge', id: item.id })} />} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16, gap: 10 },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { minHeight: 40, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: colors.text, borderColor: colors.text },
  chipText: { color: colors.text, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 12, padding: 10, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: 'transparent' },
  thumb: { width: 72, height: 96, borderRadius: radius.sm, backgroundColor: colors.line },
  tag: { color: colors.text, fontSize: 17, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 13 },
  spon: { alignSelf: 'flex-start', backgroundColor: colors.sun, color: colors.onAccent, fontSize: 11, fontWeight: '800', paddingHorizontal: 8, borderRadius: radius.pill, overflow: 'hidden' },
  empty: { alignItems: 'center', gap: 12, padding: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.edge, borderRadius: radius.md },
});
