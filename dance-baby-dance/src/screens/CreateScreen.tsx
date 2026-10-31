import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { RecorderStep } from '../components/RecorderStep';
import { checkClipLength, formatTime, MAX_CLIP_SEC, MIN_CLIP_SEC } from '../lib/clip';
import { useApp } from '../store';
import { colors, radius } from '../theme';

type Props = {
  /** Set when accepting a challenge. Leave empty to start a new challenge. */
  challengeId?: string;
  onDone: (challengeId: string) => void;
  onCancel: () => void;
};

type Clip = { uri: string; durationSec: number };

const ME = { handle: '@you', initials: 'YOU' };

function normalizeTag(input: string): string {
  const cleaned = input.replace(/[^A-Za-z0-9_]/g, '');
  return cleaned ? `#${cleaned}` : '';
}

export function CreateScreen({ challengeId, onDone, onCancel }: Props) {
  const { challenges, addChallenge, addResponse } = useApp();
  const challenge = challenges.find((c) => c.id === challengeId);

  const [step, setStep] = useState<'pick' | 'record' | 'details'>('pick');
  const [clip, setClip] = useState<Clip | null>(null);
  const [caption, setCaption] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');

  const pickVideo = async () => {
    setError('');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      videoMaxDuration: MAX_CLIP_SEC,
      quality: 1,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.duration == null) {
      setError("Couldn't read the length of that video. Pick another one.");
      return;
    }
    // expo-image-picker reports video duration in milliseconds.
    setClip({ uri: asset.uri, durationSec: asset.duration / 1000 });
    setStep('details');
  };

  const post = () => {
    if (!clip) return;
    const check = checkClipLength(clip.durationSec);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    if (challenge) {
      addResponse(challenge.id, {
        id: `r${Date.now()}`,
        creator: ME,
        durationSec: clip.durationSec,
        likes: 0,
        caption: caption.trim() || undefined,
        uri: clip.uri,
      });
      onDone(challenge.id);
      return;
    }
    const tag = normalizeTag(tagInput);
    if (tag.length < 4) {
      setError('Name your challenge with at least 3 letters, for example BabyStepChallenge.');
      return;
    }
    const id = `c${Date.now()}`;
    addChallenge({
      id,
      tag,
      creator: ME,
      durationSec: clip.durationSec,
      acceptedLabel: '0 accepted',
      uri: clip.uri,
      responses: [],
    });
    onDone(id);
  };

  if (step === 'record') {
    return (
      <RecorderStep
        challenge={challenge}
        onCancel={() => setStep('pick')}
        onRecorded={(c) => {
          setClip(c);
          setError('');
          setStep('details');
        }}
      />
    );
  }

  const check = clip ? checkClipLength(clip.durationSec) : null;

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <Text style={styles.title}>{challenge ? 'accept challenge' : 'new challenge'}</Text>
        <Pressable style={styles.ghost} onPress={onCancel} accessibilityRole="button">
          <Text style={styles.ghostText}>Close</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {step === 'pick' ? (
          <>
            <Text style={styles.h}>{challenge ? challenge.tag : 'Show your step'}</Text>
            <Text style={styles.muted}>
              Clips run {formatTime(MIN_CLIP_SEC)} to {formatTime(MAX_CLIP_SEC)}.
              {challenge ? ` Your response is posted next to ${challenge.creator.handle}'s original and they are tagged.` : ''}
            </Text>
            <Pressable style={styles.cta} onPress={() => { setError(''); setStep('record'); }} accessibilityRole="button">
              <Text style={styles.ctaText}>Record now</Text>
            </Pressable>
            <Pressable style={styles.ghostWide} onPress={pickVideo} accessibilityRole="button">
              <Text style={styles.ghostText}>Upload a video</Text>
            </Pressable>
            {error ? <Text style={styles.bad}>{error}</Text> : null}
          </>
        ) : (
          <>
            <Text style={styles.h}>Add details</Text>
            {check ? <Text style={check.ok ? styles.ok : styles.bad}>{check.message}</Text> : null}

            {!challenge ? (
              <View style={styles.field}>
                <Text style={styles.label}>Challenge name</Text>
                <TextInput
                  style={styles.input}
                  value={tagInput}
                  onChangeText={(v) => { setTagInput(v); setError(''); }}
                  placeholder="BabyStepChallenge"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  maxLength={30}
                />
              </View>
            ) : (
              <Text style={styles.muted}>Tagging {challenge.creator.handle} automatically.</Text>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Caption</Text>
              <TextInput
                style={styles.input}
                value={caption}
                onChangeText={setCaption}
                placeholder="My take on the step"
                placeholderTextColor={colors.muted}
                maxLength={80}
              />
            </View>

            {error && check?.ok !== false ? <Text style={styles.bad}>{error}</Text> : null}

            <View style={styles.row}>
              <Pressable style={styles.cta} onPress={post} accessibilityRole="button">
                <Text style={styles.ctaText}>{challenge ? 'Post response' : 'Post challenge'}</Text>
              </Pressable>
              <Pressable
                style={styles.ghostWide}
                onPress={() => { setClip(null); setError(''); setStep('pick'); }}
                accessibilityRole="button"
              >
                <Text style={styles.ghostText}>{check && !check.ok ? 'Choose another' : 'Retake'}</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  title: { color: colors.text, fontSize: 17, fontWeight: '800' },
  body: { padding: 16, gap: 14 },
  h: { color: colors.text, fontSize: 22, fontWeight: '800' },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  ok: { color: colors.ok, fontSize: 14 },
  bad: { color: colors.danger, fontSize: 14 },
  field: { gap: 6 },
  label: { color: colors.muted, fontSize: 13 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: '#4A3D57', borderRadius: radius.sm, color: colors.text, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  cta: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: 18, paddingVertical: 12, alignSelf: 'flex-start' },
  ctaText: { color: colors.onAccent, fontSize: 14, fontWeight: '700' },
  ghost: { borderWidth: 1, borderColor: '#4A3D57', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  ghostWide: { borderWidth: 1, borderColor: '#4A3D57', borderRadius: radius.pill, paddingHorizontal: 18, paddingVertical: 12, alignSelf: 'flex-start' },
  ghostText: { color: colors.text, fontSize: 14 },
});
