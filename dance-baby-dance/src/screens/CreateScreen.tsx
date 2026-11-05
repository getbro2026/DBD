import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQuery } from 'convex/react';
import { api, useFirebaseUser } from '../lib/backend';
import { uploadFileToStorage } from '../lib/firebase';
import { checkClipLength, formatTime, MAX_CLIP_SEC, MIN_CLIP_SEC } from '../lib/clip';
import { RecorderStep } from '../components/RecorderStep';
import { useNav } from '../nav';
import { colors } from '../theme';
import { ChallengeDetail } from '../types';
import { Btn, errMsg, ErrorText, Field, Muted, Title } from '../components/ui';

type Clip = { uri: string; durationSec: number };

export function CreateScreen({ acceptId }: { acceptId?: string }) {
  const { go, back } = useNav();
  const { user } = useFirebaseUser();
  const detail = useQuery(api.challenges.get, acceptId ? { id: acceptId } : 'skip') as ChallengeDetail | null | undefined;
  const createChallenge = useMutation(api.challenges.create);
  const addResponse = useMutation(api.challenges.addResponse);

  const [step, setStep] = useState<'pick' | 'record' | 'details'>('pick');
  const [clip, setClip] = useState<Clip | null>(null);
  const [tag, setTag] = useState('');
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!user) {
    return (
      <View style={styles.body}>
        <Title>Log in to post</Title>
        <Muted>Create an account to start challenges and accept them.</Muted>
        <Btn label="Log in or sign up" onPress={() => go({ name: 'login' })} />
      </View>
    );
  }

  const target = detail?.challenge;
  const check = clip ? checkClipLength(clip.durationSec) : null;

  const pickVideo = async () => {
    setError('');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], allowsEditing: true, videoMaxDuration: MAX_CLIP_SEC, quality: 1 });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.duration == null) return setError("Couldn't read the length of that video. Pick another one.");
    // expo-image-picker reports video duration in milliseconds.
    setClip({ uri: asset.uri, durationSec: asset.duration / 1000 });
    setStep('details');
  };

  const post = async () => {
    if (!clip || !check?.ok) return;
    setError('');
    setBusy(true);
    try {
      const ext = clip.uri.toLowerCase().includes('.mov') ? 'mov' : 'mp4';
      const videoUrl = await uploadFileToStorage(clip.uri, `videos/${user.uid}/${Date.now()}.${ext}`, ext === 'mov' ? 'video/quicktime' : 'video/mp4');
      if (acceptId) {
        await addResponse({ challengeId: acceptId, caption, videoUrl, durationSec: clip.durationSec });
        go({ name: 'challenge', id: acceptId });
      } else {
        const id = (await createChallenge({ tag, caption, videoUrl, durationSec: clip.durationSec })) as string;
        go({ name: 'challenge', id });
      }
    } catch (e) {
      setError(errMsg(e, 'Could not post. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  if (step === 'record') {
    return <RecorderStep challenge={target} onCancel={() => setStep('pick')} onRecorded={(c) => { setClip(c); setError(''); setStep('details'); }} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Title>{acceptId ? (target?.tag ?? 'Accept challenge') : 'Show your step'}</Title>
      <Muted>
        Clips run {formatTime(MIN_CLIP_SEC)} to {formatTime(MAX_CLIP_SEC)}.
        {acceptId && target ? ` Your response is posted next to @${target.creator.handle}'s original and they are tagged.` : ''}
      </Muted>

      {step === 'pick' || !clip ? (
        <>
          <Btn label="Record now" onPress={() => { setError(''); setStep('record'); }} />
          <Btn label="Upload a video" kind="ghost" onPress={pickVideo} />
        </>
      ) : (
        <>
          <Text style={check?.ok ? styles.ok : styles.bad}>{check?.message}</Text>
          {!acceptId ? <Field label="Challenge name" value={tag} onChangeText={setTag} placeholder="BabyStepChallenge" autoCapitalize="none" maxLength={31} /> : null}
          <Field label="Caption" value={caption} onChangeText={setCaption} placeholder="My take on the step" maxLength={120} />
          <Btn label={busy ? 'Uploading...' : acceptId ? 'Post response' : 'Post challenge'} busy={busy} disabled={!check?.ok || (!acceptId && tag.replace(/^#/, '').length < 3)} onPress={post} />
          <Btn label={check && !check.ok ? 'Choose another' : 'Retake'} kind="ghost" disabled={busy} onPress={() => { setClip(null); setStep('pick'); }} />
        </>
      )}
      <ErrorText>{error}</ErrorText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 14 },
  ok: { color: colors.ok, fontSize: 14 },
  bad: { color: colors.danger, fontSize: 14 },
});
