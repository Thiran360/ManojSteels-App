import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Colors } from '../theme/colors';
import { ChevronLeft, User, Phone, Briefcase, Calendar, Activity, CheckCircle2, XCircle } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { attendanceService, StaffProfile } from '../services/AttendanceService';

const StaffProfileScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const staffId = route.params?.staffId;

  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [stats, setStats] = useState({ present: 0, absent: 0, halfDay: 0, leave: 0 });
  const currentMonth = new Date().toISOString().substring(0, 7);

  useEffect(() => {
    const fetchData = async () => {
      const profiles = await attendanceService.getStaffProfiles();
      const found = profiles.find(p => p.id === staffId);
      if (found) setProfile(found);

      const attendanceStats = await attendanceService.getStaffAttendanceStats(staffId, currentMonth);
      setStats(attendanceStats);
    };
    fetchData();
  }, [staffId]);

  if (!profile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: Colors.textSecondary }}>Loading Profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Profile</Text>
      </View>

      <ScrollView style={{ padding: 20 }}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{profile.name.charAt(0).toUpperCase()}</Text>
          </View>
          
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileDesignation}>{profile.designation}</Text>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <User size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Staff Name</Text>
              <Text style={styles.detailValue}>{profile.name}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Phone size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Mobile Number</Text>
              <Text style={styles.detailValue}>{profile.phone}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Briefcase size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Role</Text>
              <Text style={styles.detailValue}>{profile.designation}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Calendar size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Joining Date</Text>
              <Text style={styles.detailValue}>{profile.joiningDate || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Activity size={20} color={profile.status === 'Active' ? Colors.success : Colors.error} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={[styles.detailValue, { color: profile.status === 'Active' ? Colors.success : Colors.error, fontWeight: 'bold' }]}>
                {profile.status || 'Active'}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Monthly Attendance Report Details */}
        <Text style={styles.sectionTitle}>Attendance Report ({currentMonth})</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <CheckCircle2 size={28} color={Colors.success} />
            <Text style={styles.statValue}>{stats.present}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.statBox}>
            <XCircle size={28} color={Colors.error} />
            <Text style={styles.statValue}>{stats.absent}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 15,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: Colors.black,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(24, 119, 242, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 5,
  },
  profileDesignation: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    width: '100%',
    marginVertical: 20,
  },
  detailRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(24, 119, 242, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 15,
    marginLeft: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: Colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 10,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});

export default StaffProfileScreen;
