import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import React from "react";
import { StyleSheet, View } from "react-native";
import { RanchBalance } from "./types";

interface BalanceSectionProps {
  balance: RanchBalance;
}

export const BalanceSection: React.FC<BalanceSectionProps> = ({ balance }) => {
  return (
    <ThemedView style={styles.section}>
      <ThemedText type="subtitle">Ranch Balance</ThemedText>
      <View style={styles.balanceBreakdown}>
        <View style={styles.balanceRow}>
          <ThemedText style={styles.balanceLabel}>Liquid Cash:</ThemedText>
          <ThemedText style={styles.balanceValue}>
            ${balance.ranchBalance.toLocaleString()}
          </ThemedText>
        </View>
        <View style={styles.balanceRow}>
          <ThemedText style={styles.balanceLabel}>Invested:</ThemedText>
          <ThemedText style={styles.balanceValueInvested}>
            ${balance.investedAmount.toLocaleString()}
          </ThemedText>
        </View>
        <View style={[styles.balanceRow, { marginTop: 8 }]}>
          <ThemedText style={[styles.balanceLabel, { fontWeight: "bold" }]}>
            Total Assets:
          </ThemedText>
          <ThemedText
            style={[styles.balanceValue, { fontSize: 20, fontWeight: "bold" }]}
          >
            ${balance.totalAssets.toLocaleString()}
          </ThemedText>
        </View>
        <View style={styles.separator} />
        <View style={styles.balanceRow}>
          <ThemedText style={styles.balanceLabel}>
            Your Available Balance:
          </ThemedText>
          <ThemedText style={styles.balanceValue}>
            ${balance.personalBalance.toLocaleString()}
          </ThemedText>
        </View>
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
  balanceBreakdown: {
    marginTop: 8,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FBBF24",
  },
  balanceValueInvested: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10B981",
  },
  separator: {
    height: 1,
    backgroundColor: "#374151",
    marginVertical: 8,
  },
});
