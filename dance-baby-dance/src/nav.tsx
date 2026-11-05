import React, { createContext, useContext } from 'react';
import { Route } from './types';

type Nav = { route: Route; go: (r: Route) => void; back: () => void };
const NavContext = createContext<Nav | null>(null);

export const NavProvider = NavContext.Provider;

export function useNav(): Nav {
  const n = useContext(NavContext);
  if (!n) throw new Error('useNav must be used inside NavProvider');
  return n;
}
