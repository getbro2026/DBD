import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius } from '../theme';

export function Btn({ label, onPress, kind = 'primary', disabled, busy }: { label: string; onPress: () => void; kind?: 'primary' | 'ghost'; disabled?: boolean; busy?: boolean }) {
  const off = disabled || busy;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      style={[styles.btn, kind === 'ghost' ? styles.ghost : styles.primary, off && { opacity: 0.5 }]}
    >
      {busy ? <ActivityIndicator color={kind === 'ghost' ? colors.text : colors.onAccent} /> : <Text style={[styles.btnText, kind === 'ghost' && { color: colors.text }]}>{label}</Text>}
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} placeholderTextColor={colors.muted} style={styles.input} accessibilityLabel={label} />
    </View>
  );
}

export const Title = ({ children }: { children: React.ReactNode }) => <Text style={styles.title}>{children}</Text>;
export const Muted = ({ children }: { children: React.ReactNode }) => <Text style={styles.muted}>{children}</Text>;
export const ErrorText = ({ children }: { children?: string }) => (children ? <Text style={styles.error} accessibilityRole="alert">{children}</Text> : null);

export const errMsg = (e: unknown, fallback = 'Something went wrong. Try again.') => (e instanceof Error ? (e.message.split('Uncaught Error: ').pop() ?? fallback).split('\n')[0] : fallback);

const styles = StyleSheet.create({
  btn: { minHeight: 48, borderRadius: radius.pill, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: colors.accent },
  ghost: { borderWidth: 1, borderColor: '#4A3D57' },
  btnText: { color: colors.onAccent, fontWeight: '800', fontSize: 15 },
  label: { color: colors.muted, fontSize: 13 },
  input: { minHeight: 48, backgroundColor: colors.surface, borderWidth: 1, borderColor: '#4A3D57', borderRadius: radius.sm, color: colors.text, paddingHorizontal: 12, fontSize: 15 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  error: { color: colors.danger, fontSize: 14 },
});
