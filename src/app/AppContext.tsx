import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  addKidToStore,
  deleteKidFromStore,
  getActiveProfile,
  loadProfilesStore,
  renameKidInStore,
  saveProfilesStore,
  switchActiveProfile,
  updateKidSettingsInStore,
  updateKidStatsInStore,
} from "../storage/profiles";
import { KidLearningStats, KidProfile, KidSettings, ProfilesStore } from "../storage/schema";

interface AppContextValue {
  ready: boolean;
  store: ProfilesStore | null;
  activeProfile: KidProfile | null;
  setActiveProfile: (profileId: string) => void;
  addKid: (name: string) => void;
  renameKid: (profileId: string, name: string) => void;
  deleteKid: (profileId: string) => void;
  updateActiveSettings: (patch: Partial<KidSettings>) => void;
  updateActiveStats: (updater: (stats: KidLearningStats) => KidLearningStats) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [ready, setReady] = useState(false);
  const [store, setStore] = useState<ProfilesStore | null>(null);

  useEffect(() => {
    loadProfilesStore()
      .then((loaded) => setStore(loaded))
      .finally(() => setReady(true));
  }, []);

  const applyStoreUpdate = useCallback((updater: (current: ProfilesStore) => ProfilesStore): void => {
    setStore((current) => {
      if (!current) {
        return current;
      }
      const next = updater(current);
      saveProfilesStore(next).catch(() => {
        // Keep UI responsive even if persistence fails temporarily.
      });
      return next;
    });
  }, []);

  const activeProfile = useMemo(() => (store ? getActiveProfile(store) : null), [store]);

  const setActiveProfile = useCallback(
    (profileId: string) => {
      applyStoreUpdate((current) => switchActiveProfile(current, profileId));
    },
    [applyStoreUpdate],
  );

  const addKid = useCallback(
    (name: string) => {
      applyStoreUpdate((current) => addKidToStore(current, name));
    },
    [applyStoreUpdate],
  );

  const renameKid = useCallback(
    (profileId: string, name: string) => {
      applyStoreUpdate((current) => renameKidInStore(current, profileId, name));
    },
    [applyStoreUpdate],
  );

  const deleteKid = useCallback(
    (profileId: string) => {
      applyStoreUpdate((current) => deleteKidFromStore(current, profileId));
    },
    [applyStoreUpdate],
  );

  const updateActiveSettings = useCallback(
    (patch: Partial<KidSettings>) => {
      if (!activeProfile) {
        return;
      }
      applyStoreUpdate((current) => updateKidSettingsInStore(current, activeProfile.id, patch));
    },
    [activeProfile, applyStoreUpdate],
  );

  const updateActiveStats = useCallback(
    (updater: (stats: KidLearningStats) => KidLearningStats) => {
      if (!activeProfile) {
        return;
      }
      applyStoreUpdate((current) => updateKidStatsInStore(current, activeProfile.id, updater));
    },
    [activeProfile, applyStoreUpdate],
  );

  return (
    <AppContext.Provider
      value={{
        ready,
        store,
        activeProfile,
        setActiveProfile,
        addKid,
        renameKid,
        deleteKid,
        updateActiveSettings,
        updateActiveStats,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider.");
  }
  return context;
}
