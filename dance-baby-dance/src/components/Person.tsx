import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { Creator } from '../types';

const TONES = ['#2A8FA0', '#D6376E', '#E2A21B', '#7A4AD6'];

export function Person({ user, size = 36 }: { user: Pick<Creator, 'handle' | 'displayName' | 'avatarUrl'>; size?: number }) {
  const tone = TONES[(user.handle.charCodeAt(0) || 0) % TONES.length];
  if (user.avatarUrl) {
    return <Image source={{ uri: user.avatarUrl }} style={{ width: size, height: size, borderRadius: size / 2 }} accessibilityLabel={user.handle} />;
  }
  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2, backgroundColor: tone }]}>
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{(user.displayName || user.handle).slice(0, 2).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: colors.onAccent, fontWeight: '800' },
});
