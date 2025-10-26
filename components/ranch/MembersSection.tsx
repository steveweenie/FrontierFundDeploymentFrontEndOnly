import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import React from "react";
import { FlatList, StyleSheet } from "react-native";

interface MembersSectionProps {
  memberList: string[];
  memberProfiles: Record<string, string>;
  memberCount: number;
}

export const MembersSection: React.FC<MembersSectionProps> = ({
  memberList,
  memberProfiles,
  memberCount,
}) => {
  return (
    <ThemedView style={styles.section}>
      <ThemedText type="subtitle">
        Members ({memberList.length || memberCount})
      </ThemedText>
      {memberList.length > 0 ? (
        <FlatList
          data={memberList}
          keyExtractor={(item, idx) => idx.toString()}
          renderItem={({ item }) => (
            <ThemedText style={styles.memberText}>
              👨‍🚀 {memberProfiles[item] ? memberProfiles[item] : item}
            </ThemedText>
          )}
        />
      ) : (
        <ThemedText style={styles.loadingText}>Loading members...</ThemedText>
      )}
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
  memberText: {
    paddingVertical: 4,
  },
  loadingText: {
    color: "#9CA3AF",
    fontStyle: "italic",
  },
});
