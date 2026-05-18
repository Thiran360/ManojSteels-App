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
} from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  Clock, 
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
  Eye,
  EyeOff
} from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { cartService } from '../services/CartService';
import { authService } from '../services/AuthService';

const AdminDashboard = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState('Orders');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [inventoryList, setInventoryList] = useState(cartService.getProducts());
  const [filter, setFilter] = useState('All');
  const [activeCart, setActiveCart] = useState(cartService.getCartItems());
  const [orderList, setOrderList] = useState(cartService.getOrders());
  const receiptRef = React.useRef<any>(null);
  const [bulkOrderList, setBulkOrderList] = useState(cartService.getBulkOrders());
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showTruckModal, setShowTruckModal] = useState(false);
  const [editingTruckOrder, setEditingTruckOrder] = useState<any>(null);
  const [tempTruckNo, setTempTruckNo] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [tempItems, setTempItems] = useState<any[]>([]);
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
  const [adminSettings, setAdminSettings] = useState(authService.getAdminCredentials());
  const [tempAdminMobile, setTempAdminMobile] = useState(authService.getAdminCredentials().mobile);
  const [tempAdminPassword, setTempAdminPassword] = useState(authService.getAdminCredentials().password);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Helper to bridge static products with backend inventory
  const syncStaticProducts = () => {
    const backendProducts = cartService.getProducts();
    // This could be used to update local state if needed
  };
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
    
    // Initial fetch
    cartService.apiFetchProducts();
    cartService.apiFetchQuotations().catch(err => console.log('Quotations fetch err:', err));
    cartService.apiFetchBulkOrders().catch(err => console.log('Bulk fetch err:', err));
    cartService.apiFetchEmployees().then(setEmployeeList).catch(err => console.log('Emp fetch err:', err));

    cartService.on('change', update);
    return () => cartService.off('change', update);
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
      <View style={styles.orderHeader}>
        <View>
          <View style={styles.bulkBadge}>
            <Text style={styles.bulkBadgeText}>BULK TOKEN</Text>
          </View>
          <Text style={styles.orderUser}>{item.name || 'Bulk Order User'}</Text>
          <Text style={styles.orderPhone}>{item.phone}</Text>
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
      
      <View style={styles.orderItems}>
        <View style={styles.detailRow}>
          <Package size={14} color={Colors.textSecondary} />
          <Text style={styles.detailText}>{item.bags} Bags</Text>
        </View>
        <View style={styles.detailRow}>
          <MapPin size={14} color={Colors.textSecondary} />
          <Text style={styles.detailText} numberOfLines={1}>{item.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Truck size={14} color={Colors.primary} />
          <Text style={[styles.detailText, { color: Colors.primary, fontWeight: 'bold' }]}>
            Truck: {item.truckNo || 'Not Assigned'}
          </Text>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.secondaryAction}
          onPress={() => {
            setEditingTruckOrder(item);
            setTempTruckNo(item.truckNo || '');
            setShowTruckModal(true);
          }}
        >
          <Text style={styles.actionBtnText}>Assign Truck</Text>
        </TouchableOpacity>
        
        {item.status === 'In Queue' && (
          <TouchableOpacity 
            style={styles.primaryAction}
            onPress={() => cartService.updateBulkOrder(item.id, { status: 'Dispatched' })}
          >
            <Text style={styles.primaryActionText}>Dispatch</Text>
          </TouchableOpacity>
        )}
        
        {item.status === 'Dispatched' && (
          <TouchableOpacity 
            style={[styles.primaryAction, { backgroundColor: Colors.success }]}
            onPress={() => cartService.updateBulkOrder(item.id, { status: 'Delivered' })}
          >
            <Text style={styles.primaryActionText}>Mark Delivered</Text>
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
                  onPress: () => cartService.deleteOrder(item.id)
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
            } catch (e) {
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

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.category) {
      Alert.alert('Error', 'Please fill in the Product Name and Category');
      return;
    }
    
    setLoading(true);
    try {
      const product = {
        id: `PROD-${Date.now()}`,
        name: newProduct.name,
        brand: newProduct.brand || 'Manoj Steels',
        image: newProduct.image || 'https://via.placeholder.com/150',
        price: parseFloat(newProduct.price) || 0,
        qty: parseInt(newProduct.qty) || 0,
        category: newProduct.category
      };
      
      // Call API
      const result = await cartService.apiAddProduct(product);
      
      // Refresh list from server to get correct IDs etc.
      await cartService.apiFetchProducts();
      
      setShowAddProduct(false);
      setNewProduct({ name: '', brand: '', price: '', qty: '', image: '', category: 'Cement' });
      Alert.alert('Success', 'Product added successfully!');
    } catch (e: any) {
      console.error('Add Product Error:', e);
      Alert.alert('Network Error', 'Failed to connect to the server. Please check if your API is running and try again.');
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
              .logo { font-size: 28px; font-weight: bold; color: ${Colors.primary}; }
              .order-info { margin-bottom: 30px; border-bottom: 1px dashed #ccc; padding-bottom: 15px; }
              .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
              .label { font-weight: bold; color: #666; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th { border-bottom: 2px solid ${Colors.primary}; text-align: left; padding: 10px; }
              td { padding: 10px; border-bottom: 1px solid #eee; }
              .total-row { margin-top: 20px; text-align: right; font-size: 20px; font-weight: bold; }
              .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; }
              .branding { color: ${Colors.primary}; font-weight: bold; margin-top: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">MANOJ STEELS</div>
              <div style="font-size: 12px; color: #666;">B2B Building Materials Platform</div>
            </div>

            <div class="order-info">
              <div class="info-row">
                <span><span class="label">Bill No:</span> ${selectedOrder.id}</span>
                <span><span class="label">Date:</span> ${new Date().toLocaleDateString()}</span>
              </div>
              <div class="info-row">
                <span><span class="label">Customer:</span> ${selectedOrder.name || selectedOrder.user || 'Manoj Steels User'}</span>
                <span><span class="label">Phone:</span> ${selectedOrder.phone || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span><span class="label">Payment:</span> ${selectedOrder.paymentMethod || 'CASH'}</span>
                <span><span class="label">Employee:</span> ${selectedEmployee?.name || selectedOrder.employeeName || 'Admin'}</span>
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
              <p>Terms: Goods once sold cannot be returned.</p>
              <div class="branding">~ Manoj Steels ~</div>
            </div>
          </body>
        </html>
      `;

      const options = {
        html: htmlContent,
        fileName: `Receipt_${selectedOrder.id}`,
        directory: 'Documents',
      };

      const file = await generatePDF(options);
      
      if (file.filePath) {
        await Share.open({
          url: `file://${file.filePath}`,
          type: 'application/pdf',
          title: 'View Receipt',
        });
      }
    } catch (error) {
      console.error('PDF Generation Error:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
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
      });

      await Share.open({
        url: uri,
        type: 'image/png',
        title: 'Share Bill',
        message: `Manoj Steels Bill - ${selectedOrder.id}`,
      });
    } catch (error) {
      console.error('Image Capture Error:', error);
      Alert.alert('Error', 'Failed to generate bill image.');
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

      <View style={styles.tabBar}>
        {['Orders', 'Bulk Orders', 'Inventory', 'Settings'].map((t) => (
          <TouchableOpacity 
            key={t} 
            onPress={() => setActiveTab(t)}
            style={[styles.tab, activeTab === t && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === t && styles.activeTabText]}>{t}</Text>
          </TouchableOpacity>
        ))}
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
                    <TextInput
                      style={styles.priceInputMini}
                      value={item.price.toString()}
                      onChangeText={(val) => {
                        const newItems = [...tempItems];
                        newItems[idx].price = parseFloat(val) || 0;
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
                ₹{tempItems.reduce((acc, i) => acc + ((i.price || 0) * (i.qty || 1)), 0).toLocaleString()}
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
                    // Manual Update: Update the local order list instead of calling the API
                    const updatedOrders = orderList.map(order => {
                      if (order.id === editingOrderId) {
                        return {
                          ...order,
                          status: 'PRICE_FIXED',
                          items: tempItems,
                          total: tempItems.reduce((acc: number, i: any) => acc + ((i.price || 0) * (i.qty || 1)), 0)
                        };
                      }
                      return order;
                    });
                    
                    setOrderList(updatedOrders);
                    setIsEditingPrice(false);
                    Alert.alert('Success', 'Prices fixed manually.');
                  } catch (e: any) {
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
                <View style={styles.receiptHeader}>
                  <Image 
                    source={require('../assets/logo.png')} 
                    style={styles.receiptLogo}
                    resizeMode="contain"
                  />
                  <View style={{ flex: 1 }} />
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
                    <Text style={styles.billValue}>{selectedOrder?.date || new Date().toLocaleDateString()} | {selectedOrder?.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
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
                                selectedEmployee?.id === emp.id ? { backgroundColor: Colors.primary, borderColor: Colors.primary } : { borderColor: Colors.border }
                              ]}
                            >
                              <Text style={{ fontSize: 10, color: selectedEmployee?.id === emp.id ? Colors.white : Colors.textSecondary }}>{emp.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      ) : (
                        <Text style={styles.billValue}>{selectedOrder?.employeeName || authService.getCurrentUser()?.username || 'Admin (Manoj)'}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Payment:</Text>
                    <Text style={[styles.billValue, { color: Colors.primary, textTransform: 'uppercase' }]}>{selectedOrder?.paymentMethod || 'CASH'}</Text>
                  </View>
                </View>

                <View style={styles.receiptDivider} />

                <View style={styles.receiptTable}>
                  <View style={styles.tableHeader}>
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
                  <Text style={styles.receiptTotalValue}>₹{(selectedOrder?.total || 0).toLocaleString()}</Text>
                </View>

                <Text style={styles.receiptFooter}>Terms: Goods once sold cannot be returned.</Text>
                <Text style={styles.receiptBranding}>~ Manoj Steels ~</Text>
              </ViewShot>

              <View style={[styles.receiptDivider, { marginHorizontal: 20 }]} />

              <View style={{ paddingHorizontal: 20 }}>
                <TouchableOpacity 
                  style={[styles.printFinalBtn, { backgroundColor: Colors.success, marginBottom: 15 }]}
                  onPress={handleDownloadImage}
                >
                  <ShoppingBag size={20} color={Colors.white} />
                  <Text style={styles.printFinalText}>Download Bill (Image)</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.printFinalBtn, { backgroundColor: Colors.accent, marginBottom: 15 }]}
                  onPress={handleDownloadPDF}
                >
                  <FileText size={20} color={Colors.white} />
                  <Text style={styles.printFinalText}>Download PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.printFinalBtn}
                  onPress={() => {
                    Alert.alert('Success', 'Sending to Bluetooth Printer...');
                    setShowReceipt(false);
                  }}
                >
                  <Printer size={20} color={Colors.white} />
                  <Text style={styles.printFinalText}>Print Invoice</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Truck Assignment Modal */}
      <Modal visible={showTruckModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.priceEditContainer}>
            <Text style={styles.priceEditTitle}>Assign Truck Number</Text>
            <Text style={styles.priceEditSubtitle}>Order: {editingTruckOrder?.id}</Text>
            
            <View style={styles.priceInputMiniWrapper}>
              <Truck size={20} color={Colors.primary} style={{ marginRight: 10 }} />
              <TextInput
                style={[styles.priceInputMini, { fontSize: 18, width: 200 }]}
                value={tempTruckNo}
                onChangeText={(t) => setTempTruckNo(t.toUpperCase())}
                placeholder="e.g. TN 01 AB 1234"
                autoCapitalize="characters"
              />
            </View>

            <View style={[styles.priceEditActions, { marginTop: 30 }]}>
              <TouchableOpacity 
                style={styles.cancelPriceBtn}
                onPress={() => setShowTruckModal(false)}
              >
                <Text style={styles.cancelPriceText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.savePriceBtn}
                onPress={() => {
                  cartService.updateBulkOrder(editingTruckOrder.id, { truckNo: tempTruckNo });
                  setShowTruckModal(false);
                  Alert.alert('Success', 'Truck number updated.');
                }}
              >
                <Text style={styles.savePriceText}>Save Truck No</Text>
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
              <View style={styles.filterRow}>
                {['All', 'Pending', 'Completed', 'Today'].map((f) => (
                  <TouchableOpacity 
                    key={f} 
                    onPress={() => setFilter(f)}
                    style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                  >
                    <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
                      {f === 'All' ? 'Recent' : f}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <FlatList
                data={orderList.filter(o => {
                  if (filter === 'All') return true;
                  if (filter === 'Pending') return o.status === 'Pending' || o.status === 'PRICE_FIXED';
                  if (filter === 'Completed') return o.status === 'Completed' || o.status === 'Delivered';
                  
                  const today = new Date().toLocaleDateString();
                  if (filter === 'Today') return o.date === today;
                  
                  if (filter === 'Last Week') {
                    const lastWeek = Date.now() - 7 * 24 * 60 * 60 * 1000;
                    return o.createdAt && o.createdAt >= lastWeek;
                  }
                  
                  return true;
                })}
                renderItem={renderOrder}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>
          </>
        ) : activeTab === 'Bulk Orders' ? (
          <View style={styles.section}>
            <Text style={[Typography.h3, styles.sectionTitle]}>Bulk Order Management</Text>
            
            <View style={styles.brandManageCard}>
              <Text style={[styles.inputLabel, { marginBottom: 10 }]}>Manage Selectable Brands</Text>
              <View style={styles.brandInputRow}>
                <TextInput 
                  style={[styles.adminInput, { flex: 1, marginRight: 10 }]}
                  placeholder="New Brand (e.g. Dalmia Cement)"
                  value={newBrandName}
                  onChangeText={setNewBrandName}
                />
                <TouchableOpacity 
                  style={styles.brandAddBtn}
                  onPress={() => {
                    if (newBrandName.trim()) {
                      cartService.addBrand(newBrandName.trim());
                      setNewBrandName('');
                    }
                  }}
                >
                  <Text style={styles.brandAddBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.brandChipContainer}>
                {brandList.map((brand) => (
                  <View key={brand} style={styles.brandChip}>
                    <Text style={styles.brandChipText}>{brand}</Text>
                    <TouchableOpacity onPress={() => cartService.removeBrand(brand)}>
                      <X size={14} color={Colors.error} style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {bulkOrderList.length === 0 ? (
              <View style={styles.emptyAdminState}>
                <Truck size={48} color={Colors.border} />
                <Text style={styles.emptyAdminText}>No bulk orders yet</Text>
              </View>
            ) : (
              <FlatList
                data={bulkOrderList}
                renderItem={renderBulkOrder}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}
          </View>
        ) : activeTab === 'Settings' ? (
          <View style={styles.section}>
            <Text style={[Typography.h3, styles.sectionTitle]}>Admin Account Settings</Text>
            
            <View style={styles.brandManageCard}>
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Admin Mobile Number</Text>
                <TextInput 
                  style={styles.adminInput}
                  value={tempAdminMobile}
                  onChangeText={setTempAdminMobile}
                  keyboardType="numeric"
                  placeholder="Enter new admin mobile"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Admin Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput 
                    style={[styles.adminInput, { flex: 1, borderBottomWidth: 0 }]}
                    value={tempAdminPassword}
                    onChangeText={setTempAdminPassword}
                    secureTextEntry={!showAdminPassword}
                    placeholder="Enter new admin password"
                  />
                  <TouchableOpacity 
                    onPress={() => setShowAdminPassword(!showAdminPassword)}
                    style={styles.eyeBtn}
                  >
                    {showAdminPassword ? <EyeOff size={20} color={Colors.textSecondary} /> : <Eye size={20} color={Colors.textSecondary} />}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.saveProductBtn, { marginTop: 10 }]}
                onPress={async () => {
                  const success = await authService.updateAdminCredentials(tempAdminMobile, tempAdminPassword);
                  if (success) {
                    Alert.alert('Success', 'Admin credentials updated successfully.');
                  } else {
                    Alert.alert('Error', 'Failed to update credentials.');
                  }
                }}
              >
                <Text style={styles.saveProductText}>Update Credentials</Text>
              </TouchableOpacity>
            </View>

              <TouchableOpacity 
                style={[styles.logoutBtn, { marginTop: 20, backgroundColor: 'rgba(250, 56, 62, 0.05)' }]}
                onPress={() => {
                  Alert.alert(
                    'Clear All Products',
                    'This will permanently delete ALL products in the New Arrivals/Others section. This cannot be undone. Continue?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Clear All', 
                        style: 'destructive',
                        onPress: () => {
                          cartService.clearProducts();
                          Alert.alert('Success', 'Inventory cleared.');
                        }
                      }
                    ]
                  );
                }}
              >
                <Trash2 size={22} color={Colors.error} />
                <Text style={styles.logoutText}>Clear All Products</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.logoutBtn, { marginTop: 20 }]}
                onPress={() => {
                  authService.logout();
                  navigation.replace('Login');
                }}
              >
                <LogOut size={22} color={Colors.error} />
                <Text style={styles.logoutText}>Logout from Admin Panel</Text>
              </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.section}>
             <View style={styles.sectionHeaderRow}>
                <Text style={[Typography.h3, styles.sectionTitle]}>Inventory Management</Text>
                <TouchableOpacity 
                  style={styles.addItemBtn}
                  onPress={() => {
                    console.log('Opening Add Product Modal');
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
                     <Text style={[styles.receiptBrand, { color: Colors.white }]}>Add New Product</Text>
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
                       {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveProductText}>Save Product</Text>}
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
        )}
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
    paddingTop: 45,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
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
    padding: 15,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: 2,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    color: Colors.textSecondary,
    fontWeight: '600',
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
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: Colors.accent,
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
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
    borderRadius: 20,
    padding: 24,
    width: '85%',
    alignItems: 'center',
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
});

export default AdminDashboard;
