import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { api, BackendProvider, convexConfigured, useFirebaseUser } from './src/lib/backend';
import { NavProvider } from './src/nav';
import { colors } from './src/theme';
import { Route } from './src/types';
import { AlertsScreen } from './src/screens/AlertsScreen';
import { ChallengeScreen } from './src/screens/ChallengeScreen';
import { CreateScreen } from './src/screens/CreateScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { TrendingScreen } from './src/screens/TrendingScreen';

function Shell() {
  const { user } = useFirebaseUser();
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }]);
  const route = stack[stack.length - 1];
  const notices = useQuery(api.social.notifications, user ? {} : 'skip') as { unread: number } | undefined;

  const go = useCallback((r: Route) => {
    setStack((s) => {
      const top = s[s.length - 1];
      if (JSON.stringify(top) === JSON.stringify(r)) return s;
      // Tabs replace the stack; detail screens stack on top.
      return ['home', 'trending', 'alerts', 'login'].includes(r.name) || (r.name === 'profile' && r.handle === 'me') ? [r] : [...s, r];
    });
  }, []);
  const back = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);

  // Android back goes to the previous screen instead of closing the app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length <= 1) return false;
      back();
      return true;
    });
    return () => sub.remove();
  }, [stack.length, back]);

  const nav = useMemo(() => ({ route, go, back }), [route, go, back]);

  let body: React.ReactNode;
  switch (route.name) {
    case 'home': body = <HomeScreen />; break;
    case 'trending': body = <TrendingScreen />; break;
    case 'challenge': body = <ChallengeScreen id={route.id} />; break;
    case 'create': body = <CreateScreen acceptId={route.acceptId} />; break;
    case 'profile': body = <ProfileScreen handle={route.handle} />; break;
    case 'alerts': body = <AlertsScreen />; break;
    default: body = <LoginScreen />;
  }

  const tab = (label: string, r: Route, on: boolean, badge?: number) => (
    <Pressable style={styles.navBtn} onPress={() => go(r)} accessibilityRole="button" accessibilityState={{ selected: on }}>
      <Text style={[styles.navText, on && styles.navOn]}>{label}{badge ? `  ${badge}` : ''}</Text>
    </Pressable>
  );

  return (
    <NavProvider value={nav}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <StatusBar style="light" />
        {!convexConfigured ? <Text style={styles.warn}>Backend not set up: add EXPO_PUBLIC_CONVEX_URL (see README).</Text> : null}
        {stack.length > 1 ? (
          <Pressable style={styles.back} onPress={back} accessibilityRole="button" accessibilityLabel="Back"><Text style={styles.backText}>‹ Back</Text></Pressable>
        ) : null}
        <View style={styles.body}>{body}</View>
        <View style={styles.nav}>
          {tab('Home', { name: 'home' }, route.name === 'home')}
          {tab('Trending', { name: 'trending' }, route.name === 'trending')}
          <Pressable style={styles.plus} onPress={() => go({ name: 'create' })} accessibilityRole="button" accessibilityLabel="Start a new challenge"><Text style={styles.plusText}>+</Text></Pressable>
          {tab('Alerts', { name: 'alerts' }, route.name === 'alerts', notices?.unread)}
          {user ? tab('Me', { name: 'profile', handle: 'me' }, route.name === 'profile' && route.handle === 'me') : tab('Log in', { name: 'login' }, route.name === 'login')}
        </View>
      </SafeAreaView>
    </NavProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <BackendProvider>
        <Shell />
      </BackendProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1 },
  warn: { color: colors.onAccent, backgroundColor: colors.sun, padding: 8, fontSize: 12, textAlign: 'center' },
  back: { minHeight: 44, paddingHorizontal: 16, justifyContent: 'center' },
  backText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  nav: { height: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bg },
  navBtn: { paddingHorizontal: 8, paddingVertical: 8, minWidth: 56, alignItems: 'center' },
  navText: { color: colors.muted, fontSize: 12 },
  navOn: { color: colors.text, fontWeight: '700' },
  plus: { width: 52, height: 38, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  plusText: { color: colors.onAccent, fontSize: 26, lineHeight: 28, fontWeight: '700' },
});
