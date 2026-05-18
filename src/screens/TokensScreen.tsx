import React, { useState, useEffect } from 'react'; // Stable JS Calendar Version
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { 
  ChevronLeft, 
  Coins, 
  Info, 
  ShieldCheck, 
  Truck, 
  MapPin, 
  Calendar, 
  CreditCard, 
  CheckCircle2,
  Package,
  Navigation,
  ChevronRight
} from 'lucide-react-native';
import { cartService } from '../services/CartService';
import { authService } from '../services/AuthService';

const { width } = Dimensions.get('window');

const paymentTypes = ['Cash on Delivery', 'Online Payment', 'Shop Credit'];
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TokensScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<'tokens' | 'order'>('tokens');
  const [bulkOrders, setBulkOrders] = useState(cartService.getBulkOrders());
  const [balance, setBalance] = useState(cartService.getLoyaltyTokens());
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await cartService.globalRefresh();
    setRefreshing(false);
  }, []);

  // Form State
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [bags, setBags] = useState('');
  const [location, setLocation] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paymentType, setPaymentType] = useState(paymentTypes[0]);
  const [truckNo, setTruckNo] = useState('');

  // Calendar State
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    const update = () => {
      setBulkOrders(cartService.getBulkOrders());
      setBalance(cartService.getLoyaltyTokens());
    };
    cartService.on('change', update);
    
    // Initial fetch from API
    cartService.apiFetchActiveTokens();
    cartService.apiFetchCategories().then((cats: any[]) => {
      setCategories(cats);
      if (cats.length > 0) setSelectedCategory(cats[0]);
    }).catch(e => console.error(e));
    
    return () => cartService.off('change', update);
  }, []);

  const handlePlaceBulkOrder = async () => {
    if (!bags || !location) {
      Alert.alert('Missing Info', 'Please fill in all delivery details.');
      return;
    }

    const user = authService.getCurrentUser();
    
    try {
      const orderData = {
        categoryId: selectedCategory?.id || 1,
        categoryName: selectedCategory?.name || 'Cement',
        bags: parseInt(bags),
        location: location,
        deliveryDate: deliveryDate.toISOString().split('T')[0], // Fixed parsing error
        paymentType: paymentType,
        customerName: user?.username || 'Customer',
        phone: user?.mobile_number || '9876543210',
        truckNo: truckNo
      };

      // Call the API
      const result = await cartService.apiPlaceBulkOrder(orderData);

      Alert.alert(
        'Bulk Order Placed!',
        `Your Token Number is ${result.id || 'Generated'}. Track your delivery status here.`,
        [{ text: 'View Token', onPress: () => setActiveTab('tokens') }]
      );

      setBags('');
      setLocation('');
      setTruckNo('');
    } catch (e: any) {
      Alert.alert('Order Failed', e.message || 'Something went wrong while placing your order.');
    }
  };

  // Calendar Logic
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();
    today.setHours(0,0,0,0);

    const days = [];
    // Padding
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const currentDay = new Date(year, month, d);
      const isPast = currentDay < today;
      const isSelected = deliveryDate.toDateString() === currentDay.toDateString();

      days.push(
        <TouchableOpacity
          key={d}
          disabled={isPast}
          style={[
            styles.calendarDay,
            isSelected && styles.selectedDay,
            isPast && styles.pastDay
          ]}
          onPress={() => {
            setDeliveryDate(currentDay);
            setShowDatePicker(false);
          }}
        >
          <Text style={[
            styles.dayText,
            isSelected && styles.selectedDayText,
            isPast && styles.pastDayText
          ]}>{d}</Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setViewDate(newDate);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={[Typography.h3, styles.headerTitle]}>Bulk Order System</Text>
        <TouchableOpacity style={styles.infoBtn}>
          <ShieldCheck size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'tokens' && styles.activeTab]}
          onPress={() => setActiveTab('tokens')}
        >
          <Text style={[styles.tabText, activeTab === 'tokens' && styles.activeTabText]}>Active Tokens</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'order' && styles.activeTab]}
          onPress={() => setActiveTab('order')}
        >
          <Text style={[styles.tabText, activeTab === 'order' && styles.activeTabText]}>New Bulk Order</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        
        {activeTab === 'order' ? (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Skip the shop line - Order Bulk</Text>
            
            <Text style={styles.inputLabel}>Select Category</Text>
            <View style={styles.brandPicker}>
              {categories.map(cat => (
                <TouchableOpacity 
                  key={cat.id} 
                  style={[styles.brandOption, selectedCategory?.id === cat.id && styles.selectedBrand]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.brandOptionText, selectedCategory?.id === cat.id && styles.selectedBrandText]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Number of Bags</Text>
              <View style={styles.inputWrapper}>
                <TextInput 
                  style={styles.input} 
                  placeholder="Minimum 50 bags" 
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                  value={bags}
                  onChangeText={setBags}
                />
                <Text style={styles.unitText}>Bags</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Delivery Location</Text>
              <View style={styles.inputWrapper}>
                <MapPin size={20} color={Colors.primary} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Enter full address" 
                  placeholderTextColor={Colors.textSecondary}
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Truck Number (Optional)</Text>
              <View style={styles.inputWrapper}>
                <Truck size={20} color={Colors.primary} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="e.g. TN 01 AB 1234" 
                  placeholderTextColor={Colors.textSecondary}
                  value={truckNo}
                  onChangeText={(t) => setTruckNo(t.toUpperCase())}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Preferred Delivery Date</Text>
              <TouchableOpacity 
                style={styles.inputWrapper} 
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color={Colors.primary} style={styles.inputIcon} />
                <Text style={[styles.input, { textAlignVertical: 'center', paddingTop: 12 }]}>
                  {deliveryDate.toDateString()}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Payment Type</Text>
              <View style={styles.paymentPicker}>
                {paymentTypes.map(p => (
                  <TouchableOpacity 
                    key={p} 
                    style={[styles.paymentOption, paymentType === p && styles.selectedPayment]}
                    onPress={() => setPaymentType(p)}
                  >
                    <CreditCard size={16} color={paymentType === p ? Colors.white : Colors.textSecondary} />
                    <Text style={[styles.paymentText, paymentType === p && styles.selectedPaymentText]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handlePlaceBulkOrder}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                style={styles.submitGradient}
              >
                <Text style={styles.submitBtnText}>Confirm Bulk Order & Get Token</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.tokensContainer}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.miniBalance}
            >
              <View>
                <Text style={styles.miniLabel}>Total Loyalty Tokens</Text>
                <Text style={styles.miniValue}>{balance.toLocaleString()}</Text>
              </View>
              <Coins size={32} color={Colors.white} opacity={0.8} />
            </LinearGradient>

            <Text style={styles.sectionTitle}>Your Active Delivery Tokens</Text>

            {bulkOrders.length === 0 ? (
              <View style={styles.emptyState}>
                <Truck size={48} color={Colors.border} />
                <Text style={styles.emptyText}>No active bulk tokens</Text>
                <Text style={styles.emptySubtext}>Orders placed here skip the shop queue and include free site delivery.</Text>
              </View>
            ) : (
              bulkOrders.map((order) => (
                <View key={order.id} style={styles.tokenCard}>
                  <View style={styles.tokenHeader}>
                    <View>
                      <Text style={styles.tokenNum}>{order.id}</Text>
                      <Text style={styles.tokenTime}>{order.date}</Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>{order.status}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.tokenDetails}>
                    <View style={styles.detailRow}>
                      <Package size={16} color={Colors.textSecondary} />
                      <Text style={styles.detailText}>{order.brand} • {order.bags} Bags</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <MapPin size={16} color={Colors.textSecondary} />
                      <Text style={styles.detailText} numberOfLines={1}>{order.location}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Calendar size={16} color={Colors.textSecondary} />
                      <Text style={styles.detailText}>Delivery: {order.deliveryDate}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Truck size={16} color={Colors.primary} />
                      <Text style={[styles.detailText, { color: Colors.primary, fontWeight: 'bold' }]}>
                        Truck No: {order.truckNo || 'Assigning...'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Custom Calendar Modal */}
      <Modal visible={showDatePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => changeMonth(-1)}>
                <ChevronLeft size={24} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{months[viewDate.getMonth()]} {viewDate.getFullYear()}</Text>
              <TouchableOpacity onPress={() => changeMonth(1)}>
                <ChevronRight size={24} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekDays}>
              {daysOfWeek.map(d => <Text key={d} style={styles.weekDayText}>{d}</Text>)}
            </View>

            <View style={styles.daysGrid}>
              {renderCalendar()}
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowDatePicker(false)}>
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  header: { paddingTop: 45, paddingHorizontal: 20, paddingBottom: 15, backgroundColor: Colors.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { padding: 5 },
  headerTitle: { color: Colors.white, fontWeight: 'bold' },
  infoBtn: { padding: 5 },
  tabBar: { flexDirection: 'row', backgroundColor: Colors.white, padding: 5, elevation: 2 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: 'rgba(24, 119, 242, 0.05)' },
  tabText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 14 },
  activeTabText: { color: Colors.primary, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  
  formContainer: { backgroundColor: Colors.white, borderRadius: 20, padding: 20, elevation: 2 },
  formTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 8, marginTop: 15 },
  brandPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  brandOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F0F2F5', borderWidth: 1, borderColor: '#E0E0E0' },
  selectedBrand: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  brandOptionText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  selectedBrandText: { color: Colors.white },
  inputGroup: { marginTop: 15 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F2F5', borderRadius: 12, paddingHorizontal: 15, height: 50 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: Colors.text, fontWeight: '500' },
  unitText: { color: Colors.textSecondary, fontWeight: 'bold', marginLeft: 10 },
  paymentPicker: { gap: 10, marginTop: 5 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F2F5', padding: 12, borderRadius: 12 },
  selectedPayment: { backgroundColor: Colors.primary },
  paymentText: { marginLeft: 10, fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  selectedPaymentText: { color: Colors.white },
  submitBtn: { marginTop: 30, borderRadius: 15, overflow: 'hidden', elevation: 4 },
  submitGradient: { paddingVertical: 16, alignItems: 'center' },
  submitBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 16 },

  tokensContainer: { },
  miniBalance: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 16, marginBottom: 25 },
  miniLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  miniValue: { color: Colors.white, fontSize: 24, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 20 },
  tokenCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 15, elevation: 3 },
  tokenHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F0F2F5', paddingBottom: 10 },
  tokenNum: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  tokenTime: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { backgroundColor: 'rgba(0,164,0,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: 'bold', color: Colors.success },
  tokenDetails: { gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  detailText: { marginLeft: 10, color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingVertical: 50, backgroundColor: Colors.white, borderRadius: 20 },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginTop: 15 },
  emptySubtext: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 40, marginTop: 5, lineHeight: 18 },

  // Modal & Custom Calendar Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  calendarContainer: { width: width * 0.9, backgroundColor: Colors.white, borderRadius: 20, padding: 20, elevation: 10 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  monthTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  weekDays: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  weekDayText: { width: (width * 0.9 - 40) / 7, textAlign: 'center', color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDay: { width: (width * 0.9 - 40) / 7, height: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 5, borderRadius: 10 },
  selectedDay: { backgroundColor: Colors.primary },
  pastDay: { opacity: 0.2 },
  dayText: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  selectedDayText: { color: Colors.white, fontWeight: 'bold' },
  pastDayText: { color: Colors.textSecondary },
  closeBtn: { marginTop: 20, alignItems: 'center', padding: 10 },
  closeBtnText: { color: Colors.error, fontWeight: 'bold' },
});

export default TokensScreen;
