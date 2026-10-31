import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../store';
import { colors, radius } from '../theme';

type Props = {
  onOpen: (challengeId: string) => void;
};

export function TrendingScreen({ onOpen }: Props) {
  const { challenges } = useApp();

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <Text style={styles.title}>trending</Text>
      </View>
      <Text style={styles.sub}>Open a challenge to see how people answered it.</Text>
      <FlatList
        data={challenges}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => onOpen(item.id)} accessibilityRole="button">
            <Text style={styles.tag}>{item.tag}</Text>
            <Text style={styles.meta}>
              {item.creator.handle} · {item.acceptedLabel}
            </Text>
            {item.sponsor ? (
              <View style={styles.sponsor}>
                <Text style={styles.sponsorText}>{item.sponsor}</Text>
              </View>
            ) : null}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { height: 48, justifyContent: 'center', paddingHorizontal: 14 },
  title: { color: colors.text, fontSize: 17, fontWeight: '800' },
  sub: { color: colors.muted, fontSize: 13, paddingHorizontal: 14, paddingBottom: 10 },
  list: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  row: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, gap: 2 },
  tag: { color: colors.text, fontSize: 17, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 13 },
  sponsor: { alignSelf: 'flex-start', backgroundColor: colors.sun, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, marginTop: 6 },
  sponsorText: { color: colors.onAccent, fontSize: 11, fontWeight: '700' },
});
