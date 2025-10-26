import { StockTradingModal } from "@/components/StockTradingModal";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, { G, Path } from "react-native-svg";

const API_BASE_URL = "http://localhost:8080";

// Format money to 2 decimal places with commas
const formatMoney = (amount: number): string => {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Platform-specific storage helpers
const getData = async (key: string) => {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

interface Transaction {
  transactionID: string;
  groupID: string;
  userID: string;
  amount: string;
  description: string;
  status: "pending" | "approved" | "rejected" | "executed";
  votes: Record<string, "approve" | "reject">;
  createdAt: string;
  proposedBy?: string;
  transactionType?: string;
  executedAt?: string;
}

interface UserBalance {
  personalBalance: number; // This would come from user profile
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

export default function RanchScreen() {
  const { id, name, balance, members } = useLocalSearchParams<{
    id: string;
    name: string;
    balance: string;
    members: string;
  }>();

  console.log("🏠 Ranch screen loaded with params:", {
    id,
    name,
    balance,
    members,
  });

  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [groupOwnerId, setGroupOwnerId] = useState<string | null>(null);
  const [ranchBalance, setRanchBalance] = useState(Number(balance)); // Liquid cash
  const [investedAmount, setInvestedAmount] = useState(0); // Locked in investments
  const [totalAssets, setTotalAssets] = useState(Number(balance)); // Total = liquid + invested
  const [stockHoldings, setStockHoldings] = useState<Array<{
    symbol: string;
    name: string;
    quantity: number;
    current_price: number;
    current_value: number;
    percentage: number;
  }>>([]);
  const [memberList, setMemberList] = useState<string[]>(
    members ? members.split(",") : []
  );
  const [memberProfiles, setMemberProfiles] = useState<Record<string, string>>(
    {}
  ); // userId -> username
  const [memberCount, setMemberCount] = useState(
    members ? members.split(",").length : 1
  );
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [proposals, setProposals] = useState<Transaction[]>([]);
  const [ledger, setLedger] = useState<Transaction[]>([]); // Executed transactions
  const [personalBalance, setPersonalBalance] = useState(10000); // Mock personal balance - replace with real data

  // Load auth token and userId on mount
  useEffect(() => {
    const loadAuth = async () => {
      const token = await getData("authToken");
      const userId = await getData("userId");
      console.log("🔐 Loaded auth:", {
        tokenLength: token?.length,
        tokenPreview: token?.substring(0, 20) + "...",
        userId,
      });
      if (!token) {
        console.error("❌ No auth token found!");
      } else if (token.split(".").length !== 3) {
        console.error(
          "❌ Invalid token format! Segments:",
          token.split(".").length
        );
      }
      setAuthToken(token);
      setCurrentUserId(userId);
    };
    loadAuth();
  }, []);

  // Fetch data when auth token is loaded or when ranch ID changes
  useEffect(() => {
    if (authToken && id) {
      console.log("✅ Auth token loaded for ranch:", id);
      console.log("🧹 Clearing old proposals before fetching new ones");
      setProposals([]); // Clear proposals when switching ranches
      fetchGroupData();
      fetchProposals();
      fetchPersonalBalance();
      fetchStockHoldings();
    }
  }, [authToken, id]);

  // Fetch user's personal balance (total invested across all groups)
  const fetchPersonalBalance = async () => {
    if (!authToken) {
      console.log("⚠️ No auth token yet, skipping personal balance fetch");
      return;
    }
    try {
      console.log("🔍 Fetching personal balance...");
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("✅ User data fetched:", data);
        setPersonalBalance(data.balance || 0);
      } else {
        console.log("❌ Failed to fetch personal balance:", response.status);
      }
    } catch (error) {
      console.error("❌ Error fetching personal balance:", error);
    }
  };

  // Fetch stock holdings breakdown for the group
  const fetchStockHoldings = async () => {
    if (!authToken || !id) {
      console.log("⚠️ No auth token or group ID, skipping holdings fetch");
      return;
    }
    try {
      console.log("📊 Fetching stock holdings for group:", id);
      const response = await fetch(`${API_BASE_URL}/groups/${id}/holdings`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Stock holdings fetched:", data);
        setStockHoldings(data.holdings || []);
      } else {
        console.log("❌ Failed to fetch stock holdings:", response.status);
      }
    } catch (error) {
      console.error("❌ Error fetching stock holdings:", error);
    }
  };

  // Color palette for stocks in pie chart
  const stockColors = [
    "#EF4444", // red
    "#F59E0B", // orange  
    "#10B981", // green
    "#3B82F6", // blue
    "#8B5CF6", // purple
    "#EC4899", // pink
    "#14B8A6", // teal
    "#F97316", // dark orange
    "#06B6D4", // cyan
    "#6366F1", // indigo
  ];

  // Build investments array dynamically with individual stocks
  const investments = [
    { key: "Liquid Cash", value: ranchBalance, color: "#FBBF24" },
    ...stockHoldings.map((holding, index) => ({
      key: `${holding.symbol}`,
      value: holding.current_value,
      color: stockColors[index % stockColors.length],
      percentage: holding.percentage,
    })),
  ];

  // Modals
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<
    Array<{ userId: string; username: string; email: string }>
  >([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [manageMembersModalVisible, setManageMembersModalVisible] =
    useState(false);
  const [investModalVisible, setInvestModalVisible] = useState(false);
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [transactionAmount, setTransactionAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  // Fetch updated group balance and members
  const fetchGroupData = async () => {
    if (!id) return;
    if (!authToken) {
      console.log("⚠️ No auth token yet, skipping fetch");
      return;
    }
    try {
      console.log("🔍 Fetching group data for:", id);
      console.log("🔑 Using token length:", authToken.length);
      const response = await fetch(`${API_BASE_URL}/groups/${id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Group data fetched:", data);
        setRanchBalance(Math.round((data.group?.balance || data.balance || 0) * 100) / 100);
        setInvestedAmount(Math.round((data.group?.investedAmount || 0) * 100) / 100);
        setTotalAssets(Math.round((data.group?.totalAssets || data.group?.balance || 0) * 100) / 100);
        setGroupOwnerId(data.group?.createdBy || null);
        const membersArr: string[] = data.group?.members || [];
        setMemberList(membersArr);
        setMemberCount(membersArr.length || 0);

        // Fetch usernames for these members (uses /users/all which returns basic info)
        try {
          const usersResp = await fetch(`${API_BASE_URL}/users/all`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          if (usersResp.ok) {
            const usersData = await usersResp.json();
            const map: Record<string, string> = {};
            (usersData.users || []).forEach((u: any) => {
              map[u.userId] = u.username;
            });
            setMemberProfiles(map);
          } else {
            console.warn("Failed to fetch user profiles for members");
          }
        } catch (err) {
          console.warn("Error fetching user profiles:", err);
        }
      } else {
        console.log("❌ Failed to fetch group data:", response.status);
      }
    } catch (error) {
      console.error("Failed to fetch group balance:", error);
    }
  };

  // Fetch pending proposals for this group
  const fetchProposals = async () => {
    if (!id) {
      console.log("⚠️ No group ID, skipping fetch");
      return;
    }
    if (!authToken) {
      console.log("⚠️ No auth token yet, skipping proposals fetch");
      return;
    }
    console.log("🔍 Fetching proposals for THIS group ONLY:", id);
    try {
      const url = `${API_BASE_URL}/transactions?groupId=${id}`;
      console.log("🌐 Fetching from:", url);
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      console.log("📡 Proposals response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("📦 Raw response data:", data);

        // Filter to only show transactions for THIS specific group
        const thisGroupTransactions = (data.transactions || []).filter(
          (txn: Transaction) => txn.groupID === id
        );

        // Separate pending/active proposals from executed transactions
        const pendingProposals = thisGroupTransactions.filter(
          (txn: Transaction) => txn.status !== 'executed'
        );
        const executedTransactions = thisGroupTransactions.filter(
          (txn: Transaction) => txn.status === 'executed'
        );

        console.log(
          `✅ Total transactions received: ${data.transactions?.length || 0}`
        );
        console.log(
          `✅ Transactions for THIS group (${id}): ${thisGroupTransactions.length}`
        );
        console.log(`📋 Pending proposals: ${pendingProposals.length}`);
        console.log(`📜 Executed (ledger): ${executedTransactions.length}`);

        setProposals(pendingProposals);
        setLedger(executedTransactions);
      } else {
        const errorText = await response.text();
        console.log("❌ Error response:", errorText);
      }
    } catch (error) {
      console.error("❌ Failed to fetch proposals:", error);
    }
  };

  // Refresh all data
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchGroupData(),
      fetchProposals(),
      fetchPersonalBalance(),
    ]);
    setRefreshing(false);
  };

  // Load data on mount and when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchGroupData();
      fetchProposals();
      fetchPersonalBalance();
    }, [id])
  );

  // Log proposals whenever they change
  useEffect(() => {
    console.log(
      "🎯 Proposals updated:",
      proposals.length,
      "proposals",
      proposals
    );
  }, [proposals]);

  const handleInvest = () => setStockModalVisible(true);

  const handleStockTrade = async (
    symbol: string,
    quantity: number,
    stockName: string,
    price: number
  ) => {
    if (!authToken) {
      Alert.alert("Error", "Not authenticated. Please log in again.");
      return;
    }

    try {
      console.log("📈 Creating stock trade proposal:", {
        symbol,
        quantity,
        stockName,
        price,
        groupId: id,
      });

      const response = await fetch(`${API_BASE_URL}/stocks/trade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          symbol,
          quantity,
          group_id: id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Trade proposal created:", result);
        Alert.alert(
          "Success! 📈",
          `Trade proposal created: Buy ${quantity} shares of ${stockName} @ $${price.toFixed(2)}\n\nTotal: $${(quantity * price).toFixed(2)}\n\nGroup members can now vote on this proposal.`
        );
        await fetchProposals();
        await fetchGroupData();
      } else {
        const error = await response.json();
        console.error("❌ Trade failed:", error);
        Alert.alert("Error", error.detail || "Failed to create trade proposal");
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      Alert.alert("Error", "Network error occurred");
      throw error; // Re-throw to let modal know it failed
    }
  };

  const handleInvestSubmit = async () => {
    console.log("🔵 handleInvestSubmit called");
    console.log("Transaction amount:", transactionAmount);

    if (!authToken) {
      console.error("❌ No auth token available");
      Alert.alert("Error", "Not authenticated. Please log in again.");
      return;
    }

    if (!id) {
      console.error("❌ No group ID available");
      Alert.alert("Error", "Ranch ID is missing. Please try again.");
      return;
    }

    const amount = parseFloat(transactionAmount);
    console.log("Parsed amount:", amount);

    if (!amount || amount <= 0) {
      console.log("❌ Invalid amount");
      Alert.alert("Invalid Amount", "Please enter a valid positive amount");
      return;
    }

    // Check if user has enough personal balance
    if (amount > personalBalance) {
      console.log("❌ Insufficient funds");
      Alert.alert(
        "Insufficient Funds",
        `You don't have enough to invest $${amount.toLocaleString()}. Your available balance is $${personalBalance.toLocaleString()}.`
      );
      return;
    }

    console.log("✅ Validation passed, making API call");
    console.log("🔑 Using auth token length:", authToken?.length);
    console.log("🏠 Group ID:", id);
    setLoading(true);
    try {
      // Create a transaction proposal (not direct deposit)
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupId: id,
          amount: amount,
          description: `Investment proposal: $${amount.toLocaleString()}`,
          transactionType: "investment",
        }),
      });

      console.log("📡 Response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Success:", data);

        // Close modal and clear input FIRST
        setTransactionAmount("");
        setInvestModalVisible(false);

        // Then fetch proposals
        console.log("🔄 Fetching proposals after creation...");
        await fetchProposals();

        // Then show success message
        Alert.alert(
          "🎉 Proposal Created!",
          `Your investment proposal of $${amount.toLocaleString()} has been submitted. Other members need to approve it before funds are added.`
        );
      } else {
        const error = await response.json();
        console.error("❌ API error:", error);
        Alert.alert("Error", error.detail || "Failed to create proposal");
      }
    } catch (error) {
      console.log("❌ Network error:", error);
      Alert.alert("Error", "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = () => setWithdrawModalVisible(true);

  const handleWithdrawSubmit = async () => {
    const amount = parseFloat(transactionAmount);
    if (!amount || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid positive amount");
      return;
    }

    if (amount > ranchBalance) {
      Alert.alert(
        "Insufficient Balance",
        `Cannot withdraw $${amount.toLocaleString()}. Ranch balance is only $${ranchBalance.toLocaleString()}`
      );
      return;
    }

    setLoading(true);
    try {
      // Create a withdrawal proposal instead of direct withdrawal
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupId: id,
          amount: amount,
          description: `Withdrawal Request: $${amount.toLocaleString()} from ranch balance`,
          transactionType: "withdrawal",
        }),
      });

      if (response.ok) {
        Alert.alert(
          "Proposal Created! �",
          `Withdrawal proposal for $${amount.toLocaleString()} has been submitted for group approval`
        );
        setTransactionAmount("");
        setWithdrawModalVisible(false);
        await fetchProposals(); // Refresh proposals to show new one
        await fetchGroupData();
      } else {
        const error = await response.json();
        Alert.alert("Error", error.detail || "Failed to create withdrawal proposal");
      }
    } catch (error) {
      Alert.alert("Error", "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete =
      Platform.OS === "web"
        ? window.confirm(
            `Are you sure you want to delete ${name}? This action cannot be undone.`
          )
        : await new Promise((resolve) => {
            Alert.alert(
              "Delete Ranch",
              `Are you sure you want to delete ${name}? This action cannot be undone.`,
              [
                { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => resolve(true),
                },
              ]
            );
          });

    if (!confirmDelete) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/groups/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        if (Platform.OS === "web") {
          window.alert("Ranch deleted successfully");
        } else {
          Alert.alert("Success", "Ranch deleted successfully");
        }
        router.replace("/(tabs)");
      } else {
        const error = await response.json();
        if (Platform.OS === "web") {
          window.alert(error.detail || "Failed to delete ranch");
        } else {
          Alert.alert("Error", error.detail || "Failed to delete ranch");
        }
      }
    } catch (error) {
      console.error("Delete error:", error);
      if (Platform.OS === "web") {
        window.alert("Network error occurred");
      } else {
        Alert.alert("Error", "Network error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    const confirmLeave =
      Platform.OS === "web"
        ? window.confirm(`Are you sure you want to leave ${name}?`)
        : await new Promise((resolve) => {
            Alert.alert(
              "Leave Ranch",
              `Are you sure you want to leave ${name}?`,
              [
                { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
                {
                  text: "Leave",
                  style: "destructive",
                  onPress: () => resolve(true),
                },
              ]
            );
          });

    if (!confirmLeave) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/groups/${id}/members/${currentUserId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.ok) {
        if (Platform.OS === "web") {
          window.alert("You have left the ranch");
        } else {
          Alert.alert("Success", "You have left the ranch");
        }
        router.back();
      } else {
        const error = await response.json();
        if (Platform.OS === "web") {
          window.alert(error.detail || "Failed to leave ranch");
        } else {
          Alert.alert("Error", error.detail || "Failed to leave ranch");
        }
      }
    } catch (error) {
      console.error("Leave error:", error);
      if (Platform.OS === "web") {
        window.alert("Network error occurred");
      } else {
        Alert.alert("Error", "Network error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = () => setDepositModalVisible(true);

  const handleDepositSubmit = async () => {
    console.log("💵 handleDepositSubmit called");
    const amount = parseFloat(depositAmount);
    console.log("Deposit amount:", amount);

    if (!amount || amount <= 0) {
      console.log("❌ Invalid deposit amount");
      Alert.alert("Invalid Amount", "Please enter a valid positive amount");
      return;
    }

    // Check if user has enough personal balance
    if (amount > personalBalance) {
      console.log("❌ Insufficient personal funds");
      Alert.alert(
        "Insufficient Funds",
        `You don't have enough to deposit $${amount.toLocaleString()}. Your available balance is $${personalBalance.toLocaleString()}.`
      );
      return;
    }

    console.log("✅ Deposit validation passed, making API call");
    setLoading(true);
    try {
      // Direct deposit to ranch balance
      const response = await fetch(`${API_BASE_URL}/groups/${id}/deposit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: amount }), // Positive amount for deposit
      });

      if (response.ok) {
        console.log("✅ Deposit successful");
        const data = await response.json();
        // Update personal balance from backend response
        if (data.userBalance !== undefined) {
          setPersonalBalance(data.userBalance);
        }
        // Close modal and refresh
        setDepositAmount("");
        setDepositModalVisible(false);
        await fetchGroupData();
        Alert.alert(
          "Success! 💰",
          `Deposited $${amount.toLocaleString()} into ${name}. Your new balance is $${data.userBalance?.toLocaleString() || '...'}.`
        );
      } else {
        const error = await response.json();
        console.log("❌ Deposit error response:", error);
        Alert.alert("Error", error.detail || "Failed to deposit");
      }
    } catch (error) {
      console.log("❌ Deposit network error:", error);
      Alert.alert("Error", "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all available users when opening invite modal
  const handleInvite = async () => {
    setLoading(true);
    try {
      // First, fetch the latest group data to get current members
      console.log("🔄 Refreshing group data before fetching users...");
      await fetchGroupData();

      console.log("👥 Fetching all users...");
      const response = await fetch(`${API_BASE_URL}/users/all`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Users fetched:", data.users.length);
        console.log("👥 All users:", data.users);
        console.log("📋 Current memberList:", memberList);
        console.log("👤 Current user ID:", currentUserId);

        // Filter out users who are already members
        const nonMembers = data.users.filter((user: any) => {
          const isAlreadyMember = memberList.includes(user.userId);
          const isCurrentUser = user.userId === currentUserId;
          console.log(
            `🔍 Checking ${user.username}: isAlreadyMember=${isAlreadyMember}, isCurrentUser=${isCurrentUser}`
          );
          return !isAlreadyMember && !isCurrentUser;
        });

        console.log("✅ Available users after filtering:", nonMembers);
        setAvailableUsers(nonMembers);
        setInviteModalVisible(true);
      } else {
        console.error("❌ Failed to fetch users");
        Alert.alert("Error", "Failed to load users");
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      Alert.alert("Error", "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Add selected user to the group
  const handleAddMember = async () => {
    if (!selectedUserId) {
      Alert.alert("Error", "Please select a user");
      return;
    }

    console.log("➕ Adding member:", selectedUserId);
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/groups/${id}/members`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUserId,
        }),
      });

      if (response.ok) {
        console.log("✅ Member added");
        const selectedUser = availableUsers.find(
          (u) => u.userId === selectedUserId
        );
        Alert.alert(
          "Member Added! 🎉",
          `${selectedUser?.username} has been added to ${name}`
        );
        setSelectedUserId("");
        setInviteModalVisible(false);
        await fetchGroupData(); // Refresh member list
      } else {
        const error = await response.json();
        console.error("❌ Add member error:", error);
        if (error.detail === "User is already a member") {
          Alert.alert("Already a Member", "This user is already in the ranch");
        } else {
          Alert.alert("Error", error.detail || "Failed to add member");
        }
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      Alert.alert("Error", "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleKickMember = (member: string) => {
    Alert.alert("Kick Member", `Kicked ${member} from the ranch`);
    setMemberList(memberList.filter((m) => m !== member));
  };

  const handlePromoteMember = (member: string) => {
    Alert.alert("Promote Member", `${member} is now an admin!`);
  };

  // Vote on a proposal
  const handleVote = async (
    transactionId: string,
    vote: "approve" | "reject"
  ) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/transactions/${transactionId}/vote`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ vote }),
        }
      );

      if (response.ok) {
        Alert.alert("Vote Recorded", `You voted to ${vote} this proposal`);
        await fetchProposals(); // Refresh proposals
        await fetchGroupData(); // Refresh balance in case it auto-executed
      } else {
        const error = await response.json();
        Alert.alert("Error", error.detail || "Failed to vote");
      }
    } catch (error) {
      Alert.alert("Error", "Network error occurred");
    }
  };

  // Execute an approved proposal
  const handleExecute = async (transactionId: string) => {
    if (!authToken) {
      Alert.alert("Error", "Not authenticated. Please log in again.");
      return;
    }

    try {
      console.log("⚡ Executing transaction:", transactionId);
      const response = await fetch(
        `${API_BASE_URL}/transactions/${transactionId}/execute`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Transaction executed:", result);
        Alert.alert("Success! 🎉", "Transaction executed successfully!");
        await fetchProposals();
        await fetchGroupData();
        await fetchPersonalBalance(); // Update personal balance after execution
      } else {
        const error = await response.json();
        console.error("❌ Execute failed:", error);
        Alert.alert("Error", error.detail || "Failed to execute");
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      Alert.alert("Error", "Network error occurred");
    }
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FBBF24"
          />
        }
      >
        <ThemedView style={styles.contentContainer}>
          {/* Header */}
          <ThemedView style={styles.header}>
            <ThemedText type="title" style={styles.headerText}>
              🤠 {name} 🚀
            </ThemedText>
            <View style={styles.balanceContainer}>
              <ThemedText type="subtitle" style={styles.totalAssetsText}>
                Total Assets: ${formatMoney(totalAssets)}
              </ThemedText>
              <View style={styles.balanceBreakdown}>
                <View style={styles.balanceRow}>
                  <ThemedText style={styles.balanceLabel}>
                    💵 Liquid Cash:
                  </ThemedText>
                  <ThemedText style={styles.balanceValue}>
                    ${formatMoney(ranchBalance)}
                  </ThemedText>
                </View>
                <View style={styles.balanceRow}>
                  <ThemedText style={styles.balanceLabel}>
                    📈 Invested:
                  </ThemedText>
                  <ThemedText style={styles.balanceValueInvested}>
                    ${formatMoney(investedAmount)}
                  </ThemedText>
                </View>
              </View>
            </View>
            <ThemedText style={styles.personalBalance}>
              💰 Your Available Balance: ${formatMoney(personalBalance)}
            </ThemedText>
          </ThemedView>

          {/* Pending Proposals Section */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              📋 Proposals ({proposals.length})
            </ThemedText>
            {proposals.length === 0 ? (
              <ThemedText style={styles.emptyText}>
                No proposals yet. Click Invest to create one!
              </ThemedText>
            ) : (
              proposals.map((proposal) => {
                const voteCount = Object.keys(proposal.votes || {}).length;
                const approveCount = Object.values(proposal.votes || {}).filter(
                  (v) => v === "approve"
                ).length;
                const rejectCount = Object.values(proposal.votes || {}).filter(
                  (v) => v === "reject"
                ).length;
                const votesNeeded = Math.ceil(memberCount / 2);
                const votesRemaining = Math.max(0, votesNeeded - approveCount);
                const userVote = proposal.votes?.[currentUserId || ""];

                // Status colors and emojis
                const statusConfig = {
                  pending: { emoji: "⏳", color: "#FBBF24", text: "Pending" },
                  approved: { emoji: "✓", color: "#10B981", text: "Approved" },
                  rejected: { emoji: "✗", color: "#EF4444", text: "Rejected" },
                  executed: { emoji: "✅", color: "#8B5CF6", text: "Executed" },
                };
                const status =
                  statusConfig[proposal.status] || statusConfig.pending;

                // Debug: Log if this proposal doesn't match the current group
                if (proposal.groupID !== id) {
                  console.warn(
                    "⚠️ MISMATCH! Proposal",
                    proposal.transactionID,
                    "belongs to group",
                    proposal.groupID,
                    "but showing in",
                    id
                  );
                }

                return (
                  <ThemedView
                    key={proposal.transactionID}
                    style={styles.proposalCard}
                  >
                    <View style={styles.proposalHeader}>
                      <ThemedText style={styles.proposalAmount}>
                        ${formatMoney(parseFloat(proposal.amount))}
                      </ThemedText>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: status.color },
                        ]}
                      >
                        <ThemedText style={styles.statusText}>
                          {status.emoji} {status.text}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText style={styles.proposalDescription}>
                      {proposal.description}
                    </ThemedText>

                    <View style={styles.voteInfo}>
                      <ThemedText style={styles.voteText}>
                        👍 {approveCount} | 👎 {rejectCount} |
                        {proposal.status === "pending"
                          ? ` ${votesRemaining} more vote${
                              votesRemaining !== 1 ? "s" : ""
                            } needed`
                          : proposal.status === "approved"
                          ? " Ready to execute!"
                          : proposal.status === "executed"
                          ? " Funds added to ranch!"
                          : " Not approved"}
                      </ThemedText>
                    </View>

                    {/* Only show voting buttons for pending proposals where user hasn't voted */}
                    {userVote ? (
                      <ThemedText style={styles.votedText}>
                        You voted:{" "}
                        {userVote === "approve" ? "👍 Approve" : "👎 Reject"}
                      </ThemedText>
                    ) : proposal.status === "pending" ? (
                      <View style={styles.voteButtons}>
                        <TouchableOpacity
                          style={[styles.voteButton, styles.approveButton]}
                          onPress={() =>
                            handleVote(proposal.transactionID, "approve")
                          }
                        >
                          <ThemedText style={styles.voteButtonText}>
                            👍 Approve
                          </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.voteButton, styles.rejectButton]}
                          onPress={() =>
                            handleVote(proposal.transactionID, "reject")
                          }
                        >
                          <ThemedText style={styles.voteButtonText}>
                            👎 Reject
                          </ThemedText>
                        </TouchableOpacity>
                      </View>
                    ) : null}

                    {/* Show execute button only for approved proposals */}
                    {proposal.status === "approved" && (
                      <TouchableOpacity
                        style={styles.executeButton}
                        onPress={() => handleExecute(proposal.transactionID)}
                      >
                        <ThemedText style={styles.executeButtonText}>
                          ⚡ Execute Transaction
                        </ThemedText>
                      </TouchableOpacity>
                    )}

                    {/* Show timestamp */}
                    <ThemedText style={styles.timestampText}>
                      Created: {new Date(proposal.createdAt).toLocaleString()}
                    </ThemedText>
                  </ThemedView>
                );
              })
            )}
          </ThemedView>

          {/* Pie Chart */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Ranch Balance Breakdown</ThemedText>
            {totalAssets > 0 ? (
              <>
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
                        style={[
                          styles.legendColor,
                          { backgroundColor: inv.color },
                        ]}
                      />
                      <ThemedText>
                        {inv.key}: ${inv.value.toLocaleString()}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <ThemedText style={styles.emptyText}>
                No assets yet. Make a deposit to get started!
              </ThemedText>
            )}
          </ThemedView>

          {/* Members */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">
              Members ({memberList.length || memberCount})
            </ThemedText>
            {memberList.length > 0 ? (
              <FlatList
                data={memberList}
                keyExtractor={(item, idx) => idx.toString()}
                renderItem={({ item }) => (
                  <ThemedText>
                    👨‍🚀 {memberProfiles[item] ? memberProfiles[item] : item}
                  </ThemedText>
                )}
              />
            ) : (
              <ThemedText>Loading members...</ThemedText>
            )}
          </ThemedView>

          {/* Ledger - Executed Transactions */}
          {ledger.length > 0 && (
            <ThemedView style={styles.section}>
              <ThemedText type="subtitle">📜 Ledger</ThemedText>
              <ThemedText style={styles.ledgerSubtitle}>
                Transaction History (Executed)
              </ThemedText>
              {ledger.map((transaction) => {
                const proposedBy = transaction.proposedBy
                  ? memberProfiles[transaction.proposedBy] ||
                    transaction.proposedBy
                  : "Unknown";
                const createdDate = new Date(
                  transaction.createdAt
                ).toLocaleDateString();
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
                        ${formatMoney(parseFloat(transaction.amount))}
                      </ThemedText>
                      <ThemedText style={styles.ledgerDate}>
                        {executedDate}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.ledgerDescription}>
                      {transaction.description}
                    </ThemedText>
                    <ThemedText style={styles.ledgerProposer}>
                      Proposed by: {proposedBy}
                    </ThemedText>
                    <ThemedText style={styles.ledgerType}>
                      Type: {transaction.transactionType}
                    </ThemedText>
                  </ThemedView>
                );
              })}
            </ThemedView>
          )}

          {/* Actions */}
          <ThemedView style={styles.section}>
            <View style={styles.buttonRow}>
              {[
                { label: "Deposit", color: "#10B981", onPress: handleDeposit },
                { label: "Invest", color: "#FBBF24", onPress: handleInvest },
                {
                  label: "Withdraw",
                  color: "#F59E0B",
                  onPress: handleWithdraw,
                },
                { label: "Invite", color: "#3B82F6", onPress: handleInvite },
                {
                  label: "Manage Members",
                  color: "#8B5CF6",
                  onPress: () => setManageMembersModalVisible(true),
                },
                currentUserId === groupOwnerId
                  ? {
                      label: "Delete Ranch",
                      color: "#EF4444",
                      onPress: handleDelete,
                    }
                  : {
                      label: "Leave Ranch",
                      color: "#F97316",
                      onPress: handleLeave,
                    },
              ].map((btn) => (
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
        </ThemedView>
      </ScrollView>

      {/* Invite Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={inviteModalVisible}
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <ThemedView style={styles.modalBackground}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="subtitle">� Add Member to {name}</ThemedText>
            <ThemedText style={styles.modalSubtext}>
              Select a user to add to your ranch
            </ThemedText>

            {availableUsers.length === 0 ? (
              <ThemedText style={styles.emptyText}>
                {loading ? "Loading users..." : "No users available to add"}
              </ThemedText>
            ) : (
              <ScrollView style={styles.userList}>
                {availableUsers.map((user) => (
                  <TouchableOpacity
                    key={user.userId}
                    style={[
                      styles.userItem,
                      selectedUserId === user.userId && styles.userItemSelected,
                    ]}
                    onPress={() => setSelectedUserId(user.userId)}
                  >
                    <View>
                      <ThemedText style={styles.username}>
                        👤 {user.username}
                      </ThemedText>
                      <ThemedText style={styles.userEmail}>
                        {user.email}
                      </ThemedText>
                    </View>
                    {selectedUserId === user.userId && (
                      <ThemedText style={styles.checkmark}>✓</ThemedText>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setInviteModalVisible(false);
                  setSelectedUserId("");
                }}
                style={styles.modalBtnCancel}
                disabled={loading}
              >
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddMember}
                style={[styles.modalBtnSend, loading && styles.btnDisabled]}
                disabled={loading || !selectedUserId}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText>Add Member</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </ThemedView>
        </ThemedView>
      </Modal>

      {/* Manage Members Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={manageMembersModalVisible}
        onRequestClose={() => setManageMembersModalVisible(false)}
      >
        <ThemedView style={styles.modalBackground}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="subtitle">Manage Members</ThemedText>
            <FlatList
              data={memberList}
              keyExtractor={(item, idx) => idx.toString()}
              renderItem={({ item }) => (
                <View style={styles.memberActionRow}>
                  <ThemedText>👨‍🚀 {item}</ThemedText>
                  <View style={styles.memberButtons}>
                    <TouchableOpacity
                      onPress={() => handleKickMember(item)}
                      style={styles.kickBtn}
                    >
                      <ThemedText>Kick</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handlePromoteMember(item)}
                      style={styles.promoteBtn}
                    >
                      <ThemedText>Promote</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
            <TouchableOpacity
              onPress={() => setManageMembersModalVisible(false)}
              style={styles.modalCloseBtn}
            >
              <ThemedText>Close</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </Modal>

      {/* Stock Trading Modal */}
      <StockTradingModal
        visible={stockModalVisible}
        onClose={() => setStockModalVisible(false)}
        onTradeSubmit={handleStockTrade}
        groupId={id || ""}
        authToken={authToken || ""}
      />

      {/* Invest Modal (Legacy - keeping for backward compatibility) */}
      <Modal
        transparent
        animationType="slide"
        visible={investModalVisible}
        onRequestClose={() => setInvestModalVisible(false)}
      >
        <ThemedView style={styles.modalBackground}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="subtitle">💰 Propose Investment</ThemedText>
            <ThemedText style={styles.modalSubtext}>
              Create a proposal that other members need to approve
            </ThemedText>
            <ThemedText style={styles.modalSubtext}>
              Your Balance: ${personalBalance.toLocaleString()}
            </ThemedText>
            <ThemedText style={styles.modalSubtext}>
              Ranch Balance: ${ranchBalance.toLocaleString()}
            </ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Amount to invest"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={transactionAmount}
              onChangeText={setTransactionAmount}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setInvestModalVisible(false);
                  setTransactionAmount("");
                }}
                style={styles.modalBtnCancel}
                disabled={loading}
              >
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleInvestSubmit}
                style={[styles.modalBtnSend, loading && styles.btnDisabled]}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText>Propose</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </ThemedView>
        </ThemedView>
      </Modal>

      {/* Deposit Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={depositModalVisible}
        onRequestClose={() => setDepositModalVisible(false)}
      >
        <ThemedView style={styles.modalBackground}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="subtitle">💵 Deposit to {name}</ThemedText>
            <ThemedText style={styles.modalSubtext}>
              Direct deposit - No approval needed
            </ThemedText>
            <ThemedText style={styles.modalSubtext}>
              Your Balance: ${personalBalance.toLocaleString()}
            </ThemedText>
            <ThemedText style={styles.modalSubtext}>
              Ranch Balance: ${ranchBalance.toLocaleString()}
            </ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Amount to deposit"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={depositAmount}
              onChangeText={setDepositAmount}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setDepositModalVisible(false);
                  setDepositAmount("");
                }}
                style={styles.modalBtnCancel}
                disabled={loading}
              >
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDepositSubmit}
                style={[styles.modalBtnSend, loading && styles.btnDisabled]}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText>Deposit</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </ThemedView>
        </ThemedView>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={withdrawModalVisible}
        onRequestClose={() => setWithdrawModalVisible(false)}
      >
        <ThemedView style={styles.modalBackground}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="subtitle">💸 Withdraw from {name}</ThemedText>
            <ThemedText style={styles.modalSubtext}>
              Available Balance: ${ranchBalance.toLocaleString()}
            </ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Amount"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={transactionAmount}
              onChangeText={setTransactionAmount}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setWithdrawModalVisible(false);
                  setTransactionAmount("");
                }}
                style={styles.modalBtnCancel}
                disabled={loading}
              >
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleWithdrawSubmit}
                style={[
                  styles.modalBtnSend,
                  { backgroundColor: "#10B981" },
                  loading && styles.btnDisabled,
                ]}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText>Withdraw</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </ThemedView>
        </ThemedView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1120", padding: 16 },
  header: { marginBottom: 16, alignItems: "center" },
  headerText: { fontSize: 28, color: "#FBBF24", textAlign: "center" },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#1B1F3B",
  },
  memberItem: { marginVertical: 4, color: "#E5E7EB" },
  legend: { flexDirection: "row", flexWrap: "wrap", marginTop: 12 },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 8,
  },
  legendColor: { width: 16, height: 16, borderRadius: 4, marginRight: 6 },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000aa",
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "#1B1F3B",
    borderRadius: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 8,
    padding: 8,
    marginTop: 12,
    marginBottom: 12,
    color: "#fff",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  modalBtnCancel: { backgroundColor: "#EF4444", padding: 8, borderRadius: 8 },
  modalBtnSend: { backgroundColor: "#3B82F6", padding: 8, borderRadius: 8 },
  modalCloseBtn: {
    marginTop: 12,
    backgroundColor: "#9CA3AF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    marginVertical: 6,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: "45%",
  },
  buttonText: { color: "#0B1120", fontWeight: "bold", fontSize: 16 },
  memberActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6,
  },
  memberButtons: { flexDirection: "row", gap: 6 },
  kickBtn: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  promoteBtn: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modalSubtext: { color: "#9CA3AF", marginTop: 8, fontSize: 14 },
  userList: {
    maxHeight: 300,
    marginVertical: 16,
  },
  userItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#1D1F33",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  userItemSelected: {
    borderColor: "#10B981",
    borderWidth: 2,
    backgroundColor: "#1D2F26",
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  userEmail: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  checkmark: {
    fontSize: 24,
    color: "#10B981",
    fontWeight: "bold",
  },
  btnDisabled: { opacity: 0.6 },
  contentContainer: { paddingBottom: 20 },
  personalBalance: { color: "#9CA3AF", fontSize: 14, marginTop: 4 },
  balanceContainer: {
    marginVertical: 12,
    padding: 12,
    backgroundColor: "#1D1F33",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  totalAssetsText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FBBF24",
    marginBottom: 8,
    textAlign: "center",
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
  sectionTitle: { marginBottom: 12, fontSize: 18 },
  proposalCard: {
    backgroundColor: "#0F1729",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  proposalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  proposalAmount: { fontSize: 24, fontWeight: "bold", color: "#FBBF24" },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 12, fontWeight: "bold", color: "#000" },
  proposalDescription: { color: "#E5E7EB", marginBottom: 12 },
  voteInfo: { marginBottom: 12 },
  voteText: { color: "#9CA3AF", fontSize: 14 },
  votedText: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    padding: 8,
  },
  voteButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  voteButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  approveButton: { backgroundColor: "#10B981" },
  rejectButton: { backgroundColor: "#EF4444" },
  voteButtonText: { color: "#fff", fontWeight: "bold" },
  executeButton: {
    backgroundColor: "#8B5CF6",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  executeButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  emptyText: {
    color: "#9CA3AF",
    fontStyle: "italic",
    textAlign: "center",
    padding: 16,
  },
  timestampText: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 8,
    fontStyle: "italic",
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
