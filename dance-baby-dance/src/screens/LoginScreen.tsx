import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { confirmPhoneCode, firebaseConfigured, sendPhoneCode, signInWithGoogle } from '../lib/firebase';
import { useFirebaseUser } from '../lib/backend';
import { useNav } from '../nav';
import { colors } from '../theme';
import { Btn, errMsg, ErrorText, Field, Muted, Title } from '../components/ui';

/** One screen for new and returning people: Google or phone number. The account is created on first sign-in. */
export function LoginScreen() {
  const { go } = useNav();
  const { user } = useFirebaseUser();
  const [phone, setPhone] = useState('+91');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) go({ name: 'home' });
  }, [user, go]);

  const run = async (fn: () => Promise<void>) => {
    setError('');
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(errMsg(e, 'Could not sign you in.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Title>Log in or sign up</Title>
      <Muted>Use Google or your phone number. New here? Your account is created the first time you sign in.</Muted>
      {!firebaseConfigured ? <ErrorText>Firebase is not set up yet. Add the EXPO_PUBLIC_FIREBASE_* values (see README).</ErrorText> : null}
      <Btn label="Continue with Google" busy={busy} onPress={() => run(signInWithGoogle)} />
      <View style={styles.divider} />
      <Field label="Phone number with country code" value={phone} onChangeText={setPhone} keyboardType="phone-pad" editable={!sent} placeholder="+91 98765 43210" />
      {sent ? <Field label="6-digit code we texted you" value={code} onChangeText={(v) => setCode(v.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={6} placeholder="123456" /> : null}
      {sent ? (
        <Btn label="Verify and log in" busy={busy} disabled={code.length !== 6} onPress={() => run(() => confirmPhoneCode(code))} />
      ) : (
        <Btn label="Text me a code" busy={busy} onPress={() => run(async () => { await sendPhoneCode(phone.replace(/[\s()-]/g, '')); setSent(true); })} />
      )}
      <ErrorText>{error}</ErrorText>
      <Btn label="Keep browsing as a guest" kind="ghost" onPress={() => go({ name: 'trending' })} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 14 },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 4 },
});
