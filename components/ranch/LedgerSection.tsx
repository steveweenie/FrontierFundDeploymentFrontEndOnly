import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Transaction } from "./types";

interface LedgerSectionProps {
  ledger: Transaction[];
  memberProfiles: Record<string, string>;
}

export const LedgerSection: React.FC<LedgerSectionProps> = ({
  ledger,
  memberProfiles,
}) => {
  if (ledger.length === 0) {
    return null;
  }

  return (
    <ThemedView style={styles.section}>
      <ThemedText type="subtitle">📜 Ledger</ThemedText>
      <ThemedText style={styles.ledgerSubtitle}>
        Transaction History (Executed)
      </ThemedText>
      {ledger.map((transaction) => {
        const proposedBy = transaction.proposedBy
          ? memberProfiles[transaction.proposedBy] || transaction.proposedBy
          : "Unknown";
        const executedDate = transaction.executedAt
          ? new Date(transaction.executedAt).toLocaleDateString()
          : "N/A";

        return (
          <ThemedView
            key={transaction.transactionID}
            style={styles.ledgerEntry}
          >
            <View style={styles.ledgerHeader}>
              <ThemedText style={styles.ledgerAmount}>
                ${parseFloat(transaction.amount).toLocaleString()}
              </ThemedText>
              <ThemedText style={styles.ledgerDate}>{executedDate}</ThemedText>
            </View>
            <ThemedText style={styles.ledgerDescription}>
              {transaction.description}
            </ThemedText>
            <ThemedText style={styles.ledgerProposer}>
              Proposed by: {proposedBy}
            </ThemedText>
            {transaction.transactionType && (
              <ThemedText style={styles.ledgerType}>
                Type: {transaction.transactionType}
              </ThemedText>
            )}
          </ThemedView>
        );
      })}
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
  ledgerSubtitle: {
    color: "#9CA3AF",
    fontSize: 14,
    marginBottom: 12,
    fontStyle: "italic",
  },
  ledgerEntry: {
    backgroundColor: "#0F1729",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1F2937",
    opacity: 0.85,
  },
  ledgerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  ledgerAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6B7280",
  },
  ledgerDate: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  ledgerDescription: {
    color: "#D1D5DB",
    marginBottom: 6,
    fontSize: 14,
  },
  ledgerProposer: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  ledgerType: {
    color: "#9CA3AF",
    fontSize: 12,
    fontStyle: "italic",
  },
});
