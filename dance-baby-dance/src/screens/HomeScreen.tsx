import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../lib/backend';
import { useFirebaseUser } from '../lib/backend';
import { useNav } from '../nav';
import { colors, radius } from '../theme';
import { ChallengeCard, Creator, Me } from '../types';
import { Btn, errMsg, Muted, Title } from '../components/ui';
import { ChallengeRow } from './TrendingScreen';
import { Person } from '../components/Person';
import { Alert } from 'react-native';

type Summary = { stats: { posts: number; subscribed: number; likesGiven: number }; suggested: (Creator & { headline: string })[] } | null | undefined;

export function HomeScreen() {
  const { go } = useNav();
  const { user, loading } = useFirebaseUser();
  const me = useQuery(api.users.current, user ? {} : 'skip') as Me | null | undefined;
  const summary = useQuery(api.home.summary, user ? {} : 'skip') as Summary;
  const trending = useQuery(api.challenges.list, { sort: 'hot' }) as ChallengeCard[] | undefined;
  const subscribe = useMutation(api.social.toggleSubscribe);

  return (
    <ScrollView contentContainerStyle={styles.body}>
      {!user && !loading ? (
        <View style={{ gap: 12 }}>
          <Title>Post a step. Watch the answer beside it.</Title>
          <Muted>Every response plays next to the original in a split screen, with the creator tagged.</Muted>
          <Btn label="Log in or sign up" onPress={() => go({ name: 'login' })} />
        </View>
      ) : (
        <View style={{ gap: 4 }}>
          <Title>Hi, {me?.displayName ?? '...'}</Title>
          <Muted>Here is what is moving today.</Muted>
        </View>
      )}

      {summary ? (
        <View style={styles.stats}>
          {[
            ['Your posts', summary.stats.posts],
            ['Subscribed', summary.stats.subscribed],
            ['Likes given', summary.stats.likesGiven],
          ].map(([label, n], i) => (
            <View key={String(label)} style={[styles.stat, i > 0 && { borderLeftWidth: 1, borderLeftColor: colors.line }]}>
              <Text style={styles.statN}>{n}</Text>
              <Text style={styles.statL}>{label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.h}>Trending now</Text>
      {trending === undefined ? null : trending.length === 0 ? (
        <View style={styles.empty}>
          <Muted>No challenges yet. Start the first one.</Muted>
          <Btn label="Start a challenge" onPress={() => go({ name: 'create' })} />
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {trending.slice(0, 5).map((c) => (
            <ChallengeRow key={c.id} c={c} onPress={() => go({ name: 'challenge', id: c.id })} />
          ))}
        </View>
      )}

      {summary && summary.suggested.length > 0 ? (
        <>
          <Text style={styles.h}>Creators to follow</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {summary.suggested.map((p) => (
              <View key={p.id} style={styles.person}>
                <Person user={p} size={56} />
                <Text style={styles.personName} numberOfLines={1}>@{p.handle}</Text>
                <Text style={styles.statL} numberOfLines={1}>{p.headline || 'New creator'}</Text>
                <Btn label="Subscribe" onPress={() => subscribe({ handle: p.handle }).catch((e) => Alert.alert('Could not subscribe', errMsg(e)))} />
              </View>
            ))}
          </ScrollView>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 14, paddingBottom: 32 },
  h: { color: colors.text, fontSize: 18, fontWeight: '800' },
  stats: { flexDirection: 'row', borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.surface },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statN: { color: colors.text, fontSize: 20, fontWeight: '800' },
  statL: { color: colors.muted, fontSize: 12 },
  empty: { alignItems: 'center', gap: 12, padding: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.line, borderRadius: radius.md },
  person: { width: 140, alignItems: 'center', gap: 6, padding: 12, borderRadius: radius.md, backgroundColor: colors.surface },
  personName: { color: colors.text, fontWeight: '700', maxWidth: 120 },
});
