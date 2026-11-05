import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

const blur = (px: number): object => (Platform.OS === 'web' ? { filter: `blur(${px}px)` } : { filter: [{ blur: px }] });

/** Pastel gradient-like backdrop: three soft colour blobs behind the frosted panels. */
export function Backdrop({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.blob, { left: -90, top: -60, width: 300, height: 300, backgroundColor: 'rgba(23,162,174,0.42)' }, blur(52)]} />
        <View style={[styles.blob, { right: -100, top: '38%', width: 300, height: 300, backgroundColor: 'rgba(255,201,60,0.48)' }, blur(56)]} />
        <View style={[styles.blob, { left: -60, bottom: -80, width: 340, height: 340, backgroundColor: 'rgba(255,77,126,0.36)' }, blur(56)]} />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  blob: { position: 'absolute', borderRadius: 999 },
});
