import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, FlatList } from 'react-native';
import { Colors } from '../theme/colors';
import { Fuel, Plus, X, Search, Calendar as CalendarIcon, MapPin, Truck } from 'lucide-react-native';
import { fuelService, FuelRecord } from '../services/FuelService';
import { authService } from '../services/AuthService';
import { attendanceService, StaffProfile } from '../services/AttendanceService';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRESET_TRUCKS = [
  'TN 36 P 0123',
  'TN 36 V 1270',
  'TN 22 BJ 2799',
  'TN 42 E 1408',
  'Others',
];

const FuelScreen = () => {
  const insets = useSafeAreaInsets();
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'admin' || user?.role?.toLowerCase() === 'admin';

  // Form state
  const [truckNo, setTruckNo] = useState('');
  const [selectedTruckOption, setSelectedTruckOption] = useState('');
  const [showTruckDropdown, setShowTruckDropdown] = useState(false);
  const [employeeName, setEmployeeName] = useState(user?.full_name || '');
  const [liters, setLiters] = useState('');
  const [amount, setAmount] = useState('');
  const [fuelPrice, setFuelPrice] = useState('');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-GB').replace(/\//g, '-'));
  const [showCalendar, setShowCalendar] = useState(false);
  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>([]);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);



  useEffect(() => {
    const amt = parseFloat(amount);
    const price = parseFloat(fuelPrice);
    if (!isNaN(amt) && !isNaN(price) && price > 0) {
      setLiters((amt / price).toFixed(2));
    }
  }, [amount, fuelPrice]);

  const loadData = async () => {
    const data = await fuelService.getFuelRecords();
    setRecords(data);
    const profiles = await attendanceService.getStaffProfiles();
    setStaffProfiles(profiles);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = fuelService.subscribe(() => {
      setRecords(fuelService.getLocalFuelRecords());
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!truckNo || !liters || !amount || !employeeName || !fuelPrice) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      await fuelService.addFuelRecord({
        truckNo,
        employeeName: employeeName,
        liters: parseFloat(liters),
        amount: parseFloat(amount),
        fuelPrice: parseFloat(fuelPrice),
        date
      });
      
      Alert.alert('Success', 'Fuel record added successfully');
      setShowAddModal(false);
      
      // Reset form
      setTruckNo('');
      setSelectedTruckOption('');
      setEmployeeName(user?.full_name || '');
      setLiters('');
      setAmount('');
      setFuelPrice('');
      setDate(new Date().toLocaleDateString('en-GB').replace(/\//g, '-'));
      
    } catch (e) {
      Alert.alert('Error', 'Failed to save fuel record');
    }
  };

  const filteredRecords = records.filter(r => 
    r.truckNo.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.date.includes(searchQuery)
  );

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
          <Text style={styles.detailLabel}>Fuel Volume</Text>
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

      <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10 }}>
        <Text style={styles.driverText}>Employee: <Text style={{ fontWeight: 'bold', color: Colors.text }}>{item.employeeName}</Text></Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Fuel Tracking</Text>
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color={Colors.white} style={{ marginRight: 6 }} />
          <Text style={styles.addBtnText}>Add Fuel</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Truck No or Date..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      {filteredRecords.length === 0 ? (
        <View style={styles.emptyState}>
          <Fuel size={48} color={Colors.border} />
          <Text style={styles.emptyStateText}>No fuel records found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRecords}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Fuel Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Fuel Entry</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.closeButton}>
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 24, paddingBottom: 20 }}>
              <Text style={styles.inputLabel}>Date *</Text>
              <TouchableOpacity 
                style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' }]}
                onPress={() => setShowCalendar(true)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <CalendarIcon size={20} color={Colors.primary} style={{ marginRight: 10 }} />
                  <Text style={{ color: Colors.text, fontSize: 16, fontWeight: '500' }}>{date}</Text>
                </View>
                <Text style={{ color: Colors.primary, fontSize: 13, fontWeight: '600' }}>Change</Text>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Truck Number *</Text>
              <TouchableOpacity 
                style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' }]} 
                onPress={() => setShowTruckDropdown(!showTruckDropdown)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Truck size={20} color={Colors.primary} style={{ marginRight: 10 }} />
                  <Text style={{ color: selectedTruckOption ? Colors.text : Colors.textSecondary, fontSize: 16, fontWeight: selectedTruckOption ? '500' : '400' }}>
                    {selectedTruckOption || 'Select Truck Number'}
                  </Text>
                </View>
                <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>▼</Text>
              </TouchableOpacity>
              
              {showTruckDropdown && (
                <View style={{ backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E4E6EB', borderRadius: 12, marginTop: 5, overflow: 'hidden' }}>
                  {PRESET_TRUCKS.map((truck, idx) => (
                    <TouchableOpacity 
                      key={idx}
                      style={{ padding: 15, borderBottomWidth: idx === PRESET_TRUCKS.length - 1 ? 0 : 1, borderBottomColor: '#E4E6EB' }}
                      onPress={() => {
                        setSelectedTruckOption(truck);
                        if (truck !== 'Others') {
                          setTruckNo(truck);
                        } else {
                          setTruckNo('');
                        }
                        setShowTruckDropdown(false);
                      }}
                    >
                      <Text style={{ color: Colors.text, fontSize: 15 }}>{truck}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {selectedTruckOption === 'Others' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: '#FFFFFF', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6', paddingHorizontal: 16, height: 54 }}>
                  <Text style={{ color: Colors.textSecondary, fontSize: 15, marginRight: 8, fontWeight: '500' }}>TN</Text>
                  <TextInput 
                    style={{ flex: 1, color: Colors.text, fontSize: 16, fontWeight: '500' }}
                    placeholder="Enter custom Truck No"
                    value={truckNo}
                    onChangeText={setTruckNo}
                    autoCapitalize="characters"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>
              )}

              <Text style={styles.inputLabel}>Employee Name</Text>
              <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderWidth: 0, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }]}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <Text style={{ color: Colors.primary, fontWeight: 'bold', fontSize: 16 }}>
                    {employeeName ? employeeName.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
                <Text style={{ color: Colors.text, fontSize: 16, fontWeight: '600', flex: 1 }}>
                  {employeeName || 'Unknown User'}
                </Text>
                <View style={{ backgroundColor: '#E5E7EB', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ fontSize: 11, color: Colors.textSecondary, fontWeight: '600' }}>Logged In</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 15, marginTop: 5 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Today Fuel Price (₹) *</Text>
                  <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' }]}>
                    <Text style={{ color: Colors.textSecondary, marginRight: 6, fontSize: 16, fontWeight: '600' }}>₹</Text>
                    <TextInput 
                      style={{ flex: 1, color: Colors.text, fontSize: 16, fontWeight: '500' }}
                      placeholder="0.00"
                      keyboardType="numeric"
                      value={fuelPrice}
                      onChangeText={setFuelPrice}
                      placeholderTextColor={Colors.textSecondary}
                    />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Total Amount (₹) *</Text>
                  <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' }]}>
                    <Text style={{ color: Colors.success || '#10B981', marginRight: 6, fontSize: 16, fontWeight: '600' }}>₹</Text>
                    <TextInput 
                      style={{ flex: 1, color: Colors.text, fontSize: 16, fontWeight: '600' }}
                      placeholder="0"
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                      placeholderTextColor={Colors.textSecondary}
                    />
                  </View>
                </View>
              </View>

              <Text style={styles.inputLabel}>Fuel Liters *</Text>
              <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' }]}>
                <Fuel size={20} color={Colors.primary} style={{ marginRight: 10 }} />
                <TextInput 
                  style={{ flex: 1, color: Colors.text, fontSize: 16, fontWeight: '500' }}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={liters}
                  onChangeText={setLiters}
                  placeholderTextColor={Colors.textSecondary}
                />
                <Text style={{ color: Colors.textSecondary, fontWeight: '600', fontSize: 14 }}>Liters</Text>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save Fuel Record</Text>
              </TouchableOpacity>
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Calendar Modal */}
      <Modal visible={showCalendar} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={{ width: '90%', backgroundColor: Colors.white, borderRadius: 20, overflow: 'hidden' }}>
            <Calendar 
              onDayPress={(day: any) => {
                const [year, month, d] = day.dateString.split('-');
                const localDateStr = `${d}-${month}-${year}`; // en-GB format
                setDate(localDateStr);
                setShowCalendar(false);
              }}
              theme={{
                selectedDayBackgroundColor: Colors.primary,
                todayTextColor: Colors.primary,
                arrowColor: Colors.primary,
              }}
            />
            <TouchableOpacity 
              style={{ padding: 15, alignItems: 'center', backgroundColor: '#F0F2F5', borderTopWidth: 1, borderTopColor: Colors.border }} 
              onPress={() => setShowCalendar(false)}
            >
              <Text style={{ fontWeight: 'bold', color: Colors.textSecondary }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>



    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  addBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addBtnText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 20,
    height: 52,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: Colors.text,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.5)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
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
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
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
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyStateText: {
    marginTop: 15,
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 15,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  dragHandle: {
    width: 45,
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 5,
  },
  closeButton: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    color: Colors.text,
    fontSize: 15,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 25,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  saveBtnText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.5)',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 15,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
  },
});

export default FuelScreen;
