import { createContext, useContext, useMemo, useState } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';

import { defaultFlags } from '../../utils/featureFlags';

type FlagMap = Record<string, boolean>;

interface FeatureFlagContextValue {
  flags: FlagMap;
  setFlag: (flag: string, value: boolean) => void;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | undefined>(undefined);

export const FeatureFlagProvider = ({ children }: PropsWithChildren): ReactNode => {
  const [flags, setFlags] = useState<FlagMap>(defaultFlags);

  const value = useMemo<FeatureFlagContextValue>(
    () => ({
      flags,
      setFlag: (flag, value) =>
        setFlags((prev) => ({
          ...prev,
          [flag]: value,
        })),
    }),
    [flags],
  );

  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>;
};

export const useFeatureFlag = (flag: string): boolean => {
  const context = useContext(FeatureFlagContext);

  if (!context) {
    throw new Error('useFeatureFlag must be used within FeatureFlagProvider');
  }

  return context.flags[flag] ?? false;
};

export const useFeatureFlags = (): FeatureFlagContextValue => {
  const context = useContext(FeatureFlagContext);

  if (!context) {
    throw new Error('useFeatureFlags must be used within FeatureFlagProvider');
  }

  return context;
};
