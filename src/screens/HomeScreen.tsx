import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { RootStackParamList } from "../app/navigation";
import NixFox from "../mascot/NixFox";
import { useAppContext } from "../app/AppContext";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

type EditorMode = "add" | "rename" | null;

export default function HomeScreen({ navigation }: Props): React.JSX.Element {
  const { activeProfile, store, setActiveProfile, addKid, renameKid, deleteKid } = useAppContext();
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [draftName, setDraftName] = useState("");

  const canDelete = useMemo(() => (store?.profiles.length ?? 0) > 1, [store?.profiles.length]);

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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Image
          source={require("../../assets/branding/outfoxed-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <NixFox size={168} />

        <Text style={styles.sectionTitle}>Kid Profile</Text>
        <View style={styles.profileRow}>
          {store?.profiles.map((profile) => {
            const selected = profile.id === activeProfile?.id;
            return (
              <Pressable
                key={profile.id}
                style={[styles.profileChip, selected && styles.profileChipSelected]}
                onPress={() => setActiveProfile(profile.id)}
              >
                <Text style={[styles.profileChipText, selected && styles.profileChipTextSelected]}>{profile.name}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.inlineButtons}>
          <Pressable style={styles.smallButton} onPress={openAdd}>
            <Text style={styles.smallButtonText}>Add Kid</Text>
          </Pressable>
          <Pressable style={styles.smallButton} onPress={openRename} disabled={!activeProfile}>
            <Text style={styles.smallButtonText}>Rename Kid</Text>
          </Pressable>
          <Pressable style={[styles.smallButton, !canDelete && styles.buttonDisabled]} onPress={confirmDelete} disabled={!canDelete}>
            <Text style={styles.smallButtonText}>Delete Kid</Text>
          </Pressable>
        </View>

        <View style={styles.mainActions}>
          <Pressable style={styles.actionButton} onPress={() => navigation.navigate("FocusSetup")}>
            <Text style={styles.actionButtonText}>Focus</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={() => navigation.navigate("Game", { mode: "progression" })}>
            <Text style={styles.actionButtonText}>Progression</Text>
          </Pressable>
          <Pressable style={styles.settingsButton} onPress={() => navigation.navigate("Settings")}>
            <Text style={styles.settingsButtonText}>Settings</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={editorMode !== null} transparent animationType="fade" onRequestClose={closeEditor}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editorMode === "add" ? "Add Kid" : "Rename Kid"}</Text>
            <TextInput
              autoFocus
              value={draftName}
              onChangeText={setDraftName}
              style={styles.input}
              placeholder="Kid name"
              maxLength={20}
            />
            <View style={styles.modalButtons}>
              <Pressable style={[styles.modalButton, styles.cancel]} onPress={closeEditor}>
                <Text style={[styles.modalButtonText, styles.cancelText]}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.confirm]} onPress={submitEditor}>
                <Text style={styles.modalButtonText}>Save</Text>
              </Pressable>
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
    backgroundColor: "#F4F8FC",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    alignItems: "center",
  },
  logo: {
    width: "100%",
    height: 120,
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E3553",
    marginBottom: 8,
  },
  profileRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 10,
  },
  profileChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#9CB6D1",
    marginHorizontal: 4,
    marginVertical: 4,
    backgroundColor: "#FFFFFF",
  },
  profileChipSelected: {
    backgroundColor: "#1A4D9C",
    borderColor: "#1A4D9C",
  },
  profileChipText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E3553",
  },
  profileChipTextSelected: {
    color: "#FFFFFF",
  },
  inlineButtons: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  smallButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: "#E8F0FA",
    borderWidth: 1,
    borderColor: "#B4C9E0",
    paddingVertical: 10,
    alignItems: "center",
  },
  smallButtonText: {
    color: "#1E3553",
    fontSize: 13,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  mainActions: {
    width: "100%",
    gap: 10,
  },
  actionButton: {
    backgroundColor: "#FF8C42",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
  },
  settingsButton: {
    backgroundColor: "#1A4D9C",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 2,
  },
  settingsButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(18, 28, 46, 0.5)",
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
    fontSize: 19,
    fontWeight: "800",
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
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalButton: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginLeft: 8,
  },
  cancel: {
    backgroundColor: "#E8EEF5",
  },
  confirm: {
    backgroundColor: "#1A4D9C",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  cancelText: {
    color: "#1E3553",
  },
});
