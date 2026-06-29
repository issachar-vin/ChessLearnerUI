import { useCallback, useState } from "react";
import type { Profile } from "../types/chess";

const PROFILE_KEY = "chesslearner.profile";

const DEFAULT_PROFILE: Profile = {
  name: "Player",
  icon: { type: "piece", piece: "p" },
};

function load(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Profile;
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(load);

  const save = useCallback((next: Profile) => {
    const cleaned: Profile = { ...next, name: next.name.trim() || DEFAULT_PROFILE.name };
    setProfile(cleaned);
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(cleaned));
    } catch {
      /* storage unavailable or image too large — ignore */
    }
  }, []);

  return { profile, save };
}
