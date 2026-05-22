import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { User, Phone, Edit2, AlertCircle, X, Check } from 'lucide-react-native';
import { cartService } from '../services/CartService';

const { width } = Dimensions.get('window');

const ActivePartyBanner = () => {
  const [activeParty, setActiveParty] = useState(cartService.getActiveParty());
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const update = () => {
      const current = cartService.getActiveParty();
      setActiveParty(current);
      if (current) {
        setName(current.name);
        setPhone(current.phone);
      } else {
        setName('');
        setPhone('');
      }
    };
    cartService.on('change', update);
    // Load initial values
    const current = cartService.getActiveParty();
    if (current) {
      setName(current.name);
      setPhone(current.phone);
    }
    return () => cartService.off('change', update);
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter a Party Name.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Required Field', 'Please enter a Contact Number.');
      return;
    }
    if (phone.trim().length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit Contact Number.');
      return;
    }

    await cartService.setActiveParty({
      name: name.trim(),
      phone: phone.trim(),
    });
    setModalVisible(false);
  };

  const handleClear = async () => {
    Alert.alert(
      'Clear Party Details',
      'Are you sure you want to clear the active party details? This will reset your active shopping session.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await cartService.setActiveParty(null);
            setName('');
            setPhone('');
            setModalVisible(false);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {activeParty ? (
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.banner, styles.activeBanner]}
          onPress={() => setModalVisible(true)}
        >
          <View style={styles.bannerLeft}>
            <View style={styles.avatar}>
              <User size={18} color={Colors.white} />
            </View>
            <View style={styles.details}>
              <Text style={styles.activeLabel}>Active Shopping Session</Text>
              <Text style={styles.partyName} numberOfLines={1}>{activeParty.name}</Text>
              <View style={styles.phoneRow}>
                <Phone size={12} color={Colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={styles.partyPhone}>{activeParty.phone}</Text>
              </View>
            </View>
          </View>
          <View style={styles.editBtn}>
            <Edit2 size={16} color={Colors.primary} />
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.banner, styles.warningBanner]}
          onPress={() => setModalVisible(true)}
        >
          <View style={styles.bannerLeft}>
            <View style={[styles.avatar, styles.warningAvatar]}>
              <AlertCircle size={18} color={Colors.white} />
            </View>
            <View style={styles.details}>
              <Text style={styles.warningTitle}>No Active Party Set</Text>
              <Text style={styles.warningSubtitle}>Tap here to enter Party Details to begin shopping</Text>
            </View>
          </View>
          <View style={styles.actionPrompt}>
            <Text style={styles.promptText}>Set Details</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Inputs Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{activeParty ? 'Edit Party Details' : 'Set Active Party Details'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalDesc}>
                Set the active party so that any products you add to the cart are saved specifically for this customer.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Party Name *</Text>
                <View style={styles.inputWrapper}>
                  <User size={18} color={Colors.primary} />
                  <TextInput
                    style={styles.textInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter Party Name"
                    placeholderTextColor={Colors.textSecondary}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contact Number *</Text>
                <View style={styles.inputWrapper}>
                  <Phone size={18} color={Colors.primary} />
                  <TextInput
                    style={styles.textInput}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter 10-digit Contact Number"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
              </View>

              <View style={styles.btnRow}>
                {activeParty && (
                  <TouchableOpacity
                    style={[styles.btn, styles.clearBtn]}
                    onPress={handleClear}
                  >
                    <Text style={styles.clearBtnText}>Clear Party</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.btn, styles.saveBtn, !activeParty && { flex: 1 }]}
                  onPress={handleSave}
                >
                  <Check size={18} color={Colors.white} style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>Save details</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  activeBanner: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  warningBanner: {
    backgroundColor: 'rgba(255, 107, 0, 0.06)',
    borderColor: 'rgba(255, 107, 0, 0.3)',
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningAvatar: {
    backgroundColor: '#FF6B00',
  },
  details: {
    marginLeft: 12,
    flex: 1,
  },
  activeLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  partyName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  partyPhone: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D84B00',
  },
  warningSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(24, 119, 242, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionPrompt: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  promptText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: width - 40,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  inputWrapper: {
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
    fontWeight: 'bold',
    ...Typography.bodyMedium,
  },
  btnRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 12,
  },
  btn: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  clearBtn: {
    flex: 1,
    backgroundColor: 'rgba(250, 56, 62, 0.08)',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  clearBtnText: {
    color: Colors.error,
    fontWeight: 'bold',
  },
  saveBtn: {
    flex: 2,
    backgroundColor: Colors.primary,
  },
  saveBtnText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
});

export default ActivePartyBanner;
