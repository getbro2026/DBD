# Dance Baby Dance (Expo app, first slice)

A short-video dance challenge app. Someone posts a dance step of 30 seconds to 1 minute, others accept it, record or upload the same step, and the response is shown next to the original in a split screen with the original creator tagged.

## What works in this slice

- Feed with the split-screen view. Switch between stacked and side by side. Tap to pause both clips.
- Step through the responses to a challenge, like a response, share a challenge.
- Trending list that opens a challenge in the feed.
- Create flow: record in the app (3-2-1 countdown, ghost overlay and reference clip when accepting) or upload a video.
- Clip length rule of 30 seconds to 1 minute, checked on record and on upload, with a plain message when a clip is too short or too long.
- Posting adds the response to the challenge, or creates a new challenge.

Everything is held in memory with sample data. Restarting the app resets it. Clips in the sample data show an animated stick figure instead of video.

## Status

Type-checked and bundled for Android and iOS on Expo SDK 58 (React Native 0.88). The feed, both split layouts, Trending and the create screen were rendered and clicked through with no errors. Camera recording and video upload still need a test on a real phone, since they can't run without one.

Fixed in this pass:
- Two React Native APIs that newer versions removed (`StyleSheet.absoluteFillObject`, status bar background color).
- Safe areas now use `react-native-safe-area-context`, so the tab bar no longer sits under the Android navigation bar (newer Expo is edge-to-edge only).
- Camera and microphone permissions are asked one after the other. If access was turned off, the button opens Settings.
- Cancel during the 3-2-1 countdown goes back to the ready state instead of closing the screen.
- Leaving the recorder mid-recording stops the camera and discards the clip.
- The Android back button returns to the feed instead of closing the app.
- `app.json` has the app name, dark theme and the camera, microphone and photo-library permission texts.

## Run it

This is a complete Expo project.

```
npm install
npx expo start
```

Scan the QR code with the Expo Go app on your phone. Expo Go must support SDK 58, which the current store version does.

## Folder map

```
App.tsx                      tab bar and routing
src/store.tsx                app state (challenges, likes, layout)
src/data/sample.ts           sample challenges and responses
src/lib/clip.ts              30s to 1 min rule, time formatting
src/lib/usePlayhead.ts       shared playhead for the split screen
src/components/SplitView.tsx the split screen
src/components/ClipPane.tsx  one clip: video or placeholder, tag, timer
src/components/Dancer.tsx    animated placeholder figure
src/components/RecorderStep.tsx  camera, countdown, recording
src/screens/FeedScreen.tsx
src/screens/TrendingScreen.tsx
src/screens/CreateScreen.tsx
```

## Next steps, in order

1. Test recording and upload on a real Android phone and iPhone.
2. Add a backend. Supabase or Firebase for sign-in and data (users, challenges, responses, likes, tags), and Mux or Cloudflare Stream to upload and stream video.
3. Replace the shared playhead with the real video player clock so both clips stay in sync.
4. Licensed sound library, and report and block.
5. Sponsored challenges, then tips and subscription.
6. Accuracy score last. It is the hardest piece, and the sample data only shows a placeholder number.
