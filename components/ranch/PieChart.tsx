import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { G, Path } from "react-native-svg";

interface PieChartProps {
  ranchBalance: number;
  investedAmount: number;
  totalAssets: number;
}

// Helper function for pie chart arcs
const createArcPath = (
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) => {
  const startX = cx + r * Math.cos(startAngle);
  const startY = cy + r * Math.sin(startAngle);
  const endX = cx + r * Math.cos(endAngle);
  const endY = cy + r * Math.sin(endAngle);
  const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
  return `M ${cx} ${cy} L ${startX} ${startY} A ${r} ${r} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
};

export const RanchPieChart: React.FC<PieChartProps> = ({
  ranchBalance,
  investedAmount,
  totalAssets,
}) => {
  // Prepare investments data for pie chart, filtering out zero values
  const investments = [
    { key: "Liquid Cash", value: ranchBalance, color: "#FBBF24" },
    { key: "Invested", value: investedAmount, color: "#10B981" },
  ].filter((inv) => inv.value > 0);

  // If only one investment, show it as a full circle
  if (investments.length === 1) {
    const singleInv = investments[0];
    return (
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Ranch Balance Breakdown</ThemedText>
        <Svg
          width={250}
          height={250}
          viewBox="0 0 250 250"
          style={{ alignSelf: "center" }}
        >
          <G rotation="-90" origin="125,125">
            <Path
              d={createArcPath(125, 125, 100, 0, 2 * Math.PI)}
              fill={singleInv.color}
            />
          </G>
        </Svg>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: singleInv.color }]}
            />
            <ThemedText>
              {singleInv.key}: ${singleInv.value.toLocaleString()}
            </ThemedText>
          </View>
        </View>
      </ThemedView>
    );
  }

  if (totalAssets === 0 || investments.length === 0) {
    return (
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Ranch Balance Breakdown</ThemedText>
        <ThemedText style={styles.emptyText}>
          No assets yet. Make a deposit to get started!
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.section}>
      <ThemedText type="subtitle">Ranch Balance Breakdown</ThemedText>
      <Svg
        width={250}
        height={250}
        viewBox="0 0 250 250"
        style={{ alignSelf: "center" }}
      >
        <G rotation="-90" origin="125,125">
          {(() => {
            let currentAngle = 0;
            return investments.map((inv) => {
              const angle = (inv.value / totalAssets) * 2 * Math.PI;
              const path = createArcPath(
                125,
                125,
                100,
                currentAngle,
                currentAngle + angle
              );
              currentAngle += angle;
              return <Path key={inv.key} d={path} fill={inv.color} />;
            });
          })()}
        </G>
      </Svg>
      <View style={styles.legend}>
        {investments.map((inv) => (
          <View key={inv.key} style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: inv.color }]}
            />
            <ThemedText>
              {inv.key}: ${inv.value.toLocaleString()}
            </ThemedText>
          </View>
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
  legend: {
    marginTop: 12,
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  emptyText: {
    color: "#9CA3AF",
    fontStyle: "italic",
    textAlign: "center",
    padding: 16,
  },
});
