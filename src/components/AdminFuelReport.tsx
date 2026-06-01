import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { Colors } from '../theme/colors';
import { Fuel, Truck, Calendar as CalendarIcon, ChevronDown, X } from 'lucide-react-native';
import { fuelService, FuelRecord } from '../services/FuelService';

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const currentYear = new Date().getFullYear();
const allMonths = Array.from({ length: 12 }, (_, i) => {
  const m = (i + 1).toString().padStart(2, '0');
  return { value: `${currentYear}-${m}`, label: `${monthNames[i]} ${currentYear}` };
});

export const AdminFuelReport = ({ refreshing }: { refreshing?: boolean }) => {
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [summaries, setSummaries] = useState<Array<{ month: string; total: number; paid: number; balance: number }>>([]);
  
  const currentMonthValue = `${currentYear}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthValue);
  
  const [showPayModal, setShowPayModal] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [paymentInput, setPaymentInput] = useState('');
  const [apiSummary, setApiSummary] = useState<any>(null);

  const loadData = async () => {
    const data = await fuelService.getFuelRecords();
    setRecords(data);
    const sum = await fuelService.getMonthlySummary();
    setSummaries(sum);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = fuelService.subscribe(() => {
      setRecords(fuelService.getLocalFuelRecords());
      fuelService.getMonthlyBill().then(sum => setSummaries(sum as any));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (refreshing) {
      loadData();
    }
  }, [refreshing]);

  useEffect(() => {
    const fetchApiSummary = async () => {
      if (!selectedMonth) return;
      try {
        const res = await fetch(`https://api.codingboss.in/inventory/fuel/monthly-summary/?month=${selectedMonth}`);
        const data = await res.json();
        setApiSummary(data);
      } catch (err) {
        console.error("API Fuel summary fetch error", err);
      }
    };
    fetchApiSummary();
  }, [selectedMonth, refreshing, records]); // Refetch when month changes or new records/payments added

  const filteredRecords = selectedMonth ? records.filter(r => {
    if (!r.date) return false;
    // Check YYYY-MM (e.g. 2026-05-29)
    if (r.date.startsWith(selectedMonth)) return true;
    
    // Check DD-MM-YYYY (e.g. 29-05-2026)
    const [year, month] = selectedMonth.split('-');
    if (r.date.includes(`-${month}-${year}`)) return true;
    
    // Check YYYY/MM/DD or MM/DD/YYYY if slashes are used
    if (r.date.includes(`${year}/${month}`) || r.date.includes(`${month}/${year}`)) return true;

    return false;
  }) : records;
  const currentSummary = summaries.find(s => s.month === selectedMonth) || { total: 0, paid: 0, balance: 0 };
  
  // Use API summary if available, fallback to local
  const totalCost = Number(apiSummary?.total_amount ?? currentSummary.total ?? 0);
  const paidAmount = Number(apiSummary?.paid ?? currentSummary.paid ?? 0);
  const balance = Number(apiSummary?.balance ?? currentSummary.balance ?? 0);
  const totalLiters = Number(apiSummary?.total_liters ?? filteredRecords.reduce((sum, r) => sum + r.liters, 0));

  const handlePayment = async () => {
    const amt = parseFloat(paymentInput);
    if (!isNaN(amt) && amt > 0 && selectedMonth) {
      try {
        // Send payment to remote API
        await fetch('https://api.codingboss.in/inventory/fuel/payment/', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            month: selectedMonth,
            paid_amount: amt
          }),
        });

        // Also update local store
        await fuelService.addFuelPayment(selectedMonth, amt);
        
        setPaymentInput('');
        setShowPayModal(false);
        loadData();
      } catch (err) {
        console.error("Payment failed", err);
        Alert.alert("Error", "Failed to record payment on the server.");
      }
    }
  };

  const renderItem = ({ item }: { item: FuelRecord }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.truckBadge}>
          <Truck size={16} color={Colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.truckText}>{item.truckNo}</Text>
        </View>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
      
      <View style={styles.detailsGrid}>
        <View style={styles.detailBox}>
          <Text style={styles.detailLabel}>Fuel</Text>
          <Text style={styles.detailValue}>{item.liters} L</Text>
        </View>
        <View style={styles.detailBox}>
          <Text style={styles.detailLabel}>Price/L</Text>
          <Text style={styles.detailValue}>₹{item.fuelPrice}</Text>
        </View>
        <View style={styles.detailBox}>
          <Text style={styles.detailLabel}>Total Amount</Text>
          <Text style={[styles.detailValue, { color: Colors.success }]}>₹{item.amount}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.driverText}>Employee: <Text style={{ fontWeight: 'bold', color: Colors.text }}>{item.employeeName}</Text></Text>
        <TouchableOpacity 
          onPress={() => fuelService.deleteFuelRecord(item.id)}
          style={{ padding: 4 }}
        >
          <Text style={{ color: Colors.error, fontSize: 12, fontWeight: 'bold' }}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={{ marginBottom: 15, paddingHorizontal: 5 }}>
        <TouchableOpacity 
          style={styles.dropdownTrigger}
          onPress={() => setShowMonthDropdown(true)}
        >
          <CalendarIcon size={20} color={Colors.primary} />
          <Text style={styles.dropdownText}>
            {allMonths.find(m => m.value === selectedMonth)?.label || selectedMonth}
          </Text>
          <ChevronDown size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.statsContainer, { flexWrap: 'wrap' }]}>
        <View style={[styles.statBox, { minWidth: '45%', marginBottom: 10 }]}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: Colors.text }}>{totalLiters.toFixed(2)} L</Text>
          <Text style={styles.statLabel}>Total Liters</Text>
        </View>
        <View style={[styles.statBox, { minWidth: '45%', marginBottom: 10 }]}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: Colors.text }}>₹{totalCost.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Bill</Text>
        </View>
        <View style={[styles.statBox, { minWidth: '45%' }]}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: Colors.primary }}>₹{paidAmount.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Paid</Text>
        </View>
        <View style={[styles.statBox, { minWidth: '45%' }]}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: balance > 0 ? Colors.error : Colors.success }}>₹{balance.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Balance Bill</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.payBtn}
        onPress={() => setShowPayModal(true)}
      >
        <Text style={styles.payBtnText}>Record Payment for {selectedMonth}</Text>
      </TouchableOpacity>

      {filteredRecords.length === 0 ? (
        <View style={styles.emptyState}>
          <Fuel size={48} color={Colors.border} />
          <Text style={styles.emptyStateText}>No fuel records found.</Text>
        </View>
      ) : (
        <View style={{ paddingBottom: 100 }}>
          {filteredRecords.map(item => (
            <React.Fragment key={item.id}>
              {renderItem({ item })}
            </React.Fragment>
          ))}
        </View>
      )}

      {/* Month Dropdown Modal */}
      <Modal visible={showMonthDropdown} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select Month</Text>
              <TouchableOpacity onPress={() => setShowMonthDropdown(false)}>
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {allMonths.map(m => (
                <TouchableOpacity 
                  key={m.value}
                  style={[styles.dropdownItem, selectedMonth === m.value && styles.dropdownItemActive]}
                  onPress={() => {
                    setSelectedMonth(m.value);
                    setShowMonthDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, selectedMonth === m.value && styles.dropdownItemTextActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={showPayModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Fuel Payment</Text>
            <Text style={{ color: Colors.textSecondary, marginBottom: 15 }}>Remaining Balance: ₹{balance}</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Enter amount paid"
              keyboardType="numeric"
              value={paymentInput}
              onChangeText={setPaymentInput}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: Colors.border }]} onPress={() => setShowPayModal(false)}>
                <Text style={{ color: Colors.text, fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: Colors.primary }]} onPress={handlePayment}>
                <Text style={{ color: Colors.white, fontWeight: 'bold' }}>Save Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: 4,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  truckBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 119, 242, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  truckText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 15,
  },
  dateText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 12,
  },
  detailBox: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  driverText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  notesText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 30,
    paddingVertical: 30,
  },
  emptyStateText: {
    marginTop: 15,
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  payBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  payBtnText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  modalBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 10,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(24, 119, 242, 0.1)',
  },
  dropdownItemText: {
    fontSize: 16,
    color: Colors.text,
  },
  dropdownItemTextActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
});
