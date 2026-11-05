// Android and iOS implementation. Needs a development build (not Expo Go) because it uses native Firebase.
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getApp } from '@react-native-firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  onIdTokenChanged,
  signInWithCredential,
  signInWithPhoneNumber,
  signOut as fbSignOut,
} from '@react-native-firebase/auth';
import { getDownloadURL, getStorage, putFile, ref } from '@react-native-firebase/storage';

export type AuthUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
};

export const firebaseConfigured = true;

GoogleSignin.configure({ webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID });

const auth = () => getAuth(getApp());

export function subscribeAuth(cb: (u: AuthUser | null) => void): () => void {
  return onIdTokenChanged(auth(), (u) =>
    cb(u ? { uid: u.uid, displayName: u.displayName, email: u.email, phoneNumber: u.phoneNumber, photoURL: u.photoURL } : null),
  );
}

export async function getIdToken(forceRefresh: boolean): Promise<string | null> {
  const user = auth().currentUser;
  return user ? await user.getIdToken(forceRefresh) : null;
}

export async function signInWithGoogle(): Promise<void> {
  await GoogleSignin.hasPlayServices();
  const res = await GoogleSignin.signIn();
  if (res.type !== 'success' || !res.data.idToken) throw new Error('Google sign-in was cancelled.');
  await signInWithCredential(auth(), GoogleAuthProvider.credential(res.data.idToken));
}

let confirmation: Awaited<ReturnType<typeof signInWithPhoneNumber>> | null = null;

export async function sendPhoneCode(phone: string): Promise<void> {
  confirmation = await signInWithPhoneNumber(auth(), phone);
}

export async function confirmPhoneCode(code: string): Promise<void> {
  if (!confirmation) throw new Error('Ask for a code first.');
  await confirmation.confirm(code);
  confirmation = null;
}

export async function signOut(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch {
    /* not signed in with Google */
  }
  await fbSignOut(auth());
}

/** Uploads a local file to Firebase Storage and returns its public download URL. */
export async function uploadFileToStorage(localUri: string, path: string, contentType: string): Promise<string> {
  const r = ref(getStorage(getApp()), path);
  await putFile(r, localUri.replace(/^file:\/\//, ''), { contentType });
  return await getDownloadURL(r);
}
