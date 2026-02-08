'use client';

import {
  createContext,
  useContext,
  useTransition,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

type NavTransitionContextType = {
  isNavigating: boolean;
  navigate: (href: string) => void;
};

const NavTransitionContext = createContext<NavTransitionContextType>({
  isNavigating: false,
  navigate: () => {},
});

export function useNavTransition() {
  return useContext(NavTransitionContext);
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();

  const navigate = useCallback(
    (href: string) => {
      startTransition(() => {
        router.push(href);
      });
    },
    [router, startTransition],
  );

  return (
    <NavTransitionContext.Provider value={{ isNavigating, navigate }}>
      {children}
    </NavTransitionContext.Provider>
  );
}
