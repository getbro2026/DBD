# Naalnachana

Dance challenges and singing duets, side by side. A person posts a step (30 seconds to 1 minute), others accept it, and each response plays beside the original with the creator tagged.

One Expo codebase runs on Android, iOS and the web.

## How it is built

| Part | What it does |
|---|---|
| **Firebase Authentication** | Sign in with Google or a phone number (text-message code) |
| **Firebase Storage** | Holds the videos. Public to watch, only the owner can upload |
| **Convex** | The database and live updates: challenges, responses, likes, comments, subscriptions, alerts, reports |
| **Expo / React Native** | The app. Camera recording, upload, split-screen playback |

Convex trusts Firebase sign-in tokens, so a person signs in once and both services know who they are.

```
App.tsx                      tabs and navigation
src/lib/firebase.ts          sign-in and upload on the web
src/lib/firebase.native.ts   the same on Android and iOS
src/lib/backend.tsx          connects Convex to Firebase sign-in
src/screens/                 Home, Trending, Challenge, Create, Profile, Alerts, Login
convex/                      database schema and server functions
storage.rules                Firebase Storage security rules
```

## Set it up (about 30 minutes)

You need a Google account for Firebase and a free Convex account.

### 1. Firebase
1. Create a project at https://console.firebase.google.com.
2. **Authentication**, Sign-in method: turn on **Google** and **Phone**.
3. **Storage**: create the default bucket, then paste `storage.rules` into its Rules tab and publish.
4. **Project settings, Your apps**: add a **Web app**, then copy its config into `.env` (see `.env.example`).
5. For phones also add an **Android app** (package `com.naalnachana.app`) and an **iOS app** (bundle `com.naalnachana.app`). Download `google-services.json` and `GoogleService-Info.plist` into this folder. For Android add your signing certificate's SHA-1 and SHA-256 fingerprints.
6. Copy the **Web client ID** (Authentication, Google provider) into `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`. In `app.json` replace `REPLACE_WITH_YOUR_IOS_CLIENT_ID` with your iOS client ID.
7. Phone sign-in needs the Blaze (pay as you go) plan once you go past Firebase's free test numbers. Texts cost money.

### 2. Convex
```bash
npm install
npx convex dev
```
Log in when asked and create a project. It prints your URL: put it in `.env` as `EXPO_PUBLIC_CONVEX_URL`. It also writes `convex/_generated`.

In the Convex dashboard, Settings, Environment Variables, add `FIREBASE_PROJECT_ID` with your Firebase project id. Convex uses it to check sign-in tokens (`convex/auth.config.ts`).

### 3. Run it
```bash
npm run web          # in the browser
```
On phones the app uses native Firebase, so it will not run in Expo Go. Make a development or test build:
```bash
npx eas-cli build -p android --profile preview    # APK you can install
npx eas-cli build -p ios --profile preview        # needs an Apple developer account
```

## Before a public launch
- Test sign-in, recording, upload and the split screen on real phones.
- There is no screen for reviewing reports yet. Reports are stored in the `reports` table, which you can read in the Convex dashboard.
- Add a Privacy Policy, Terms of Use and a way to delete an account. Decide a minimum age.
- Decide how music and copyrighted videos are handled, and how takedowns work.
- Set Firebase and Convex budget alerts. Video storage and streaming costs grow with use.
- The match score is not built into this version yet.

## Type-check
```bash
npx tsc --noEmit
npx tsc --noEmit -p convex
```
