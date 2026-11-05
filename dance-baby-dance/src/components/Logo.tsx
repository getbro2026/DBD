import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

/** The N mark, with the wordmark next to it when `word` is true. */
export function Logo({ size = 30, word = true }: { size?: number; word?: boolean }) {
  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="Naalnachana">
      <Image source={require('../../assets/brand/naalnachana-mark.png')} style={{ width: size, height: size }} resizeMode="contain" accessibilityElementsHidden />
      {word ? <Text style={[styles.word, { fontSize: size * 0.72 }]}>Naalnachana</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  word: { color: colors.text, fontWeight: '800', letterSpacing: -0.8 },
});
