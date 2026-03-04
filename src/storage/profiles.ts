import AsyncStorage from "@react-native-async-storage/async-storage";
import { KidLearningStats, KidProfile, KidSettings, ProfilesStore, STORAGE_KEY, createDefaultStore, createKidProfile } from "./schema";

function ensureValidStore(store: ProfilesStore | null | undefined): ProfilesStore {
  if (!store || !Array.isArray(store.profiles) || store.profiles.length === 0) {
    return createDefaultStore();
  }
  const activeExists = store.profiles.some((profile) => profile.id === store.activeProfileId);
  return {
    ...store,
    activeProfileId: activeExists ? store.activeProfileId : store.profiles[0].id,
  };
}

export async function loadProfilesStore(): Promise<ProfilesStore> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = createDefaultStore();
    await saveProfilesStore(initial);
    return initial;
  }

  try {
    const parsed = JSON.parse(raw) as ProfilesStore;
    return ensureValidStore(parsed);
  } catch {
    const fallback = createDefaultStore();
    await saveProfilesStore(fallback);
    return fallback;
  }
}

export async function saveProfilesStore(store: ProfilesStore): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getActiveProfile(store: ProfilesStore): KidProfile {
  return (
    store.profiles.find((profile) => profile.id === store.activeProfileId) ??
    store.profiles[0]
  );
}

export function switchActiveProfile(store: ProfilesStore, profileId: string): ProfilesStore {
  if (!store.profiles.some((profile) => profile.id === profileId)) {
    return store;
  }
  return { ...store, activeProfileId: profileId };
}

export function addKidToStore(store: ProfilesStore, name: string): ProfilesStore {
  const kid = createKidProfile(name);
  return {
    activeProfileId: kid.id,
    profiles: [...store.profiles, kid],
  };
}

export function renameKidInStore(store: ProfilesStore, profileId: string, newName: string): ProfilesStore {
  const name = newName.trim();
  if (!name) {
    return store;
  }
  return {
    ...store,
    profiles: store.profiles.map((profile) =>
      profile.id === profileId
        ? {
            ...profile,
            name,
          }
        : profile,
    ),
  };
}

export function deleteKidFromStore(store: ProfilesStore, profileId: string): ProfilesStore {
  if (store.profiles.length <= 1) {
    return store;
  }
  const profiles = store.profiles.filter((profile) => profile.id !== profileId);
  return {
    profiles,
    activeProfileId: profiles.some((profile) => profile.id === store.activeProfileId)
      ? store.activeProfileId
      : profiles[0].id,
  };
}

export function updateKidSettingsInStore(
  store: ProfilesStore,
  profileId: string,
  patch: Partial<KidSettings>,
): ProfilesStore {
  return {
    ...store,
    profiles: store.profiles.map((profile) =>
      profile.id === profileId
        ? {
            ...profile,
            settings: {
              ...profile.settings,
              ...patch,
            },
          }
        : profile,
    ),
  };
}

export function updateKidStatsInStore(
  store: ProfilesStore,
  profileId: string,
  updater: (current: KidLearningStats) => KidLearningStats,
): ProfilesStore {
  return {
    ...store,
    profiles: store.profiles.map((profile) =>
      profile.id === profileId
        ? {
            ...profile,
            stats: updater(profile.stats),
          }
        : profile,
    ),
  };
}
