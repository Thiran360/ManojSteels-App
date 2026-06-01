import React, { useState, useEffect } from 'react';
import { authService } from '../services/AuthService';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { 
  User, 
  Phone,
  Package, 
  MapPin, 
  CreditCard, 
  Settings, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  ShieldCheck,
  ChevronLeft,
  Lock,
  X
} from 'lucide-react-native';


const ProfileScreen = ({ navigation }: any) => {
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());

  useEffect(() => {
    const update = () => setCurrentUser(authService.getCurrentUser());
    authService.on('change', update);
    return () => { authService.off('change', update); };
  }, []);

  useEffect(() => {
    // Fetch latest profile data from backend whenever screen comes into focus
    const fetchProfile = async () => {
      try {
        await authService.apiFetchProfile();
      } catch (err) {
        console.log('Profile fetch err:', err);
      }
    };
    
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    navigation.replace('Login');
  };

  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [adminMobile, setAdminMobile] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [showProfilePassword, setShowProfilePassword] = useState(false);

  const handleAdminLogin = async () => {
    if (!adminMobile || !adminPassword) {
      Alert.alert('Error', 'Please enter admin credentials');
      return;
    }

    setAdminLoading(true);
    const adminCreds = authService.getAdminCredentials();
    
    if (adminMobile === adminCreds.mobile && adminPassword === adminCreds.password) {
      setAdminModalVisible(false);
      setAdminMobile('');
      setAdminPassword('');
      setAdminLoading(false);
      navigation.navigate('Admin');
    } else {
      setAdminLoading(false);
      Alert.alert('Access Denied', 'Invalid Admin Credentials');
    }
  };

  const menuItems = [
    { icon: <Package size={22} color={Colors.accent} />, label: 'My Orders', screen: 'OrderTracking' },
    { icon: <Settings size={22} color={Colors.accent} />, label: 'Account Settings', screen: null },
    { 
      icon: <ShieldCheck size={22} color={Colors.accent} />, 
      label: 'Admin Panel', 
      action: () => {
        if (currentUser?.role === 'admin') {
          navigation.navigate('Admin');
        } else {
          setAdminModalVisible(true);
        }
      } 
    },
    { icon: <HelpCircle size={22} color={Colors.accent} />, label: 'Help & Support', screen: null },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={[Typography.h1, styles.headerTitle]}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={40} color={Colors.white} />
            </View>
          </View>
          
          <View style={styles.infoContainer}>

             {/* Full Name - always shown */}
             <View style={styles.infoRow}>
               <View style={styles.infoIconWrapper}>
                 <User size={18} color={Colors.accent} />
               </View>
               <View style={styles.infoTextContainer}>
                 <Text style={styles.infoLabel}>Full Name</Text>
                 <Text style={styles.infoValue}>
                   {currentUser?.full_name || currentUser?.customer_name || currentUser?.name || '—'}
                 </Text>
               </View>
             </View>

             {/* Mobile Number - always shown */}
             <View style={styles.infoRow}>
               <View style={styles.infoIconWrapper}>
                 <Phone size={18} color={Colors.accent} />
               </View>
               <View style={styles.infoTextContainer}>
                 <Text style={styles.infoLabel}>Mobile Number</Text>
                 <Text style={styles.infoValue}>
                   {currentUser?.mobile_number || currentUser?.customer_phone || currentUser?.phone || '—'}
                 </Text>
               </View>
             </View>

             {/* Role - always shown */}
             <View style={styles.infoRow}>
               <View style={styles.infoIconWrapper}>
                 <ShieldCheck size={18} color={Colors.accent} />
               </View>
               <View style={styles.infoTextContainer}>
                 <Text style={styles.infoLabel}>Role</Text>
                 <Text style={[styles.infoValue, { textTransform: 'capitalize' }]}>
                   {currentUser?.role
                     ? currentUser.role.toLowerCase() === 'user'
                       ? 'Customer'
                       : currentUser.role
                     : 'Customer'}
                 </Text>
               </View>
             </View>

          </View>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.menuItem}
              onPress={() => {
                if (item.action) {
                  item.action();
                } else if (item.screen) {
                  navigation.navigate(item.screen);
                }
              }}
            >
              <View style={styles.menuIconContainer}>
                {item.icon}
              </View>
              <Text style={[Typography.bodyMedium, styles.menuLabel]}>{item.label}</Text>
              <ChevronRight size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <View>
          <TouchableOpacity 
            style={styles.logoutBtn}
            onPress={handleLogout}
          >
            <LogOut size={22} color={Colors.error} />
            <Text style={[Typography.bodyMedium, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
      <Modal
        visible={adminModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAdminModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[Typography.h3, styles.modalTitle]}>Admin Portal</Text>
              <TouchableOpacity onPress={() => setAdminModalVisible(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Admin Mobile</Text>
                <View style={styles.inputContainer}>
                  <Phone size={18} color={Colors.accent} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter admin mobile"
                    placeholderTextColor={Colors.textSecondary}
                    value={adminMobile}
                    onChangeText={setAdminMobile}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Admin Password</Text>
                <View style={styles.inputContainer}>
                  <Lock size={18} color={Colors.accent} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter admin password"
                    placeholderTextColor={Colors.textSecondary}
                    value={adminPassword}
                    onChangeText={setAdminPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={styles.adminLoginBtn}
                onPress={handleAdminLogin}
                disabled={adminLoading}
              >
                {adminLoading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.adminLoginBtnText}>Enter Portal</Text>
                )}
              </TouchableOpacity>
            </View>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  backBtn: {
    marginRight: 15,
    padding: 5,
  },
  headerTitle: {
    color: Colors.white,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  infoContainer: {
    width: '100%',
    marginTop: 20,
  },
  infoRow: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoValue: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  menuContainer: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    paddingVertical: 10,
    marginBottom: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(24, 119, 242, 0.1)', // Facebook blue tint
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuLabel: {
    flex: 1,
    color: Colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: Colors.text,
  },
  modalBody: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textInput: {
    flex: 1,
    marginLeft: 10,
    color: Colors.text,
    fontSize: 14,
  },
  adminLoginBtn: {
    backgroundColor: Colors.accent,
    height: 50,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 4,
  },
  adminLoginBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250, 56, 62, 0.1)',
    height: 56,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(250, 56, 62, 0.2)',
  },
  logoutText: {
    color: Colors.error,
    marginLeft: 10,
  },
  version: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 20,
  },
});

export default ProfileScreen;
