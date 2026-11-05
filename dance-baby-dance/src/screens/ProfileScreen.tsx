import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { api, useFirebaseUser } from '../lib/backend';
import { signOut } from '../lib/firebase';
import { useNav } from '../nav';
import { colors, radius } from '../theme';
import { ProfileData } from '../types';
import { Btn, errMsg, ErrorText, Field, Muted, Title } from '../components/ui';
import { Person } from '../components/Person';

export function ProfileScreen({ handle }: { handle: string }) {
  const { go } = useNav();
  const { user } = useFirebaseUser();
  const data = useQuery(api.users.byHandle, { handle }) as ProfileData | null | undefined;
  const subscribe = useMutation(api.social.toggleSubscribe);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<'all' | 'challenge' | 'response'>('all');

  if (handle === 'me' && !user) {
    return (
      <View style={styles.body}>
        <Title>Your profile</Title>
        <Muted>Log in to see and edit your profile.</Muted>
        <Btn label="Log in or sign up" onPress={() => go({ name: 'login' })} />
      </View>
    );
  }
  if (data === undefined) return <View style={styles.body}><Muted>Loading...</Muted></View>;
  if (data === null) {
    return (
      <View style={styles.body}>
        <Title>Profile not found</Title>
        <Muted>That username does not exist, or the link is wrong.</Muted>
      </View>
    );
  }

  const { profile: p, items, counts, isSelf, isSubscribed } = data;
  const shown = tab === 'all' ? items : items.filter((i) => i.type === tab);
  const contact = [p.email && ['Email', p.email], p.phone && ['Phone', p.phone], p.website && ['Website', p.website]].filter(Boolean) as string[][];

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <View style={styles.head}>
        <Person user={p} size={96} />
        <Text style={styles.name}>{p.displayName}{p.verified ? '  ✓' : ''}</Text>
        <Text style={styles.muted}>@{p.handle}</Text>
        {p.headline || p.city ? <Text style={styles.muted}>{[p.headline, p.city].filter(Boolean).join(' · ')}</Text> : null}
        {p.bio ? <Text style={styles.bio}>{p.bio}</Text> : null}
      </View>

      <View style={styles.stats}>
        {[['Videos', counts.videos], ['Subscribers', counts.subscribers], ['Subscribed', counts.subscribed]].map(([l, n], i) => (
          <View key={String(l)} style={[styles.stat, i > 0 && { borderLeftWidth: 1, borderLeftColor: colors.line }]}>
            <Text style={styles.statN}>{n}</Text>
            <Text style={styles.muted}>{l}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {isSelf ? (
          <>
            <View style={{ flex: 1 }}><Btn label="Edit profile" onPress={() => setEditing(true)} /></View>
            <View style={{ flex: 1 }}><Btn label="Log out" kind="ghost" onPress={() => signOut().then(() => go({ name: 'home' }))} /></View>
          </>
        ) : (
          <View style={{ flex: 1 }}>
            <Btn
              label={isSubscribed ? 'Subscribed' : 'Subscribe'}
              kind={isSubscribed ? 'ghost' : 'primary'}
              onPress={() => (user ? subscribe({ handle: p.handle }).catch((e) => Alert.alert('Could not subscribe', errMsg(e))) : go({ name: 'login' }))}
            />
          </View>
        )}
      </View>

      <View style={styles.box}>
        <Text style={styles.boxTitle}>CONTACT</Text>
        {contact.length === 0 ? <Muted>{isSelf ? 'Add your phone or website in Edit profile.' : 'This creator has not shared contact details.'}</Muted> : null}
        {contact.map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.muted}>{label}</Text>
            <Text style={{ color: colors.text, flex: 1, textAlign: 'right' }} selectable>{value}</Text>
          </View>
        ))}
        {isSelf ? <Muted>{p.showContact ? 'Visible on your public profile.' : 'Hidden from your public profile.'}</Muted> : null}
      </View>

      <View style={styles.tabs}>
        {([['all', 'Videos'], ['challenge', 'Challenges'], ['response', 'Responses']] as const).map(([k, l]) => (
          <Pressable key={k} style={[styles.tab, tab === k && styles.tabOn]} onPress={() => setTab(k)} accessibilityRole="tab" accessibilityState={{ selected: tab === k }}>
            <Text style={{ color: tab === k ? colors.text : colors.muted, fontWeight: tab === k ? '800' : '500' }}>{l}</Text>
          </Pressable>
        ))}
      </View>
      {shown.length === 0 ? (
        <Muted>{isSelf ? 'Nothing posted yet. Start a challenge or accept one to see it here.' : 'No videos yet.'}</Muted>
      ) : (
        shown.map((i, n) => (
          <Pressable key={`${i.type}-${n}`} style={styles.item} onPress={() => go({ name: 'challenge', id: i.challengeId })} accessibilityRole="button">
            <Text style={{ color: colors.text, fontWeight: '800' }}>{i.tag}</Text>
            <Text style={styles.muted}>{i.type === 'challenge' ? 'Challenge' : 'Response'}</Text>
          </Pressable>
        ))
      )}

      {isSelf ? <EditProfile profile={p} visible={editing} onClose={() => setEditing(false)} /> : null}
    </ScrollView>
  );
}

function EditProfile({ profile, visible, onClose }: { profile: ProfileData['profile']; visible: boolean; onClose: () => void }) {
  const update = useMutation(api.users.update);
  const [f, setF] = useState({
    displayName: profile.displayName,
    handle: profile.handle,
    headline: profile.headline,
    city: profile.city,
    bio: profile.bio,
    website: profile.website ?? '',
    showContact: profile.showContact,
  });
  const [error, setError] = useState('');
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
        <Title>Edit profile</Title>
        <Field label="Display name" value={f.displayName} onChangeText={(v) => set('displayName', v)} maxLength={40} />
        <Field label="Username" value={f.handle} onChangeText={(v) => set('handle', v)} autoCapitalize="none" maxLength={20} />
        <Field label="What you do" value={f.headline} onChangeText={(v) => set('headline', v)} maxLength={60} />
        <Field label="City" value={f.city} onChangeText={(v) => set('city', v)} maxLength={40} />
        <Field label="Bio" value={f.bio} onChangeText={(v) => set('bio', v)} maxLength={160} multiline />
        <Field label="Website" value={f.website} onChangeText={(v) => set('website', v)} autoCapitalize="none" maxLength={80} />
        <View style={styles.switchRow}>
          <Text style={{ color: colors.text, flex: 1 }}>Show my email, phone and website on my public profile</Text>
          <Switch value={f.showContact} onValueChange={(v) => set('showContact', v)} trackColor={{ true: colors.accent }} />
        </View>
        <ErrorText>{error}</ErrorText>
        <Btn label="Save" onPress={() => { setError(''); update(f).then(onClose).catch((e) => setError(errMsg(e))); }} />
        <Btn label="Cancel" kind="ghost" onPress={onClose} />
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 14, paddingBottom: 32 },
  head: { alignItems: 'center', gap: 4, paddingTop: 8 },
  name: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 8 },
  muted: { color: colors.muted, fontSize: 13 },
  bio: { color: colors.text, textAlign: 'center', marginTop: 6, maxWidth: 320 },
  stats: { flexDirection: 'row', borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.surface },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statN: { color: colors.text, fontSize: 20, fontWeight: '800' },
  box: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.surface, padding: 14, gap: 8 },
  boxTitle: { color: colors.muted, fontSize: 12, letterSpacing: 1.5, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.line },
  tab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabOn: { borderBottomColor: colors.text },
  item: { padding: 14, borderRadius: radius.md, backgroundColor: colors.surface, gap: 2 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
