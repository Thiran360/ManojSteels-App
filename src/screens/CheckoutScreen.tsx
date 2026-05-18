import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { MapPin, ChevronLeft, CheckCircle2, User, Phone } from 'lucide-react-native';
import { cartService } from '../services/CartService';
import { authService } from '../services/AuthService';

const CheckoutScreen = ({ navigation }: any) => {
  const user = authService.getCurrentUser();
  const [customerName, setCustomerName] = useState(user?.full_name || user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.mobile_number || user?.phone || '');
  const [customerAddress, setCustomerAddress] = useState(user?.business_address || user?.address || '');
  const [paymentType, setPaymentType] = useState('cash');
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const [cartItems, setCartItems] = useState(cartService.getCartItems());

  useEffect(() => {
    const update = () => setCartItems(cartService.getCartItems());
    cartService.on('change', update);
    return () => cartService.off('change', update);
  }, []);

  const subtotal = cartItems.reduce((acc, item) => acc + ((item.price || 0) * (item.qty || 0)), 0);

  const handlePlaceOrder = async () => {
    try {
      const user = authService.getCurrentUser();
      console.log('Logged User:', user);
      const result = await cartService.apiPlaceOrder({
        name: customerName,
        phone: customerPhone,
        address: customerAddress,
        payment_type: paymentType,
        employee_id: user?.id,
        items: [...cartItems],
      });
      setPlacedOrder({
        id: result.data?.id || result.quotation_id || result.order_id || result.id || 'MS-Pending',
        employeeName: user?.full_name || user?.name || user?.username || 'Manoj Steels User',
      });
      setIsSuccess(true);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e.message || 'Failed to place quotation. Please try again.');
    }
  };

  const SummaryRow = ({ label, value, bold = false }: any) => (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && { fontWeight: 'bold', color: Colors.white }]}>{label}</Text>
      <Text style={[styles.summaryValue, bold && { color: Colors.accent, fontSize: 18 }]}>{value}</Text>
    </View>
  );

  if (isSuccess) {
    return (
      <View style={styles.successContainer}>
        <CheckCircle2 size={80} color={Colors.success} />
        <Text style={[Typography.h1, styles.successTitle]}>Quotation Sent!</Text>
        <Text style={[Typography.bodyMedium, styles.successSubtitle]}>
          ✅ Request sent! Admin will fix prices soon.
        </Text>
        <Text style={[Typography.bodyMedium, { color: Colors.accent, marginTop: 10, fontWeight: 'bold' }]}>
          Quotation ID: {placedOrder?.id}
        </Text>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Processed by:</Text>
          <Text style={styles.billValue}>{placedOrder?.employeeName || 'Admin (Manoj)'}</Text>
        </View>
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate('Main')}
        >
          <Text style={[Typography.button, styles.homeBtnText]}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={[Typography.h2, styles.headerTitle]}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress Bar */}
        {/* Pickup Info */}
        {/* Party Details */}
        <View style={styles.section}>
          <Text style={[Typography.h3, styles.sectionTitle]}>Party Details</Text>
          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <User size={18} color={Colors.accent} />
              <TextInput
                style={styles.textInput}
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Party Name"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Phone size={18} color={Colors.accent} />
              <TextInput
                style={styles.textInput}
                value={customerPhone}
                onChangeText={setCustomerPhone}
                placeholder="Contact Number"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.inputWrapper}>
            <MapPin size={18} color={Colors.accent} />
            <TextInput
              style={styles.textInput}
              value={customerAddress}
              onChangeText={setCustomerAddress}
              placeholder="Delivery Address"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
        </View>

          <View style={styles.orderSummary}>
            <Text style={[Typography.h3, styles.sectionTitle]}>Order Summary</Text>
            
            {cartItems.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemQty}>Qty: {item.qty}</Text>
                </View>
                <Text style={styles.itemPrice}>₹{(item.price * item.qty).toLocaleString()}</Text>
              </View>
            ))}
            
            <View style={styles.divider} />
            
            <SummaryRow label="Items Total" value={`₹${subtotal.toLocaleString()}`} />
            <SummaryRow label="Total" value={`₹${subtotal.toLocaleString()}`} bold />
          </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={handlePlaceOrder}
        >
          <Text style={[Typography.button, styles.continueText]}>Place Order</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    color: Colors.white,
  },
  scrollContent: {
    padding: 20,
  },
  pickupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickupDetails: {
    marginLeft: 15,
  },
  pickupTitle: {
    color: Colors.text,
    fontWeight: 'bold',
  },
  pickupAddress: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: Colors.text,
    marginBottom: 16,
    fontWeight: 'bold',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
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
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: Colors.textSecondary,
    marginBottom: 8,
    fontSize: 12,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activePayment: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(255, 107, 0, 0.05)',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.textSecondary,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: Colors.accent,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
  },
  paymentText: {
    color: Colors.textSecondary,
  },
  orderSummary: {
    marginTop: 30,
    paddingTop: 30,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  itemQty: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  itemPrice: {
    color: Colors.text,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 15,
  },
  summaryLabel: {
    color: Colors.textSecondary,
  },
  summaryValue: {
    color: Colors.text,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  continueBtn: {
    backgroundColor: Colors.accent,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueText: {
    color: Colors.white,
  },
  successContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successTitle: {
    color: Colors.text,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  successSubtitle: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  billRow: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: Colors.surface,
    padding: 15,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
  },
  billLabel: {
    color: Colors.textSecondary,
    marginRight: 10,
    fontWeight: 'bold',
  },
  billValue: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  trackBtn: {
    backgroundColor: Colors.accent,
    width: '100%',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  trackBtnText: {
    color: Colors.white,
  },
  homeBtn: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  homeBtnText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
});

export default CheckoutScreen;
