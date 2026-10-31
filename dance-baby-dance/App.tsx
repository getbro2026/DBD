import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { CreateScreen } from './src/screens/CreateScreen';
import { FeedScreen } from './src/screens/FeedScreen';
import { TrendingScreen } from './src/screens/TrendingScreen';
import { AppProvider, useApp } from './src/store';
import { colors } from './src/theme';

type Route =
  | { name: 'feed' }
  | { name: 'trending' }
  | { name: 'create'; challengeId?: string };

function Shell() {
  const { challenges } = useApp();
  const [route, setRoute] = useState<Route>({ name: 'feed' });
  const [feedId, setFeedId] = useState(challenges[0].id);

  // Android back: return to the feed instead of closing the app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (route.name === 'feed') return false;
      setRoute({ name: 'feed' });
      return true;
    });
    return () => sub.remove();
  }, [route.name]);

  const openFeed = (id: string) => {
    setFeedId(id);
    setRoute({ name: 'feed' });
  };

  let body: React.ReactNode;
  if (route.name === 'feed') {
    body = <FeedScreen challengeId={feedId} onAccept={(id) => setRoute({ name: 'create', challengeId: id })} />;
  } else if (route.name === 'trending') {
    body = <TrendingScreen onOpen={openFeed} />;
  } else {
    body = (
      <CreateScreen
        challengeId={route.challengeId}
        onDone={openFeed}
        onCancel={() => setRoute({ name: 'feed' })}
      />
    );
  }

  const active = route.name;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.body}>{body}</View>
      <View style={styles.nav}>
        <Pressable style={styles.navBtn} onPress={() => setRoute({ name: 'feed' })} accessibilityRole="button">
          <Text style={[styles.navText, active === 'feed' && styles.navOn]}>Feed</Text>
        </Pressable>
        <Pressable
          style={styles.plus}
          onPress={() => setRoute({ name: 'create' })}
          accessibilityRole="button"
          accessibilityLabel="Start a new challenge"
        >
          <Text style={styles.plusText}>+</Text>
        </Pressable>
        <Pressable style={styles.navBtn} onPress={() => setRoute({ name: 'trending' })} accessibilityRole="button">
          <Text style={[styles.navText, active === 'trending' && styles.navOn]}>Trending</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1 },
  nav: { height: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bg },
  navBtn: { paddingHorizontal: 18, paddingVertical: 8, minWidth: 80, alignItems: 'center' },
  navText: { color: colors.muted, fontSize: 12 },
  navOn: { color: colors.text, fontWeight: '700' },
  plus: { width: 52, height: 38, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  plusText: { color: colors.onAccent, fontSize: 26, lineHeight: 28, fontWeight: '700' },
});
