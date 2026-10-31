import React, { createContext, useContext, useMemo, useReducer } from 'react';
import { sampleChallenges } from './data/sample';
import { Challenge, Response } from './types';

type State = {
  challenges: Challenge[];
  /** true = original and response side by side, false = stacked */
  side: boolean;
};

type Action =
  | { type: 'toggleLayout' }
  | { type: 'toggleLike'; challengeId: string; responseId: string }
  | { type: 'addResponse'; challengeId: string; response: Response }
  | { type: 'addChallenge'; challenge: Challenge };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'toggleLayout':
      return { ...state, side: !state.side };
    case 'toggleLike':
      return {
        ...state,
        challenges: state.challenges.map((c) =>
          c.id !== action.challengeId
            ? c
            : {
                ...c,
                responses: c.responses.map((r) =>
                  r.id !== action.responseId
                    ? r
                    : { ...r, liked: !r.liked, likes: r.likes + (r.liked ? -1 : 1) },
                ),
              },
        ),
      };
    case 'addResponse':
      return {
        ...state,
        challenges: state.challenges.map((c) =>
          c.id === action.challengeId ? { ...c, responses: [action.response, ...c.responses] } : c,
        ),
      };
    case 'addChallenge':
      return { ...state, challenges: [action.challenge, ...state.challenges] };
    default:
      return state;
  }
}

type Store = State & {
  toggleLayout: () => void;
  toggleLike: (challengeId: string, responseId: string) => void;
  addResponse: (challengeId: string, response: Response) => void;
  addChallenge: (challenge: Challenge) => void;
};

const AppContext = createContext<Store | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { challenges: sampleChallenges, side: false });

  const value = useMemo<Store>(
    () => ({
      ...state,
      toggleLayout: () => dispatch({ type: 'toggleLayout' }),
      toggleLike: (challengeId, responseId) => dispatch({ type: 'toggleLike', challengeId, responseId }),
      addResponse: (challengeId, response) => dispatch({ type: 'addResponse', challengeId, response }),
      addChallenge: (challenge) => dispatch({ type: 'addChallenge', challenge }),
    }),
    [state],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): Store {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
