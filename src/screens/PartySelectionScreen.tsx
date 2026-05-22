import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { X, Check, User, Phone } from 'lucide-react-native';
import { cartService } from '../services/CartService';

const { width } = Dimensions.get('window');

const PartySelectionScreen = ({ navigation, route }: any) => {
  const { item, qty, items } = route.params;
  const active = cartService.getActiveParty();
  
  const [name, setName] = useState(active ? active.name : '');
  const [phone, setPhone] = useState(active ? active.phone : '');

  const handleConfirm = () => {
    if (!name.trim() || !phone.trim() || phone.trim().length < 10) {
      Alert.alert('Selection Required', 'Please select a Party from the list before continuing.');
      return;
    }
    
    // Save to custom parties
    cartService.addCustomParty({ name: name.trim(), phone: phone.trim() });
    
    // Add item(s) scoped to this party
    if (items && items.length > 0) {
      items.forEach((entry: any) => {
        cartService.addItemForParty(entry.item, entry.qty, name.trim(), phone.trim());
      });
    } else {
      cartService.addItemForParty(item, qty, name.trim(), phone.trim());
    }
    
    // Optionally set this as the active party for the session if none was set
    if (!active) {
      cartService.setActiveParty({ name: name.trim(), phone: phone.trim() });
    }
    
    Alert.alert(
      'Added to Cart',
      items && items.length > 0 
        ? `Successfully added ${items.length} product sizes to cart for ${name.trim()}!`
        : `${qty} unit(s) of ${item.name} added to cart for ${name.trim()}!`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Party for Order</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.desc}>
              Please select a party to add {items && items.length > 0 ? 'the selected items' : `${item?.name} (${qty})`}.
            </Text>
            
            {cartService.getParties().filter(p => p.name).length > 0 ? (
              <View style={styles.partiesList}>
                <Text style={styles.sectionTitle}>Select Party</Text>
                {cartService.getParties().filter(p => p.name).map((p, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={[styles.partyCard, name === p.name && phone === p.phone && styles.partyCardSelected]}
                    onPress={() => {
                      setName(p.name);
                      setPhone(p.phone);
                    }}
                  >
                    <View style={styles.partyCardIcon}>
                      <User size={16} color={name === p.name && phone === p.phone ? Colors.white : Colors.primary} />
                    </View>
                    <View style={styles.partyCardInfo}>
                      <Text style={[styles.partyCardName, name === p.name && phone === p.phone && { color: Colors.white }]}>{p.name}</Text>
                      <Text style={[styles.partyCardPhone, name === p.name && phone === p.phone && { color: Colors.white }]}>{p.phone}</Text>
                    </View>
                    {name === p.name && phone === p.phone && (
                      <Check size={18} color={Colors.white} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={{ textAlign: 'center', color: Colors.textSecondary, marginTop: 20, marginBottom: 20 }}>
                No parties available. Please go to Cart and add a new party first.
              </Text>
            )}
            
            
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Check size={20} color={Colors.white} style={{ marginRight: 8 }} />
              <Text style={styles.confirmBtnText}>Confirm Add to Cart</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 20,
  },
  desc: {
    fontSize: 14,
    color: Colors.textSecondary,
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
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  confirmBtnText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  partiesList: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  partyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  partyCardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  partyCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  partyCardInfo: {
    flex: 1,
  },
  partyCardName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  partyCardPhone: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  orDivider: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 15,
  },
});

export default PartySelectionScreen;
