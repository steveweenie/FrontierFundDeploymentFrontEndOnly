import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface ActionButton {
  label: string;
  color: string;
  onPress: () => void;
}

interface ActionButtonsSectionProps {
  onDeposit: () => void;
  onInvest: () => void;
  onWithdraw: () => void;
  onInvite: () => void;
  onManageMembers: () => void;
  onDelete: () => void;
}

export const ActionButtonsSection: React.FC<ActionButtonsSectionProps> = ({
  onDeposit,
  onInvest,
  onWithdraw,
  onInvite,
  onManageMembers,
  onDelete,
}) => {
  const buttons: ActionButton[] = [
    { label: "Deposit", color: "#10B981", onPress: onDeposit },
    { label: "Invest", color: "#FBBF24", onPress: onInvest },
    { label: "Withdraw", color: "#F59E0B", onPress: onWithdraw },
    { label: "Invite", color: "#3B82F6", onPress: onInvite },
    { label: "Manage Members", color: "#8B5CF6", onPress: onManageMembers },
    { label: "Delete Ranch", color: "#EF4444", onPress: onDelete },
  ];

  return (
    <ThemedView style={styles.section}>
      <View style={styles.buttonRow}>
        {buttons.map((btn) => (
          <TouchableOpacity
            key={btn.label}
            style={[styles.actionButton, { backgroundColor: btn.color }]}
            onPress={btn.onPress}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.buttonText}>{btn.label}</ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#1A2332",
    borderWidth: 1,
    borderColor: "#374151",
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});
