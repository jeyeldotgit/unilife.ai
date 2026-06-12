"use client";

import type { UserProfile } from "@unilife-ai/types";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getProfileClient } from "@/lib/api/profile-client";
import { resolveProfileTimeZone } from "@/lib/profile/time";

type ProfileContextValue = {
  error: string | null;
  loading: boolean;
  profile: UserProfile | null;
  refreshProfile: () => Promise<void>;
  resolvedTimeZone: string;
  setProfile: (profile: UserProfile | null) => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({
  children,
  initialProfile,
}: {
  children: ReactNode;
  initialProfile: UserProfile | null;
}) {
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const [loading, setLoading] = useState(initialProfile === null);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = async () => {
    setLoading(true);

    try {
      const nextProfile = await getProfileClient();
      setProfile(nextProfile);
      setError(null);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "We couldn't load your profile right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialProfile === null) {
      void refreshProfile();
    }
  }, [initialProfile]);

  const value = useMemo(
    () => ({
      error,
      loading,
      profile,
      refreshProfile,
      resolvedTimeZone: resolveProfileTimeZone(profile?.timezone),
      setProfile,
    }),
    [error, loading, profile],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error("useProfile must be used inside ProfileProvider.");
  }

  return context;
}
