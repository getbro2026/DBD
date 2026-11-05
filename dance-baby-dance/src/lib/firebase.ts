// Web implementation (browser). Phones use firebase.native.ts, which has the same exports.
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  getAuth,
  onIdTokenChanged,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut as fbSignOut,
  type ConfirmationResult,
} from 'firebase/auth';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

export type AuthUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
};

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = !!config.apiKey && !!config.projectId;

const app = () => (getApps().length ? getApp() : initializeApp(config));

export function subscribeAuth(cb: (u: AuthUser | null) => void): () => void {
  if (!firebaseConfigured) {
    cb(null);
    return () => {};
  }
  return onIdTokenChanged(getAuth(app()), (u) =>
    cb(u ? { uid: u.uid, displayName: u.displayName, email: u.email, phoneNumber: u.phoneNumber, photoURL: u.photoURL } : null),
  );
}

export async function getIdToken(forceRefresh: boolean): Promise<string | null> {
  if (!firebaseConfigured) return null;
  const user = getAuth(app()).currentUser;
  return user ? await user.getIdToken(forceRefresh) : null;
}

export async function signInWithGoogle(): Promise<void> {
  await signInWithPopup(getAuth(app()), new GoogleAuthProvider());
}

let confirmation: ConfirmationResult | null = null;
let verifier: RecaptchaVerifier | null = null;

export async function sendPhoneCode(phone: string): Promise<void> {
  const auth = getAuth(app());
  if (!verifier) {
    const holder = document.createElement('div');
    document.body.appendChild(holder);
    verifier = new RecaptchaVerifier(auth, holder, { size: 'invisible' });
  }
  confirmation = await signInWithPhoneNumber(auth, phone, verifier);
}

export async function confirmPhoneCode(code: string): Promise<void> {
  if (!confirmation) throw new Error('Ask for a code first.');
  await confirmation.confirm(code);
  confirmation = null;
}

export async function signOut(): Promise<void> {
  await fbSignOut(getAuth(app()));
}

/** Uploads a local file to Firebase Storage and returns its public download URL. */
export async function uploadFileToStorage(localUri: string, path: string, contentType: string): Promise<string> {
  const blob = await (await fetch(localUri)).blob();
  const r = ref(getStorage(app()), path);
  await uploadBytes(r, blob, { contentType });
  return await getDownloadURL(r);
}
