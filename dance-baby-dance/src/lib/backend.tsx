import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ConvexProviderWithAuth, ConvexReactClient, useMutation, useQuery } from 'convex/react';
import { anyApi } from 'convex/server';
import { getIdToken, subscribeAuth, type AuthUser } from './firebase';

export const api = anyApi;

const url = process.env.EXPO_PUBLIC_CONVEX_URL;
export const convexConfigured = !!url;
const convex = new ConvexReactClient(url ?? 'https://not-configured.convex.cloud', { unsavedChangesWarning: false });

type AuthCtx = { user: AuthUser | null; loading: boolean };
const FirebaseAuthContext = createContext<AuthCtx>({ user: null, loading: true });

function FirebaseAuthState({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthCtx>({ user: null, loading: true });
  useEffect(() => subscribeAuth((user) => setState({ user, loading: false })), []);
  return <FirebaseAuthContext.Provider value={state}>{children}</FirebaseAuthContext.Provider>;
}

/** Lets Convex use the Firebase sign-in token. */
function useFirebaseForConvex() {
  const { user, loading } = useContext(FirebaseAuthContext);
  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => (await getIdToken(forceRefreshToken)) ?? null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.uid],
  );
  return useMemo(() => ({ isLoading: loading, isAuthenticated: !!user, fetchAccessToken }), [loading, user, fetchAccessToken]);
}

export function BackendProvider({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseAuthState>
      <ConvexProviderWithAuth client={convex} useAuth={useFirebaseForConvex}>
        <EnsureProfile>{children}</EnsureProfile>
      </ConvexProviderWithAuth>
    </FirebaseAuthState>
  );
}

/** Creates the profile row the first time someone signs in. */
function EnsureProfile({ children }: { children: React.ReactNode }) {
  const { user } = useContext(FirebaseAuthContext);
  const me = useQuery(api.users.current, user ? {} : 'skip') as unknown;
  const ensure = useMutation(api.users.ensure);
  useEffect(() => {
    if (user && me === null) ensure({}).catch(() => {});
  }, [user, me, ensure]);
  return <>{children}</>;
}

export const useFirebaseUser = () => useContext(FirebaseAuthContext);
