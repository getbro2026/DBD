import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { api, useFirebaseUser } from '../lib/backend';
import { useNav } from '../nav';
import { colors, radius } from '../theme';
import { Notice } from '../types';
import { Btn, Muted, Title } from '../components/ui';
import { Person } from '../components/Person';

const text = (n: Notice) =>
  n.kind === 'accepted' ? `accepted your challenge ${n.tag ?? ''}` : n.kind === 'liked' ? `liked your response to ${n.tag ?? 'a challenge'}` : n.kind === 'commented' ? `commented on ${n.tag ?? 'your challenge'}` : 'subscribed to you';

export function AlertsScreen() {
  const { go } = useNav();
  const { user } = useFirebaseUser();
  const data = useQuery(api.social.notifications, user ? {} : 'skip') as { items: Notice[]; unread: number } | undefined;
  const markRead = useMutation(api.social.markNotificationsRead);
  const marked = useRef(false);

  useEffect(() => {
    if (data && data.unread > 0 && !marked.current) {
      marked.current = true;
      markRead({}).catch(() => {});
    }
  }, [data, markRead]);

  if (!user) {
    return (
      <View style={styles.root}>
        <Title>Alerts</Title>
        <Muted>Log in to see who accepted your challenges, liked your responses and subscribed.</Muted>
        <Btn label="Log in or sign up" onPress={() => go({ name: 'login' })} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Title>Alerts</Title>
      {data === undefined ? (
        <ActivityIndicator color={colors.accent} />
      ) : data.items.length === 0 ? (
        <Muted>Nothing yet. When someone accepts your challenge, likes a response or subscribes, it shows up here.</Muted>
      ) : (
        <FlatList
          data={data.items}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ gap: 8, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.row, !item.read && { borderColor: colors.accent }]}
              onPress={() => (item.challengeId ? go({ name: 'challenge', id: item.challengeId }) : go({ name: 'profile', handle: item.actor.handle }))}
              accessibilityRole="button"
            >
              <Person user={item.actor} size={40} />
              <Text style={{ color: colors.text, flex: 1 }}><Text style={{ fontWeight: '800' }}>@{item.actor.handle}</Text> {text(item)}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: 'transparent' },
});
