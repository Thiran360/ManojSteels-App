import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import { attendanceService, StaffProfile, AttendanceStatus } from '../services/AttendanceService';
import { useNavigation } from '@react-navigation/native';
import { User, Activity, CheckCircle, XCircle, CalendarDays, ChevronRight } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

export const AdminAttendanceReport = () => {
  const [reportData, setReportData] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const currentDate = new Date().toISOString().split('T')[0];
  const currentMonth = currentDate.substring(0, 7);
  const navigation = useNavigation<any>();

  const isEndOfMonth = () => {
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return today.getDate() === lastDayOfMonth.getDate();
  };
  const showHolidays = isEndOfMonth();

  useEffect(() => {
    const fetchStats = async () => {
      const profiles = await attendanceService.getStaffProfiles();
      const todayRecords = await attendanceService.getAttendanceForDate(currentDate);
      
      const data = await Promise.all(
        profiles.map(async (p) => {
          const stats = await attendanceService.getStaffAttendanceStats(p.id, currentMonth);
          const dailyRecords = await attendanceService.getStaffRecords(p.id, currentMonth);
          const todayStatus = todayRecords.find(r => r.staffId === p.id)?.status || 'Pending';
          return {
            ...p,
            todayStatus,
            present: stats.present,
            leave: stats.leave,
            holiday: stats.holiday,
            dailyRecords,
          };
        })
      );
      
      setReportData(data);
    };

    fetchStats();
    
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: AttendanceStatus | 'Pending') => {
    switch (status) {
      case 'Present': return Colors.success;
      case 'Morning': return Colors.success;
      case 'Afternoon': return Colors.success;
      case 'Absent': return Colors.error;
      case 'Half Day': return '#FFC107';
      case 'Leave': return '#2196F3';
      default: return Colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#1877F2', '#0A58CA']} 
        style={styles.headerBanner}
        start={{x: 0, y: 0}} end={{x: 1, y: 1}}
      >
        <View>
          <Text style={styles.title}>Attendance Report</Text>
          <Text style={styles.subtitle}>Overview for {currentMonth}</Text>
        </View>
        <CalendarDays size={40} color="rgba(255,255,255,0.2)" style={{position: 'absolute', right: 20, top: 20}} />
      </LinearGradient>

      <View style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <View style={[styles.headerCell, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
            <User size={14} color={Colors.textSecondary} style={{marginRight: 4}} />
            <Text style={styles.headerText}>STAFF</Text>
          </View>
          <View style={[styles.headerCell, { flex: 1.5, flexDirection: 'row', alignItems: 'center' }]}>
            <Activity size={14} color={Colors.textSecondary} style={{marginRight: 4}} />
            <Text style={styles.headerText}>TODAY</Text>
          </View>
          <View style={[styles.headerCell, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
            <CheckCircle size={14} color={Colors.textSecondary} style={{marginRight: 4}} />
            <Text style={styles.headerText}>PRS</Text>
          </View>
          <View style={[styles.headerCell, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
            <XCircle size={14} color={Colors.textSecondary} style={{marginRight: 4}} />
            <Text style={styles.headerText}>LEV</Text>
          </View>
          <View style={[styles.headerCell, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
            <CalendarDays size={14} color={Colors.textSecondary} style={{marginRight: 4}} />
            <Text style={styles.headerText}>HLD</Text>
          </View>
          <View style={{ width: 21 }} />
        </View>

        <View style={{ paddingBottom: 20 }}>
          {reportData.map((row, index) => (
            <React.Fragment key={row.id}>
              <TouchableOpacity 
                style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}
                onPress={() => setExpandedId(expandedId === row.id ? null : row.id)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', paddingRight: 8 }}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{row.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.staffName} numberOfLines={1}>{row.name}</Text>
                    <Text style={styles.staffRole}>{row.designation}</Text>
                  </View>
                </View>
                
                <View style={{ flex: 1.5, justifyContent: 'center' }}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(row.todayStatus) + '15' }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(row.todayStatus) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(row.todayStatus) }]}>
                      {row.todayStatus}
                    </Text>
                  </View>
                </View>
                
                <Text style={[styles.cellNum, { flex: 1, color: Colors.success }]}>{row.present}</Text>
                <Text style={[styles.cellNum, { flex: 1, color: Colors.error }]}>{row.leave}</Text>
                <Text style={[styles.cellNum, { flex: 1, color: Colors.textSecondary }]}>{showHolidays ? row.holiday : '-'}</Text>
                
                <ChevronRight size={16} color={Colors.border} style={{marginLeft: 5, transform: [{ rotate: expandedId === row.id ? '90deg' : '0deg' }] }} />
              </TouchableOpacity>
              
              {expandedId === row.id && (
                <View style={styles.expandedContainer}>
                  <Text style={styles.expandedTitle}>Date-wise Attendance</Text>
                  <View style={{ paddingBottom: 10 }}>
                    {row.dailyRecords && row.dailyRecords.length > 0 ? (
                      row.dailyRecords.map((record: any, idx: number) => (
                        <View key={idx} style={styles.recordRow}>
                          <Text style={styles.recordDate}>{record.date}</Text>
                          <Text style={[styles.recordStatus, { color: getStatusColor(record.status) }]}>{record.status}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noRecordsText}>No records for this month</Text>
                    )}
                  </View>
                  <TouchableOpacity style={styles.viewProfileBtn} onPress={() => navigation.navigate('StaffProfile', { staffId: row.id })}>
                    <Text style={styles.viewProfileText}>View Full Profile</Text>
                  </TouchableOpacity>
                </View>
              )}
            </React.Fragment>
          ))}
          
          {reportData.length === 0 && (
            <View style={styles.emptyState}>
              <Activity size={40} color={Colors.border} />
              <Text style={styles.emptyText}>No attendance data found.</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: Colors.background,
    flex: 1,
  },
  headerBanner: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  tableCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerCell: {
    justifyContent: 'flex-start',
  },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  evenRow: {
    backgroundColor: Colors.surface,
  },
  oddRow: {
    backgroundColor: '#FAFAFB',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  staffName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  staffRole: {
    fontSize: 10,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cellNum: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '700',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 10,
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  expandedContainer: {
    backgroundColor: '#FAFAFB',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  expandedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  recordDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  recordStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  noRecordsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  viewProfileBtn: {
    marginTop: 15,
    paddingVertical: 10,
    backgroundColor: Colors.primary + '15',
    borderRadius: 8,
    alignItems: 'center',
  },
  viewProfileText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  }
});
