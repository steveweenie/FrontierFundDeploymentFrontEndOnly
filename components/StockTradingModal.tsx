import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface Stock {
  symbol: string;
  name: string;
  price?: number;
  change?: number;
  change_percent?: number;
}

interface StockCategory {
  category: string;
  stocks: Stock[];
}

interface StockTradingModalProps {
  visible: boolean;
  onClose: () => void;
  onTradeSubmit: (symbol: string, quantity: number, stockName: string, price: number) => Promise<void>;
  groupId: string;
  authToken: string;
}

const API_BASE_URL = "http://localhost:8080";

export const StockTradingModal: React.FC<StockTradingModalProps> = ({
  visible,
  onClose,
  onTradeSubmit,
  groupId,
  authToken,
}) => {
  const [categories, setCategories] = useState<Record<string, Stock[]>>({});
  const [expandedCategory, setExpandedCategory] = useState<string | null>("blue_chips");
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingPrices, setFetchingPrices] = useState(false);

  // Category display names
  const categoryNames: Record<string, string> = {
    blue_chips: "💎 Blue Chip Stocks",
    etfs: "📊 ETFs",
    technology: "💻 Technology",
    healthcare: "🏥 Healthcare",
    finance: "🏦 Finance",
    consumer: "🛍️ Consumer",
    energy: "⚡ Energy",
    industrial: "🏭 Industrial",
  };

  useEffect(() => {
    if (visible && authToken) {
      fetchStockLists();
    }
  }, [visible, authToken]);

  const fetchStockLists = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/stocks/lists`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        Alert.alert("Error", "Failed to load stock lists");
      }
    } catch (error) {
      console.error("Error fetching stock lists:", error);
      Alert.alert("Error", "Failed to load stock lists");
    } finally {
      setLoading(false);
    }
  };

  const fetchStockPrice = async (stock: Stock) => {
    setFetchingPrices(true);
    try {
      const response = await fetch(`${API_BASE_URL}/stocks/quote/${stock.symbol}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedStock({
          ...stock,
          price: data.price,
          change: data.change,
          change_percent: data.change_percent,
        });
      } else {
        Alert.alert("Error", `Failed to get price for ${stock.symbol}`);
      }
    } catch (error) {
      console.error("Error fetching stock price:", error);
      Alert.alert("Error", "Failed to fetch stock price");
    } finally {
      setFetchingPrices(false);
    }
  };

  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock);
    fetchStockPrice(stock);
  };

  const handleTradeSubmit = async () => {
    if (!selectedStock || !quantity || !selectedStock.price) {
      Alert.alert("Error", "Please select a stock and enter quantity");
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert("Error", "Please enter a valid quantity");
      return;
    }

    try {
      await onTradeSubmit(selectedStock.symbol, qty, selectedStock.name, selectedStock.price);
      // Reset form
      setSelectedStock(null);
      setQuantity("");
      onClose();
    } catch (error) {
      // Error handled by parent
    }
  };

  const calculateTotal = () => {
    if (selectedStock?.price && quantity) {
      const qty = parseFloat(quantity);
      if (!isNaN(qty)) {
        return (selectedStock.price * qty).toFixed(2);
      }
    }
    return "0.00";
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <ThemedView style={styles.modalBackground}>
        <ThemedView style={styles.modalContent}>
          <ThemedText type="subtitle" style={styles.title}>
            📈 Stock Trading
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Select a stock to create a trade proposal
          </ThemedText>

          {loading ? (
            <ActivityIndicator size="large" color="#FBBF24" style={styles.loader} />
          ) : (
            <ScrollView style={styles.scrollView}>
              {/* Stock Categories */}
              {Object.entries(categories).map(([categoryKey, stocks]) => (
                <View key={categoryKey} style={styles.categoryContainer}>
                  <TouchableOpacity
                    style={styles.categoryHeader}
                    onPress={() =>
                      setExpandedCategory(
                        expandedCategory === categoryKey ? null : categoryKey
                      )
                    }
                  >
                    <ThemedText style={styles.categoryTitle}>
                      {categoryNames[categoryKey] || categoryKey}
                    </ThemedText>
                    <ThemedText style={styles.expandIcon}>
                      {expandedCategory === categoryKey ? "▼" : "▶"}
                    </ThemedText>
                  </TouchableOpacity>

                  {expandedCategory === categoryKey && (
                    <View style={styles.stockList}>
                      {stocks.map((stock) => (
                        <TouchableOpacity
                          key={stock.symbol}
                          style={[
                            styles.stockItem,
                            selectedStock?.symbol === stock.symbol &&
                              styles.stockItemSelected,
                          ]}
                          onPress={() => handleStockSelect(stock)}
                        >
                          <View>
                            <ThemedText style={styles.stockSymbol}>
                              {stock.symbol}
                            </ThemedText>
                            <ThemedText style={styles.stockName}>
                              {stock.name}
                            </ThemedText>
                          </View>
                          {selectedStock?.symbol === stock.symbol && (
                            <ThemedText style={styles.checkmark}>✓</ThemedText>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ))}

              {/* Selected Stock Details */}
              {selectedStock && (
                <ThemedView style={styles.selectedStockCard}>
                  <ThemedText style={styles.selectedStockTitle}>
                    Selected: {selectedStock.symbol}
                  </ThemedText>
                  <ThemedText style={styles.selectedStockName}>
                    {selectedStock.name}
                  </ThemedText>

                  {fetchingPrices ? (
                    <ActivityIndicator size="small" color="#FBBF24" />
                  ) : selectedStock.price ? (
                    <>
                      <ThemedText style={styles.priceText}>
                        Price: ${selectedStock.price.toFixed(2)}
                      </ThemedText>
                      {selectedStock.change !== undefined && (
                        <ThemedText
                          style={[
                            styles.changeText,
                            { color: selectedStock.change >= 0 ? "#10B981" : "#EF4444" },
                          ]}
                        >
                          {selectedStock.change >= 0 ? "+" : ""}
                          {selectedStock.change.toFixed(2)} (
                          {selectedStock.change_percent?.toFixed(2)}%)
                        </ThemedText>
                      )}

                      <TextInput
                        style={styles.input}
                        placeholder="Quantity (shares)"
                        placeholderTextColor="#9CA3AF"
                        value={quantity}
                        onChangeText={setQuantity}
                        keyboardType="decimal-pad"
                      />

                      <ThemedText style={styles.totalText}>
                        Total: ${calculateTotal()}
                      </ThemedText>
                    </>
                  ) : null}
                </ThemedView>
              )}
            </ScrollView>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <ThemedText style={styles.buttonText}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedStock || !quantity || fetchingPrices) && styles.buttonDisabled,
              ]}
              onPress={handleTradeSubmit}
              disabled={!selectedStock || !quantity || fetchingPrices}
            >
              <ThemedText style={styles.buttonText}>
                Create Proposal
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#1A2332",
    borderWidth: 1,
    borderColor: "#374151",
  },
  title: {
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 16,
  },
  loader: {
    marginVertical: 32,
  },
  scrollView: {
    maxHeight: 400,
  },
  categoryContainer: {
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#0F1729",
    borderRadius: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  expandIcon: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  stockList: {
    marginTop: 8,
    paddingLeft: 12,
  },
  stockItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#0F1729",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  stockItemSelected: {
    borderColor: "#FBBF24",
    backgroundColor: "#1F2937",
  },
  stockSymbol: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FBBF24",
  },
  stockName: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  checkmark: {
    fontSize: 20,
    color: "#10B981",
  },
  selectedStockCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#0F1729",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FBBF24",
  },
  selectedStockTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FBBF24",
  },
  selectedStockName: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 12,
  },
  priceText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#10B981",
    marginBottom: 4,
  },
  changeText: {
    fontSize: 14,
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#1F2937",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
    fontSize: 16,
    marginBottom: 12,
  },
  totalText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FBBF24",
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#6B7280",
    alignItems: "center",
  },
  submitButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#10B981",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
