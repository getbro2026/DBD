import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { api, useFirebaseUser } from '../lib/backend';
import { usePlayhead } from '../lib/usePlayhead';
import { formatCount } from '../lib/clip';
import { useNav } from '../nav';
import { colors, glass, radius } from '../theme';
import { ChallengeDetail, CommentItem } from '../types';
import { SplitView } from '../components/SplitView';
import { Person } from '../components/Person';
import { Btn, errMsg, ErrorText, Muted } from '../components/ui';

export function ChallengeScreen({ id }: { id: string }) {
  const { go } = useNav();
  const { user } = useFirebaseUser();
  const data = useQuery(api.challenges.get, { id }) as ChallengeDetail | null | undefined;
  const like = useMutation(api.social.toggleLike);
  const subscribe = useMutation(api.social.toggleSubscribe);

  const [ri, setRi] = useState(0);
  const [side, setSide] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [sheet, setSheet] = useState<'none' | 'comments' | 'report'>('none');

  useEffect(() => setRi(0), [id]);

  const count = data?.responses.length ?? 0;
  const response = data?.responses[Math.min(ri, Math.max(0, count - 1))];
  const longest = Math.max(data?.challenge.durationSec ?? 1, response?.durationSec ?? 0);
  const t = usePlayhead(longest, playing, `${id}:${response?.id ?? 'none'}`);

  if (data === undefined) return <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />;
  if (data === null) {
    return (
      <View style={styles.problem}>
        <Text style={styles.problemTitle}>This challenge is not available</Text>
        <Muted>It may have been removed, or the link is wrong.</Muted>
        <Btn label="See what is trending" onPress={() => go({ name: 'trending' })} />
      </View>
    );
  }

  const { challenge, commentCount, subscribedIds, viewerId } = data;
  const needLogin = (): boolean => {
    if (user) return false;
    go({ name: 'login' });
    return true;
  };
  const failAlert = (title: string) => (e: unknown) => Alert.alert(title, errMsg(e));
  const step = (n: number) => count && setRi((i) => (Math.min(i, count - 1) + n + count) % count);
  const subscribed = response ? subscribedIds.includes(response.creator.id) : false;

  return (
    <View style={styles.root}>
      <View style={styles.stage}>
        <SplitView challenge={challenge} response={response} responseIndex={Math.min(ri, Math.max(0, count - 1))} responseCount={count} side={side} playing={playing} t={t} onTogglePlay={() => setPlaying((p) => !p)} />
      </View>
      <View style={styles.bar}>
        <View style={styles.progress}><View style={[styles.fill, { width: `${Math.min(100, (t / longest) * 100)}%` }]} /></View>
        {response ? (
          <View style={styles.who}>
            <Person user={response.creator} size={36} />
            <Pressable style={{ flex: 1 }} onPress={() => go({ name: 'profile', handle: response.creator.handle })}>
              <Text style={styles.handle} numberOfLines={1}>@{response.creator.handle}</Text>
              <Text style={styles.sub} numberOfLines={1}>{response.caption || `Accepted and tagged @${challenge.creator.handle}`}</Text>
            </Pressable>
            {viewerId !== response.creator.id ? (
              <Pressable
                style={[styles.pill, subscribed && styles.pillOn]}
                onPress={() => { if (!needLogin()) subscribe({ handle: response.creator.handle }).catch(failAlert('Could not subscribe')); }}
                accessibilityRole="button"
              >
                <Text style={[styles.pillText, subscribed && { color: colors.accentText }]}>{subscribed ? 'Subscribed' : 'Subscribe'}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View style={styles.stepRow}>
          <Pressable style={styles.stepBtn} onPress={() => step(-1)} accessibilityLabel="Previous response"><Text style={styles.stepText}>‹</Text></Pressable>
          <Text style={styles.muted}>{count === 0 ? 'No responses yet' : `Response ${Math.min(ri, count - 1) + 1} of ${count}`}</Text>
          <Pressable style={styles.stepBtn} onPress={() => step(1)} accessibilityLabel="Next response"><Text style={styles.stepText}>›</Text></Pressable>
        </View>

        <View style={styles.actions}>
          {response ? (
            <Pressable style={[styles.pill, response.likedByMe && styles.pillOn]} onPress={() => { if (!needLogin()) like({ responseId: response.id }).catch(failAlert('Could not like')); }} accessibilityRole="button" accessibilityState={{ selected: response.likedByMe }}>
              <Text style={[styles.pillText, response.likedByMe && { color: colors.accentText }]}>{response.likedByMe ? 'Liked' : 'Like'} · {formatCount(response.likeCount)}</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.pill} onPress={() => setSheet('comments')} accessibilityRole="button"><Text style={styles.pillText}>Comments · {formatCount(commentCount)}</Text></Pressable>
          <Pressable style={styles.pill} onPress={() => Share.share({ message: `Try the ${challenge.tag} challenge on Naalnachana.` }).catch(() => {})} accessibilityRole="button"><Text style={styles.pillText}>Share</Text></Pressable>
          <Pressable style={styles.pill} onPress={() => setSide((s) => !s)} accessibilityRole="button"><Text style={styles.pillText}>{side ? 'Stacked' : 'Side by side'}</Text></Pressable>
        </View>
        <View style={styles.actions}>
          <View style={{ flex: 1 }}><Btn label="Accept challenge" onPress={() => { if (!needLogin()) go({ name: 'create', acceptId: challenge.id }); }} /></View>
          <Pressable style={styles.pill} onPress={() => { if (!needLogin()) setSheet('report'); }} accessibilityRole="button"><Text style={styles.pillText}>Report</Text></Pressable>
        </View>
      </View>

      <Sheet visible={sheet === 'comments'} onClose={() => setSheet('none')}>
        <Comments challengeId={challenge.id} signedIn={!!user} onLogin={() => { setSheet('none'); go({ name: 'login' }); }} />
      </Sheet>
      <Sheet visible={sheet === 'report'} onClose={() => setSheet('none')}>
        <Report targetType={response ? 'response' : 'challenge'} targetId={response ? response.id : challenge.id} onDone={() => setSheet('none')} />
      </Sheet>
    </View>
  );
}

function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}>
        <View style={styles.handleBar} />
        {children}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Comments({ challengeId, signedIn, onLogin }: { challengeId: string; signedIn: boolean; onLogin: () => void }) {
  const list = useQuery(api.social.comments, { challengeId }) as CommentItem[] | undefined;
  const add = useMutation(api.social.addComment);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  return (
    <View style={{ gap: 12, maxHeight: 460 }}>
      <Text style={styles.sheetTitle}>{list ? `${list.length} comments` : 'Comments'}</Text>
      {list === undefined ? <ActivityIndicator color={colors.accent} /> : (
        <FlatList
          data={list}
          keyExtractor={(c) => c.id}
          ListEmptyComponent={<Muted>No comments yet. Say something about this step.</Muted>}
          contentContainerStyle={{ gap: 14 }}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Person user={item.user} size={34} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sub}>@{item.user.handle}{item.isCreator ? '  ·  Creator' : ''}</Text>
                <Text style={{ color: colors.text }}>{item.body}</Text>
              </View>
            </View>
          )}
        />
      )}
      {signedIn ? (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput style={[styles.input, { flex: 1 }]} value={text} onChangeText={setText} placeholder="Add a comment..." placeholderTextColor={colors.muted} maxLength={300} />
            <Btn label="Send" disabled={!text.trim()} onPress={() => { setError(''); add({ challengeId, body: text }).then(() => setText('')).catch((e) => setError(errMsg(e))); }} />
          </View>
          <ErrorText>{error}</ErrorText>
        </View>
      ) : <Btn label="Log in to comment" onPress={onLogin} />}
    </View>
  );
}

function Report({ targetType, targetId, onDone }: { targetType: 'challenge' | 'response'; targetId: string; onDone: () => void }) {
  const report = useMutation(api.social.report);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.sheetTitle}>Report this video</Text>
      <Muted>Tell us what is wrong. A person on our team reviews every report.</Muted>
      <TextInput style={[styles.input, { minHeight: 90, textAlignVertical: 'top', paddingTop: 10 }]} value={reason} onChangeText={setReason} multiline maxLength={300} placeholder="For example: it uses someone else's video." placeholderTextColor={colors.muted} />
      <ErrorText>{error}</ErrorText>
      <Btn label="Send report" disabled={reason.trim().length < 3} onPress={() => report({ targetType, targetId, reason }).then(() => { Alert.alert('Thanks', 'We will review it.'); onDone(); }).catch((e) => setError(errMsg(e)))} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  stage: { flex: 1, marginHorizontal: 12, marginTop: 4, borderRadius: 28, overflow: 'hidden', borderWidth: 2, borderColor: '#fff', backgroundColor: '#fff', shadowColor: '#783C64', shadowOpacity: 0.25, shadowRadius: 20, elevation: 6 },
  progress: { height: 4, borderRadius: 2, backgroundColor: 'rgba(28,20,36,0.1)', overflow: 'hidden' },
  fill: { height: 4, backgroundColor: colors.accent },
  bar: { margin: 12, padding: 12, gap: 10, borderRadius: 28, ...glass },
  who: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  handle: { color: colors.text, fontWeight: '800' },
  sub: { color: colors.muted, fontSize: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' },
  stepText: { color: colors.text, fontSize: 22, lineHeight: 24 },
  muted: { color: colors.muted, fontSize: 13 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  pill: { minHeight: 44, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(255,255,255,0.75)', alignItems: 'center', justifyContent: 'center' },
  pillOn: { borderColor: colors.accent },
  pillText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  problem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  problemTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  scrim: { flex: 1, backgroundColor: 'rgba(255,241,246,0.55)' },
  sheet: { backgroundColor: 'rgba(255,255,255,0.94)', padding: 16, paddingBottom: 28, borderTopLeftRadius: 36, borderTopRightRadius: 36, gap: 12 },
  handleBar: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(28,20,36,0.25)' },
  sheetTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  input: { minHeight: 48, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.edge, borderRadius: radius.sm, color: colors.text, paddingHorizontal: 12 },
});
