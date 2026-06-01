import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  Alert,
  TextInput,
  Image,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { 
  ShoppingBag, 
  TrendingUp, 
  CheckCircle2, 
  ChevronLeft,
  LogOut,
  ShoppingCart,
  Printer,
  FileText,
  Truck,
  MapPin,
  Package,
  X,
  Trash2,
  Users,
  Eye,
  EyeOff,
  Coins,
  CalendarDays,
  Ticket,
  LayoutGrid,
  Receipt,
  ClipboardCheck,
  Clock,
  RefreshCw
} from 'lucide-react-native';
import { Calendar } from 'react-native-calendars';
import { launchImageLibrary } from 'react-native-image-picker';
import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { cartService } from '../services/CartService';
import { authService } from '../services/AuthService';
import { fuelService } from '../services/FuelService';
import { ActiveTokensList } from '../components/ActiveTokensList';

const FUEL_MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const formatFuelMonth = (yyyyMm: string) => {
  if (!yyyyMm) return '';
  const [y, m] = yyyyMm.split('-');
  return `${FUEL_MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
};

const AdminDashboard = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState('Orders');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [inventoryList, setInventoryList] = useState(cartService.getProducts());
  const [filter, setFilter] = useState('All');
  const [activeCart, setActiveCart] = useState(cartService.getCartItems());
  const [orderList, setOrderList] = useState(cartService.getOrders());
  const receiptRef = React.useRef<any>(null);
  const liveReceiptRef = React.useRef<any>(null);
  const [bulkOrderList, setBulkOrderList] = useState(cartService.getBulkOrders());
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showTruckModal, setShowTruckModal] = useState(false);
  const [editingTruckOrder, setEditingTruckOrder] = useState<any>(null);
  const [tempTruckNo, setTempTruckNo] = useState('');

  // Customize Bulk Order Modal State
  const [showOrderCalendar, setShowOrderCalendar] = useState(false);
  const [selectedOrderDate, setSelectedOrderDate] = useState<string>('');
  const [showCustomizeBulkModal, setShowCustomizeBulkModal] = useState(false);
  const [customizingOrder, setCustomizingOrder] = useState<any>(null);
  const [customBags, setCustomBags] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTokenCalendar, setShowTokenCalendar] = useState(false);
  const [selectedTokenDate, setSelectedTokenDate] = useState<string>('');
  const [tokenFilter, setTokenFilter] = useState<'All' | "Today's" | 'Cancelled' | 'Completed'>('All');
  const [customLocation, setCustomLocation] = useState('');
  const [customTruckNo, setCustomTruckNo] = useState('');
  const [customDeliveryDate, setCustomDeliveryDate] = useState('');
  const [customPaymentType, setCustomPaymentType] = useState('');
  const [customStatus, setCustomStatus] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [tempItems, setTempItems] = useState<any[]>([]);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Accounts State
  const [accName, setAccName] = useState('');
  const [accPhone, setAccPhone] = useState('');
  const [accPassword, setAccPassword] = useState('');
  const [accRole, setAccRole] = useState('employee');
  const [accountsList, setAccountsList] = useState<any[]>([]);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountsFilter, setAccountsFilter] = useState('All');

  // Attendance State
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceDateFilter, setAttendanceDateFilter] = useState('');   // YYYY-MM-DD from calendar
  const [attendanceRole, setAttendanceRole]     = useState('All');          // category tab
  const [showAttendanceCalendar, setShowAttendanceCalendar] = useState(false);
  const [attendanceMonthFilter, setAttendanceMonthFilter] = useState('');
  const [showAttendanceMonthDropdown, setShowAttendanceMonthDropdown] = useState(false);

  // Role → list-of-phones mapping (admin can extend this)
  const ROLE_PHONES: Record<string, string[]> = {
    Manager:      [],
    Supervisor:   [],
    Accountants:  [],
    Drivers:      [],
    'North Indians': [],
  };

  // Fuel State
  const [fuelList, setFuelList] = useState<any[]>([]);
  const [fuelLoading, setFuelLoading] = useState(false);
  const [fuelDateFilter, setFuelDateFilter] = useState('');
  
  // Fuel Payments State
  const [fuelMonthFilter, setFuelMonthFilter] = useState('');
  const [fuelMonthPayments, setFuelMonthPayments] = useState<Record<string, number>>({});
  const [showFuelPaymentModal, setShowFuelPaymentModal] = useState(false);
  const [fuelPaymentInput, setFuelPaymentInput] = useState('');
  const [showFuelMonthDropdown, setShowFuelMonthDropdown] = useState(false);

  useEffect(() => {
    if (activeTab === 'Accounts') {
      fetchAccounts();
    }
    if (activeTab === 'Attendance') {
      fetchAttendance();
    }
    if (activeTab === 'Fuel') {
      fetchFuel();
    }
  }, [activeTab]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('https://api.codingboss.in/inventory/get-users/');
      const data = await response.json();
      setAccountsList(data);
    } catch(e) {
      console.log('Error fetching accounts', e);
    }
  };

  const fetchAttendance = async () => {
    setAttendanceLoading(true);
    try {
      const response = await fetch('https://api.codingboss.in/inventory/attendance/', {
        headers: { 'Accept': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      });
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.value || []);
      setAttendanceList(list);
    } catch(e) {
      console.log('Error fetching attendance', e);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchFuel = async () => {
    setFuelLoading(true);
    try {
      const response = await fetch('https://api.codingboss.in/inventory/fuel/', {
        headers: { 'Accept': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      });
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.value || []);
      setFuelList(list);

      const summary = await fuelService.getMonthlySummary();
      const paymentsMap: Record<string, number> = {};
      summary.forEach(s => {
        paymentsMap[s.month] = s.paid;
      });
      setFuelMonthPayments(paymentsMap);
    } catch(e) {
      console.log('Error fetching fuel', e);
    } finally {
      setFuelLoading(false);
    }
  };

  const handleAddFuelPayment = async () => {
    if (!fuelMonthFilter || !fuelPaymentInput) {
      Alert.alert('Error', 'Please select a month and enter an amount');
      return;
    }
    const amt = parseFloat(fuelPaymentInput);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    await fuelService.addFuelPayment(fuelMonthFilter, amt);
    setShowFuelPaymentModal(false);
    setFuelPaymentInput('');
    Alert.alert('Success', 'Payment recorded successfully');
    fetchFuel(); // Refresh payments
  };

  const handleCreateAccount = async () => {
    if (!accName.trim() || !accPhone.trim() || !accPassword.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setIsCreatingAccount(true);
    try {
      await authService.apiCreateEmployee({
        name: accName,
        phone: accPhone,
        password: accPassword,
        role: accRole
      });
      Alert.alert('Success', 'Account created successfully');
      setAccName(''); setAccPhone(''); setAccPassword('');
      fetchAccounts();
    } catch(e: any) {
      Alert.alert('Error', e.message || 'Failed to create account');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState('');
  const [dynamicCategories, setDynamicCategories] = useState<any[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  useEffect(() => {
    if (activeTab === 'Categories') {
      fetchDynamicCategories();
    }
  }, [activeTab]);

  const fetchDynamicCategories = async () => {
    try {
      const cats = await cartService.apiFetchCategories();
      if (cats && Array.isArray(cats)) {
         setDynamicCategories(cats);
      } else {
         setDynamicCategories(cartService.getCategories() || []);
      }
    } catch(e) { 
      console.log(e); 
      setDynamicCategories(cartService.getCategories() || []);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }
    setIsAddingCategory(true);
    try {
      await cartService.apiAddCategory({ name: newCategoryName, image: newCategoryImage });
      Alert.alert('Success', 'Category added successfully');
      setNewCategoryName('');
      setNewCategoryImage('');
      fetchDynamicCategories();
    } catch(e: any) {
      Alert.alert('Error', e.message || 'Failed to add category');
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleDeleteCategory = (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this category?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await cartService.apiDeleteCategory(id);
            Alert.alert('Success', 'Category deleted');
            fetchDynamicCategories();
          } catch(e: any) {
            Alert.alert('Error', e.message || 'Failed to delete category');
          }
        }
      }
    ]);
  };

  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: '',
    price: '',
    qty: '',
    image: '',
    category: 'Cement'
  });
  const [brandList, setBrandList] = useState(cartService.getBrands());
  const [newBrandName, setNewBrandName] = useState('');
  const [tempAdminMobile, setTempAdminMobile] = useState(authService.getAdminCredentials().mobile);
  const [tempAdminPassword, setTempAdminPassword] = useState(authService.getAdminCredentials().password);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Receipt Settings Hooks
  const [receiptSettings, setReceiptSettings] = useState(authService.getReceiptSettings());
  const [rBusinessName, setRBusinessName] = useState(authService.getReceiptSettings().businessName);
  const [rTagline, setRTagline] = useState(authService.getReceiptSettings().tagline);
  const [rPhone, setRPhone] = useState(authService.getReceiptSettings().phone);
  const [rAddress, setRAddress] = useState(authService.getReceiptSettings().address);
  const [rGstin, setRGstin] = useState(authService.getReceiptSettings().gstin);
  const [rTerms, setRTerms] = useState(authService.getReceiptSettings().terms);
  const [rFooterBranding, setRFooterBranding] = useState(authService.getReceiptSettings().footerBranding);
  const [rShowGstin, setRShowGstin] = useState(authService.getReceiptSettings().showGstin);
  const [rShowPaymentMethod, setRShowPaymentMethod] = useState(authService.getReceiptSettings().showPaymentMethod);
  const [rAccentColor, setRAccentColor] = useState(authService.getReceiptSettings().accentColor);
  const [rBalanceDueDate, setRBalanceDueDate] = useState((authService.getReceiptSettings() as any).balanceDueDate || '');
  const [rWhatsappNumber, setRWhatsappNumber] = useState((authService.getReceiptSettings() as any).whatsappNumber || '');

  // WhatsApp Reminder (per-send fields)
  const [reminderCustomerName, setReminderCustomerName] = useState('');
  const [reminderCustomerPhone, setReminderCustomerPhone] = useState('');
  const [reminderBalance, setReminderBalance] = useState('');
  const [reminderTotalAmount, setReminderTotalAmount] = useState('');
  const [reminderCurrentAmount, setReminderCurrentAmount] = useState('');

  // Customer Creation
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerPassword, setNewCustomerPassword] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');

  // Employee Creation
  const [newEmpMobile, setNewEmpMobile] = useState('');
  const [newEmpPassword, setNewEmpPassword] = useState('');
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [localEmployees, setLocalEmployees] = useState<any[]>(authService.getEmployeeCredentials());

  const [employeeList, setEmployeeList] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const categories = [
    'Cement', 'TMT Bars', 'Kadapa Slabs', 'Building Blocks', 
    'Tarpaulin', 'Cement Products', 'Laundry Stone', 'Blue Metals', 'Water Tanks', 'Others'
  ];

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await cartService.globalRefresh();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const update = () => {
      setActiveCart([...cartService.getCartItems()]);
      setOrderList([...cartService.getOrders()]);
      setBulkOrderList([...cartService.getBulkOrders()]);
      setBrandList([...cartService.getBrands()]);
      setInventoryList([...cartService.getProducts()]);
    };

    const updateAuth = () => {
      const currentReceipt = authService.getReceiptSettings();
      setReceiptSettings(currentReceipt);
      setLocalEmployees([...authService.getEmployeeCredentials()]);
    };
    
    // Initial fetch
    cartService.apiFetchProducts();
    cartService.apiFetchQuotations().catch(err => console.log('Quotations fetch err:', err));
    cartService.apiFetchBulkOrders().catch(err => console.log('Bulk fetch err:', err));
    cartService.apiFetchEmployees().then(setEmployeeList).catch(err => console.log('Emp fetch err:', err));

    cartService.on('change', update);
    authService.on('change', updateAuth);
    
    return () => {
      cartService.off('change', update);
      authService.off('change', updateAuth);
    };
  }, []);

  const StatCard = ({ title, value, icon, color }: any) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  const renderProduct = ({ item }: { item: any }) => (
    <View style={styles.productCard}>
      <Image 
        source={typeof item.image === 'number' ? item.image : { uri: item.image }} 
        style={[styles.trendingImage, { width: 60, height: 60, marginRight: 15 }]} 
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={{ fontSize: 12, color: Colors.accent, fontWeight: 'bold' }}>{item.category}</Text>
        <View style={styles.productMetadata}>
          <Text style={styles.productStock}>Stock: </Text>
          <Text style={[styles.stockValue, { color: item.qty < 50 ? Colors.error : Colors.success }]}>
            {item.qty} units
          </Text>
        </View>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity 
          style={[styles.deleteBtn, { backgroundColor: Colors.primary, marginRight: 10 }]}
          onPress={() => {
            setNewProduct({
              name: item.name || '',
              brand: item.brand || '',
              price: item.price?.toString() || '',
              qty: item.qty?.toString() || '',
              image: item.image || '',
              category: item.categoryId || item.category || 'Cement'
            });
            setIsEditingProduct(true);
            setEditingProductId(item.id);
            setShowAddProduct(true);
          }}
        >
          <Text style={styles.deleteBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteBtn}
          onPress={() => {
            Alert.alert(
              'Delete Product',
              'Are you sure you want to remove this product?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete', 
                  style: 'destructive',
                  onPress: () => {
                    cartService.deleteProduct(item.id);
                  }
                }
              ]
            );
          }}
        >
          <Trash2 size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBulkOrder = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
      {/* Token Number Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[styles.bulkBadge, { backgroundColor: Colors.primary }]}>
            <Text style={[styles.bulkBadgeText, { color: Colors.white }]}>🎫 TOKEN</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: Colors.primary, letterSpacing: 1 }}>
            {item.id}
          </Text>
        </View>
        <View style={[
          styles.statusBadge, 
          item.status === 'Delivered' ? styles.statusCompleted : 
          item.status === 'Dispatched' ? styles.statusReady : styles.statusPending
        ]}>
          <Text style={[
            styles.statusText,
            item.status === 'Delivered' ? { color: Colors.success } : 
            item.status === 'Dispatched' ? { color: '#2196F3' } : { color: Colors.accent }
          ]}>{item.status}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: Colors.border, marginBottom: 10 }} />

      {/* Customer Info */}
      <View style={styles.orderHeader}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Text style={{ fontSize: 11, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>Name</Text>
          </View>
          <Text style={[styles.orderUser, { marginTop: 0 }]}>{item.name || 'Bulk Order Customer'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
            <Text style={{ fontSize: 11, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>Phone</Text>
          </View>
          <Text style={[styles.orderPhone, { marginTop: 2 }]}>{item.phone ? `📞 ${item.phone}` : '—  No phone'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 11, color: Colors.textSecondary }}>{item.date}</Text>
          <Text style={{ fontSize: 10, color: Colors.textSecondary }}>{item.time}</Text>
        </View>
      </View>

      {/* Order Details Grid */}
      <View style={{ backgroundColor: '#F8F9FA', borderRadius: 12, padding: 16, marginTop: 12, borderWidth: 1, borderColor: Colors.border }}>
        {/* Row 1: Brand and Quantity */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <Package size={18} color={Colors.accent} style={{ marginRight: 8 }} />
            <View>
              <Text style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Brand</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text }}>{item.brand || item.categoryName || 'Cement'}</Text>
            </View>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <Package size={18} color={Colors.primary} style={{ marginRight: 8 }} />
            <View>
              <Text style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>No of Bags</Text>
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: Colors.text }}>{item.bags} Bags</Text>
            </View>
          </View>
        </View>

        {/* Row 2: Location */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <MapPin size={18} color={'#E53935'} style={{ marginRight: 8 }} />
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Delivery Location</Text>
              <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text, lineHeight: 18 }} numberOfLines={2}>{item.location || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Row 3: Delivery Date */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 }}>
          <FileText size={18} color={Colors.textSecondary} style={{ marginRight: 8, marginTop: 1 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>Delivery Date & Time</Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.text, lineHeight: 18 }}>
              {item.deliveryDate
                ? (!isNaN(new Date(item.deliveryDate).getTime())
                    ? new Date(item.deliveryDate).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : item.deliveryDate)
                : 'TBD'}
            </Text>
          </View>
        </View>

        {/* Row 4: Payment */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Coins size={18} color={Colors.success} style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>Payment Type</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: Colors.success, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {item.paymentType || item.transactionType || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Row 4: Truck Assignment */}
        <View style={{ backgroundColor: Colors.white, borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' }}>
          <Truck size={20} color={Colors.primary} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Assigned Truck</Text>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: Colors.primary }}>{item.truckNo || 'Not Assigned'}</Text>
          </View>
        </View>
      </View>
      
      <View style={[styles.actionButtons, { marginTop: 12, alignItems: 'center' }]}>
        {/* Print Button */}
        <TouchableOpacity 
          style={[styles.secondaryAction, { paddingHorizontal: 12, marginRight: 8, height: 40, justifyContent: 'center' }]}
          onPress={() => {
            const mockOrder = {
              ...item,
              items: [{
                name: `${item.brand || item.categoryName || 'Cement'}`,
                qty: `${item.bags} Bags`,
                price: item.total || 0,
              }],
              total: item.total || 0,
              paymentMethod: item.paymentType || item.transactionType || 'CASH'
            };
            setSelectedOrder(mockOrder);
            setShowReceipt(true);
          }}
        >
          <Printer size={18} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Edit Button */}
        <TouchableOpacity 
          style={[styles.secondaryAction, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}
          onPress={() => {
            setCustomizingOrder(item);
            setCustomBags(String(item.bags || ''));
            setCustomLocation(item.location || '');
            setCustomTruckNo(item.truckNo || '');
            setCustomDeliveryDate(item.deliveryDate || '');
            setCustomPaymentType(item.paymentType || '');
            setCustomStatus(item.status || 'In Queue');
            setShowCustomizeBulkModal(true);
          }}
        >
          <Text style={styles.actionBtnText}>✏️ Edit</Text>
        </TouchableOpacity>
        
        {/* Cancel Button */}
        {item.status !== 'Delivered' && item.status !== 'Cancelled' && (
          <TouchableOpacity 
            style={[styles.secondaryAction, { borderColor: Colors.error, marginLeft: 8 }]}
            onPress={() => {
              Alert.alert(
                'Cancel Order',
                'Are you sure you want to cancel this order?',
                [
                  { text: 'No', style: 'cancel' },
                  { 
                    text: 'Yes, Cancel', 
                    style: 'destructive', 
                    onPress: () => cartService.updateBulkOrder(item.id, { status: 'Cancelled' }) 
                  }
                ]
              );
            }}
          >
            <Text style={[styles.actionBtnText, { color: Colors.error }]}>Cancel</Text>
          </TouchableOpacity>
        )}
        
        {item.status === 'In Queue' && (
          <TouchableOpacity 
            style={styles.primaryAction}
            onPress={() => cartService.updateBulkOrder(item.id, { status: 'Dispatched' })}
          >
            <Text style={styles.primaryActionText}>Dispatch</Text>
          </TouchableOpacity>
        )}
        
        {(item.status === 'Dispatched' || item.status === 'Pending') && (
          <TouchableOpacity 
            style={[styles.primaryAction, { backgroundColor: Colors.success }]}
            onPress={() => {
              Alert.alert(
                'Complete Order',
                'Mark this bulk order as fully completed and delivered?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Complete',
                    style: 'default',
                    onPress: () => {
                      cartService.updateBulkOrder(item.id, { status: 'Delivered' });
                      Alert.alert('Done!', 'Order marked as completed ✅');
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.primaryActionText}>✅ Complete Order</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderOrder = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderUser}>{item.name || item.user || 'Manoj Steels User'}</Text>
          <Text style={styles.orderPhone}>{item.phone}</Text>
          {item.employee && (
            <Text style={{ fontSize: 10, color: Colors.accent, marginTop: 2 }}>Placed by: {item.employee}</Text>
          )}
          {item.address && (
            <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 4 }}>📍 {item.address}</Text>
          )}
        </View>
        <TouchableOpacity 
          onPress={() => {
            Alert.alert(
              'Delete Order',
              'Are you sure you want to delete this order?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete', 
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await cartService.deleteOrder(item.id);
                      Alert.alert('Deleted', 'Order deleted successfully.');
                    } catch {
                      Alert.alert('Error', 'Failed to delete order. Please try again.');
                    }
                  }
                }
              ]
            );
          }}
          style={{ padding: 10 }}
        >
          <Trash2 size={20} color={Colors.error} />
        </TouchableOpacity>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={[
            styles.statusBadge, 
            item.status === 'COMPLETED' ? styles.statusCompleted : 
            item.status === 'PRICE_FIXED' ? { backgroundColor: 'rgba(33, 150, 243, 0.1)' } : 
            styles.statusPending
          ]}>
            <Text style={[
              styles.statusText,
              item.status === 'COMPLETED' ? { color: Colors.success } : 
              item.status === 'PRICE_FIXED' ? { color: '#2196F3' } : { color: Colors.accent }
            ]}>{item.status || 'PENDING'}</Text>
          </View>
          
          <View style={styles.paymentSelector}>
            <TouchableOpacity 
              onPress={() => {
                const updated = orderList.map(o => o.id === item.id ? { ...o, paymentMethod: 'Cash' } : o);
                setOrderList(updated);
              }}
              style={[styles.payBtn, item.paymentMethod === 'Cash' && styles.payBtnActive]}
            >
              <Text style={[styles.payBtnText, item.paymentMethod === 'Cash' && styles.payBtnTextActive]}>Cash</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                const updated = orderList.map(o => o.id === item.id ? { ...o, paymentMethod: 'Credit' } : o);
                setOrderList(updated);
              }}
              style={[styles.payBtn, item.paymentMethod === 'Credit' && styles.payBtnActive]}
            >
              <Text style={[styles.payBtnText, item.paymentMethod === 'Credit' && styles.payBtnTextActive]}>Credit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      <View style={styles.orderItems}>
        {item.items.map((prod: any, idx: number) => (
          <Text key={idx} style={styles.itemText}>
            • {prod.name} x {prod.qty} {prod.category === 'Cement' ? 'Bags' : ''}
          </Text>
        ))}
      </View>
      
      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>Total: ₹{(item.total || 0).toLocaleString()}</Text>
        <Text style={styles.orderTime}>{item.time}</Text>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.primaryAction}
          onPress={() => {
            if (!item.items || item.items.length === 0) {
              Alert.alert('No Items', 'This order has no product items to price-fix. Items may have been stored as text notes only.');
              return;
            }
            setEditingOrderId(item.id);
            setTempItems(item.items.map((i: any) => ({ ...i, price: i.price || 0 })));
            setIsEditingPrice(true);
          }}
        >
          <Text style={styles.primaryActionText}>Fix Price</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.secondaryAction, 
            item.status === 'PRICE_FIXED' && { backgroundColor: '#2196F3', borderColor: '#2196F3' }
          ]}
          onPress={async () => {
            if (item.status === 'PRICE_FIXED') {
              // Use manual local data
              setSelectedOrder(item);
              setShowReceipt(true);
              return;
            }
            
            setLoading(true);
            try {
              const billData = await cartService.apiFetchBill(item.id);
              setSelectedOrder({
                ...item,
                items: billData.items.map((i: any) => ({
                  name: i.product_name,
                  qty: i.quantity,
                  price: i.fixed_unit_price
                })),
                total: billData.total_amount
              });
              setShowReceipt(true);
            } catch {
              // Fallback to current item if API fails
              setSelectedOrder(item);
              setShowReceipt(true);
            } finally {
              setLoading(false);
            }
          }}
        >
          <Text style={[
            styles.actionBtnText,
            item.status === 'PRICE_FIXED' && { color: Colors.white, fontWeight: 'bold' }
          ]}>View Bill</Text>
        </TouchableOpacity>
        {item.status !== 'Completed' && (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.primaryAction, { backgroundColor: Colors.success }]}
            onPress={() => {
              const updated = orderList.map(o => o.id === item.id ? { ...o, status: 'Completed' } : o);
              setOrderList(updated);
              Alert.alert('Success', 'Order marked as Completed');
            }}
          >
            <Text style={styles.primaryActionText}>Complete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );



  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Image Picker Error');
        return;
      }
      if (response.assets && response.assets.length > 0) {
        setNewProduct({ ...newProduct, image: response.assets[0].uri || '' });
      }
    });
  };

  const pickCategoryImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Image Picker Error');
        return;
      }
      if (response.assets && response.assets.length > 0) {
        setNewCategoryImage(response.assets[0].uri || '');
      }
    });
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.category) {
      Alert.alert('Error', 'Please fill in the Product Name and Category');
      return;
    }
    
    setLoading(true);
    try {
      const productData = {
        name: newProduct.name,
        brand: newProduct.brand || 'Manoj Steels',
        image: newProduct.image || 'https://via.placeholder.com/150',
        price: parseFloat(newProduct.price) || 0,
        qty: parseInt(newProduct.qty) || 0,
        category: newProduct.category
      };
      
      if (isEditingProduct && editingProductId) {
        await cartService.apiUpdateProduct(editingProductId as string, productData);
        Alert.alert('Success', 'Product updated successfully!');
      } else {
        const product = {
          ...productData,
          id: `PROD-${Date.now()}`,
        };
        await cartService.apiAddProduct(product);
        Alert.alert('Success', 'Product added successfully!');
      }
      
      await cartService.apiFetchProducts();
      
      setShowAddProduct(false);
      setNewProduct({ name: '', brand: '', price: '', qty: '', image: '', category: 'Cement' });
      setIsEditingProduct(false);
      setEditingProductId(null);
    } catch (e: any) {
      console.error('Add/Update Product Error:', e);
      Alert.alert('Error', e.message || 'Failed to update product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedOrder) return;
    
    setLoading(true);
    try {
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica'; padding: 40px; color: #333; }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { font-size: 28px; font-weight: bold; color: ${receiptSettings.accentColor}; text-transform: uppercase; letter-spacing: 0.5px; }
              .tagline { font-size: 12px; color: #666; margin-top: 4px; }
              .store-info { font-size: 11px; color: #666; margin-top: 6px; }
              .order-info { margin-bottom: 30px; border-bottom: 1px dashed #ccc; padding-bottom: 15px; }
              .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
              .label { font-weight: bold; color: #666; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th { border-bottom: 2px solid ${receiptSettings.accentColor}; text-align: left; padding: 10px; font-weight: bold; }
              td { padding: 10px; border-bottom: 1px solid #eee; }
              .total-row { margin-top: 20px; text-align: right; font-size: 20px; font-weight: bold; color: ${receiptSettings.accentColor}; }
              .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; border-top: 1px dashed #ccc; padding-top: 15px; }
              .branding { color: ${receiptSettings.accentColor}; font-weight: bold; margin-top: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">${receiptSettings.businessName}</div>
              ${receiptSettings.tagline ? `<div class="tagline">${receiptSettings.tagline}</div>` : ''}
            </div>

            <div class="order-info">
              <div class="info-row">
                <span><span class="label">Bill No:</span> ${selectedOrder.id}</span>
                <span><span class="label">Date & Time:</span> ${new Date().toLocaleString()}</span>
              </div>
              <div class="info-row">
                <span><span class="label">Customer:</span> ${selectedOrder.name || selectedOrder.user || 'Manoj Steels User'}</span>
                <span><span class="label">Phone:</span> ${selectedOrder.phone || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span><span class="label">Employee:</span> ${selectedEmployee?.name || selectedOrder.employeeName || 'Admin'}</span>
                ${receiptSettings.showPaymentMethod ? `<span><span class="label">Payment:</span> ${selectedOrder.paymentMethod || 'CASH'}</span>` : ''}
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Product Description</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Rate</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${selectedOrder.items.map((item: any) => `
                  <tr>
                    <td>${item.name}</td>
                    <td style="text-align: center;">${item.qty}</td>
                    <td style="text-align: right;">₹${(item.price || 0).toLocaleString()}</td>
                    <td style="text-align: right;">₹${((item.price || 0) * (item.qty || 1)).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="total-row">
              Grand Total: ₹${(selectedOrder.total || 0).toLocaleString()}
            </div>

            <div class="footer">
              ${receiptSettings.terms ? `<p>${receiptSettings.terms}</p>` : ''}
              ${receiptSettings.footerBranding ? `<div class="branding">${receiptSettings.footerBranding}</div>` : ''}
            </div>
          </body>
        </html>
      `;

      const safeFileName = `Bill_${String(selectedOrder.id).replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
      const pdfOptions = {
        html: htmlContent,
        fileName: safeFileName,
        directory: 'Download',
        width: 595,
        height: 842,
        base64: true,
      };

      const file = await generatePDF(pdfOptions);
      
      if (file && file.filePath) {
        try {
          const fileUri = file.filePath.startsWith('file://')
            ? file.filePath
            : `file://${file.filePath}`;
          
          await Share.open({
            url: fileUri,
            type: 'application/pdf',
            title: `Bill Receipt - ${selectedOrder.id}`,
            message: `${receiptSettings.businessName} Bill Receipt | Order: ${selectedOrder.id} | Total: Rs.${Number(selectedOrder.total || 0).toLocaleString('en-IN')}`,
            failOnCancel: false,
          });
        } catch (shareError: any) {
          console.log('File URI share failed, trying secure base64 share:', shareError);
          // If the user cancelled, don't fallback, just raise the cancel
          if (
            shareError?.message?.includes('User did not share') ||
            shareError?.message?.includes('cancel') ||
            shareError?.error === 'CANCELLED'
          ) {
            throw shareError;
          }

          if (file.base64) {
            await Share.open({
              url: `data:application/pdf;base64,${file.base64}`,
              type: 'application/pdf',
              title: `Bill Receipt - ${selectedOrder.id}`,
              message: `${receiptSettings.businessName} Bill Receipt | Order: ${selectedOrder.id} | Total: Rs.${Number(selectedOrder.total || 0).toLocaleString('en-IN')}`,
              failOnCancel: false,
            });
          } else {
            throw shareError;
          }
        }
      } else {
        throw new Error('PDF file path not returned from generator');
      }
    } catch (error: any) {
      console.error('PDF Generation Error:', error);
      // Don't show error if user just cancelled the share sheet
      if (
        error?.message?.includes('User did not share') ||
        error?.message?.includes('cancel') ||
        error?.error === 'CANCELLED'
      ) {
        return;
      }
      Alert.alert(
        'PDF Error',
        'Could not generate or share PDF. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!selectedOrder) return;
    
    setLoading(true);
    try {
      const uri = await captureRef(receiptRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
        snapshotContentContainer: false,
      });

      await Share.open({
        url: uri,
        type: 'image/png',
        title: 'Share Bill Receipt',
        message: `Manoj Steels Bill - ${selectedOrder.id}\nTotal: Rs.${Number(selectedOrder.total || 0).toLocaleString('en-IN')}`,
        failOnCancel: false,
      });
    } catch (error: any) {
      console.error('Image Capture Error:', error);
      if (error?.message?.includes('User did not share') || error?.message?.includes('cancel')) {
        return;
      }
      Alert.alert('Error', 'Failed to generate bill image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.replace('Login');
            }
          }} 
          style={styles.backBtn}
        >
          <ChevronLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={[Typography.h1, styles.headerTitle]}>Admin Panel</Text>
          <Text style={styles.headerSubtitle}>Manoj Steels Management</Text>
        </View>
      </View>

      <View style={{
        marginVertical: 10,
        marginHorizontal: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 35,
        paddingVertical: 8,
        paddingHorizontal: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 6, alignItems: 'center' }}>
          {['Orders', 'Tokens', 'Categories', 'Inventory', 'Receipt Options', 'Accounts', 'Attendance', 'Fuel'].map((t) => {
            const isActive = activeTab === t;
            const iconColor = isActive ? '#FFFFFF' : '#4B5563';
            const iconSize = 18;
            let iconComponent = <Package size={iconSize} color={iconColor} />;
            
            if (t === 'Orders') iconComponent = <ShoppingCart size={iconSize} color={iconColor} />;
            else if (t === 'Tokens') iconComponent = <Ticket size={iconSize} color={iconColor} />;
            else if (t === 'Categories') iconComponent = <LayoutGrid size={iconSize} color={iconColor} />;
            else if (t === 'Inventory') iconComponent = <Package size={iconSize} color={iconColor} />;
            else if (t === 'Receipt Options') iconComponent = <Receipt size={iconSize} color={iconColor} />;
            else if (t === 'Accounts') iconComponent = <Users size={iconSize} color={iconColor} />;
            else if (t === 'Attendance') iconComponent = <ClipboardCheck size={iconSize} color={iconColor} />;
            else if (t === 'Fuel') iconComponent = <Truck size={iconSize} color={iconColor} />;

            return (
              <TouchableOpacity 
                key={t} 
                onPress={() => setActiveTab(t)}
                style={{
                  alignItems: 'center',
                  marginHorizontal: 8,
                  minWidth: 58,
                }}
              >
                <View style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: isActive ? '#1E78FF' : '#F3F4F6',
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: isActive ? '#1E78FF' : '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isActive ? 0.2 : 0.03,
                  shadowRadius: 4,
                  elevation: isActive ? 4 : 1,
                }}>
                  {iconComponent}
                </View>
                <Text style={{
                  fontSize: 10,
                  marginTop: 4,
                  fontWeight: isActive ? 'bold' : '600',
                  color: isActive ? '#1E78FF' : '#4B5563',
                }}>
                  {t === 'Receipt Options' ? 'Receipts' : t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>



      {/* Fix Price Modal */}
      <Modal visible={isEditingPrice} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.priceEditContainer, { width: '90%', maxHeight: '80%' }]}>
            <Text style={styles.priceEditTitle}>Fix Item Prices</Text>
            <Text style={styles.priceEditSubtitle}>Order ID: {editingOrderId}</Text>
            
            <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
              {tempItems.map((item, idx) => (
                <View key={idx} style={styles.priceEditRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemNameLabel}>{item.name}</Text>
                    <Text style={styles.itemQtyLabel}>Quantity: {item.qty}</Text>
                  </View>
                  <View style={styles.priceInputMiniWrapper}>
                    <Text style={styles.currencySymbolMini}>₹</Text>
                    <TextInput placeholderTextColor={Colors.textSecondary}
                      style={styles.priceInputMini}
                      value={item.price?.toString() === '0' ? '' : item.price?.toString() || ''}
                      onChangeText={(val) => {
                        const newItems = [...tempItems];
                        newItems[idx] = { ...newItems[idx], price: val };
                        setTempItems(newItems);
                      }}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.totalPreviewRow}>
              <Text style={styles.totalPreviewLabel}>Calculated Total:</Text>
              <Text style={styles.totalPreviewValue}>
                ₹{tempItems.reduce((acc, i) => acc + ((parseFloat(i.price) || 0) * (i.qty || 1)), 0).toLocaleString()}
              </Text>
            </View>

            <View style={styles.priceEditActions}>
              <TouchableOpacity 
                style={styles.cancelPriceBtn}
                onPress={() => setIsEditingPrice(false)}
              >
                <Text style={styles.cancelPriceText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.savePriceBtn}
                onPress={async () => {
                  setLoading(true);
                  try {
                    // Update price in the backend
                    const fixedItems = tempItems.map(i => ({...i, price: parseFloat(i.price) || 0}));
                    await cartService.apiFixPrice(editingOrderId as string, fixedItems);
                    
                    // Update local list
                    const updatedOrders = orderList.map(order => {
                      if (order.id === editingOrderId) {
                        return {
                          ...order,
                          status: 'PRICE_FIXED',
                          items: fixedItems,
                          total: fixedItems.reduce((acc: number, i: any) => acc + ((i.price || 0) * (i.qty || 1)), 0)
                        };
                      }
                      return order;
                    });
                    
                    setOrderList(updatedOrders);
                    setIsEditingPrice(false);
                    Alert.alert('Success', 'Prices fixed manually.');
                  } catch {
                    Alert.alert('Error', 'Failed to update prices.');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <Text style={styles.savePriceText}>Save All Prices</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Receipt Modal */}
      <Modal visible={showReceipt} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.receiptContainer, { maxHeight: '90%' }]}>
            <TouchableOpacity 
              onPress={() => setShowReceipt(false)} 
              style={{ alignSelf: 'flex-end', padding: 10, marginBottom: -10, zIndex: 1 }}
            >
              <X size={24} color={Colors.primary} />
            </TouchableOpacity>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
              <ViewShot 
                ref={receiptRef} 
                options={{ format: 'png', quality: 1.0 }}
                style={{ backgroundColor: Colors.white, padding: 20 }}
              >
                <View style={{ alignItems: 'center', marginVertical: 10 }}>
                  <Image source={require('../assets/receipt_logo.png')} style={{ width: 250, height: 60, marginBottom: 8 }} resizeMode="contain" />
                  {receiptSettings.businessName ? (
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: receiptSettings.accentColor, textAlign: 'center', letterSpacing: 0.5 }}>{receiptSettings.businessName}</Text>
                  ) : null}
                  {receiptSettings.tagline ? <Text style={{ fontSize: 12, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 }}>{receiptSettings.tagline}</Text> : null}
                </View>

                <View style={styles.receiptDivider} />

                <View style={styles.billSection}>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Party Name:</Text>
                    <Text style={styles.billValue}>
                      {selectedOrder?.name || selectedOrder?.user || selectedOrder?.customerName || 'Manoj Steels User'}
                    </Text>
                  </View>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Phone:</Text>
                    <Text style={styles.billValue}>{selectedOrder?.phone || 'N/A'}</Text>
                  </View>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Date & Time:</Text>
                    <Text style={styles.billValue}>{new Date().toLocaleString()}</Text>
                  </View>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Employee:</Text>
                    <View style={{ flex: 1 }}>
                      {employeeList.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 5 }}>
                          {employeeList.map(emp => (
                            <TouchableOpacity 
                              key={emp.id} 
                              onPress={() => setSelectedEmployee(emp)}
                              style={[
                                { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginRight: 5, borderWidth: 1 },
                                selectedEmployee?.id === emp.id ? { backgroundColor: receiptSettings.accentColor, borderColor: receiptSettings.accentColor } : { borderColor: Colors.border }
                              ]}
                            >
                              <Text style={{ fontSize: 10, color: selectedEmployee?.id === emp.id ? Colors.white : Colors.textSecondary }}>{emp.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      ) : (
                        <Text style={styles.billValue}>{selectedOrder?.employeeName || authService.getCurrentUser()?.full_name || authService.getCurrentUser()?.name || 'Admin (Manoj)'}</Text>
                      )}
                    </View>
                  </View>
                  {receiptSettings.showPaymentMethod ? (
                    <View style={styles.billRow}>
                      <Text style={styles.billLabel}>Payment:</Text>
                      <Text style={[styles.billValue, { color: receiptSettings.accentColor, textTransform: 'uppercase' }]}>{selectedOrder?.paymentMethod || 'CASH'}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.receiptDivider} />

                <View style={styles.receiptTable}>
                  <View style={[styles.tableHeader, { borderBottomColor: receiptSettings.accentColor, borderBottomWidth: 2, paddingBottom: 6 }]}>
                    <Text style={[styles.tableLabel, { flex: 2, color: Colors.text, fontWeight: 'bold' }]}>Product</Text>
                    <Text style={[styles.tableLabel, { textAlign: 'center', color: Colors.text, fontWeight: 'bold' }]}>Qty</Text>
                    <Text style={[styles.tableLabel, { textAlign: 'right', color: Colors.text, fontWeight: 'bold' }]}>Rate</Text>
                  </View>
                  {selectedOrder?.items.map((item: any, idx: number) => (
                    <View key={idx} style={styles.tableRow}>
                      <Text style={[styles.tableValue, { flex: 2, fontWeight: 'bold' }]}>{item.name}</Text>
                      <Text style={[styles.tableValue, { textAlign: 'center' }]}>{item.qty}</Text>
                      <Text style={[styles.tableValue, { textAlign: 'right' }]}>₹{(item.price || 0).toLocaleString()}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.receiptDivider} />

                <View style={styles.receiptTotalRow}>
                  <Text style={styles.receiptTotalLabel}>Grand Total</Text>
                  <Text style={[styles.receiptTotalValue, { color: receiptSettings.accentColor, fontWeight: 'bold', fontSize: 18 }]}>₹{(selectedOrder?.total || 0).toLocaleString()}</Text>
                </View>

                {receiptSettings.terms ? <Text style={styles.receiptFooter}>{receiptSettings.terms}</Text> : null}
                {receiptSettings.footerBranding ? <Text style={[styles.receiptBranding, { color: receiptSettings.accentColor }]}>{receiptSettings.footerBranding}</Text> : null}
              </ViewShot>

              <View style={[styles.receiptDivider, { marginHorizontal: 20 }]} />

              <View style={{ paddingHorizontal: 20, gap: 10 }}>
                <TouchableOpacity 
                  style={[styles.printFinalBtn, { backgroundColor: receiptSettings.accentColor, marginTop: 10 }]}
                  onPress={handleDownloadPDF}
                >
                  <FileText size={20} color={Colors.white} />
                  <Text style={styles.printFinalText}>Download PDF Invoice</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.printFinalBtn, { backgroundColor: Colors.surface, borderWidth: 1, borderColor: receiptSettings.accentColor, marginTop: 0 }]}
                  onPress={handleDownloadImage}
                >
                  <Printer size={20} color={receiptSettings.accentColor} />
                  <Text style={[styles.printFinalText, { color: receiptSettings.accentColor }]}>Share Receipt Image</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.printFinalBtn, { backgroundColor: '#4F5E7B', marginTop: 0 }]}
                  onPress={() => {
                    Alert.alert('Success', 'Sending to Bluetooth Printer...');
                    setShowReceipt(false);
                  }}
                >
                  <Printer size={20} color={Colors.white} />
                  <Text style={styles.printFinalText}>Print to Bluetooth</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Customize Bulk Order Modal */}
      <Modal visible={showCustomizeBulkModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.priceEditContainer, { width: '92%', maxHeight: '88%', borderRadius: 20 }]}>
            
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <View>
                <Text style={styles.priceEditTitle}>✏️ Edit Order</Text>
                <Text style={[styles.priceEditSubtitle, { color: Colors.primary, fontWeight: 'bold' }]}>
                  Token: {customizingOrder?.id}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowCustomizeBulkModal(false)} style={{ padding: 6 }}>
                <X size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={{ height: 1, backgroundColor: Colors.border, marginBottom: 14 }} />

            <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>

              {/* Status Selector */}
              <Text style={[styles.itemNameLabel, { marginBottom: 8 }]}>Order Status</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {['In Queue', 'Dispatched', 'Delivered'].map(s => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setCustomStatus(s)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 20,
                      borderWidth: 1.5,
                      borderColor: customStatus === s ? Colors.primary : Colors.border,
                      backgroundColor: customStatus === s ? Colors.primary + '15' : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: customStatus === s ? Colors.primary : Colors.textSecondary }}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Truck Number */}
              <Text style={[styles.itemNameLabel, { marginBottom: 6 }]}>🚛 Truck Number</Text>
              <View style={[styles.priceInputMiniWrapper, { marginBottom: 14, borderRadius: 10, paddingHorizontal: 12, width: '100%', height: 48 }]}>
                <Truck size={18} color={Colors.primary} style={{ marginRight: 8 }} />
                <TextInput placeholderTextColor={Colors.textSecondary}
                  style={[styles.priceInputMini, { flex: 1, fontSize: 15 }]}
                  value={customTruckNo}
                  onChangeText={(t) => setCustomTruckNo(t.toUpperCase())}
                  placeholder="e.g. TN 01 AB 1234"
                  autoCapitalize="characters"
                />
              </View>

              {/* Number of Bags */}
              <Text style={[styles.itemNameLabel, { marginBottom: 6 }]}>📦 Number of Bags</Text>
              <View style={[styles.priceInputMiniWrapper, { marginBottom: 14, borderRadius: 10, paddingHorizontal: 12, width: '100%', height: 48 }]}>
                <Package size={18} color={Colors.primary} style={{ marginRight: 8 }} />
                <TextInput placeholderTextColor={Colors.textSecondary}
                  style={[styles.priceInputMini, { flex: 1, fontSize: 15 }]}
                  value={customBags}
                  onChangeText={setCustomBags}
                  keyboardType="numeric"
                  placeholder="e.g. 100"
                />
              </View>

              {/* Delivery Location */}
              <Text style={[styles.itemNameLabel, { marginBottom: 6 }]}>📍 Delivery Location</Text>
              <View style={[styles.priceInputMiniWrapper, { marginBottom: 14, borderRadius: 10, paddingHorizontal: 12, width: '100%', height: 'auto', minHeight: 52, paddingVertical: 12, alignItems: 'flex-start' }]}>
                <MapPin size={18} color={Colors.primary} style={{ marginRight: 8, marginTop: 2 }} />
                <TextInput placeholderTextColor={Colors.textSecondary}
                  style={[styles.priceInputMini, { flex: 1, fontSize: 14, lineHeight: 20 }]}
                  value={customLocation}
                  onChangeText={setCustomLocation}
                  placeholder="Full delivery address"
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Delivery Date */}
              <Text style={[styles.itemNameLabel, { marginBottom: 6 }]}>📅 Delivery Date</Text>
              <View style={[styles.priceInputMiniWrapper, { marginBottom: 14, borderRadius: 10, paddingHorizontal: 12, width: '100%', height: 48 }]}>
                <FileText size={18} color={Colors.primary} style={{ marginRight: 8 }} />
                <TextInput placeholderTextColor={Colors.textSecondary}
                  style={[styles.priceInputMini, { flex: 1, fontSize: 15 }]}
                  value={customDeliveryDate}
                  onChangeText={setCustomDeliveryDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              {/* Payment Type */}
              <Text style={[styles.itemNameLabel, { marginBottom: 8 }]}>💳 Payment Type</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {['cash', 'online', 'credit'].map(p => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setCustomPaymentType(p)}
                    style={{
                      paddingHorizontal: 18,
                      paddingVertical: 8,
                      borderRadius: 20,
                      borderWidth: 1.5,
                      borderColor: customPaymentType === p ? Colors.success : Colors.border,
                      backgroundColor: customPaymentType === p ? Colors.success + '15' : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: customPaymentType === p ? Colors.success : Colors.textSecondary, textTransform: 'capitalize' }}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

            </ScrollView>

            {/* Action Buttons */}
            <View style={[styles.priceEditActions, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border }]}>
              <TouchableOpacity 
                style={styles.cancelPriceBtn}
                onPress={() => setShowCustomizeBulkModal(false)}
              >
                <Text style={styles.cancelPriceText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.savePriceBtn, { flex: 1.5 }]}
                onPress={() => {
                  if (!customizingOrder) return;
                  cartService.updateBulkOrder(customizingOrder.id, {
                    status: customStatus,
                    truckNo: customTruckNo,
                    bags: parseInt(customBags) || customizingOrder.bags,
                    location: customLocation,
                    deliveryDate: customDeliveryDate,
                    paymentType: customPaymentType,
                  });
                  setShowCustomizeBulkModal(false);
                  Alert.alert('✅ Updated', 'Bulk order has been updated successfully!');
                }}
              >
                <Text style={styles.savePriceText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {activeTab === 'Orders' ? (
          <>
            <View style={styles.statsRow}>
              <StatCard 
                title="Today's Orders" 
                value={(() => {
                  const today = new Date().toLocaleDateString();
                  const regularToday = orderList.filter(o => o.date === today).length;
                  const bulkToday = bulkOrderList.filter(o => o.date === today).length;
                  return (regularToday + bulkToday).toString();
                })()} 
                icon={<ShoppingBag size={20} color={Colors.accent} />} 
                color={Colors.accent}
              />
              <StatCard 
                title="Today's Sales" 
                value={(() => {
                  const today = new Date().toLocaleDateString();
                  const regularTotal = orderList.filter(o => o.date === today).reduce((acc, o) => acc + (o.total || 0), 0);
                  const bulkTotal = bulkOrderList.filter(o => o.date === today).reduce((acc, o) => acc + (o.total || 0), 0);
                  const total = regularTotal + bulkTotal;
                  return total >= 1000 ? `₹${(total / 1000).toFixed(1)}K` : `₹${total}`;
                })()} 
                icon={<TrendingUp size={20} color={Colors.success} />} 
                color={Colors.success}
              />
            </View>

            {activeCart.length > 0 && (
              <View style={styles.section}>
                <View style={styles.activeCartHeader}>
                  <ShoppingCart size={20} color={Colors.accent} />
                  <Text style={[Typography.h3, styles.sectionTitle, { marginBottom: 0, marginLeft: 10 }]}>Current Active Cart</Text>
                </View>
                <View style={styles.activeCartCard}>
                  {activeCart.map((item: any, idx: number) => (
                    <View key={idx} style={styles.activeCartItem}>
                      <Text style={styles.activeCartItemName}>{item.name}</Text>
                      <Text style={styles.activeCartItemQty}>
                        x {item.qty} {item.category === 'Cement' ? 'Bags' : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[Typography.h3, styles.sectionTitle]}>Recent Orders</Text>
                <TouchableOpacity 
                  onPress={() => {
                    Alert.alert(
                      'Clear All Orders',
                      'Are you sure you want to delete all orders?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Delete All', 
                          style: 'destructive',
                          onPress: () => cartService.clearOrders()
                        }
                      ]
                    );
                  }}
                  style={{ marginBottom: 15 }}
                >
                  <Text style={{ color: Colors.error, fontWeight: 'bold' }}>Clear All</Text>
                </TouchableOpacity>
              </View>
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 35,
                paddingVertical: 10,
                paddingHorizontal: 8,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
                elevation: 3,
                marginBottom: 20,
              }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
                  {['All', 'Pending', 'Completed', 'Today', 'Date'].map((f) => {
                    const isActive = filter === f;
                    const iconColor = isActive ? '#FFFFFF' : '#4B5563';
                    const iconSize = 18;
                    let iconComponent = <Clock size={iconSize} color={iconColor} />;
                    
                    if (f === 'All') iconComponent = <Clock size={iconSize} color={iconColor} />;
                    else if (f === 'Pending') iconComponent = <RefreshCw size={iconSize} color={iconColor} />;
                    else if (f === 'Completed') iconComponent = <CheckCircle2 size={iconSize} color={iconColor} />;
                    else if (f === 'Today') iconComponent = <CalendarDays size={iconSize} color={iconColor} />;
                    else if (f === 'Date') iconComponent = <CalendarDays size={iconSize} color={iconColor} />;

                    return (
                      <TouchableOpacity 
                        key={f} 
                        onPress={() => {
                          setFilter(f);
                          if (f === 'Date') {
                            setShowOrderCalendar(true);
                          }
                        }}
                        style={{
                          flexDirection: 'column',
                          alignItems: 'center',
                          marginHorizontal: 8,
                          minWidth: 62,
                        }}
                      >
                        <View style={{
                          width: 38,
                          height: 38,
                          borderRadius: 19,
                          backgroundColor: isActive ? '#1E78FF' : '#F3F4F6',
                          justifyContent: 'center',
                          alignItems: 'center',
                          shadowColor: isActive ? '#1E78FF' : '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: isActive ? 0.25 : 0.02,
                          shadowRadius: 4,
                          elevation: isActive ? 4 : 1,
                        }}>
                          {iconComponent}
                        </View>
                        <Text style={{
                          fontSize: 10,
                          marginTop: 4,
                          fontWeight: isActive ? 'bold' : '600',
                          color: isActive ? '#1E78FF' : '#4B5563',
                        }}>
                          {f === 'All' ? 'Recent' : (f === 'Date' && selectedOrderDate ? selectedOrderDate : f)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Interactive Order Calendar Modal */}
              <Modal visible={showOrderCalendar} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                  <View style={{ width: '90%', backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', padding: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8 }}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors.text }}>Filter Orders by Date</Text>
                      {selectedOrderDate ? (
                        <TouchableOpacity 
                          onPress={() => {
                            setSelectedOrderDate('');
                            setShowOrderCalendar(false);
                            setFilter('All');
                          }}
                          style={{ backgroundColor: Colors.error + '22', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}
                        >
                          <Text style={{ color: Colors.error, fontSize: 12, fontWeight: 'bold' }}>Clear</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <Calendar
                      onDayPress={(day: any) => {
                        setSelectedOrderDate(day.dateString);
                        setShowOrderCalendar(false);
                      }}
                      markedDates={selectedOrderDate ? { [selectedOrderDate]: { selected: true, selectedColor: '#1E78FF' } } : {}}
                      theme={{
                        selectedDayBackgroundColor: '#1E78FF',
                        todayTextColor: '#1E78FF',
                        arrowColor: '#1E78FF',
                      }}
                    />
                    <TouchableOpacity 
                      onPress={() => setShowOrderCalendar(false)} 
                      style={{ padding: 14, alignItems: 'center', borderTopWidth: 1, borderColor: '#eee', marginTop: 10 }}
                    >
                      <Text style={{ color: Colors.primary, fontWeight: 'bold', fontSize: 16 }}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
              
              <FlatList
                data={orderList
                  .filter(o => {
                    if (filter === 'All') return true;
                    if (filter === 'Pending') return o.status === 'Pending' || o.status === 'PRICE_FIXED';
                    if (filter === 'Completed') return o.status === 'Completed' || o.status === 'Delivered';
                    
                    const today = new Date().toLocaleDateString();
                    if (filter === 'Today') return o.date === today;
                    
                    if (filter === 'Date') {
                      return !selectedOrderDate || o.date === new Date(selectedOrderDate).toLocaleDateString();
                    }
                    
                    return true;
                  })
                  .sort((a, b) => {
                    const idA = parseInt(String(a.id).replace(/\D/g, '') || '0');
                    const idB = parseInt(String(b.id).replace(/\D/g, '') || '0');
                    return idB - idA;
                  })
                }
                renderItem={renderOrder}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>
          </>
        ) : activeTab === 'Tokens' ? (
          <View style={styles.section}>
            <Text style={[Typography.h3, styles.sectionTitle]}>Token Management</Text>
            
            <View style={{
              backgroundColor: '#FFFFFF',
              padding: 20,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              marginBottom: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.04,
              shadowRadius: 16,
              elevation: 2,
            }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: Colors.text, marginBottom: 12 }}>Manage Selectable Brands</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <TextInput 
                  placeholderTextColor={Colors.textSecondary} 
                  style={{
                    flex: 1,
                    height: 48,
                    backgroundColor: '#F9FAFB',
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    color: Colors.black,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    fontSize: 14,
                    marginRight: 10,
                  }}
                  placeholder="New Brand (e.g. Dalmia Cement)"
                  value={newBrandName}
                  onChangeText={setNewBrandName}
                />
                <TouchableOpacity 
                  style={{
                    backgroundColor: Colors.primary,
                    height: 48,
                    paddingHorizontal: 20,
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: Colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                  onPress={() => {
                    if (newBrandName.trim()) {
                      cartService.addBrand(newBrandName.trim());
                      setNewBrandName('');
                    }
                  }}
                >
                  <Text style={{ color: Colors.white, fontWeight: 'bold', fontSize: 14 }}>Add</Text>
                </TouchableOpacity>
              </View>
              
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {brandList.map((brand) => (
                  <View 
                    key={brand} 
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#F3F4F6',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                    }}
                  >
                    <Text style={{ color: '#374151', fontSize: 13, fontWeight: '600' }}>{brand}</Text>
                    <TouchableOpacity 
                      onPress={() => cartService.removeBrand(brand)}
                      style={{
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        borderRadius: 10,
                        padding: 3,
                        marginLeft: 8,
                      }}
                    >
                      <X size={10} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {/* Token Filter Tabs */}
            {(() => {
              const today = new Date().toLocaleDateString();
              const todayCount    = bulkOrderList.filter(o => o.date === today).length;
              const cancelCount   = bulkOrderList.filter(o => o.status === 'Cancelled').length;
              const completeCount = bulkOrderList.filter(o => o.status === 'Delivered' || o.status === 'Completed').length;
              const allCount      = bulkOrderList.length;

              const tabs: Array<{key: 'All' | "Today's" | 'Cancelled' | 'Completed'; label: string; count: number; color: string; bg: string}> = [
                { key: 'All',       label: 'All Orders',    count: allCount,      color: Colors.primary, bg: 'rgba(24,119,242,0.1)' },
                { key: "Today's",   label: "Today's",       count: todayCount,    color: '#FF9800',       bg: 'rgba(255,152,0,0.1)' },
                { key: 'Cancelled', label: 'Cancelled',     count: cancelCount,   color: Colors.error,    bg: 'rgba(220,53,69,0.1)' },
                { key: 'Completed', label: 'Completed',     count: completeCount, color: Colors.success,  bg: 'rgba(40,167,69,0.1)' },
              ];

              return (
                <View style={{ marginTop: 16, marginBottom: 4 }}>
                  {/* Tab Row */}
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                    {tabs.map(tab => {
                      const active = tokenFilter === tab.key;
                      return (
                        <TouchableOpacity
                          key={tab.key}
                          onPress={() => { setTokenFilter(tab.key); setSelectedTokenDate(''); }}
                          style={{
                            flex: 1,
                            minWidth: '45%',
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            borderRadius: 12,
                            backgroundColor: active ? tab.color : tab.bg,
                            borderWidth: 1.5,
                            borderColor: tab.color,
                            alignItems: 'center',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '600', color: active ? Colors.white : tab.color }}>{tab.label}</Text>
                          <View style={{ backgroundColor: active ? 'rgba(255,255,255,0.3)' : tab.color, borderRadius: 20, minWidth: 24, paddingHorizontal: 6, paddingVertical: 2, alignItems: 'center' }}>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: Colors.white }}>{tab.count}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Date picker row (only show for All / Today) */}
                  {(tokenFilter === 'All' || tokenFilter === "Today's") && (
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 10 }}>
                      <TouchableOpacity onPress={() => setShowTokenCalendar(!showTokenCalendar)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ color: Colors.primary, marginRight: 5, fontWeight: 'bold', fontSize: 13 }}>
                          {selectedTokenDate ? new Date(selectedTokenDate).toLocaleDateString() : 'Filter by Date'}
                        </Text>
                        {selectedTokenDate ? (
                          <TouchableOpacity onPress={() => setSelectedTokenDate('')}>
                            <X size={18} color={Colors.error} />
                          </TouchableOpacity>
                        ) : (
                          <CalendarDays size={18} color={Colors.primary} />
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {showTokenCalendar && (
                    <View style={{ marginBottom: 15, borderRadius: 10, overflow: 'hidden', backgroundColor: Colors.white, elevation: 2 }}>
                      <Calendar
                        onDayPress={(day: any) => {
                          setSelectedTokenDate(day.dateString);
                          setShowTokenCalendar(false);
                        }}
                        markedDates={{ [selectedTokenDate]: { selected: true, selectedColor: Colors.primary } }}
                        theme={{ todayTextColor: Colors.primary, selectedDayBackgroundColor: Colors.primary, arrowColor: Colors.primary }}
                      />
                    </View>
                  )}

                  {/* Filtered List */}
                  {(() => {
                    const todayStr = new Date().toLocaleDateString();
                    const filtered = bulkOrderList
                      .filter(o => {
                        if (tokenFilter === "Today's")  return o.date === todayStr;
                        if (tokenFilter === 'Cancelled') return o.status === 'Cancelled';
                        if (tokenFilter === 'Completed') return o.status === 'Delivered' || o.status === 'Completed';
                        // All — apply optional date filter
                        return !selectedTokenDate || o.date === new Date(selectedTokenDate).toLocaleDateString();
                      })
                      .sort((a, b) => {
                        const idA = parseInt(String(a.id).replace(/\D/g, '') || '0');
                        const idB = parseInt(String(b.id).replace(/\D/g, '') || '0');
                        return idB - idA;
                      });

                    if (filtered.length === 0) {
                      return (
                        <View style={styles.emptyAdminState}>
                          <Truck size={48} color={Colors.border} />
                          <Text style={styles.emptyAdminText}>No orders found</Text>
                        </View>
                      );
                    }

                    return (
                      <ActiveTokensList 
                        bulkOrderList={filtered} 
                        onRefresh={onRefresh} 
                      />
                    );
                  })()}
                </View>
              );
            })()}
          </View>
        ) : activeTab === 'Receipt Options' ? (
          <View style={styles.section}>
            <Text style={[Typography.h3, styles.sectionTitle]}>Receipt Settings & Customization</Text>
            {/* Quick Select Presets - Moved to Top */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              <TouchableOpacity 
                activeOpacity={0.7}
                style={{ flex: 1, backgroundColor: rBusinessName === 'MANOJ STEELS' ? Colors.primary : Colors.surface, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.primary, alignItems: 'center' }}
                onPress={() => {
                  setRBusinessName('MANOJ STEELS');
                  setRPhone('9994488447, 9364476444');
                  setRAddress('201, Sathy Aathani main road, TN palayam');
                  setRBalanceDueDate('');
                  setRFooterBranding('~ Manoj Steels ~');
                  setRAccentColor('#1877F2'); // Classic Blue
                }}
              >
                <Text style={{ color: rBusinessName === 'MANOJ STEELS' ? Colors.white : Colors.primary, fontWeight: 'bold', fontSize: 14 }}>Manoj Steels</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.7}
                style={{ flex: 1, backgroundColor: rBusinessName === 'ANANTH CEMENT AND STEELS' ? '#E65100' : Colors.surface, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#E65100', alignItems: 'center' }}
                onPress={() => {
                  setRBusinessName('ANANTH CEMENT AND STEELS');
                  setRPhone('9600612632, 9364476444');
                  setRAddress('201, Sathy Aathani main road, TN palayam');
                  setRBalanceDueDate('');
                  setRFooterBranding('~ Ananth Cement and Steels ~');
                  setRAccentColor('#FF9800'); // Warning Amber
                }}
              >
                <Text style={{ color: rBusinessName === 'ANANTH CEMENT AND STEELS' ? Colors.white : '#E65100', fontWeight: 'bold', fontSize: 13, textAlign: 'center' }}>Ananth Cement and Steels</Text>
              </TouchableOpacity>
            </View>

            {/* Live Receipt Mock Preview */}
            <Text style={[styles.inputLabel, { marginBottom: 8, fontWeight: 'bold' }]}>Live Receipt Preview</Text>
            <View ref={liveReceiptRef} collapsable={false} style={[styles.mockReceiptContainer, { borderColor: rAccentColor, backgroundColor: Colors.white }]}>
              <View style={styles.mockTearOff} />
              <View style={styles.mockReceiptContent}>
                <View style={{ alignItems: 'center', marginBottom: 6 }}>
                  <Image 
                    source={rBusinessName === 'ANANTH CEMENT AND STEELS' ? require('../assets/ananth_receipt_logo.png') : require('../assets/receipt_logo.png')} 
                    style={{ 
                      width: rBusinessName === 'ANANTH CEMENT AND STEELS' ? '95%' : '80%', 
                      height: rBusinessName === 'ANANTH CEMENT AND STEELS' ? 70 : 40, 
                      marginBottom: 4 
                    }} 
                    resizeMode="contain" 
                  />
                  <Text style={[styles.mockReceiptTitle, { color: rAccentColor, fontSize: 14 }]}>{rBusinessName || 'BUSINESS NAME'}</Text>
                </View>
                
                <View style={styles.mockReceiptDivider} />
                
                <View style={{ alignItems: 'center', paddingHorizontal: 16, paddingBottom: 6 }}>
                  <Text style={{ fontSize: 12, color: Colors.textSecondary, textAlign: 'center', marginBottom: 4, lineHeight: 18 }}>
                    📍 {rAddress || 'Business Address'}
                  </Text>
                  <Text style={{ fontSize: 12, color: Colors.textSecondary, textAlign: 'center', marginBottom: 4 }}>
                    📞 {rPhone || '9876543210'}
                  </Text>
                  {rShowPaymentMethod ? <Text style={{ fontSize: 12, color: Colors.textSecondary, textAlign: 'center', marginBottom: 4 }}>💳 Payment: CASH / CREDIT</Text> : null}
                  {rBalanceDueDate ? <Text style={{ fontSize: 12, color: '#E53935', fontWeight: 'bold', textAlign: 'center' }}>⚠️ Balance Due By: {rBalanceDueDate}</Text> : null}
                </View>
                
                <View style={{ marginVertical: 12, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#D32F2F', marginBottom: 12, textAlign: 'center' }}>
                    Kindly Make payment as soon as Possible
                  </Text>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' }}>
                    <Image source={require('../assets/gpay_icon.png')} style={{ width: 40, height: 20, marginRight: 8 }} resizeMode="contain" />
                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#1F2937', letterSpacing: 1 }}>
                      {rBusinessName === 'ANANTH CEMENT AND STEELS' ? '7094488447' : '8124488447'}
                    </Text>
                  </View>
                </View>
                
                <View style={[styles.mockReceiptDivider, { borderStyle: 'dashed' }]} />
                
                {rTerms ? <Text style={styles.mockTermsText}>{rTerms}</Text> : null}
                {rFooterBranding ? <Text style={[styles.mockFooterBranding, { color: rAccentColor }]}>{rFooterBranding}</Text> : null}
              </View>
              <View style={styles.mockTearOff} />
            </View>

            {/* Print Bill Button for Live Receipt */}
            <TouchableOpacity 
              style={{ backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, marginTop: 15, alignSelf: 'center', width: '90%', elevation: 3 }}
              onPress={async () => {
                try {
                  const uri = await captureRef(liveReceiptRef, { format: 'png', quality: 1.0 });
                  await Share.open({ url: uri, type: 'image/png', title: 'Print Receipt Preview' });
                } catch(e) {}
              }}
            >
              <Printer size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Print Bill</Text>
            </TouchableOpacity>

            {/* Calendar Modal */}
            <Modal visible={showCalendar} transparent={true} animationType="fade">
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: '90%', backgroundColor: 'white', borderRadius: 10, overflow: 'hidden' }}>
                  <Calendar
                    onDayPress={(day: any) => {
                      const parts = day.dateString.split('-');
                      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                      const formatted = `${parts[2]}-${months[parseInt(parts[1], 10)-1]}-${parts[0]}`;
                      setRBalanceDueDate(formatted);
                      setShowCalendar(false);
                    }}
                    theme={{
                      selectedDayBackgroundColor: Colors.primary,
                      todayTextColor: Colors.primary,
                      arrowColor: Colors.primary,
                    }}
                  />
                  <TouchableOpacity onPress={() => setShowCalendar(false)} style={{ padding: 15, alignItems: 'center', borderTopWidth: 1, borderColor: '#eee' }}>
                    <Text style={{ color: Colors.error, fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            {/* ── Customization Form ── */}
            <View style={[styles.brandManageCard, { marginTop: 20 }]}>
              <Text style={[styles.inputLabel, { fontSize: 16, marginBottom: 15, color: Colors.primary }]}>Customize Header Info</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Business Name</Text>
                <TextInput placeholderTextColor={Colors.textSecondary} 
                  style={styles.adminInput}
                  value={rBusinessName}
                  onChangeText={setRBusinessName}
                  placeholder="e.g. MANOJ STEELS"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Contact Phone Number</Text>
                <TextInput placeholderTextColor={Colors.textSecondary} 
                  style={styles.adminInput}
                  value={rPhone}
                  onChangeText={setRPhone}
                  keyboardType="phone-pad"
                  placeholder="e.g. 9876543210"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Business Address</Text>
                <TextInput placeholderTextColor={Colors.textSecondary} 
                  style={styles.adminInput}
                  value={rAddress}
                  onChangeText={setRAddress}
                  placeholder="e.g. 123 Main Bazaar Road"
                />
              </View>

              {/* Balance Amount Due Date */}
              <View style={[styles.formGroup, { backgroundColor: '#FFF8E1', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#FFD54F' }]}>
                <Text style={[styles.inputLabel, { color: '#E65100', fontWeight: 'bold', marginBottom: 4 }]}>⏰ Balance Amount Due Date</Text>
                <Text style={{ fontSize: 11, color: '#BF360C', marginBottom: 10 }}>
                  This date will appear on all receipts as the balance payment deadline.
                </Text>
                <TouchableOpacity 
                  style={[styles.adminInput, { borderColor: '#FF8F00', backgroundColor: Colors.white, justifyContent: 'center' }]}
                  onPress={() => setShowCalendar(true)}
                >
                  <Text style={{ color: rBalanceDueDate ? Colors.text : Colors.textSecondary, fontSize: 15 }}>
                    {rBalanceDueDate || 'Select Date (e.g. 31-May-2026)'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { fontSize: 16, marginTop: 20, marginBottom: 15, color: Colors.primary }]}>Terms & Display Controls</Text>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Terms & Conditions Note</Text>
                <TextInput placeholderTextColor={Colors.textSecondary} 
                  style={styles.adminInput}
                  value={rTerms}
                  onChangeText={setRTerms}
                  placeholder="e.g. Goods once sold cannot be returned."
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Footer Branding Text</Text>
                <TextInput placeholderTextColor={Colors.textSecondary} 
                  style={styles.adminInput}
                  value={rFooterBranding}
                  onChangeText={setRFooterBranding}
                  placeholder="e.g. ~ Manoj Steels ~"
                />
              </View>

              {/* Toggle: Payment Method */}
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Display Payment Method (Cash/Credit)</Text>
                <TouchableOpacity 
                  onPress={() => setRShowPaymentMethod(!rShowPaymentMethod)}
                  style={[styles.switchTrack, rShowPaymentMethod ? styles.switchTrackActive : styles.switchTrackInactive]}
                >
                  <View style={[styles.switchThumb, rShowPaymentMethod ? styles.switchThumbActive : styles.switchThumbInactive]} />
                </TouchableOpacity>
              </View>



              <TouchableOpacity 
                style={[styles.saveProductBtn, { marginTop: 25 }]}
                onPress={async () => {
                  setLoading(true);
                  try {
                    const success = await authService.updateReceiptSettings({
                      businessName: rBusinessName.trim(),
                      tagline: rTagline.trim(),
                      phone: rPhone.trim(),
                      address: rAddress.trim(),
                      gstin: rGstin.trim(),
                      terms: rTerms.trim(),
                      footerBranding: rFooterBranding.trim(),
                      showGstin: rShowGstin,
                      showPaymentMethod: rShowPaymentMethod,
                      accentColor: rAccentColor,
                      balanceDueDate: rBalanceDueDate.trim(),
                      whatsappNumber: rWhatsappNumber.trim(),
                    });
                    
                    if (success) {
                      Alert.alert('Success', 'Receipt customization options saved successfully.');
                    } else {
                      Alert.alert('Error', 'Failed to save receipt settings.');
                    }
                  } catch {
                    Alert.alert('Error', 'An error occurred while saving.');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveProductText}>Save Receipt Customization</Text>}
              </TouchableOpacity>
            </View>

            {/* ── WhatsApp Payment Reminder Section ── */}
            <View style={[styles.brandManageCard, { marginTop: 20, borderWidth: 2, borderColor: '#25D366' }]}>
              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#25D366', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                  <Text style={{ fontSize: 20 }}>💬</Text>
                </View>
                <View>
                  <Text style={[styles.inputLabel, { fontSize: 16, color: '#128C7E', fontWeight: 'bold', marginBottom: 0 }]}>WhatsApp Payment Reminder</Text>
                  <Text style={{ fontSize: 11, color: Colors.textSecondary }}>Send a payment reminder directly via WhatsApp</Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: '#E0F2F1', marginVertical: 12 }} />

              {/* Default WhatsApp Number (store) */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Your WhatsApp Business Number</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#25D366', borderRadius: 10, backgroundColor: Colors.white, overflow: 'hidden' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 14, borderRightWidth: 1, borderRightColor: '#25D366' }}>
                    <Text style={{ fontSize: 16 }}>🇮🇳</Text>
                    <Text style={{ marginLeft: 4, fontWeight: 'bold', color: '#128C7E', fontSize: 14 }}>+91</Text>
                  </View>
                  <TextInput
                    placeholderTextColor={Colors.textSecondary}
                    style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, color: Colors.text }}
                    value={rWhatsappNumber}
                    onChangeText={(t) => setRWhatsappNumber(t.replace(/\D/g, '').slice(0, 10))}
                    keyboardType="phone-pad"
                    placeholder="9876543210"
                    maxLength={10}
                  />
                </View>
                <Text style={{ fontSize: 10, color: Colors.textSecondary, marginTop: 4 }}>
                  Enter 10-digit number. Country code +91 is added automatically.
                </Text>
              </View>

              <View style={{ height: 1, backgroundColor: '#E8F5E9', marginVertical: 12 }} />

              {/* Reminder Form */}
              <Text style={[styles.inputLabel, { color: '#128C7E', fontWeight: 'bold', marginBottom: 12 }]}>Send Reminder to Customer</Text>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Customer Name</Text>
                <TextInput placeholderTextColor={Colors.textSecondary} 
                  style={styles.adminInput}
                  value={reminderCustomerName}
                  onChangeText={setReminderCustomerName}
                  placeholder="e.g. Ramesh Kumar"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Customer WhatsApp Number</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, backgroundColor: Colors.white, overflow: 'hidden' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 12, paddingVertical: 14, borderRightWidth: 1, borderRightColor: Colors.border }}>
                    <Text style={{ fontSize: 16 }}>🇮🇳</Text>
                    <Text style={{ marginLeft: 4, fontWeight: 'bold', color: Colors.text, fontSize: 14 }}>+91</Text>
                  </View>
                  <TextInput
                    placeholderTextColor={Colors.textSecondary}
                    style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, color: Colors.text }}
                    value={reminderCustomerPhone}
                    onChangeText={(t) => setReminderCustomerPhone(t.replace(/\D/g, '').slice(0, 10))}
                    keyboardType="phone-pad"
                    placeholder="9876543210"
                    maxLength={10}
                  />
                </View>
                <Text style={{ fontSize: 10, color: Colors.textSecondary, marginTop: 4 }}>
                  Enter 10-digit mobile number. +91 is added automatically.
                </Text>
              </View>



              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Balance Amount Due (₹)</Text>
                <TextInput placeholderTextColor={Colors.textSecondary} 
                  style={[styles.adminInput, { color: '#E53935', fontWeight: 'bold' }]}
                  value={reminderBalance}
                  onChangeText={setReminderBalance}
                  keyboardType="numeric"
                  placeholder="e.g. 30000"
                />
              </View>

              {/* Send WhatsApp Reminder Button */}
              <TouchableOpacity
                style={{
                  marginTop: 16,
                  backgroundColor: '#25D366',
                  borderRadius: 14,
                  paddingVertical: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  elevation: 3,
                  shadowColor: '#25D366',
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                }}
                onPress={() => {
                  const rawPhone = reminderCustomerPhone.trim().replace(/\D/g, '');
                  if (!rawPhone || rawPhone.length < 10) {
                    Alert.alert('Invalid Number', 'Please enter a valid 10-digit WhatsApp number.');
                    return;
                  }
                  if (!reminderBalance.trim()) {
                    Alert.alert('Missing Info', 'Please enter the balance amount.');
                    return;
                  }

                  // Always prepend Indian country code 91
                  const phone = `91${rawPhone}`;

                  const dueText = rBalanceDueDate ? `\n📅 *Due Date:* ${rBalanceDueDate}` : '';
                  const gpayNum = rBusinessName === 'ANANTH CEMENT AND STEELS' ? '7094488447' : '8124488447';
                  const customer = reminderCustomerName.trim() ? `*${reminderCustomerName.trim()}*` : '*Sir/Madam*';
                  
                  const message =
                    `🔔 *Payment Reminder* 🔔\n\n` +
                    `Hello ${customer} 👋\n\n` +
                    `This is a gentle reminder regarding your pending payment.\n\n` +
                    `💰 *Balance Due Amount:* ₹${reminderBalance.trim()}${dueText}\n\n` +
                    `Kindly make the payment at your earliest convenience to avoid delays.\n\n` +
                    `📲 *Google Pay:* ${gpayNum}\n\n` +
                    `Thank you for your support 🙏\n\n` +
                    `━━━━━━━━━━━━━━\n` +
                    `🏢 *${rBusinessName || 'BUSINESS NAME'}*`;



                  const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
                  
                  // Capture the Live Receipt Preview as an image
                  captureRef(liveReceiptRef, {
                    format: 'png',
                    quality: 0.9,
                  }).then((uri) => {
                    // Send to WhatsApp using react-native-share
                    Share.shareSingle({
                      title: 'Payment Reminder',
                      message: message,
                      url: uri,
                      social: Share.Social.WHATSAPP as any,
                      whatsAppNumber: phone, // Android directly opens chat with this number
                    } as any).catch((err) => {
                      // Fallback if share fails (e.g., WhatsApp not installed)
                      Linking.openURL(url).catch(() => {
                        Alert.alert('Error', 'Could not open WhatsApp.');
                      });
                    });
                  }).catch(() => {
                    // Fallback to text only if image capture fails
                    Linking.openURL(url).catch(() => {
                      Alert.alert('Error', 'Could not open WhatsApp.');
                    });
                  });
                }}
              >
                <Text style={{ fontSize: 20 }}>💬</Text>
                <Text style={{ color: Colors.white, fontWeight: 'bold', fontSize: 15 }}>Send WhatsApp Reminder</Text>
              </TouchableOpacity>

              {/* Quick Reminder Tip */}
              <View style={{ marginTop: 14, backgroundColor: '#E8F5E9', borderRadius: 10, padding: 10 }}>
                <Text style={{ fontSize: 11, color: '#1B5E20', lineHeight: 17 }}>
                  💡 <Text style={{ fontWeight: 'bold' }}>Tip:</Text> The reminder message is pre-filled with the customer name, balance amount, and due date. WhatsApp will open with the message ready to send.
                </Text>
              </View>
            </View>
          </View>
        ) : activeTab === 'Categories' ? (
          <ScrollView style={styles.sectionContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Manage Categories</Text>
              </View>
            </View>
            <View style={styles.addCategoryCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Category Name</Text>
                <TextInput placeholderTextColor={Colors.textSecondary} 
                  style={styles.input} 
                  value={newCategoryName} 
                  onChangeText={setNewCategoryName} 
                  placeholder="Enter Category" 
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Category Image</Text>
                {newCategoryImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: newCategoryImage }} style={styles.imagePreview} />
                    <TouchableOpacity 
                      style={styles.changeImageBtn}
                      onPress={pickCategoryImage}
                    >
                      <Text style={styles.changeImageText}>Change Image</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.uploadBtn}
                    onPress={pickCategoryImage}
                  >
                    <ShoppingBag size={24} color={Colors.primary} />
                    <Text style={styles.uploadBtnText}>Upload from Gallery</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity style={styles.addCategoryBtn} onPress={handleAddCategory} disabled={isAddingCategory}>
                {isAddingCategory ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.addCategoryBtnText}>Add Category</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Existing Categories</Text>
            </View>
            
            {dynamicCategories.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No categories found.</Text>
              </View>
            ) : (
              dynamicCategories.map(cat => (
                <View key={cat.id} style={[styles.customerCard, { alignItems: 'center' }]}>
                  {cat.image ? (
                    <Image source={{uri: cat.image.startsWith('http') ? cat.image : `https://api.codingboss.in${cat.image}`}} style={{width: 50, height: 50, borderRadius: 25, marginRight: 15}} />
                  ) : (
                    <View style={{width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.border, marginRight: 15, alignItems: 'center', justifyContent: 'center'}}>
                       <Text style={{color: '#999', fontSize: 10}}>No Img</Text>
                    </View>
                  )}
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{cat.name}</Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.deleteBtn, { backgroundColor: Colors.error }]}
                    onPress={() => handleDeleteCategory(String(cat.id))}
                  >
                    <Trash2 size={16} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              ))
            )}
            <View style={{height: 100}} />
          </ScrollView>
        ) : activeTab === 'Accounts' ? (
          <ScrollView style={styles.sectionContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Users size={24} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Create Account</Text>
              </View>
            </View>
            
            <View style={styles.addCategoryCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput placeholderTextColor={Colors.textSecondary} style={styles.input} value={accName} onChangeText={setAccName} placeholder="Enter Name" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput placeholderTextColor={Colors.textSecondary} style={styles.input} value={accPhone} onChangeText={setAccPhone} placeholder="Enter Phone" keyboardType="phone-pad" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput placeholderTextColor={Colors.textSecondary} style={styles.input} value={accPassword} onChangeText={setAccPassword} placeholder="Enter Password" />
              </View>
              
              <Text style={styles.inputLabel}>Role</Text>
              <View style={{flexDirection: 'row', gap: 10, marginBottom: 15}}>
                {['employee', 'customer', 'admin'].map(role => (
                  <TouchableOpacity 
                    key={role} 
                    style={[styles.roleChip, accRole === role && styles.roleChipActive]}
                    onPress={() => setAccRole(role)}
                  >
                    <Text style={[styles.roleChipText, accRole === role && styles.roleChipTextActive]}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.addCategoryBtn} onPress={handleCreateAccount} disabled={isCreatingAccount}>
                {isCreatingAccount ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.addCategoryBtnText}>Create Account</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Registered Accounts</Text>
            </View>
            
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 35,
              paddingVertical: 10,
              paddingHorizontal: 8,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 3,
              marginBottom: 20,
              marginTop: 5,
            }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
                {['All', 'Customer', 'Employee', 'Admin'].map((f) => {
                  const isActive = accountsFilter === f;
                  const iconColor = isActive ? '#FFFFFF' : '#4B5563';
                  const iconSize = 18;
                  let iconComponent = <Users size={iconSize} color={iconColor} />;
                  
                  if (f === 'All') iconComponent = <Users size={iconSize} color={iconColor} />;
                  else if (f === 'Customer') iconComponent = <ShoppingBag size={iconSize} color={iconColor} />;
                  else if (f === 'Employee') iconComponent = <ClipboardCheck size={iconSize} color={iconColor} />;
                  else if (f === 'Admin') iconComponent = <Eye size={iconSize} color={iconColor} />;

                  return (
                    <TouchableOpacity 
                      key={f} 
                      onPress={() => setAccountsFilter(f)}
                      style={{
                        flexDirection: 'column',
                        alignItems: 'center',
                        marginHorizontal: 8,
                        minWidth: 65,
                      }}
                    >
                      <View style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: isActive ? '#1E78FF' : '#F3F4F6',
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: isActive ? '#1E78FF' : '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: isActive ? 0.25 : 0.02,
                        shadowRadius: 4,
                        elevation: isActive ? 4 : 1,
                      }}>
                        {iconComponent}
                      </View>
                      <Text style={{
                        fontSize: 10,
                        marginTop: 4,
                        fontWeight: isActive ? 'bold' : '600',
                        color: isActive ? '#1E78FF' : '#4B5563',
                      }}>
                        {f}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {accountsList.filter(acc => accountsFilter === 'All' || (acc.role || 'user').toLowerCase() === accountsFilter.toLowerCase()).length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No accounts found.</Text>
              </View>
            ) : (
              accountsList.filter(acc => accountsFilter === 'All' || (acc.role || 'user').toLowerCase() === accountsFilter.toLowerCase()).map(acc => (
                <View key={acc.id} style={styles.customerCard}>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{acc.name || acc.phone}</Text>
                    <Text style={styles.customerPhone}>{acc.phone}</Text>
                    <Text style={{color: Colors.primary, fontSize: 12, marginTop: 4, fontWeight: 'bold'}}>{(acc.role || 'user').toUpperCase()}</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => {
                      Alert.alert('Confirm Delete', 'Are you sure you want to delete this account?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: async () => {
                            try {
                              // Optimistic delete from UI
                              setAccountsList(prev => prev.filter(a => a.id !== acc.id));
                              
                              const role = (acc.role || 'user').toLowerCase();
                              if (role === 'customer') {
                                await authService.apiDeleteCustomer(acc.id);
                              } else if (role === 'employee') {
                                await authService.apiDeleteEmployee(acc.id);
                              } else {
                                await authService.apiDeleteUser(acc.id);
                              }
                            } catch(e) {
                              console.log('Delete API error, but removed locally', e);
                            }
                          } 
                        }
                      ]);
                    }} 
                    style={styles.deleteBtn}
                  >
                    <Trash2 size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))
            )}
            <View style={{height: 100}} />
          </ScrollView>
        ) : activeTab === 'Inventory' ? (
          <View style={styles.section}>
             <View style={styles.sectionHeaderRow}>
                <Text style={[Typography.h3, styles.sectionTitle]}>Inventory Management</Text>
                <TouchableOpacity 
                  style={styles.addItemBtn}
                  onPress={() => {
                    console.log('Opening Add Product Modal');
                    setIsEditingProduct(false);
                    setEditingProductId(null);
                    setNewProduct({ name: '', brand: '', price: '', qty: '', image: '', category: 'Cement' });
                    setShowAddProduct(true);
                  }}
                >
                  <Text style={styles.addItemBtnText}>+ Add Item</Text>
                </TouchableOpacity>
             </View>

             {/* Add Product Modal (Moved back to Inventory section) */}
             <Modal visible={showAddProduct} transparent animationType="slide">
               <View style={styles.modalOverlay}>
                 <View style={styles.fullScreenModal}>
                   <View style={[styles.receiptHeader, { backgroundColor: Colors.primary, padding: 20, marginBottom: 15 }]}>
                     <Text style={[styles.receiptBrand, { color: Colors.white }]}>{isEditingProduct ? 'Edit Product' : 'Add New Product'}</Text>
                     <TouchableOpacity onPress={() => setShowAddProduct(false)}>
                       <X size={24} color={Colors.white} />
                     </TouchableOpacity>
                   </View>

                   <ScrollView style={{ padding: 20 }}>
                     <View style={styles.formGroup}>
                       <Text style={styles.inputLabel}>Product Name</Text>
                       <TextInput 
                         style={styles.adminInput}
                         placeholder="e.g. MS Steel Rods"
                         placeholderTextColor={Colors.textSecondary}
                         value={newProduct.name}
                         onChangeText={(t) => setNewProduct({...newProduct, name: t})}
                       />
                     </View>

                     <View style={styles.formGroup}>
                       <Text style={styles.inputLabel}>Brand Name</Text>
                       <TextInput 
                         style={styles.adminInput}
                         placeholder="Enter Brand"
                         placeholderTextColor={Colors.textSecondary}
                         value={newProduct.brand}
                         onChangeText={(t) => setNewProduct({...newProduct, brand: t})}
                       />
                     </View>

                     <View style={styles.formGroup}>
                       <Text style={styles.inputLabel}>Base Price (Optional)</Text>
                       <TextInput 
                         style={styles.adminInput}
                         placeholder="e.g. 500"
                         placeholderTextColor={Colors.textSecondary}
                         keyboardType="numeric"
                         value={newProduct.price}
                         onChangeText={(t) => setNewProduct({...newProduct, price: t})}
                       />
                     </View>

                     <View style={styles.formGroup}>
                       <Text style={styles.inputLabel}>Stock Quantity</Text>
                       <TextInput 
                         style={styles.adminInput}
                         placeholder="Initial Stock"
                         placeholderTextColor={Colors.textSecondary}
                         keyboardType="numeric"
                         value={newProduct.qty}
                         onChangeText={(t) => setNewProduct({...newProduct, qty: t})}
                       />
                     </View>

                     <View style={styles.formGroup}>
                       <Text style={styles.inputLabel}>Category</Text>
                       <TouchableOpacity 
                         style={styles.dropdownField}
                         onPress={() => setShowCategoryDropdown(true)}
                       >
                         <Text style={styles.dropdownValue}>{newProduct.category}</Text>
                         <Text style={styles.dropdownArrow}>▼</Text>
                       </TouchableOpacity>
                     </View>

                     <View style={styles.formGroup}>
                       <Text style={styles.inputLabel}>Product Image</Text>
                       {newProduct.image ? (
                         <View style={styles.imagePreviewContainer}>
                           <Image source={{ uri: newProduct.image }} style={styles.imagePreview} />
                           <TouchableOpacity 
                             style={styles.changeImageBtn}
                             onPress={pickImage}
                           >
                             <Text style={styles.changeImageText}>Change Image</Text>
                           </TouchableOpacity>
                         </View>
                       ) : (
                         <TouchableOpacity 
                           style={styles.uploadBtn}
                           onPress={pickImage}
                         >
                           <ShoppingBag size={24} color={Colors.primary} />
                           <Text style={styles.uploadBtnText}>Upload from Gallery</Text>
                         </TouchableOpacity>
                       )}
                     </View>

                     <TouchableOpacity 
                       style={styles.saveProductBtn}
                       onPress={handleAddProduct}
                     >
                       {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveProductText}>{isEditingProduct ? 'Save Changes' : 'Save Product'}</Text>}
                     </TouchableOpacity>
                     <View style={{ height: 40 }} />
                   </ScrollView>
                 </View>
               </View>

               <Modal visible={showCategoryDropdown} transparent animationType="slide">
                 <View style={styles.dropdownModalOverlay}>
                   <View style={styles.dropdownMenu}>
                     <View style={styles.dropdownHeader}>
                       <Text style={styles.dropdownTitle}>Select Category</Text>
                       <TouchableOpacity onPress={() => setShowCategoryDropdown(false)}>
                         <X size={20} color={Colors.text} />
                       </TouchableOpacity>
                     </View>
                     <ScrollView>
                       {categories.map((cat) => (
                         <TouchableOpacity 
                           key={cat}
                           style={styles.dropdownItem}
                           onPress={() => {
                             setNewProduct({...newProduct, category: cat});
                             setShowCategoryDropdown(false);
                           }}
                         >
                           <Text style={[
                             styles.dropdownItemText,
                             newProduct.category === cat && styles.dropdownItemActive
                           ]}>{cat}</Text>
                           {newProduct.category === cat && <CheckCircle2 size={16} color={Colors.primary} />}
                         </TouchableOpacity>
                       ))}
                     </ScrollView>
                   </View>
                 </View>
               </Modal>
             </Modal>
            <FlatList
              data={inventoryList}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        ) : null}

        {/* ─── Attendance Tab ─── */}
        {activeTab === 'Attendance' && (
          <View style={styles.section}>
            <Text style={[Typography.h3, styles.sectionTitle]}>Attendance Reports</Text>

            {attendanceLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
            ) : (() => {
              const ROLES = ['All', 'Manager', 'Supervisor', 'Accountants', 'Drivers', 'North Indians'];
              const roleColors: Record<string, string> = {
                All: Colors.primary,
                Manager: '#7C3AED',
                Supervisor: '#0891B2',
                Accountants: '#059669',
                Drivers: '#D97706',
                'North Indians': '#DC2626',
              };

              // Filter by role (phone-based) — if no phones assigned yet, All shows all
              const rolePhones = ROLE_PHONES[attendanceRole] || [];
              const roleFiltered = attendanceRole === 'All'
                ? attendanceList
                : rolePhones.length > 0
                  ? attendanceList.filter(r => rolePhones.includes(r.phone))
                  : attendanceList; // show all if no mapping set
                  
              // Generate last 12 months dynamically for attendance
              const allAttMonths = Array.from({length: 12}, (_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                return `${year}-${month}`;
              });
              const selectedAttMonth = attendanceMonthFilter || (allAttMonths.length > 0 ? allAttMonths[0] : '');

              // Filter by selected month
              const monthFiltered = roleFiltered.filter(r => {
                let m = '';
                if (r.date) {
                  if (r.date.includes('-')) {
                    const parts = r.date.split('-');
                    if (parts[0].length === 4) m = `${parts[0]}-${parts[1]}`;
                    else if (parts[2] && parts[2].length === 4) m = `${parts[2]}-${parts[1]}`;
                    else m = r.date.slice(0, 7);
                  } else m = r.date.slice(0, 7);
                }
                return m === selectedAttMonth;
              });

              // Filter by selected date
              const dateFiltered = attendanceDateFilter
                ? monthFiltered.filter(r => r.date === attendanceDateFilter)
                : monthFiltered;

              const statusColor = (s: string) => s === 'present' ? Colors.success : s === 'absent' ? Colors.error : '#FF9800';
              const statusLabel = (s: string) => s === 'morning' ? 'Morning Shift' : s === 'afternoon' ? 'Afternoon Shift' : s.charAt(0).toUpperCase() + s.slice(1);

              // Monthly summary: group all monthFiltered records by date for calendar markers
              const dateMap: Record<string, {present: number; absent: number}> = {};
              monthFiltered.forEach(r => {
                if (!dateMap[r.date]) dateMap[r.date] = { present: 0, absent: 0 };
                if (r.status === 'absent') dateMap[r.date].absent++;
                else dateMap[r.date].present++;
              });

              // Calendar marked dates
              const markedDates: Record<string, any> = {};
              Object.entries(dateMap).forEach(([d, v]) => {
                markedDates[d] = {
                  marked: true,
                  dotColor: v.absent > v.present ? Colors.error : Colors.success,
                  selected: d === attendanceDateFilter,
                  selectedColor: roleColors[attendanceRole],
                };
              });
              if (attendanceDateFilter && !markedDates[attendanceDateFilter]) {
                markedDates[attendanceDateFilter] = { selected: true, selectedColor: roleColors[attendanceRole] };
              }

              // Group filtered records by date
              const grouped: Record<string, any[]> = {};
              dateFiltered.forEach(r => {
                if (!grouped[r.date]) grouped[r.date] = [];
                grouped[r.date].push(r);
              });
              const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

              // Monthly stats (all dates for this role)
              const totalPresent = Object.values(dateMap).reduce((s, v) => s + v.present, 0);
              const totalAbsent  = Object.values(dateMap).reduce((s, v) => s + v.absent, 0);

              return (
                <>
                  {/* Month Selection */}
                  <View style={{ marginBottom: 15 }}>
                    <Text style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 8, fontWeight: '600' }}>Select Month</Text>
                    <TouchableOpacity
                      onPress={() => setShowAttendanceMonthDropdown(true)}
                      style={{
                        paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
                        backgroundColor: Colors.surface,
                        borderWidth: 1, borderColor: Colors.border,
                        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
                      }}
                    >
                      <Text style={{ color: Colors.text, fontWeight: '600', fontSize: 14 }}>
                        {selectedAttMonth ? formatFuelMonth(selectedAttMonth) : 'Select a month'}
                      </Text>
                      <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Role Category Tabs */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                    {ROLES.map(role => {
                      const active = attendanceRole === role;
                      const col = roleColors[role];
                      return (
                        <TouchableOpacity
                          key={role}
                          onPress={() => { setAttendanceRole(role); setAttendanceDateFilter(''); setShowAttendanceCalendar(false); }}
                          style={{
                            paddingHorizontal: 16, paddingVertical: 9, borderRadius: 22, marginRight: 8,
                            backgroundColor: active ? col : col + '18',
                            borderWidth: 1.5, borderColor: col,
                          }}
                        >
                          <Text style={{ color: active ? Colors.white : col, fontWeight: '700', fontSize: 13 }}>{role}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Monthly Summary Stats */}
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                    <View style={{ flex: 1, backgroundColor: Colors.success + '18', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.success }}>
                      <Text style={{ color: Colors.success, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' }}>Total Present</Text>
                      <Text style={{ color: Colors.success, fontSize: 26, fontWeight: 'bold', marginTop: 2 }}>{totalPresent}</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: Colors.error + '18', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.error }}>
                      <Text style={{ color: Colors.error, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' }}>Total Absent</Text>
                      <Text style={{ color: Colors.error, fontSize: 26, fontWeight: 'bold', marginTop: 2 }}>{totalAbsent}</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: roleColors[attendanceRole] + '18', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: roleColors[attendanceRole] }}>
                      <Text style={{ color: roleColors[attendanceRole], fontSize: 11, fontWeight: '600', textTransform: 'uppercase' }}>Days Recorded</Text>
                      <Text style={{ color: roleColors[attendanceRole], fontSize: 26, fontWeight: 'bold', marginTop: 2 }}>{Object.keys(dateMap).length}</Text>
                    </View>
                  </View>

                  {/* Calendar Picker */}
                  <TouchableOpacity
                    onPress={() => setShowAttendanceCalendar(!showAttendanceCalendar)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      backgroundColor: Colors.surface, borderRadius: 12, padding: 14,
                      borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <CalendarDays size={20} color={roleColors[attendanceRole]} />
                      <Text style={{ fontWeight: '600', color: Colors.text, fontSize: 14 }}>
                        {attendanceDateFilter ? attendanceDateFilter : 'Select Date to Filter'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {attendanceDateFilter ? (
                        <TouchableOpacity
                          onPress={(e) => { e.stopPropagation?.(); setAttendanceDateFilter(''); setShowAttendanceCalendar(false); }}
                          style={{ backgroundColor: Colors.error + '22', borderRadius: 20, padding: 4 }}
                        >
                          <X size={16} color={Colors.error} />
                        </TouchableOpacity>
                      ) : null}
                      <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>{showAttendanceCalendar ? '▲' : '▼'}</Text>
                    </View>
                  </TouchableOpacity>

                  {showAttendanceCalendar && (
                    <View style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 14, elevation: 3, backgroundColor: Colors.white }}>
                      <Calendar
                        onDayPress={(day: any) => {
                          setAttendanceDateFilter(day.dateString);
                          setShowAttendanceCalendar(false);
                        }}
                        markedDates={markedDates}
                        theme={{
                          todayTextColor: roleColors[attendanceRole],
                          selectedDayBackgroundColor: roleColors[attendanceRole],
                          arrowColor: roleColors[attendanceRole],
                          dotColor: Colors.success,
                          textDayFontWeight: '500',
                          textMonthFontWeight: 'bold',
                        }}
                      />
                    </View>
                  )}

                  {/* Date-wise Records */}
                  {sortedDates.length === 0 ? (
                    <View style={styles.emptyAdminState}>
                      <Users size={48} color={Colors.border} />
                      <Text style={styles.emptyAdminText}>
                        {attendanceDateFilter ? `No records on ${attendanceDateFilter}` : 'No attendance records'}
                      </Text>
                    </View>
                  ) : sortedDates.map(date => {
                    const records = grouped[date];
                    const pCount = records.filter(r => r.status !== 'absent').length;
                    const aCount = records.filter(r => r.status === 'absent').length;
                    return (
                      <View key={date} style={{ marginBottom: 16 }}>
                        {/* Date header */}
                        <View style={{ backgroundColor: roleColors[attendanceRole], borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <Text style={{ color: Colors.white, fontWeight: 'bold', fontSize: 15 }}>{date}</Text>
                          <View style={{ flexDirection: 'row', gap: 14 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#A5F3A5' }} />
                              <Text style={{ color: '#A5F3A5', fontWeight: '700', fontSize: 13 }}>{pCount} Present</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FCA5A5' }} />
                              <Text style={{ color: '#FCA5A5', fontWeight: '700', fontSize: 13 }}>{aCount} Absent</Text>
                            </View>
                          </View>
                        </View>

                        {records.map((r: any) => (
                          <View
                            key={r.id}
                            style={{
                              backgroundColor: Colors.surface, borderRadius: 10, padding: 12,
                              marginBottom: 8, flexDirection: 'row', alignItems: 'center',
                              borderWidth: 1, borderColor: Colors.border,
                              borderLeftWidth: 4, borderLeftColor: statusColor(r.status),
                            }}
                          >
                            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: statusColor(r.status) + '22', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                              <Text style={{ fontSize: 17, fontWeight: 'bold', color: statusColor(r.status) }}>
                                {r.staff_name?.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontWeight: 'bold', fontSize: 14, color: Colors.text }}>{r.staff_name}</Text>
                              <Text style={{ color: Colors.textSecondary, fontSize: 12, marginTop: 2 }}>{r.phone}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end', gap: 4 }}>
                              <View style={{ backgroundColor: statusColor(r.status) + '22', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: statusColor(r.status) }}>
                                <Text style={{ color: statusColor(r.status), fontWeight: '700', fontSize: 12 }}>{statusLabel(r.status)}</Text>
                              </View>
                              {r.shift && <Text style={{ color: Colors.textSecondary, fontSize: 11 }}>{r.shift}</Text>}
                            </View>
                          </View>
                        ))}
                      </View>
                    );
                  })}

                  {/* Month Dropdown Modal for Attendance */}
                  <Modal visible={showAttendanceMonthDropdown} transparent animationType="slide">
                    <View style={styles.dropdownModalOverlay}>
                      <View style={styles.dropdownMenu}>
                        <View style={styles.dropdownHeader}>
                          <Text style={styles.dropdownTitle}>Select Month</Text>
                          <TouchableOpacity onPress={() => setShowAttendanceMonthDropdown(false)}>
                            <X size={20} color={Colors.text} />
                          </TouchableOpacity>
                        </View>
                        <ScrollView>
                          {allAttMonths.map((m) => (
                            <TouchableOpacity 
                              key={m}
                              style={styles.dropdownItem}
                              onPress={() => {
                                setAttendanceMonthFilter(m);
                                setAttendanceDateFilter('');
                                setShowAttendanceMonthDropdown(false);
                              }}
                            >
                              <Text style={[
                                styles.dropdownItemText,
                                attendanceMonthFilter === m && styles.dropdownItemActive
                              ]}>{formatFuelMonth(m)}</Text>
                              {attendanceMonthFilter === m && <CheckCircle2 size={16} color={Colors.primary} />}
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </View>
                  </Modal>
                </>
              );
            })()}
          </View>
        )}

        {/* ─── Fuel Tab ─── */}
        {activeTab === 'Fuel' && (
          <View style={styles.section}>
            <Text style={[Typography.h3, styles.sectionTitle]}>Fuel Reports & Payments</Text>

            {fuelLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
            ) : (() => {
              // Generate last 12 months dynamically
              const allMonths = Array.from({length: 12}, (_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                return `${year}-${month}`;
              });
              
              // Set default month if not selected
              const selectedMonth = fuelMonthFilter || (allMonths.length > 0 ? allMonths[0] : '');

              const filtered = fuelList.filter(r => {
                let m = '';
                if (r.date) {
                  if (r.date.includes('-')) {
                    const parts = r.date.split('-');
                    if (parts[0].length === 4) m = `${parts[0]}-${parts[1]}`;
                    else if (parts[2] && parts[2].length === 4) m = `${parts[2]}-${parts[1]}`;
                    else m = r.date.slice(0, 7);
                  } else m = r.date.slice(0, 7);
                }
                return m === selectedMonth;
              }).sort((a, b) => b.date.localeCompare(a.date));

              const totalAmount = filtered.reduce((s, r) => s + (r.amount || 0), 0);
              const totalLiters = filtered.reduce((s, r) => s + (r.liters || 0), 0);
              const paidAmount = fuelMonthPayments[selectedMonth] || 0;
              const balanceAmount = totalAmount - paidAmount;

              return (
                <>
                  {/* Month Selection */}
                  <View style={{ marginBottom: 15 }}>
                    <Text style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 8, fontWeight: '600' }}>Select Month</Text>
                    <TouchableOpacity
                      onPress={() => setShowFuelMonthDropdown(true)}
                      style={{
                        paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
                        backgroundColor: Colors.surface,
                        borderWidth: 1, borderColor: Colors.border,
                        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
                      }}
                    >
                      <Text style={{ color: Colors.text, fontWeight: '600', fontSize: 14 }}>
                        {selectedMonth ? formatFuelMonth(selectedMonth) : 'Select a month'}
                      </Text>
                      <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Summary cards */}
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                    <View style={{ width: '48%', backgroundColor: 'rgba(24,119,242,0.1)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.primary, marginBottom: 10 }}>
                      <Text style={{ color: Colors.primary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Spent</Text>
                      <Text style={{ color: Colors.primary, fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>₹{totalAmount.toLocaleString()}</Text>
                    </View>
                    <View style={{ width: '48%', backgroundColor: 'rgba(255,152,0,0.1)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#FF9800', marginBottom: 10 }}>
                      <Text style={{ color: '#FF9800', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Liters</Text>
                      <Text style={{ color: '#FF9800', fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>{totalLiters.toFixed(1)} L</Text>
                    </View>
                    <View style={{ width: '48%', backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#4CAF50' }}>
                      <Text style={{ color: '#4CAF50', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>Paid Amount</Text>
                      <Text style={{ color: '#4CAF50', fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>₹{paidAmount.toLocaleString()}</Text>
                    </View>
                    <View style={{ width: '48%', backgroundColor: 'rgba(244, 67, 54, 0.1)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#F44336' }}>
                      <Text style={{ color: '#F44336', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>Balance Due</Text>
                      <Text style={{ color: '#F44336', fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>₹{balanceAmount.toLocaleString()}</Text>
                    </View>
                  </View>

                  {selectedMonth ? (
                    <TouchableOpacity 
                      style={{ backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginBottom: 20 }}
                      onPress={() => {
                        setFuelMonthFilter(selectedMonth);
                        setShowFuelPaymentModal(true);
                      }}
                    >
                      <Text style={{ color: Colors.white, fontWeight: 'bold', fontSize: 14 }}>Add Payment for {formatFuelMonth(selectedMonth)}</Text>
                    </TouchableOpacity>
                  ) : null}

                  {/* Date filter for the selected month */}
                  <Text style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 8, fontWeight: '600' }}>Filter by Date</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                    <TouchableOpacity
                      onPress={() => setFuelDateFilter('')}
                      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: !fuelDateFilter ? Colors.primary : Colors.surface, borderWidth: 1, borderColor: Colors.primary }}
                    >
                      <Text style={{ color: !fuelDateFilter ? Colors.white : Colors.primary, fontWeight: '600', fontSize: 13 }}>All Dates</Text>
                    </TouchableOpacity>
                    {[...new Set(filtered.map(r => r.date))].sort((a, b) => b.localeCompare(a)).map(d => (
                      <TouchableOpacity
                        key={d}
                        onPress={() => setFuelDateFilter(d === fuelDateFilter ? '' : d)}
                        style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: fuelDateFilter === d ? Colors.primary : Colors.surface, borderWidth: 1, borderColor: Colors.primary }}
                      >
                        <Text style={{ color: fuelDateFilter === d ? Colors.white : Colors.primary, fontWeight: '600', fontSize: 13 }}>{d}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {filtered.filter(r => !fuelDateFilter || r.date === fuelDateFilter).length === 0 ? (
                    <View style={styles.emptyAdminState}>
                      <Truck size={48} color={Colors.border} />
                      <Text style={styles.emptyAdminText}>No fuel records found</Text>
                    </View>
                  ) : filtered.filter(r => !fuelDateFilter || r.date === fuelDateFilter).map((r: any) => (
                    <View key={r.id} style={{ backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, elevation: 1 }}>
                      {/* Header row */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={{ backgroundColor: 'rgba(255,152,0,0.15)', padding: 8, borderRadius: 10 }}>
                            <Truck size={18} color={'#FF9800'} />
                          </View>
                          <Text style={{ fontWeight: 'bold', fontSize: 15, color: Colors.text }}>{r.truckNo}</Text>
                        </View>
                        <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>{r.date}</Text>
                      </View>
                      {/* Details grid */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View>
                          <Text style={{ color: Colors.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 }}>Employee</Text>
                          <Text style={{ color: Colors.text, fontWeight: '600', fontSize: 14, marginTop: 2 }}>{r.employeeName}</Text>
                        </View>
                        <View style={{ alignItems: 'center' }}>
                          <Text style={{ color: Colors.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 }}>Liters</Text>
                          <Text style={{ color: '#FF9800', fontWeight: '700', fontSize: 14, marginTop: 2 }}>{Number(r.liters).toFixed(1)} L</Text>
                        </View>
                        <View style={{ alignItems: 'center' }}>
                          <Text style={{ color: Colors.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 }}>Rate</Text>
                          <Text style={{ color: Colors.text, fontWeight: '600', fontSize: 14, marginTop: 2 }}>₹{r.fuelPrice}/L</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ color: Colors.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 }}>Amount</Text>
                          <Text style={{ color: Colors.success, fontWeight: '700', fontSize: 16, marginTop: 2 }}>₹{Number(r.amount).toLocaleString()}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </>
              );
            })()}
          </View>
        )}

        {/* Month Dropdown Modal for Fuel */}
        <Modal visible={showFuelMonthDropdown} transparent animationType="slide">
          <View style={styles.dropdownModalOverlay}>
            <View style={styles.dropdownMenu}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownTitle}>Select Month</Text>
                <TouchableOpacity onPress={() => setShowFuelMonthDropdown(false)}>
                  <X size={20} color={Colors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {Array.from({length: 12}, (_, i) => {
                  const d = new Date();
                  d.setMonth(d.getMonth() - i);
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const year = d.getFullYear();
                  return `${year}-${month}`;
                }).map((m) => (
                  <TouchableOpacity 
                    key={m}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setFuelMonthFilter(m);
                      setFuelDateFilter(''); // Clear date filter when switching month
                      setShowFuelMonthDropdown(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      fuelMonthFilter === m && styles.dropdownItemActive
                    ]}>{formatFuelMonth(m)}</Text>
                    {fuelMonthFilter === m && <CheckCircle2 size={16} color={Colors.primary} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Payment Modal for Fuel */}
        <Modal visible={showFuelPaymentModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { height: '40%' }]}>    
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Payment for {formatFuelMonth(fuelMonthFilter)}</Text>
                <TouchableOpacity onPress={() => setShowFuelPaymentModal(false)}>
                  <X size={24} color={Colors.text} />
                </TouchableOpacity>
              </View>    
              <View style={{ padding: 20 }}>
                <Text style={styles.inputLabel}>Amount (₹)</Text>
                <TextInput placeholderTextColor={Colors.textSecondary}
                  style={[styles.adminInput, { backgroundColor: '#F9FAFB', fontSize: 18, fontWeight: 'bold' }]}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  value={fuelPaymentInput}
                  onChangeText={setFuelPaymentInput}
                />
                <TouchableOpacity 
                  style={[styles.primaryAction, { marginTop: 25, paddingVertical: 14, alignItems: 'center' }]}
                  onPress={handleAddFuelPayment}
                >
                  <Text style={[styles.primaryActionText, { fontSize: 16 }]}>Save Payment</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={{ height: 100 }} />
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
      paddingHorizontal: 24,
      paddingBottom: 20,
      backgroundColor: Colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 10,
      marginBottom: 10,
    },
  backBtn: {
    marginRight: 15,
    padding: 5,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
  },
  statCard: {
      backgroundColor: Colors.surface,
      width: (Dimensions.get('window').width - 50) / 2,
      padding: 18,
      borderRadius: 24,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.02)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 15,
      elevation: 5,
    },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statValue: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: Colors.text,
    marginBottom: 15,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  filterBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterBtnActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  filterBtnText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterBtnTextActive: {
    color: Colors.white,
  },
  tabBarContainer: {
    marginVertical: 10,
  },
  tabBarContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  tab: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: 'transparent',
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
  activeTab: {
      backgroundColor: Colors.primary,
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 8,
    },
  tabText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  activeTabText: {
    color: Colors.white,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addItemBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addItemBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  trendingImage: {
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  productCard: {
      backgroundColor: Colors.surface,
      padding: 18,
      borderRadius: 24,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.02)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 15,
      elevation: 4,
    },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  productStock: {
    color: Colors.text,
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  editBtn: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editBtnText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  productMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  stockValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  productActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteBtn: {
    marginLeft: 10,
    padding: 8,
    backgroundColor: 'rgba(211, 47, 47, 0.05)',
    borderRadius: 8,
  },
  orderCard: {
      backgroundColor: Colors.surface,
      borderRadius: 24,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.02)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.06,
      shadowRadius: 15,
      elevation: 5,
    },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderUser: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  orderPhone: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: 'bold',
    opacity: 0.8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  statusPending: {
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
  },
  statusReady: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  statusCompleted: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  orderItems: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 8,
  },
  itemText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  orderTotal: {
    color: Colors.text,
    fontWeight: 'bold',
  },
  orderTime: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  primaryAction: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  secondaryAction: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  actionBtnText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  primaryActionText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeCartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(255, 107, 0, 0.05)',
    padding: 12,
    borderRadius: 12,
  },
  activeCartCard: {
      backgroundColor: Colors.surface,
      borderRadius: 24,
      padding: 20,
      marginBottom: 30,
      borderWidth: 1,
      borderColor: Colors.accent,
      shadowColor: Colors.accent,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 8,
    },
  activeCartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  activeCartItemName: {
    color: Colors.text,
    fontSize: 14,
  },
  paymentSelector: {
    flexDirection: 'row',
    marginTop: 10,
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  payBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  payBtnActive: {
    backgroundColor: Colors.primary,
  },
  payBtnText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  payBtnTextActive: {
    color: Colors.white,
  },
  activeCartItemQty: {
    color: Colors.accent,
    fontWeight: 'bold',
  },
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      padding: 24,
    },
  modalContent: {
    backgroundColor: Colors.white,
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  receiptLogo: {
    width: 120,
    height: 40,
  },
  tokenLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  tokenValue: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primary,
  },
  billSection: {
    marginVertical: 10,
  },
  billRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  billLabel: {
    width: 100,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  billValue: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    fontWeight: 'bold',
  },
  receiptBranding: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginTop: 5,
  },
  receiptContainer: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  receiptBrand: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  receiptSub: {
    fontSize: 10,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  receiptInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  receiptLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  receiptValue: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 15,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderRadius: 1,
  },
  receiptTable: {
    marginVertical: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tableLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tableValue: {
    fontSize: 13,
    color: Colors.primary,
    flex: 1,
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  receiptTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  receiptTotalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.accent,
  },
  receiptFooter: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 30,
    fontStyle: 'italic',
  },
  printFinalBtn: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  printFinalText: {
    color: Colors.white,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  formGroup: {
    marginBottom: 15,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  inputLabel: {
    color: Colors.text,
    fontSize: 14,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  adminInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 15,
    color: Colors.black,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 16,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  eyeBtn: {
    padding: 12,
  },
  saveProductBtn: {
    backgroundColor: Colors.accent,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  saveProductText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  uploadBtn: {
    height: 120,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBtnText: {
    color: Colors.primary,
    fontWeight: 'bold',
    marginTop: 10,
  },
  imagePreviewContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.background,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changeImageBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  changeImageText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  dropdownField: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dropdownValue: {
    color: Colors.black,
    fontSize: 16,
  },
  dropdownArrow: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  dropdownMenu: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    padding: 20,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItemText: {
    fontSize: 16,
    color: Colors.text,
  },
  dropdownItemActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  priceEditContainer: {
      backgroundColor: Colors.white,
      borderRadius: 32,
      padding: 32,
      width: '90%',
      alignItems: 'center',
      elevation: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 15 },
      shadowOpacity: 0.15,
      shadowRadius: 30,
    },
  priceEditTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  priceEditSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 20,
    height: 60,
    marginBottom: 30,
    width: '100%',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginRight: 10,
  },
  priceInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  priceEditActions: {
    flexDirection: 'row',
    width: '100%',
  },
  cancelPriceBtn: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelPriceText: {
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  savePriceBtn: {
    flex: 1,
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savePriceText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  priceEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    width: '100%',
  },
  itemNameLabel: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemQtyLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  priceInputMiniWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    width: 100,
    height: 40,
    paddingHorizontal: 10,
  },
  currencySymbolMini: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
    marginRight: 4,
  },
  priceInputMini: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    padding: 0,
  },
  totalPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
    marginBottom: 20,
  },
  totalPreviewLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  totalPreviewValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  fullScreenModal: {
    backgroundColor: Colors.white,
    width: '100%',
    height: '100%',
  },
  bulkBadge: {
    backgroundColor: 'rgba(24, 119, 242, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  bulkBadgeText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginLeft: 8,
    fontWeight: '500',
  },
  emptyAdminState: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 10,
  },
  emptyAdminText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250, 56, 62, 0.1)',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(250, 56, 62, 0.2)',
  },
  logoutText: {
    color: Colors.error,
    marginLeft: 10,
    fontWeight: 'bold',
  },
  brandManageCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  brandInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandAddBtn: {
    backgroundColor: Colors.primary,
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandAddBtnText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  brandChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  brandChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  brandChipText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  mockReceiptContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    marginVertical: 10,
    overflow: 'hidden',
  },
  mockTearOff: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderStyle: 'dotted',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  mockReceiptContent: {
    padding: 20,
  },
  mockReceiptTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  mockReceiptTagline: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  mockReceiptDivider: {
    height: 1,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  mockReceiptDetails: {
    gap: 4,
  },
  mockReceiptDetailText: {
    fontSize: 12,
    color: '#444',
  },
  mockItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  mockItemName: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  mockItemQty: {
    fontSize: 13,
    color: '#333',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  mockTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  mockTotalLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  mockTotalVal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  mockTermsText: {
    fontSize: 11,
    color: '#777',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 10,
  },
  mockFooterBranding: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  toggleLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  switchTrack: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackActive: {
    backgroundColor: Colors.success,
  },
  switchTrackInactive: {
    backgroundColor: '#D1D1D6',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    transform: [{ translateX: 22 }],
  },
  switchThumbInactive: {
    transform: [{ translateX: 0 }],
  },
  colorPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchActive: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  sectionContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  sectionHeader: {
    marginVertical: 15,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addCategoryCard: {
      backgroundColor: '#fff',
      padding: 24,
      borderRadius: 24,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      marginBottom: 20,
    },
  inputGroup: {
    marginBottom: 15,
  },
  addCategoryBtn: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addCategoryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  roleChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  roleChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleChipText: {
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  roleChipTextActive: {
    color: Colors.white,
  },
  tabsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  tabContent: {
    flex: 1,
    padding: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  customerCard: {
      backgroundColor: '#fff',
      padding: 18,
      borderRadius: 20,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.02)',
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 3,
    },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  customerPhone: {
    color: '#666',
    marginTop: 4,
  },
  deleteBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: Colors.white,
  },
});

export default AdminDashboard;
