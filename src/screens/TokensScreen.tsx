import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Platform,
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
  Animated,
  Easing,
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
  ChevronRight,
  ChevronDown,
  User,
  Phone,
  PenLine,
  X,
  Check,
  ListOrdered,
  PlusCircle,
  Ticket,
  XCircle
} from 'lucide-react-native';
import { cartService } from '../services/CartService';
import { authService } from '../services/AuthService';
import { ActiveTokensList } from '../components/ActiveTokensList';


const { width } = Dimensions.get('window');

const paymentTypes = ['Cash on Delivery', 'Online Payment', 'Shop Credit'];
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PRESET_TRUCKS = [
  'TN 36 P 0123',
  'TN 36 V 1270',
  'TN 22 BJ 2799',
  'TN 42 E 1408',
  'Others',
];

const TokensScreen = ({ navigation }: any) => {
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('New Order');
  const [bulkOrderList, setBulkOrderList] = useState<any[]>(cartService.getBulkOrders());

  const [tokenSubTab, setTokenSubTab] = useState('Today');
  const [tokenDate, setTokenDate] = useState(new Date());
  const [showTokenDatePicker, setShowTokenDatePicker] = useState(false);
  const [tokenViewDate, setTokenViewDate] = useState(new Date());

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await cartService.globalRefresh();
    setBulkOrderList([...cartService.getBulkOrders()]);
    setRefreshing(false);
  }, []);

  // Form State
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [brands, setBrands] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('Cement');
  const [bags, setBags] = useState('');
  const [location, setLocation] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paymentType, setPaymentType] = useState(paymentTypes[0]);
  const [truckNo, setTruckNo] = useState('');
  const [selectedTruckOption, setSelectedTruckOption] = useState(''); // '' = not chosen yet
  const [truckDropdownVisible, setTruckDropdownVisible] = useState(false);
  
  const currentUser = authService.getCurrentUser();
  const isEmployee = currentUser?.isEmployee || currentUser?.role === 'admin' || currentUser?.role === 'employee';

  // ── Truck Dropdown Animations ───────────────────────────────────
  const modalScaleAnim   = useRef(new Animated.Value(0.85)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim     = useRef(new Animated.Value(0)).current;
  const chevronAnim      = useRef(new Animated.Value(0)).current;   // 0 = closed, 1 = open
  const othersHeightAnim = useRef(new Animated.Value(0)).current;   // 0 = collapsed
  const itemAnims        = useRef(PRESET_TRUCKS.map(() => new Animated.Value(0))).current;

  const openTruckDropdown = useCallback(() => {
    setTruckDropdownVisible(true);
    // Reset item anims
    itemAnims.forEach(a => a.setValue(0));
    Animated.parallel([
      // Backdrop fade
      Animated.timing(backdropAnim, {
        toValue: 1, duration: 200, useNativeDriver: true,
      }),
      // Card scale spring
      Animated.spring(modalScaleAnim, {
        toValue: 1, friction: 7, tension: 60, useNativeDriver: true,
      }),
      // Card opacity
      Animated.timing(modalOpacityAnim, {
        toValue: 1, duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: true,
      }),
      // Chevron rotates to open
      Animated.timing(chevronAnim, {
        toValue: 1, duration: 220, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true,
      }),
      // Staggered item slide-ins
      Animated.stagger(
        55,
        itemAnims.map(a =>
          Animated.spring(a, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true })
        )
      ),
    ]).start();
  }, [itemAnims]);

  const closeTruckDropdown = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0, duration: 160, useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 0, duration: 160, useNativeDriver: true,
      }),
      Animated.spring(modalScaleAnim, {
        toValue: 0.88, friction: 8, tension: 80, useNativeDriver: true,
      }),
      Animated.timing(chevronAnim, {
        toValue: 0, duration: 200, easing: Easing.in(Easing.ease), useNativeDriver: true,
      }),
    ]).start(() => setTruckDropdownVisible(false));
  }, []);

  // Animate 'Others' input reveal
  useEffect(() => {
    Animated.spring(othersHeightAnim, {
      toValue: selectedTruckOption === 'Others' ? 1 : 0,
      friction: 8,
      tension: 70,
      useNativeDriver: false,   // height needs non-native
    }).start();
  }, [selectedTruckOption]);

  const chevronRotation = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const othersInputHeight = othersHeightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 58],
  });
  const othersInputOpacity = othersHeightAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.4, 1],
  });
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [transactionType, setTransactionType] = useState('Cash');

  // Calendar State
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    const update = () => {
      const currentBrands = cartService.getBrands();
      setBrands([...currentBrands]);
      if (!currentBrands.includes(selectedBrand) && currentBrands.length > 0) {
        setSelectedBrand(currentBrands[0]);
      }
    };
    cartService.on('change', update);
    
    // Initial fetch from API
    const initialBrands = cartService.getBrands();
    setBrands([...initialBrands]);
    if (initialBrands.length > 0 && selectedBrand === 'Cement') {
      setSelectedBrand(initialBrands[0]);
    }

    cartService.apiFetchActiveTokens();
    cartService.apiFetchCategories().then((cats: any[]) => {
      const cementCats = cats.filter(c => c.name.toLowerCase().includes('cement'));
      setCategories(cementCats);
      if (cementCats.length > 0) setSelectedCategory(cementCats[0]);
    }).catch(e => console.error(e));
    
    return () => cartService.off('change', update);
  }, []);

  const handlePlaceBulkOrder = async () => {
    if (!bags || !customerName) {
      Alert.alert('Missing Info', 'Please fill in Name and Bags.');
      return;
    }
    if (transactionType === 'Credit' && (!location || !phone)) {
      Alert.alert('Missing Info', 'Please fill in Phone and Location for Credit orders.');
      return;
    }

    const user = authService.getCurrentUser();
    
    try {
      const orderData = {
        categoryId: selectedCategory?.id || 1,
        categoryName: selectedBrand || selectedCategory?.name || 'Cement',
        bags: parseInt(bags),
        location: location,
        deliveryDate: `${deliveryDate.getFullYear()}-${String(deliveryDate.getMonth() + 1).padStart(2, '0')}-${String(deliveryDate.getDate()).padStart(2, '0')}`,
        paymentType: paymentType,
        customerName: customerName,
        phone: phone,
        truckNo: truckNo,
        transactionType: transactionType
      };

      // Call the API
      const result = await cartService.apiPlaceBulkOrder(orderData);

      Alert.alert(
        'Order Placed!',
        `Your token (Order #${result.id || 'Generated'}) has been generated successfully.\nBags: ${bags}\nDate: ${deliveryDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}`,
        [
          { 
            text: 'View Active Tokens', 
            onPress: () => {
              setBags('');
              setLocation('');
              setTruckNo('');
              setSelectedTruckOption('');
              setCustomerName('');
              setPhone('');
              setActiveTab('Active Tokens');
            }
          },
          { 
            text: 'New Order', 
            style: 'cancel',
            onPress: () => {
              setBags('');
              setLocation('');
              setTruckNo('');
              setSelectedTruckOption('');
              setCustomerName('');
              setPhone('');
            }
          }
        ]
      );
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
            const newDate = new Date(currentDay);
            const now = new Date();
            newDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
            setDeliveryDate(newDate);
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

  const renderTokenCalendar = () => {
    const year = tokenViewDate.getFullYear();
    const month = tokenViewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();
    today.setHours(0,0,0,0);

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const currentDay = new Date(year, month, d);
      const isSelected = tokenDate.toDateString() === currentDay.toDateString();

      days.push(
        <TouchableOpacity
          key={d}
          style={[
            styles.calendarDay,
            isSelected && styles.selectedDay
          ]}
          onPress={() => {
            const newDate = new Date(currentDay);
            const now = new Date();
            newDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
            setTokenDate(newDate);
            setShowTokenDatePicker(false);
          }}
        >
          <Text style={[
            styles.dayText,
            isSelected && styles.selectedDayText
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

  const changeTokenMonth = (offset: number) => {
    const newDate = new Date(tokenViewDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setTokenViewDate(newDate);
  };

  const filteredTokens = React.useMemo(() => {
    const tD = new Date(tokenDate);
    tD.setHours(0,0,0,0);
    const targetTime = tD.getTime();

    return bulkOrderList.filter(order => {
      let isDateMatch = false;
      
      if (order.date) {
        // try to parse order.date (MM/DD/YYYY)
        const cDate = new Date(order.date);
        if (!isNaN(cDate.getTime())) {
          cDate.setHours(0,0,0,0);
          isDateMatch = cDate.getTime() === targetTime;
        } else {
          isDateMatch = true; // Fallback
        }
      } else if (order.created_at) {
        const cDate = new Date(order.created_at);
        cDate.setHours(0,0,0,0);
        isDateMatch = cDate.getTime() === targetTime;
      } else {
        isDateMatch = true;
      }

      if (!isDateMatch) return false;

      const status = (order.status || '').toLowerCase();
      if (tokenSubTab === 'Today') {
        return status !== 'completed' && status !== 'cancelled';
      } else if (tokenSubTab === 'Completed') {
        return status === 'completed';
      } else if (tokenSubTab === 'Cancelled') {
        return status === 'cancelled';
      }
      return true;
    });
  }, [bulkOrderList, tokenDate, tokenSubTab]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={[Typography.h3, styles.headerTitle]}>New Order</Text>
        <TouchableOpacity style={styles.infoBtn}>
          <ShieldCheck size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>



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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 22, paddingHorizontal: 10, alignItems: 'center', flexGrow: 1, justifyContent: 'center' }}>
            {(isEmployee ? [
              { id: 'New Order', icon: PlusCircle, label: 'New Order' },
              { id: 'Active Tokens', icon: Ticket, label: 'Active Tokens' }
            ] : [
              { id: 'New Order', icon: PlusCircle, label: 'New Order' }
            ]).map((t) => (
              <TouchableOpacity 
                key={t.id} 
                onPress={() => setActiveTab(t.id)}
                style={{ alignItems: 'center', justifyContent: 'center', marginHorizontal: 10 }}
                activeOpacity={0.7}
              >
                <View style={{ 
                  backgroundColor: activeTab === t.id ? Colors.primary : 'transparent', 
                  width: 42, 
                  height: 42, 
                  borderRadius: 50, overflow: 'hidden', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginBottom: 4
                }}>
                  <t.icon size={20} color={activeTab === t.id ? Colors.white : '#4F5E7B'} />
                </View>
                <Text style={{ 
                  fontSize: 11, 
                  fontWeight: activeTab === t.id ? '700' : '500', 
                  color: activeTab === t.id ? Colors.primary : '#4F5E7B' 
                }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {activeTab === 'New Order' ? (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
        >
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Skip the shop line - Order</Text>
            
            <View style={styles.typeSelectorContainer}>
              {['Cash', 'Credit'].map(type => (
                <TouchableOpacity 
                  key={type} 
                  style={[styles.typeOption, transactionType === type && styles.selectedTypeOption]}
                  onPress={() => setTransactionType(type)}
                >
                  <Coins size={18} color={transactionType === type ? Colors.primary : Colors.textSecondary} />
                  <Text style={[styles.typeOptionText, transactionType === type && styles.selectedTypeOptionText]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Party Name</Text>
              <View style={styles.inputWrapper}>
                <User size={20} color={Colors.primary} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Enter full name" 
                  placeholderTextColor={Colors.textSecondary}
                  value={customerName}
                  onChangeText={setCustomerName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {transactionType === 'Credit' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <Phone size={20} color={Colors.primary} style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="Enter 10-digit number" 
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    maxLength={10}
                  />
                </View>
              </View>
            )}
            
            <View>
              <Text style={styles.inputLabel}>Brand</Text>
              <View style={styles.brandPicker}>
                {brands.length > 0 ? (
                  brands.map((brand: string) => (
                    <TouchableOpacity 
                      key={brand}
                      style={[styles.brandOption, selectedBrand === brand && styles.selectedBrand]}
                      onPress={() => setSelectedBrand(brand)}
                    >
                      <Text style={[styles.brandOptionText, selectedBrand === brand && styles.selectedBrandText]}>
                        {brand}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={[styles.brandOption, styles.selectedBrand]}>
                    <Text style={[styles.brandOptionText, styles.selectedBrandText]}>
                      Cement
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>No of Bags</Text>
              <View style={styles.inputWrapper}>
                <TextInput 
                  style={styles.input} 
                  placeholder="Enter the number of bags" 
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                  value={bags}
                  onChangeText={setBags}
                />
                <Text style={styles.unitText}>Bags</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Delivery Location {transactionType === 'Cash' ? '(Optional)' : ''}</Text>
              <View style={styles.inputWrapper}>
                <MapPin size={20} color={Colors.primary} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder={transactionType === 'Cash' ? "Enter address (Optional)" : "Enter full address"} 
                  placeholderTextColor={Colors.textSecondary}
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>

            {/* ── Truck Number Dropdown ─────────────────────────── */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Truck Number (Optional)</Text>

              {/* Animated dropdown trigger */}
              <TouchableOpacity
                style={[
                  styles.truckDropdownTrigger,
                  selectedTruckOption && styles.truckDropdownTriggerActive,
                ]}
                activeOpacity={0.85}
                onPress={openTruckDropdown}
              >
                <Truck
                  size={20}
                  color={selectedTruckOption ? Colors.primary : Colors.textSecondary}
                  style={styles.inputIcon}
                />
                <Text
                  style={[
                    styles.truckDropdownTriggerText,
                    !selectedTruckOption && { color: Colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {selectedTruckOption
                    ? selectedTruckOption === 'Others'
                      ? 'Others — type below'
                      : selectedTruckOption
                    : 'Select truck number...'}
                </Text>

                {selectedTruckOption ? (
                  <TouchableOpacity
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => { setSelectedTruckOption(''); setTruckNo(''); }}
                  >
                    <X size={16} color={Colors.textSecondary} />
                  </TouchableOpacity>
                ) : (
                  <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
                    <ChevronDown size={18} color={Colors.primary} />
                  </Animated.View>
                )}
              </TouchableOpacity>

              {/* Animated 'Others' custom input */}
              <Animated.View
                style={[
                  styles.truckCustomInputAnimWrapper,
                  { height: othersInputHeight, opacity: othersInputOpacity },
                ]}
                pointerEvents={selectedTruckOption === 'Others' ? 'auto' : 'none'}
              >
                <View style={[styles.inputWrapper, styles.truckCustomInput]}>
                  <PenLine size={18} color={Colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Type truck number e.g. TN 01 AB 1234"
                    placeholderTextColor={Colors.textSecondary}
                    value={truckNo}
                    onChangeText={(t) => setTruckNo(t.toUpperCase())}
                    autoCapitalize="characters"
                  />
                </View>
              </Animated.View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date and Time</Text>
              <TouchableOpacity 
                style={styles.inputWrapper} 
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color={Colors.primary} style={styles.inputIcon} />
                <Text style={[styles.input, { textAlignVertical: 'center', paddingTop: 12 }]}>
                  {deliveryDate.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            </View>



            <View>
              <TouchableOpacity style={styles.submitBtn} onPress={handlePlaceBulkOrder}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.submitGradient}
                >
                  <Text style={styles.submitBtnText}>Confirm Order</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          {/* Tokens Sub-Tabs */}
          <View style={{ alignItems: 'center', marginBottom: 15 }}>
            <View style={{ 
              backgroundColor: '#FFFFFF', 
              borderRadius: 40, 
              paddingVertical: 6,
              paddingHorizontal: 8,
              shadowColor: '#000', 
              shadowOffset: { width: 0, height: 4 }, 
              shadowOpacity: 0.08, 
              shadowRadius: 8, 
              elevation: 4,
              width: '100%'
            }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 15, paddingHorizontal: 10, alignItems: 'center', flexGrow: 1, justifyContent: 'center' }}>
                {[
                  { id: 'Today', icon: Calendar },
                  { id: 'Completed', icon: CheckCircle2 },
                  { id: 'Cancelled', icon: XCircle }
                ].map((t) => (
                  <TouchableOpacity 
                    key={t.id} 
                    onPress={() => setTokenSubTab(t.id)}
                    style={{ alignItems: 'center', justifyContent: 'center', marginHorizontal: 5 }}
                    activeOpacity={0.7}
                  >
                    <View style={{ 
                      backgroundColor: tokenSubTab === t.id ? Colors.primary : 'transparent', 
                      width: 36, 
                      height: 36, 
                      borderRadius: 50, overflow: 'hidden', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginBottom: 4
                    }}>
                      <t.icon size={18} color={tokenSubTab === t.id ? Colors.white : '#4F5E7B'} />
                    </View>
                    <Text style={{ 
                      fontSize: 10, 
                      fontWeight: tokenSubTab === t.id ? '700' : '500', 
                      color: tokenSubTab === t.id ? Colors.primary : '#4F5E7B' 
                    }}>
                      {t.id}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Date Filter */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors.text }}>
              Orders for: {tokenDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
            </Text>
            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F2F5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
              onPress={() => setShowTokenDatePicker(true)}
            >
              <Calendar size={16} color={Colors.primary} style={{ marginRight: 5 }} />
              <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>Select Date</Text>
            </TouchableOpacity>
          </View>

          <ActiveTokensList bulkOrderList={filteredTokens} onRefresh={onRefresh} refreshing={refreshing} />
        </View>
      )}

      {/* Truck Number Dropdown Modal — Animated */}
      <Modal
        visible={truckDropdownVisible}
        transparent
        animationType="none"
        onRequestClose={closeTruckDropdown}
      >
        {/* Animated backdrop */}
        <Animated.View
          style={[styles.modalOverlay, { opacity: backdropAnim }]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeTruckDropdown}
          />

          {/* Animated card */}
          <Animated.View
            style={[
              styles.truckDropdownModal,
              {
                opacity: modalOpacityAnim,
                transform: [{ scale: modalScaleAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.truckDropdownModalHeader}>
              <View style={styles.truckDropdownModalHeaderIcon}>
                <Truck size={18} color={Colors.white} />
              </View>
              <Text style={styles.truckDropdownModalTitle}>Select Truck Number</Text>
            </View>

            {/* Animated list items */}
            {PRESET_TRUCKS.map((truck, index) => {
              const isSelected  = selectedTruckOption === truck;
              const isOthers    = truck === 'Others';
              const isLast      = index === PRESET_TRUCKS.length - 1;

              const itemSlide = itemAnims[index].interpolate({
                inputRange:  [0, 1],
                outputRange: [40, 0],
              });
              const itemOpacity = itemAnims[index].interpolate({
                inputRange:  [0, 1],
                outputRange: [0, 1],
              });

              return (
                <Animated.View
                  key={truck}
                  style={{
                    opacity:   itemOpacity,
                    transform: [{ translateX: itemSlide }],
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.truckDropdownItem,
                      isSelected && styles.truckDropdownItemSelected,
                      isLast     && styles.truckDropdownItemLast,
                      isOthers   && styles.truckDropdownItemOthers,
                    ]}
                    activeOpacity={0.72}
                    onPress={() => {
                      setSelectedTruckOption(truck);
                      setTruckNo(truck !== 'Others' ? truck : '');
                      closeTruckDropdown();
                    }}
                  >
                    <View style={styles.truckDropdownItemLeft}>
                      <View style={[
                        styles.truckIconBox,
                        isSelected && styles.truckIconBoxSelected,
                        isOthers   && !isSelected && styles.truckIconBoxOthers,
                      ]}>
                        {isOthers
                          ? <PenLine size={15} color={isSelected ? Colors.white : Colors.primary} />
                          : <Truck   size={15} color={isSelected ? Colors.white : Colors.primary} />}
                      </View>
                      <View>
                        <Text style={[
                          styles.truckDropdownItemText,
                          isSelected && styles.truckDropdownItemTextSelected,
                        ]}>
                          {truck}
                        </Text>
                        {isOthers && (
                          <Text style={styles.truckDropdownItemSubtext}>
                            Type a custom truck number
                          </Text>
                        )}
                      </View>
                    </View>

                    {isSelected ? (
                      <View style={styles.truckCheckCircle}>
                        <Check size={13} color={Colors.white} />
                      </View>
                    ) : (
                      <View style={styles.truckUncheckCircle} />
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </Animated.View>
        </Animated.View>
      </Modal>

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

      {/* Token Custom Calendar Modal */}
      <Modal visible={showTokenDatePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => changeTokenMonth(-1)}>
                <ChevronLeft size={24} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{months[tokenViewDate.getMonth()]} {tokenViewDate.getFullYear()}</Text>
              <TouchableOpacity onPress={() => changeTokenMonth(1)}>
                <ChevronRight size={24} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekDays}>
              {daysOfWeek.map(d => <Text key={d} style={styles.weekDayText}>{d}</Text>)}
            </View>

            <View style={styles.daysGrid}>
              {renderTokenCalendar()}
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowTokenDatePicker(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    zIndex: 10,
  },
  backBtn: { padding: 5 },
  headerTitle: { color: Colors.white, fontWeight: 'bold' },
  infoBtn: { padding: 5 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: 6,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 30 },
  activeTab: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 13 },
  activeTabText: { color: Colors.white, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  
  formContainer: {
    backgroundColor: Colors.white,
    borderRadius: 30,
    padding: 28,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  formTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 24, letterSpacing: -0.5 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#344054', marginBottom: 8, marginTop: 18, letterSpacing: 0.3 },
  brandPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  brandOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F8F9FA', borderWidth: 1.5, borderColor: '#E9ECEF' },
  selectedBrand: { backgroundColor: 'rgba(24, 119, 242, 0.08)', borderColor: Colors.primary },
  brandOptionText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  selectedBrandText: { color: Colors.primary, fontWeight: '700' },
  inputGroup: { marginTop: 15 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1.5, borderColor: '#E9ECEF' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: Colors.text, fontWeight: '600', fontSize: 15 },
  unitText: { color: Colors.textSecondary, fontWeight: 'bold', marginLeft: 10 },
  paymentPicker: { gap: 10, marginTop: 5 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F2F5', padding: 12, borderRadius: 12 },
  selectedPayment: { backgroundColor: Colors.primary },
  paymentText: { marginLeft: 10, fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  selectedPaymentText: { color: Colors.white },
  submitBtn: { marginTop: 32, borderRadius: 20, overflow: 'hidden', elevation: 8, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12 },
  submitGradient: { paddingVertical: 18, alignItems: 'center' },
  submitBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },

  typeSelectorContainer: { flexDirection: 'row', gap: 0, marginBottom: 16, marginTop: -5, backgroundColor: '#F8F9FA', padding: 6, borderRadius: 16, borderWidth: 1, borderColor: '#E9ECEF' },
  typeOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', padding: 12, borderRadius: 12 },
  selectedTypeOption: { backgroundColor: Colors.white, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
  typeOptionText: { marginLeft: 8, fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  selectedTypeOptionText: { color: Colors.primary, fontWeight: '800' },

  tokensContainer: { },
  miniBalance: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 24, marginBottom: 25 },
  miniLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  miniValue: { color: Colors.white, fontSize: 24, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 20 },
  tokenCard: { backgroundColor: Colors.white, borderRadius: 24, padding: 18, marginBottom: 15, elevation: 8, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 10 },
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

  // ── Truck Dropdown Styles ────────────────────────────────────────
  truckDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
  },
  truckDropdownTriggerActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(24, 119, 242, 0.04)',
  },
  truckDropdownTriggerText: {
    flex: 1,
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 10,
  },
  truckCustomInputAnimWrapper: {
    overflow: 'hidden',
    marginTop: 8,
  },
  truckCustomInput: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: 'rgba(24, 119, 242, 0.04)',
  },
  truckDropdownModal: {
    width: width * 0.88,
    backgroundColor: Colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  truckDropdownModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(24,119,242,0.12)',
    backgroundColor: Colors.primary,
  },
  truckDropdownModalHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  truckDropdownModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  truckDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F6F8',
  },
  truckDropdownItemSelected: {
    backgroundColor: 'rgba(24, 119, 242, 0.05)',
  },
  truckDropdownItemLast: {
    borderBottomWidth: 0,
  },
  truckDropdownItemOthers: {
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    marginTop: 4,
    paddingTop: 16,
  },
  truckDropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  truckIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(24, 119, 242, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  truckIconBoxSelected: {
    backgroundColor: Colors.primary,
  },
  truckIconBoxOthers: {
    backgroundColor: 'rgba(24, 119, 242, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(24, 119, 242, 0.2)',
    borderStyle: 'dashed',
  },
  truckDropdownItemText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.5,
  },
  truckDropdownItemTextSelected: {
    color: Colors.primary,
  },
  truckDropdownItemSubtext: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  truckCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  truckUncheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CED0D4',
  },
});

export default TokensScreen;
