import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Colors } from '../theme/colors';
import { FuelRecord } from '../services/FuelService';
import { fuelService } from '../services/FuelService';

// Component shows month‑wise total, paid amount and remaining balance.
// Admin can tap "Record Payment" to add a payment for that month.
export const AdminMonthlyFuelReport = () => {
  const [monthlyData, setMonthlyData] = useState<Array<{ month: string; total: number; paid: number; balance: number }>>([]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [paymentInput, setPaymentInput] = useState<string>('');

  const loadData = async () => {
    try {
      const data = await fuelService.getMonthlySummary();
      setMonthlyData(data);
    } catch (e) {
      console.warn('Failed to load monthly fuel summary', e);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = fuelService.subscribe(() => loadData());
    return () => unsubscribe();
  }, []);

  const handleSavePayment = async () => {
    const amt = parseFloat(paymentInput);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid amount', 'Please enter a positive number');
      return;
    }
    try {
      await fuelService.addFuelPayment(selectedMonth, amt);
      setPaymentInput('');
      setShowPayModal(false);
      // data will refresh via subscription
    } catch (e) {
      Alert.alert('Error', 'Failed to record payment');
    }
  };

  const renderItem = ({ item }: { item: { month: string; total: number; paid: number; balance: number } }) => (
    <View style={styles.card}>
      <Text style={styles.month}>{item.month}</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Total:</Text>
        <Text style={styles.value}>₹{item.total.toFixed(2)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Paid:</Text>
        <Text style={styles.value}>₹{item.paid.toFixed(2)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Balance:</Text>
        <Text style={[styles.value, { color: item.balance > 0 ? Colors.error : Colors.success }]}>
          ₹{item.balance.toFixed(2)}
        </Text>
      </View>
      <TouchableOpacity style={styles.payBtn} onPress={() => { setSelectedMonth(item.month); setShowPayModal(true); }}>
        <Text style={styles.payBtnText}>Record Payment</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList data={monthlyData} keyExtractor={item => item.month} renderItem={renderItem} />

      <Modal visible={showPayModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Payment for {selectedMonth}</Text>
            <TextInput
              style={styles.input}
              placeholder="Amount"
              keyboardType="numeric"
              value={paymentInput}
              onChangeText={setPaymentInput}
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: Colors.border }]} onPress={() => setShowPayModal(false)}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: Colors.primary }]} onPress={handleSavePayment}>
                <Text style={styles.modalBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  month: { fontSize: 18, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 14, color: Colors.textSecondary },
  value: { fontSize: 14, fontWeight: '600', color: Colors.text },
  payBtn: { marginTop: 10, backgroundColor: Colors.primary, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  payBtnText: { color: Colors.white, fontWeight: '600', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: Colors.white, borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: Colors.text, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, marginBottom: 12 },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtn: { flex: 0.48, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  modalBtnText: { color: Colors.white, fontWeight: '600' },
});
