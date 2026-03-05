import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useMemo, useState } from "react";
import { Alert, Image, Modal, SafeAreaView, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useAppContext } from "../app/AppContext";
import { RootStackParamList } from "../app/navigation";
import AppText from "../components/AppText";
import IconButton from "../components/IconButton";
import { resolveBackgroundColor } from "../theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;
type EditorMode = "add" | "rename" | null;

export default function HomeScreen({ navigation }: Props): React.JSX.Element {
  const { activeProfile, store, setActiveProfile, addKid, renameKid, deleteKid } = useAppContext();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [draftName, setDraftName] = useState("");
  const canDelete = useMemo(() => (store?.profiles.length ?? 0) > 1, [store?.profiles.length]);
  const backgroundColor = resolveBackgroundColor(activeProfile?.settings.backgroundThemeId);

  const openAdd = (): void => {
    setDraftName("");
    setEditorMode("add");
  };

  const openRename = (): void => {
    setDraftName(activeProfile?.name ?? "");
    setEditorMode("rename");
  };

  const closeEditor = (): void => {
    setEditorMode(null);
    setDraftName("");
  };

  const submitEditor = (): void => {
    const trimmed = draftName.trim();
    if (!trimmed) {
      return;
    }
    if (editorMode === "add") {
      addKid(trimmed);
    } else if (editorMode === "rename" && activeProfile) {
      renameKid(activeProfile.id, trimmed);
    }
    closeEditor();
  };

  const confirmDelete = (): void => {
    if (!activeProfile || !canDelete) {
      return;
    }
    Alert.alert("Delete kid profile?", `Delete ${activeProfile.name}? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteKid(activeProfile.id),
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <IconButton icon="person" label="Profiles" onPress={() => setDrawerOpen(true)} haptic="light" />
          <Image source={require("../../assets/branding/outfoxed-logo.png")} style={styles.logo} resizeMode="contain" />
          <IconButton icon="gear" label="Settings" onPress={() => navigation.navigate("Settings")} haptic="light" />
        </View>

        <View style={styles.mainActions}>
          <IconButton
            icon="eye"
            label="Focus Mode"
            size="large"
            onPress={() => navigation.navigate("FocusSetup")}
            style={styles.actionButton}
            haptic="light"
          />
          <IconButton
            icon="trophy"
            label="Progression"
            size="large"
            onPress={() => navigation.navigate("Game", { mode: "progression" })}
            style={styles.actionButton}
            haptic="light"
          />
        </View>
      </ScrollView>

      <Modal visible={drawerOpen} transparent animationType="fade" onRequestClose={() => setDrawerOpen(false)}>
        <View style={styles.drawerOverlay}>
          <View style={styles.drawerCard}>
            <AppText weight="bold" style={styles.drawerTitle}>
              Kid Profiles
            </AppText>

            <View style={styles.profileList}>
              {store?.profiles.map((profile) => {
                const selected = profile.id === activeProfile?.id;
                return (
                  <IconButton
                    key={profile.id}
                    icon="person"
                    label={profile.name}
                    onPress={() => setActiveProfile(profile.id)}
                    style={[styles.profileButton, selected && styles.profileButtonSelected]}
                    iconColor={selected ? "#FFFFFF" : "#1A4D9C"}
                    textColor={selected ? "#FFFFFF" : "#1A4D9C"}
                    haptic="light"
                  />
                );
              })}
            </View>

            <View style={styles.drawerActions}>
              <IconButton icon="plus-circle" label="Add Kid" onPress={openAdd} haptic="light" style={styles.drawerAction} />
              <IconButton icon="person" label="Rename Kid" onPress={openRename} haptic="light" style={styles.drawerAction} />
              <IconButton
                icon="trash"
                label="Delete Kid"
                onPress={confirmDelete}
                haptic="error"
                style={styles.drawerAction}
                disabled={!canDelete}
              />
            </View>

            <IconButton icon="x-circle" label="Close" onPress={() => setDrawerOpen(false)} style={styles.closeDrawer} />
          </View>
        </View>
      </Modal>

      <Modal visible={editorMode !== null} transparent animationType="fade" onRequestClose={closeEditor}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <AppText weight="bold" style={styles.modalTitle}>
              {editorMode === "add" ? "Add Kid" : "Rename Kid"}
            </AppText>
            <TextInput
              autoFocus
              value={draftName}
              onChangeText={setDraftName}
              style={styles.input}
              placeholder="Kid name"
              maxLength={20}
            />
            <View style={styles.modalButtons}>
              <IconButton icon="x-circle" label="Cancel" onPress={closeEditor} style={styles.modalButton} />
              <IconButton icon="check-circle" label="Save" onPress={submitEditor} style={styles.modalButton} haptic="light" />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 26,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 16,
  },
  logo: {
    width: 160,
    height: 76,
  },
  mainActions: {
    marginTop: 14,
    gap: 14,
  },
  actionButton: {
    borderRadius: 24,
    minHeight: 130,
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: "rgba(22, 34, 54, 0.36)",
    justifyContent: "flex-start",
  },
  drawerCard: {
    width: "82%",
    maxWidth: 340,
    height: "100%",
    backgroundColor: "#FFFFFF",
    paddingTop: 60,
    paddingHorizontal: 16,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 1,
    borderColor: "#D7E2EE",
  },
  drawerTitle: {
    fontSize: 28,
    color: "#1D334E",
    marginBottom: 10,
  },
  profileList: {
    gap: 8,
    marginBottom: 14,
  },
  profileButton: {
    borderRadius: 14,
  },
  profileButtonSelected: {
    backgroundColor: "#1A4D9C",
    borderColor: "#1A4D9C",
  },
  drawerActions: {
    gap: 8,
  },
  drawerAction: {
    borderRadius: 14,
  },
  closeDrawer: {
    marginTop: 16,
    borderRadius: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(18, 28, 46, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 22,
    color: "#1F3653",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#B4C9E0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: "#F8FBFF",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  modalButton: {
    borderRadius: 12,
  },
});
