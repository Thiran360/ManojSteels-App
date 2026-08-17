import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors } from '../theme/colors';
import { authService } from '../services/AuthService';
import { cartService } from '../services/CartService';
import { attendanceService, StaffProfile, AttendanceRecord, AttendanceStatus } from '../services/AttendanceService';
import { X, Calendar as CalendarIcon, Save, Trash2, User, Phone, Briefcase, ChevronDown, UserPlus, CheckCircle, XCircle, Users, Truck, UserCheck, ClipboardList, Calculator, Map } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DESIGNATIONS = ['Driver', 'Manager', 'Supervisor', 'Accountants', 'North Indians'];


const EmployeeAttendanceScreen = () => {
  const user = authService.getCurrentUser();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [currentDate, setCurrentDate] = useState(todayStr);
  const [showCalendar, setShowCalendar] = useState(false);
  
  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>([]);
  const [dailyRecords, setDailyRecords] = useState<AttendanceRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Pending unsaved attendance selections
  const [pendingAttendance, setPendingAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [selectedShifts, setSelectedShifts] = useState<Record<string, 'Morning' | 'Afternoon'>>({});

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDesignation, setNewDesignation] = useState(DESIGNATIONS[0]);
  const [showDesignationDropdown, setShowDesignationDropdown] = useState(false);
  const [showStaffNameDropdown, setShowStaffNameDropdown] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newJoiningDate, setNewJoiningDate] = useState(todayStr);
  const [showJoiningCalendar, setShowJoiningCalendar] = useState(false);
  const [signupEmployees, setSignupEmployees] = useState<any[]>([]);

  const loadData = async () => {
    const profiles = await attendanceService.getStaffProfiles();
    const records = await attendanceService.getAttendanceForDate(currentDate);
    setStaffProfiles(profiles);
    setDailyRecords(records);
    setPendingAttendance({}); // Reset pending on date change
    
    let combinedEmployees: any[] = [];
    
    try {
      const emps = await cartService.apiFetchEmployees();
      if (emps && emps.length > 0) {
        combinedEmployees = [...emps];
      }
    } catch(e) {
      console.log('Error fetching signup employees for attendance', e);
    }

    setSignupEmployees(combinedEmployees);
  };

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const handleCreateProfile = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      Alert.alert('Error', 'Please enter Name and Phone Number');
      return;
    }

    const matchedEmp = signupEmployees.find(emp => (emp.name || emp.phone_number || emp.phone || emp.staff_name) === newName.trim());
    const backendId = matchedEmp?.id || matchedEmp?.employee;

    await attendanceService.addStaffProfile({
      backendId: backendId,
      name: newName.trim(),
      phone: newPhone.trim(),
      designation: newDesignation,
      totalDays: 30,
      joiningDate: newJoiningDate,
      status: 'Active'
    });
    Alert.alert('Success', 'Staff Profile created successfully');
    setNewName('');
    setNewPhone('');
    setNewJoiningDate(todayStr);
    setShowCreateModal(false);
    loadData();
  };

  const getRecordForStaff = (staffId: string): AttendanceStatus | null => {
    if (pendingAttendance[staffId]) return pendingAttendance[staffId];
    return dailyRecords.find(r => r.staffId === staffId)?.status || null;
  };

  const handleSaveAttendance = async () => {
    const keys = Object.keys(pendingAttendance);
    if (keys.length === 0) {
      Alert.alert('Info', 'No changes to save.');
      return;
    }
    
    let hasError = false;

    for (const staffId of keys) {
      const staff = staffProfiles.find(s => s.id === staffId);
      if (!staff) continue;
      
      const statusValue = pendingAttendance[staffId].toLowerCase();
      
      let payload: any = {
        status: statusValue,
        date: currentDate
      };

      if (staff.backendId) {
        payload.employee = Number(staff.backendId);
      } else {
        payload.temporary_staff = {
          staff_name: staff.name,
          phone: staff.phone,
          joining_date: staff.joiningDate || currentDate
        };
      }

      try {
        const response = await fetch('https://api.codingboss.in/inventory/attendance/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error('Server error:', errText);
          hasError = true;
        } else {
          // Only mark locally if server succeeded
          await attendanceService.markAttendance(staffId, currentDate, pendingAttendance[staffId]);
        }
      } catch (err) {
        console.error('Failed to sync attendance to backend', err);
        hasError = true;
      }
    }
    
    if (hasError) {
      Alert.alert('Warning', 'Some attendance records failed to sync to the server.');
    } else {
      Alert.alert('Success', 'Attendance saved successfully!');
    }
    loadData();
  };

  const filteredStaff = staffProfiles.filter(staff => 
    selectedCategory === 'All' || staff.designation === selectedCategory
  );

  return (
    <View style={styles.container}>
      <View style={[styles.modernHeader, { backgroundColor: Colors.primary, paddingTop: insets.top + 20 }]}>
        <Text style={styles.modernHeaderTitle}>Daily Attendance Roster</Text>
        <Text style={styles.modernHeaderSubtitle}>Manage your staff attendance efficiently</Text>
      </View>

      <ScrollView style={{ flex: 1, zIndex: 1, elevation: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 20, paddingBottom: 10, zIndex: 1 }}>
          <View style={styles.modernDateCard}>
            <View>
              <Text style={styles.modernDateLabel}>Attendance Date</Text>
              <Text style={styles.modernDateValue}>{currentDate}</Text>
            </View>
            <TouchableOpacity 
              style={styles.modernDateBtn}
              onPress={() => setShowCalendar(true)}
            >
              <CalendarIcon size={18} color={Colors.primary} />
              <Text style={styles.modernDateBtnText}>Change</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.modernAddBtn}
            onPress={() => setShowCreateModal(true)}
          >
            <UserPlus size={20} color={Colors.white} style={{ marginRight: 8 }} />
            <Text style={styles.modernAddBtnText}>Create New Staff Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={{ alignItems: 'center', marginVertical: 12, paddingHorizontal: 10 }}>
          <View style={{ 
            backgroundColor: '#FFFFFF', 
            borderRadius: 40, 
            paddingVertical: 8,
            paddingHorizontal: 12,
            shadowColor: '#000', 
            shadowOffset: { width: 0, height: 6 }, 
            shadowOpacity: 0.08, 
            shadowRadius: 10, 
            elevation: 6,
            width: '100%'
          }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 22, paddingHorizontal: 10, alignItems: 'center' }}>
              {['All', ...DESIGNATIONS].map((cat) => {
                let Icon = Briefcase;
                if (cat === 'All') Icon = Users;
                else if (cat === 'Driver') Icon = Truck;
                else if (cat === 'Manager') Icon = UserCheck;
                else if (cat === 'Supervisor') Icon = ClipboardList;
                else if (cat === 'Accountants') Icon = Calculator;
                else if (cat === 'North Indians') Icon = Map;
                
                const isActive = selectedCategory === cat;
                return (
                  <TouchableOpacity 
                    key={cat} 
                    onPress={() => setSelectedCategory(cat)}
                    style={{ alignItems: 'center', justifyContent: 'center' }}
                    activeOpacity={0.7}
                  >
                    <View style={{ 
                      backgroundColor: isActive ? Colors.primary : 'transparent', 
                      width: 42, 
                      height: 42, 
                      borderRadius: 50, overflow: 'hidden', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginBottom: 4
                    }}>
                      <Icon size={20} color={isActive ? Colors.white : '#4F5E7B'} />
                    </View>
                    <Text style={{ 
                      fontSize: 11, 
                      fontWeight: isActive ? '700' : '500', 
                      color: isActive ? Colors.primary : '#4F5E7B' 
                    }}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        <View style={{ padding: 20 }}>
          {filteredStaff.length === 0 ? (
            <View style={styles.modernEmptyState}>
              <User size={40} color={Colors.border} />
              <Text style={styles.modernEmptyText}>No staff profiles found for this category.</Text>
            </View>
          ) : (
            filteredStaff.map((staff) => {
              const currentStatus = getRecordForStaff(staff.id);
              return (
                <View key={staff.id} style={styles.modernStaffCard}>
                  <View style={styles.modernStaffHeader}>
                    <View style={styles.modernStaffAvatar}>
                      <Text style={styles.modernStaffAvatarText}>{staff.name ? staff.name.charAt(0).toUpperCase() : 'U'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modernStaffName}>{staff.name || 'Unknown'}</Text>
                      <Text style={styles.modernStaffDesignation}>{staff.designation ? staff.designation.toUpperCase() : 'UNKNOWN'}</Text>
                      <Text style={styles.modernStaffPhone}>{staff.phone || 'No phone'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 10 }}>
                      <TouchableOpacity 
                        style={styles.modernViewProfileBtn}
                        onPress={() => navigation.navigate('StaffProfile', { staffId: staff.id })}
                      >
                        <Text style={styles.modernViewProfileText}>View Profile</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={{ flexDirection: 'row', alignItems: 'center', padding: 4 }}
                        onPress={() => {
                          Alert.alert('Delete Staff', `Are you sure you want to delete ${staff.name}?`, [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: async () => {
                                await attendanceService.deleteStaffProfile(staff.id);
                                loadData();
                              } 
                            }
                          ]);
                        }}
                      >
                        <Trash2 size={16} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={{ paddingHorizontal: 15, paddingBottom: 10 }}>
                    <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 6, fontWeight: 'bold' }}>Select Shift</Text>
                    <View style={{ flexDirection: 'row', backgroundColor: '#F0F4F8', borderRadius: 8, padding: 4, marginBottom: 15 }}>
                      <TouchableOpacity 
                        style={{ flex: 1, padding: 8, borderRadius: 6, backgroundColor: (selectedShifts[staff.id] || 'Morning') === 'Morning' ? Colors.white : 'transparent', elevation: (selectedShifts[staff.id] || 'Morning') === 'Morning' ? 2 : 0 }}
                        onPress={() => {
                          setSelectedShifts(prev => ({...prev, [staff.id]: 'Morning'}));
                          if (currentStatus === 'Morning' || currentStatus === 'Afternoon') {
                            setPendingAttendance(prev => ({...prev, [staff.id]: 'Morning'}));
                          }
                        }}
                      >
                        <Text style={{ textAlign: 'center', color: (selectedShifts[staff.id] || 'Morning') === 'Morning' ? Colors.primary : Colors.textSecondary, fontWeight: (selectedShifts[staff.id] || 'Morning') === 'Morning' ? 'bold' : 'normal', fontSize: 13 }}>Morning</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={{ flex: 1, padding: 8, borderRadius: 6, backgroundColor: (selectedShifts[staff.id] || 'Morning') === 'Afternoon' ? Colors.white : 'transparent', elevation: (selectedShifts[staff.id] || 'Morning') === 'Afternoon' ? 2 : 0 }}
                        onPress={() => {
                          setSelectedShifts(prev => ({...prev, [staff.id]: 'Afternoon'}));
                          if (currentStatus === 'Morning' || currentStatus === 'Afternoon') {
                            setPendingAttendance(prev => ({...prev, [staff.id]: 'Afternoon'}));
                          }
                        }}
                      >
                        <Text style={{ textAlign: 'center', color: (selectedShifts[staff.id] || 'Morning') === 'Afternoon' ? Colors.primary : Colors.textSecondary, fontWeight: (selectedShifts[staff.id] || 'Morning') === 'Afternoon' ? 'bold' : 'normal', fontSize: 13 }}>Afternoon</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={[styles.modernAttendanceActionsGrid, { paddingTop: 0 }]}>
                    <TouchableOpacity 
                      style={[
                        styles.modernActionBtn, 
                        (currentStatus === 'Morning' || currentStatus === 'Afternoon') ? styles.modernPresentBtnActive : styles.modernActionBtnInactive
                      ]}
                      onPress={() => setPendingAttendance(prev => ({ ...prev, [staff.id]: (selectedShifts[staff.id] || 'Morning') }))}
                    >
                      <CheckCircle size={18} color={(currentStatus === 'Morning' || currentStatus === 'Afternoon') ? Colors.white : '#4CAF50'} />
                      <Text style={[styles.modernActionBtnText, (currentStatus === 'Morning' || currentStatus === 'Afternoon') ? { color: Colors.white } : { color: '#4CAF50' }]}>
                        Mark Present
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[
                        styles.modernActionBtn, 
                        currentStatus === 'Absent' ? styles.modernAbsentBtnActive : styles.modernActionBtnInactive
                      ]}
                      onPress={() => setPendingAttendance(prev => ({ ...prev, [staff.id]: 'Absent' }))}
                    >
                      <XCircle size={18} color={currentStatus === 'Absent' ? Colors.white : '#F44336'} />
                      <Text style={[styles.modernActionBtnText, currentStatus === 'Absent' ? { color: Colors.white } : { color: '#F44336' }]}>
                        Mark Absent
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
          
          {staffProfiles.length > 0 && (
            <TouchableOpacity style={styles.modernSaveAllBtn} onPress={handleSaveAttendance}>
              <View style={[styles.modernSaveAllGradient, { backgroundColor: '#4CAF50' }]}>
                <Save size={20} color={Colors.white} style={{ marginRight: 8 }} />
                <Text style={styles.modernSaveAllBtnText}>Save Attendance</Text>
              </View>
            </TouchableOpacity>
          )}
          
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Main Calendar Modal (Restricted to Today) */}
      <Modal visible={showCalendar} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <Calendar
              current={currentDate}
              minDate={todayStr}
              maxDate={todayStr}
              onDayPress={(day: any) => {
                setCurrentDate(day.dateString);
                setShowCalendar(false);
              }}
              theme={{
                selectedDayBackgroundColor: Colors.primary,
                todayTextColor: Colors.primary,
                arrowColor: Colors.primary,
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Create Profile Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.modalOverlay}
        >
          <View style={styles.modernModalContainer}>
            <View style={styles.modernModalHeader}>
              <View>
                <Text style={styles.modernModalTitle}>New Staff Profile</Text>
                <Text style={styles.modernModalSubtitle}>Add a new team member to attendance</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCreateModal(false)}>
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={styles.modernModalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modernFormGroup}>
                <Text style={styles.modernInputLabel}>Designation / Category</Text>
                <TouchableOpacity 
                  style={[styles.modernDropdownField, showDesignationDropdown && styles.modernDropdownFieldActive]}
                  onPress={() => setShowDesignationDropdown(!showDesignationDropdown)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Briefcase size={18} color={Colors.primary} />
                    <Text style={{ fontSize: 15, color: Colors.text, fontWeight: '500' }}>{newDesignation}</Text>
                  </View>
                  <ChevronDown size={18} color={Colors.textSecondary} style={{ transform: [{ rotate: showDesignationDropdown ? '180deg' : '0deg' }] }} />
                </TouchableOpacity>
                
                {showDesignationDropdown && (
                  <View style={styles.modernDropdownList}>
                    {DESIGNATIONS.map((desig) => (
                      <TouchableOpacity 
                        key={desig} 
                        style={styles.modernDropdownItem}
                        onPress={() => {
                          setNewDesignation(desig);
                          setShowDesignationDropdown(false);
                        }}
                      >
                        <Text style={{ color: newDesignation === desig ? Colors.primary : Colors.text, fontWeight: newDesignation === desig ? '600' : '400' }}>
                          {desig}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.modernFormGroup}>
                <Text style={styles.modernInputLabel}>Staff Name</Text>
                
                <TouchableOpacity 
                  style={[styles.modernDropdownField, showStaffNameDropdown && styles.modernDropdownFieldActive]}
                  onPress={() => setShowStaffNameDropdown(!showStaffNameDropdown)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <User size={18} color={Colors.primary} />
                    <Text style={{ fontSize: 15, color: newName ? Colors.text : Colors.textSecondary, fontWeight: '500' }}>
                      {newName || 'Select Staff Name'}
                    </Text>
                  </View>
                  <ChevronDown size={18} color={Colors.textSecondary} style={{ transform: [{ rotate: showStaffNameDropdown ? '180deg' : '0deg' }] }} />
                </TouchableOpacity>

                {showStaffNameDropdown && (
                  <View style={styles.modernDropdownList}>
                    {signupEmployees.length > 0 ? signupEmployees.map(emp => {
                      const empName = emp.name || emp.phone_number || emp.phone || 'Employee';
                      const isSelected = newName === empName;
                      return (
                          <TouchableOpacity 
                            key={emp.id || empName} 
                            style={styles.modernDropdownItem}
                            onPress={() => {
                              setNewName(empName);
                              if (emp.phone_number || emp.phone) {
                                setNewPhone(emp.phone_number || emp.phone || '');
                              }
                              setShowStaffNameDropdown(false);
                            }}
                          >
                            <Text style={{ color: isSelected ? Colors.primary : Colors.text, fontWeight: isSelected ? '600' : '500', fontSize: 15 }}>
                              {empName}
                            </Text>
                            {(emp.phone || emp.phone_number) && (
                              <Text style={{ color: Colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                                📱 {emp.phone || emp.phone_number}
                              </Text>
                            )}
                          </TouchableOpacity>
                      );
                    }) : (
                      <View style={{ padding: 12, alignItems: 'center' }}>
                        <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>No registered employees found</Text>
                      </View>
                    )}
                    <TouchableOpacity 
                      style={[styles.modernDropdownItem, { borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: 'rgba(33, 150, 243, 0.05)' }]}
                      onPress={() => {
                        setNewName('');
                        setNewPhone('');
                        setShowStaffNameDropdown(false);
                      }}
                    >
                      <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>+ Add Custom Name</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {!signupEmployees.some(emp => (emp.name || emp.phone_number || emp.phone) === newName) && (
                  <View style={[styles.modernInputWrapper, { marginTop: 12 }]}>
                    <User size={18} color={Colors.textSecondary} style={{ marginRight: 10 }} />
                    <TextInput 
                      style={styles.modernInput}
                      value={newName}
                      onChangeText={setNewName}
                      placeholder="Type custom staff name"
                      placeholderTextColor={Colors.textSecondary}
                    />
                  </View>
                )}
              </View>

              <View style={styles.modernFormGroup}>
                <Text style={styles.modernInputLabel}>Phone Number</Text>
                <View style={styles.modernInputWrapper}>
                  <Phone size={18} color={Colors.textSecondary} style={{ marginRight: 10 }} />
                  <TextInput 
                    style={styles.modernInput}
                    value={newPhone}
                    onChangeText={setNewPhone}
                    placeholder="e.g. 9876543210"
                    keyboardType="phone-pad"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>
              </View>
              
              <View style={styles.modernFormGroup}>
                <Text style={styles.modernInputLabel}>Joining Date</Text>
                <TouchableOpacity 
                  style={[styles.modernDropdownField, { paddingVertical: 12 }]}
                  onPress={() => setShowJoiningCalendar(true)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <CalendarIcon size={18} color={Colors.primary} />
                    <Text style={{ color: Colors.text, fontSize: 15, fontWeight: '500' }}>{newJoiningDate}</Text>
                  </View>
                  <ChevronDown size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

            </ScrollView>
            
            <View style={styles.modernModalFooter}>
              <TouchableOpacity 
                style={styles.modernSubmitBtn}
                onPress={handleCreateProfile}
              >
                <Text style={styles.modernSubmitBtnText}>Create Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* Joining Date Calendar Modal */}
      <Modal visible={showJoiningCalendar} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={styles.modalTitle}>Select Joining Date</Text>
              <TouchableOpacity onPress={() => setShowJoiningCalendar(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <Calendar
              current={newJoiningDate}
              onDayPress={(day: any) => {
                setNewJoiningDate(day.dateString);
                setShowJoiningCalendar(false);
              }}
              theme={{
                selectedDayBackgroundColor: Colors.primary,
                todayTextColor: Colors.primary,
                arrowColor: Colors.primary,
              }}
            />
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
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  formGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    marginBottom: 15,
  },
  addBtn: {
    backgroundColor: 'rgba(24, 119, 242, 0.1)',
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  addBtnText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: 'bold',
  },
  categoryNav: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 12,
  },
  categoryTab: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: '#F0F4F8',
    elevation: 0,
  },
  categoryTabActive: {
    backgroundColor: Colors.primary,
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  categoryTabText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  categoryTabTextActive: {
    color: Colors.white,
  },
  staffCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 18,
    marginBottom: 15,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 12,
  },
  staffDesignation: {
    fontSize: 11,
    color: Colors.accent,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  staffName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 3,
  },
  staffPhone: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 26,
    fontWeight: '500',
  },
  viewProfileBtn: {
    backgroundColor: 'rgba(24, 119, 242, 0.08)',
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 24,
  },
  viewProfileText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  attendanceActionsGrid: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
  },
  presentBtn: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  presentBtnActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF50',
    elevation: 2,
  },
  absentBtn: {
    borderColor: '#F44336',
    backgroundColor: 'rgba(244, 67, 54, 0.05)',
  },
  absentBtnActive: {
    borderColor: '#F44336',
    backgroundColor: '#F44336',
    elevation: 2,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
  },
  saveAllBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 24,
    marginTop: 15,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  saveAllBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
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
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  dropdownField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    marginTop: 5,
    backgroundColor: Colors.surface,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 15,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modernModalContainer: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  modernModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modernModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  modernModalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  closeBtn: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 8,
    borderRadius: 20,
  },
  modernModalScrollContent: {
    padding: 24,
    paddingTop: 16,
    gap: 20,
  },
  modernFormGroup: {
    gap: 8,
  },
  modernInputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4a4a4a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modernDropdownField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fafafa',
  },
  modernDropdownFieldActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(33, 150, 243, 0.03)',
  },
  modernDropdownList: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    marginTop: 6,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modernDropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modernInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fafafa',
  },
  modernInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  modernModalFooter: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    backgroundColor: '#fafafa',
  },
  modernSubmitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modernSubmitBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  modernHeader: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    zIndex: 0,
  },
  modernHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  modernHeaderSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  modernDateCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 14,
    marginTop: -30,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modernDateLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  modernDateValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 2,
  },
  modernDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  modernDateBtnText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  modernAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  modernAddBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  modernEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  modernEmptyText: {
    color: Colors.textSecondary,
    marginTop: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  modernStaffCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  modernStaffHeader: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modernStaffAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modernStaffAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  modernStaffName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modernStaffDesignation: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  modernStaffPhone: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  modernViewProfileBtn: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  modernViewProfileText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
  },
  modernAttendanceActionsGrid: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    backgroundColor: '#fafafa',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  modernActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1.5,
  },
  modernActionBtnInactive: {
    backgroundColor: Colors.white,
    borderColor: '#e0e0e0',
  },
  modernPresentBtnActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modernAbsentBtnActive: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modernActionBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
  modernSaveAllBtn: {
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  modernSaveAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  modernSaveAllBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default EmployeeAttendanceScreen;
