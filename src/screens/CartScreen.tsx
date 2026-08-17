import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ChevronLeft,
  Phone,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Building2,
  UserPlus,
  Search,
  X,
  Check,
  PlusCircle,
  Banknote,
  Receipt,
  LayoutGrid,
  Box,
  AlignJustify,
  Package,
} from 'lucide-react-native';
import { cartService } from '../services/CartService';


interface CartItem {
  id: string;
  originalId: string;
  name: string;
  brand: string;
  price: number;
  qty: number;
  image: any;
  partyName: string;
  partyPhone: string;
  category?: string;
}

interface Party {
  name: string;
  phone: string;
  isCashSale?: boolean;
}

const getProductUnit = (category?: string) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('cement')) return 'Bags';
  if (cat.includes('tmt')) return 'pcs';
  if (cat.includes('slab') || cat.includes('slap') || cat.includes('kadapa')) return 'Slabs';
  return 'units';
};

const matchesCategory = (productCat?: string, selected?: string) => {
  if (!selected || selected === 'All') return true;
  const pCat = (productCat || '').toLowerCase();
  const isCement = pCat.includes('cement');
  const isTMT = pCat.includes('tmt');
  const isKadapa = pCat.includes('slab') || pCat.includes('slap') || pCat.includes('kadapa');
  
  if (selected === 'Cement') return isCement;
  if (selected === 'TMT Bars') return isTMT;
  if (selected === 'Kadapa Slabs') return isKadapa;
  if (selected === 'Others') return !isCement && !isTMT && !isKadapa;
  return false;
};

const { width } = Dimensions.get('window');

// Cash Sales color constants
const CASH_GREEN = '#00A86B';
const CASH_GREEN_LIGHT = 'rgba(0, 168, 107, 0.08)';
const CASH_GREEN_BORDER = 'rgba(0, 168, 107, 0.25)';

const CartScreenView = ({ navigation }: any) => {
  const [items, setItems] = useState<CartItem[]>(() => cartService.getCartItems());
  const [parties, setParties] = useState<Party[]>(() => cartService.getParties());
  const [refreshing, setRefreshing] = useState(false);
  const [expandedPartyKey, setExpandedPartyKey] = useState<string | null>(null);

  // Modals visibility
  const [addPartyModalVisible, setAddPartyModalVisible] = useState(false);
  const [addProductModalVisible, setAddProductModalVisible] = useState(false);

  // Party search
  const [partySearchQuery, setPartySearchQuery] = useState('');
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);

  // Add party state
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyPhone, setNewPartyPhone] = useState('');
  const [walkinCustomers, setWalkinCustomers] = useState<any[]>([]);

  // Add product state
  const [selectedPartyForAdd, setSelectedPartyForAdd] = useState<Party | null>(null);
  const [allProducts, setAllProducts] = useState<any[]>(() => cartService.getProducts());
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [productQuantities, setProductQuantities] = useState<{ [key: string]: number }>({});
  const [selectorSizeSelections, setSelectorSizeSelections] = useState<{ [prodId: string]: { [size: string]: { pieces: number, weight: number } } }>({});
  const [activeProductIdForPicker, setActiveProductIdForPicker] = useState<string | null>(null);
  const [sizePickerModalVisible, setSizePickerModalVisible] = useState(false);

  // Cash Sales state
  const [cashSectionExpanded, setCashSectionExpanded] = useState(false);
  const [expandedCashKey, setExpandedCashKey] = useState<string | null>(null);
  const [cashCustomerModalVisible, setCashCustomerModalVisible] = useState(false);
  const [cashCustomerName, setCashCustomerName] = useState('');
  const [cashCustomerPhone, setCashCustomerPhone] = useState('');
  
  const [brandList, setBrandList] = useState<any[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('All');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cartService.globalRefresh();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const update = () => {
      setItems([...cartService.getCartItems()]);
      setParties([...cartService.getParties()]);
      setAllProducts([...cartService.getProducts()]);
    };
    cartService.on('change', update);

    const fetchCartEndpoint = async () => {
      try {
        await fetch('https://api.codingboss.in/inventory/cart/');
        await cartService.apiFetchWalkinCustomers();
      } catch (error) {
        console.log('Error fetching endpoints:', error);
      }
      try {
        const res = await fetch('https://api.codingboss.in/inventory/brands/', {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        if (res.ok) {
          const data = await res.json();
           setBrandList([{ id: 'all', name: 'All' }, ...data]);
        }
      } catch (err) {
        console.log('Error fetching brands', err);
      }
    };
    fetchCartEndpoint();

    return () => {
      cartService.off('change', update);
    };
  }, []);

  // Sync products list in real-time when modal opens
  useEffect(() => {
    if (addProductModalVisible) {
      setAllProducts([...cartService.getProducts()]);
    }
  }, [addProductModalVisible]);

  // Fetch walk-in customers when Add Party or Cash Sales modals open
  useEffect(() => {
    if (addPartyModalVisible || cashCustomerModalVisible) {
      const fetchWalkins = async () => {
        try {
          const res = await fetch('https://api.codingboss.in/inventory/walkin-customers/', { headers: { 'ngrok-skip-browser-warning': 'true' }});
          if (res.ok) {
            const data = await res.json();
            setWalkinCustomers(Array.isArray(data) ? data : []);
          }
        } catch (e) {
          console.warn('Failed to fetch walk-in customers:', e);
        }
      };
      fetchWalkins();
    }
  }, [addPartyModalVisible, cashCustomerModalVisible]);

  const deleteWalkinCustomer = async (id: number) => {
    Alert.alert(
      'Delete Customer',
      'Are you sure you want to permanently delete this walk-in customer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch('https://api.codingboss.in/inventory/delete-customer/', {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ id })
              });
              if (response.ok) {
                setWalkinCustomers(prev => prev.filter(c => c.id !== id));
              }
            } catch (e) {
              console.warn('Failed to delete customer:', e);
            }
          }
        }
      ]
    );
  };

  // Grouped items helper
  const getItemsForParty = useCallback((partyName: string, partyPhone: string): CartItem[] => {
    return items.filter(
      (item) =>
        (item.partyName || 'Unknown Party') === partyName &&
        (item.partyPhone || '') === partyPhone
    );
  }, [items]);

  // Separate cash vs regular parties
  const cashParties = parties.filter(p => p.isCashSale === true);
  const regularParties = parties.filter(p => !p.isCashSale);

  // Auto-expand if exactly one regular party exists
  useEffect(() => {
    if (regularParties.length === 1 && expandedPartyKey === null) {
      const key = `${regularParties[0].name}-${regularParties[0].phone}`;
      setExpandedPartyKey(key);
    }
  }, [regularParties.length, expandedPartyKey]);

  const toggleExpand = (key: string) => {
    setExpandedPartyKey((prev) => (prev === key ? null : key));
  };

  const updateQty = (id: string, delta: number) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      cartService.updateQty(id, Math.max(1, item.qty + delta));
    }
  };

  const removeItem = (id: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this product from the cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => cartService.removeItem(id),
        },
      ]
    );
  };

  const handleCheckoutForParty = (partyName: string, partyPhone: string) => {
    navigation.navigate('Checkout', {
      customerName: partyName,
      customerPhone: partyPhone,
    });
  };

  const handleDeleteParty = (partyName: string, partyPhone: string) => {
    Alert.alert(
      'Delete Party',
      `Are you sure you want to delete "${partyName}" and all of their items?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            cartService.clearCartForParty(partyName, partyPhone);
            const key = `${partyName}-${partyPhone}`;
            if (expandedPartyKey === key) {
              setExpandedPartyKey(null);
            }
            if (expandedCashKey === key) {
              setExpandedCashKey(null);
            }

            try {
              const res = await fetch('https://api.codingboss.in/inventory/walkin-customers/', {
                headers: { 'ngrok-skip-browser-warning': 'true' }
              });
              const customers = await res.json();
              const match = customers.find((c: any) => 
                (c.name === partyName || c.customer_name === partyName) && 
                (c.phone === partyPhone || c.customer_phone === partyPhone)
              );
              if (match && match.id) {
                await fetch('https://api.codingboss.in/inventory/delete-customer/', {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                  },
                  body: JSON.stringify({ id: match.id })
                });
                setWalkinCustomers(prev => prev.filter(c => c.id !== match.id));
              }
            } catch (e) {
              console.warn('Failed to delete from backend:', e);
            }
          },
        },
      ]
    );
  };

  const handleSaveParty = async () => {
    if (!newPartyName.trim()) {
      Alert.alert('Required Field', 'Please enter a Party Name.');
      return;
    }
    if (!newPartyPhone.trim()) {
      Alert.alert('Required Field', 'Please enter a Contact Number.');
      return;
    }
    if (newPartyPhone.trim().length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit Contact Number.');
      return;
    }

    try {
      await fetch('https://api.codingboss.in/inventory/walkin-customers/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          customer_name: newPartyName.trim(),
          customer_phone: newPartyPhone.trim(),
          name: newPartyName.trim(),
          phone: newPartyPhone.trim()
        })
      });
    } catch (error) {
      console.log('Error notifying party customers endpoint', error);
    }

    await cartService.addCustomParty({
      name: newPartyName.trim(),
      phone: newPartyPhone.trim(),
    });

    const key = `${newPartyName.trim()}-${newPartyPhone.trim()}`;
    setExpandedPartyKey(key);

    setNewPartyName('');
    setNewPartyPhone('');
    setAddPartyModalVisible(false);
  };

  const handleAddCashSale = () => {
    setCashCustomerName('');
    setCashCustomerPhone('');
    setCashCustomerModalVisible(true);
  };

  const handleSaveCashCustomer = async () => {
    if (!cashCustomerName.trim()) {
      Alert.alert('Required', 'Please enter a customer name.');
      return;
    }
    if (!cashCustomerPhone.trim() || cashCustomerPhone.trim().length < 10) {
      Alert.alert('Required', 'Please enter a valid 10-digit phone number.');
      return;
    }

    const cashName = cashCustomerName.trim();
    const cashPhone = cashCustomerPhone.trim();

    try {
      await fetch('https://api.codingboss.in/inventory/walkin-customers/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          name: cashName,
          phone: cashPhone
        })
      });
    } catch (error) {
      console.log('Error saving walk-in customer to API:', error);
    }

    await cartService.addCustomParty({
      name: cashName,
      phone: cashPhone,
      isCashSale: true,
    } as any);

    const key = `${cashName}-${cashPhone}`;
    setCashSectionExpanded(true);
    setExpandedCashKey(key);
    setCashCustomerModalVisible(false);
    setCashCustomerName('');
    setCashCustomerPhone('');

    // Immediately open product selector for the new cash customer
    const newParty: Party = { name: cashName, phone: cashPhone, isCashSale: true };
    openAddProductsForParty(newParty);
  };

  const openAddProductsForParty = (party: Party) => {
    setSelectedPartyForAdd(party);
    // Reset product selection states
    setProductSearchQuery('');
    setSelectedCategory('All');
    setProductQuantities({});
    setSelectorSizeSelections({});
    setActiveProductIdForPicker(null);
    setSizePickerModalVisible(false);
    setAddProductModalVisible(true);
  };

  const handleAdjustModalProductQty = (productId: string, delta: number) => {
    setProductQuantities((prev) => {
      const current = prev[productId] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const handleSelectSizeForProduct = (size: string) => {
    if (!activeProductIdForPicker) return;
    setSelectorSizeSelections(prev => {
      const currentProdSelections = prev[activeProductIdForPicker] || {};
      if (!currentProdSelections[size]) {
        return {
          ...prev,
          [activeProductIdForPicker]: {
            ...currentProdSelections,
            [size]: { pieces: 1, weight: 0 }
          }
        };
      }
      return prev;
    });
    setSizePickerModalVisible(false);
  };

  const handleAdjustSelectorSizeQty = (productId: string, size: string, delta: number) => {
    setSelectorSizeSelections(prev => {
      const currentProdSelections = prev[productId] || {};
      const currentSelection = currentProdSelections[size] || { pieces: 0, weight: 0 };
      const nextPieces = Math.max(0, currentSelection.pieces + delta);
      
      const newProdSelections = { ...currentProdSelections };
      if (nextPieces <= 0 && delta < 0 && currentSelection.pieces <= 1) {
        // Only delete if specifically removing
        delete newProdSelections[size];
      } else {
        newProdSelections[size] = { ...currentSelection, pieces: nextPieces };
      }
      
      const nextSelections = { ...prev };
      if (Object.keys(newProdSelections).length === 0) {
        delete nextSelections[productId];
      } else {
        nextSelections[productId] = newProdSelections;
      }
      return nextSelections;
    });
  };

  const handleSetSelectorSizeQty = (productId: string, size: string, qtyText: string) => {
    setSelectorSizeSelections(prev => {
      const currentProdSelections = prev[productId] || {};
      const currentSelection = currentProdSelections[size] || { pieces: 0, weight: 0 };
      const nextPieces = parseInt(qtyText) || 0;
      
      const newProdSelections = { ...currentProdSelections };
      newProdSelections[size] = { ...currentSelection, pieces: nextPieces };
      
      const nextSelections = { ...prev };
      nextSelections[productId] = newProdSelections;
      return nextSelections;
    });
  };

  const handleSetSelectorSizeWeight = (productId: string, size: string, weightText: string) => {
    setSelectorSizeSelections(prev => {
      const currentProdSelections = prev[productId] || {};
      const currentSelection = currentProdSelections[size] || { pieces: 0, weight: 0 };
      const nextWeight = parseInt(weightText) || 0;
      
      const newProdSelections = { ...currentProdSelections };
      newProdSelections[size] = { ...currentSelection, weight: nextWeight };
      
      const nextSelections = { ...prev };
      nextSelections[productId] = newProdSelections;
      return nextSelections;
    });
  };

  const handleAddTMTProductsToParty = async (product: any) => {
    if (!selectedPartyForAdd) return;
    const selections = selectorSizeSelections[product.id];
    if (!selections || Object.keys(selections).length === 0) return;

    for (const [size, selection] of Object.entries(selections)) {
      if (selection.pieces <= 0) continue;
      const weightStr = selection.weight > 0 ? ` [${selection.weight}kg]` : '';
      const itemWithSize = {
        ...product,
        id: `${product.id}-${size}`,
        name: `${product.name} (${size}MM)${weightStr}`,
        category: 'TMT Bars',
        size: size,
        weight: selection.weight
      };
      await cartService.addItemForParty(
        itemWithSize,
        selection.pieces,
        selectedPartyForAdd.name,
        selectedPartyForAdd.phone
      );
    }

    setSelectorSizeSelections(prev => {
      const next = { ...prev };
      delete next[product.id];
      return next;
    });

    Alert.alert(
      'Products Added',
      `Selected TMT sizes added to ${selectedPartyForAdd.name}.`,
      [{ text: 'OK' }]
    );
  };

  const handleAddProductToParty = async (product: any) => {
    if (!selectedPartyForAdd) return;

    const qtyToAdd = productQuantities[product.id] || 1;

    await cartService.addItemForParty(
      product,
      qtyToAdd,
      selectedPartyForAdd.name,
      selectedPartyForAdd.phone
    );

    // Reset quantities state for this product
    setProductQuantities((prev) => ({ ...prev, [product.id]: 1 }));

    // Show high-quality feedback
    Alert.alert(
      'Product Added',
      `${qtyToAdd} unit(s) of ${product.name} added to ${selectedPartyForAdd.name}.`,
      [{ text: 'OK' }]
    );
  };


  const getPartyTotalQty = (partyItems: CartItem[]) => {
    return partyItems.reduce((sum, i) => sum + i.qty, 0);
  };

  const renderProductItem = (item: CartItem) => (
    <View key={item.id} style={styles.cartItem}>
      <Image
        source={typeof item.image === 'number' ? item.image : { uri: item.image }}
        style={styles.itemImage}
      />
      <View style={styles.itemDetails}>
        <View style={styles.itemHeader}>
          <Text style={[Typography.bodyMedium, styles.itemName]} numberOfLines={1}>
            {item.name}
          </Text>
          <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
            <Trash2 size={16} color={Colors.error} />
          </TouchableOpacity>
        </View>
        <Text style={[Typography.bodySmall, styles.itemBrand]}>{item.brand}</Text>
        <View style={[styles.itemFooter, { justifyContent: 'flex-end' }]}>
          <View style={styles.qtyContainer}>
            <TouchableOpacity onPress={() => updateQty(item.id, -1)} style={styles.qtyBtn}>
              <Minus size={14} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.qty} {getProductUnit(item.category)}</Text>
            <TouchableOpacity onPress={() => updateQty(item.id, 1)} style={styles.qtyBtn}>
              <Plus size={14} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderPartyCard = ({ item, index }: { item: Party, index?: number }) => {
    const key = `${item.name}-${item.phone}`;
    const isExpanded = expandedPartyKey === key;
    const partyItems = getItemsForParty(item.name, item.phone);
    const totalQty = getPartyTotalQty(partyItems);

    return (
      <View style={styles.partyCard}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => toggleExpand(key)}
          style={[styles.partyHeader, isExpanded && styles.partyHeaderExpanded]}
        >
          <View style={styles.partyHeaderLeft}>
            <View style={styles.partyAvatar}>
              <Building2 size={20} color={Colors.primary} />
            </View>
            <View style={styles.partyMeta}>
              <Text style={styles.partyNameText} numberOfLines={1}>
                {item.name}
              </Text>
              {item.phone ? (
                <View style={styles.phoneRow}>
                  <Phone size={12} color={Colors.textSecondary} style={styles.phoneIcon} />
                  <Text style={styles.partyPhoneText}>{item.phone}</Text>
                </View>
              ) : (
                <Text style={styles.noPhoneText}>No contact number</Text>
              )}
            </View>
          </View>
          <View style={styles.partyHeaderRight}>
            <View style={[styles.badge, partyItems.length === 0 && styles.badgeEmpty]}>
              <Text style={[styles.badgeText, partyItems.length === 0 && styles.badgeTextEmpty]}>
                {partyItems.length} Products
              </Text>
            </View>
            {isExpanded ? (
              <ChevronUp size={20} color={Colors.textSecondary} />
            ) : (
              <ChevronDown size={20} color={Colors.textSecondary} />
            )}
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            {partyItems.length === 0 ? (
              <View style={styles.emptyPartyContainer}>
                <View style={styles.emptyPartyIconCircle}>
                  <ShoppingBag size={30} color={Colors.textSecondary} />
                </View>
                <Text style={styles.emptyPartyText}>No items added yet</Text>
                <Text style={styles.emptyPartySubtext}>
                  Add products to this party's quotation sheet.
                </Text>
                <TouchableOpacity
                  style={styles.addProductsBtnEmpty}
                  onPress={() => openAddProductsForParty(item)}
                >
                  <PlusCircle size={16} color={Colors.white} style={{ marginRight: 6 }} />
                  <Text style={styles.addProductsBtnTextEmpty}>Add Products</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* List of Products */}
                <View style={styles.productsList}>
                  {partyItems.map((prod) => renderProductItem(prod))}
                </View>

                {/* Subtotal and Summary */}
                <View style={styles.partySummaryContainer}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Quantity</Text>
                    <Text style={styles.summaryValue}>{totalQty} units</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.partyActionRow}>
                  <TouchableOpacity
                    style={[styles.partyBtnInline, styles.partyAddProductsBtnInline]}
                    onPress={() => openAddProductsForParty(item)}
                  >
                    <PlusCircle size={18} color={Colors.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.partyAddProductsTextInline}>Add Products</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.partyBtnInline, styles.partyCheckoutBtnInline]}
                    onPress={() => handleCheckoutForParty(item.name, item.phone)}
                  >
                    <Text style={styles.partyCheckoutTextInline}>Checkout</Text>
                    <ArrowRight size={16} color={Colors.white} style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Delete Party Link */}
            <TouchableOpacity
              style={styles.deletePartyBtn}
              onPress={() => handleDeleteParty(item.name, item.phone)}
            >
              <Trash2 size={14} color={Colors.error} style={{ marginRight: 4 }} />
              <Text style={styles.deletePartyText}>Delete Party</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // ── Cash Customer Card Renderer ──────────────────────────────────
  const renderCashCustomerCard = (item: Party) => {
    const key = `${item.name}-${item.phone}`;
    const isExpanded = expandedCashKey === key;
    const partyItems = getItemsForParty(item.name, item.phone);
    const totalQty = getPartyTotalQty(partyItems);
    const cashNumber = item.name.replace('Cash Customer #', '#');

    return (
      <View key={key} style={styles.cashCard}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setExpandedCashKey(prev => (prev === key ? null : key))}
          style={[styles.cashCardHeader, isExpanded && styles.cashCardHeaderExpanded]}
        >
          <View style={styles.partyHeaderLeft}>
            <View style={styles.cashAvatar}>
              <Banknote size={20} color={CASH_GREEN} />
            </View>
            <View style={styles.partyMeta}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.cashNameText} numberOfLines={1}>{item.name}</Text>
                <View style={styles.cashBadgeTag}>
                  <Text style={styles.cashBadgeTagText}>CASH</Text>
                </View>
              </View>
              <Text style={styles.cashSubtext}>Walk-in cash customer</Text>
            </View>
          </View>
          <View style={styles.partyHeaderRight}>
            <View style={[styles.cashCountBadge, partyItems.length === 0 && styles.cashCountBadgeEmpty]}>
              <Text style={[styles.cashCountBadgeText, partyItems.length === 0 && styles.cashCountBadgeTextEmpty]}>
                {partyItems.length} Items
              </Text>
            </View>
            {isExpanded ? (
              <ChevronUp size={20} color={CASH_GREEN} />
            ) : (
              <ChevronDown size={20} color={Colors.textSecondary} />
            )}
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.cashExpandedContent}>
            {partyItems.length === 0 ? (
              <View style={styles.emptyPartyContainer}>
                <View style={[styles.emptyPartyIconCircle, { backgroundColor: 'rgba(0,168,107,0.06)' }]}>
                  <ShoppingBag size={28} color={CASH_GREEN} />
                </View>
                <Text style={styles.emptyPartyText}>No items added yet</Text>
                <Text style={styles.emptyPartySubtext}>Add products for this cash customer.</Text>
                <TouchableOpacity
                  style={styles.cashAddProductsBtnEmpty}
                  onPress={() => openAddProductsForParty(item)}
                >
                  <PlusCircle size={16} color={Colors.white} style={{ marginRight: 6 }} />
                  <Text style={styles.addProductsBtnTextEmpty}>Add Products</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.productsList}>
                  {partyItems.map((prod) => renderProductItem(prod))}
                </View>

                <View style={styles.cashSummaryBox}>
                  <View style={styles.cashSummaryRow}>
                    <View style={styles.cashSummaryIconBox}>
                      <Receipt size={14} color={CASH_GREEN} />
                    </View>
                    <Text style={styles.cashSummaryLabel}>Total Items</Text>
                    <Text style={styles.cashSummaryValue}>{partyItems.length} products</Text>
                  </View>
                  <View style={styles.cashSummaryRow}>
                    <View style={styles.cashSummaryIconBox}>
                      <Banknote size={14} color={CASH_GREEN} />
                    </View>
                    <Text style={styles.cashSummaryLabel}>Total Qty</Text>
                    <Text style={styles.cashSummaryValue}>{totalQty} units</Text>
                  </View>
                  <View style={[styles.cashSummaryRow, { borderTopWidth: 1, borderTopColor: CASH_GREEN_BORDER, marginTop: 6, paddingTop: 10 }]}>
                    <Text style={styles.cashPaymentLabel}>💵 Payment Mode</Text>
                    <View style={styles.cashPaymentTag}>
                      <Text style={styles.cashPaymentTagText}>CASH</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.partyActionRow}>
                  <TouchableOpacity
                    style={[styles.partyBtnInline, styles.cashAddMoreBtn]}
                    onPress={() => openAddProductsForParty(item)}
                  >
                    <PlusCircle size={18} color={CASH_GREEN} style={{ marginRight: 6 }} />
                    <Text style={styles.cashAddMoreBtnText}>Add Products</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.partyBtnInline, styles.cashCheckoutBtn]}
                    onPress={() => handleCheckoutForParty(item.name, item.phone)}
                  >
                    <Text style={styles.cashCheckoutBtnText}>Checkout</Text>
                    <ArrowRight size={16} color={Colors.white} style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.deletePartyBtn}
              onPress={() => handleDeleteParty(item.name, item.phone)}
            >
              <Trash2 size={14} color={Colors.error} style={{ marginRight: 4 }} />
              <Text style={styles.deletePartyText}>Delete Cash Sale</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Filter products catalog inside modal
  const filteredModalProducts = allProducts.filter(
    (p) => {
      const matchesSearch =
        (p.name || '').toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        (p.brand || '').toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(productSearchQuery.toLowerCase());
      const matchesCat = matchesCategory(p.category, selectedCategory);
      const matchesBrand = selectedBrand === 'All' || p.brand === selectedBrand;
      return matchesSearch && matchesCat && matchesBrand;
    }
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={[Typography.h1, styles.headerTitle]}>My Cart</Text>
        </View>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeTextTop}>{items.length} Items Total</Text>
        </View>
      </View>

      {/* Top Premium Card for Adding New Party */}
      <View style={styles.topManageCard}>
        <View style={styles.topManageLeft}>
          <Text style={styles.topManageTitle}>Manage Shopping Parties</Text>
          <Text style={styles.topManageSubtitle}>
            Add distinct client sessions and request quotations separately.
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.topAddPartyBtn}
          onPress={() => setAddPartyModalVisible(true)}
        >
          <UserPlus size={16} color={Colors.white} style={{ marginRight: 6 }} />
          <Text style={styles.topAddPartyBtnText}>Add Party</Text>
        </TouchableOpacity>
      </View>

      {/* Cash Sales Banner */}
      <TouchableOpacity
        activeOpacity={0.88}
        style={styles.cashSalesBanner}
        onPress={() => setCashSectionExpanded(prev => !prev)}
      >
        <View style={styles.cashSalesBannerLeft}>
          <View style={styles.cashSalesBannerIcon}>
            <Banknote size={22} color={CASH_GREEN} />
          </View>
          <View>
            <Text style={styles.cashSalesBannerTitle}>Cash Sales</Text>
            <Text style={styles.cashSalesBannerSubtitle}>
              {cashParties.length > 0
                ? `${cashParties.length} active cash ${cashParties.length === 1 ? 'customer' : 'customers'}`
                : 'Quick billing for walk-in cash customers'}
            </Text>
          </View>
        </View>
        <View style={styles.cashSalesBannerRight}>
          <TouchableOpacity
            style={styles.cashSalesNewBtn}
            onPress={(e) => { e.stopPropagation?.(); handleAddCashSale(); }}
            activeOpacity={0.85}
          >
            <Plus size={14} color={Colors.white} />
            <Text style={styles.cashSalesNewBtnText}>New</Text>
          </TouchableOpacity>
          {cashSectionExpanded ? (
            <ChevronUp size={20} color={CASH_GREEN} style={{ marginLeft: 6 }} />
          ) : (
            <ChevronDown size={20} color={CASH_GREEN} style={{ marginLeft: 6 }} />
          )}
        </View>
      </TouchableOpacity>

      {/* Cash Customer Cards (expanded) */}
      {cashSectionExpanded && (
        <View style={styles.cashCardsContainer}>
          {cashParties.length === 0 ? (
            <View style={styles.cashEmptyState}>
              <Banknote size={32} color={CASH_GREEN} style={{ marginBottom: 8, opacity: 0.5 }} />
              <Text style={styles.cashEmptyStateText}>No cash sales yet</Text>
              <Text style={styles.cashEmptyStateSubtext}>Tap "New" to add a walk-in cash customer.</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.cashCardsScroll}
              contentContainerStyle={styles.cashCardsScrollContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              indicatorStyle="black"
            >
              {cashParties.map((cp) => renderCashCustomerCard(cp))}
              {/* Bottom spacer */}
              <View style={{ height: 4 }} />
            </ScrollView>
          )}
        </View>
      )}

      {/* Party Search Bar */}
      <View style={styles.partySearchWrapper}>
        <View style={styles.partySearchBar}>
          <Search size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.partySearchInput}
            placeholder="Search party by name or phone..."
            placeholderTextColor={Colors.textSecondary}
            value={partySearchQuery}
            onChangeText={(text) => {
              setPartySearchQuery(text);
              setShowPartyDropdown(text.trim().length > 0);
            }}
            onFocus={() => {
              if (partySearchQuery.trim().length > 0) setShowPartyDropdown(true);
            }}
          />
          {partySearchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setPartySearchQuery('');
                setShowPartyDropdown(false);
              }}
              style={{ padding: 4 }}
            >
              <X size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Dropdown results */}
        {showPartyDropdown && (() => {
          const q = partySearchQuery.toLowerCase();
          const matched = regularParties.filter(
            p =>
              p.name.toLowerCase().includes(q) ||
              (p.phone || '').includes(q)
          );
          return matched.length > 0 ? (
            <View style={styles.partyDropdown}>
              {matched.map((p) => {
                const key = `${p.name}-${p.phone}`;
                return (
                  <TouchableOpacity
                    key={key}
                    style={styles.partyDropdownItem}
                    activeOpacity={0.75}
                    onPress={() => {
                      setExpandedPartyKey(key);
                      setPartySearchQuery('');
                      setShowPartyDropdown(false);
                    }}
                  >
                    <View style={styles.partyDropdownAvatar}>
                      <Building2 size={16} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.partyDropdownName} numberOfLines={1}>{p.name}</Text>
                      {p.phone ? (
                        <Text style={styles.partyDropdownPhone}>
                          📞 {p.phone}
                        </Text>
                      ) : (
                        <Text style={styles.partyDropdownPhone}>No phone</Text>
                      )}
                    </View>
                    <Check size={16} color={Colors.primary} />
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={[styles.partyDropdown, { paddingVertical: 16, alignItems: 'center' }]}>
              <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>No matching party found</Text>
            </View>
          );
        })()}
      </View>

      {/* Regular Parties Section */}
      {regularParties.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconCircle}>
            <ShoppingBag size={50} color={Colors.textSecondary} />
          </View>
          <Text style={styles.emptyStateText}>No Parties Added</Text>
          <Text style={styles.emptyStateSubtext}>
            To start shopping, create a new party first. You can manage multiple client lists concurrently.
          </Text>
          <TouchableOpacity
            style={styles.startShoppingBtn}
            onPress={() => setAddPartyModalVisible(true)}
          >
            <UserPlus size={18} color={Colors.white} style={{ marginRight: 8 }} />
            <Text style={styles.startShoppingBtnText}>Add First Party</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={[...regularParties].sort((a, b) => {
            const keyA = `${a.name}-${a.phone}`;
            const keyB = `${b.name}-${b.phone}`;
            if (keyA === expandedPartyKey) return -1;
            if (keyB === expandedPartyKey) return 1;
            return 0;
          })}
          renderItem={renderPartyCard}
          keyExtractor={(item) => `${item.name}-${item.phone}`}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
        />
      )}

      {/* Cash Customer Creation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={cashCustomerModalVisible}
        onRequestClose={() => setCashCustomerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.cashModalContent}>
            {/* Modal Header */}
            <View style={styles.cashModalHeader}>
              <View style={styles.cashModalHeaderIcon}>
                <Banknote size={22} color={CASH_GREEN} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.cashModalTitle}>New Cash Sale</Text>
                <Text style={styles.cashModalSubtitle}>Enter customer details to begin</Text>
              </View>
              <TouchableOpacity
                onPress={() => setCashCustomerModalVisible(false)}
                style={styles.closeBtn}
              >
                <X size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <View style={styles.cashModalBody}>
              <View style={styles.cashModalInfoBanner}>
                <Text style={styles.cashModalInfoText}>
                  💵 After saving, you'll be taken directly to add products for this customer.
                </Text>
              </View>
              {walkinCustomers.length > 0 && (
                <View style={{ marginBottom: 15 }}>
                  <Text style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 6 }}>Select Existing Walk-in Customer:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {walkinCustomers.map(c => (
                      <View key={c.id || Math.random().toString()} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: '#bbf7d0' }}>
                        <TouchableOpacity 
                          style={{ padding: 8, paddingRight: 4 }}
                          onPress={() => {
                            setCashCustomerName(c.name || c.customer_name || '');
                            setCashCustomerPhone(c.phone || c.phone_number || c.customer_phone || '');
                          }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: 'bold', color: CASH_GREEN }}>{c.name || c.customer_name}</Text>
                          <Text style={{ fontSize: 11, color: Colors.textSecondary }}>{c.phone || c.phone_number || c.customer_phone}</Text>
                        </TouchableOpacity>
                        {c.id && (
                          <TouchableOpacity 
                            style={{ padding: 8, paddingLeft: 4 }}
                            onPress={() => deleteWalkinCustomer(c.id)}
                          >
                            <X size={16} color={Colors.error} />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Name Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Customer Name *</Text>
                <View style={[styles.inputWrapper, styles.cashInputWrapper]}>
                  <Receipt size={18} color={CASH_GREEN} />
                  <TextInput
                    style={styles.textInput}
                    value={cashCustomerName}
                    onChangeText={setCashCustomerName}
                    placeholder="e.g. Rajesh Kumar"
                    placeholderTextColor={Colors.textSecondary}
                    autoCapitalize="words"
                    autoFocus
                  />
                </View>
              </View>

              {/* Phone Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number *</Text>
                <View style={[styles.inputWrapper, styles.cashInputWrapper]}>
                  <Phone size={18} color={CASH_GREEN} />
                  <TextInput
                    style={styles.textInput}
                    value={cashCustomerPhone}
                    onChangeText={setCashCustomerPhone}
                    placeholder="10-digit mobile number"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
              </View>

              {/* Payment Mode Indicator */}
              <View style={styles.cashModalPaymentRow}>
                <Text style={styles.cashModalPaymentLabel}>Payment Mode</Text>
                <View style={styles.cashPaymentTag}>
                  <Text style={styles.cashPaymentTagText}>CASH</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn]}
                  onPress={() => setCashCustomerModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.cashSaveBtn]}
                  onPress={handleSaveCashCustomer}
                >
                  <Banknote size={18} color={Colors.white} style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>Save & Add Products</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Party Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addPartyModalVisible}
        onRequestClose={() => setAddPartyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Shopping Party</Text>
              <TouchableOpacity
                onPress={() => setAddPartyModalVisible(false)}
                style={styles.closeBtn}
              >
                <X size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalDesc}>
                Create a distinct shopping list/session. Products can be added separately for this client.
              </Text>

              {walkinCustomers.length > 0 && (
                <View style={{ marginBottom: 15 }}>
                  <Text style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 6 }}>Select Existing Customer:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {walkinCustomers.map(c => (
                      <View key={c.id || Math.random().toString()} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: '#bfdbfe' }}>
                        <TouchableOpacity 
                          style={{ padding: 8, paddingRight: 4 }}
                          onPress={() => {
                            setNewPartyName(c.name || c.customer_name || '');
                            setNewPartyPhone(c.phone || c.phone_number || c.customer_phone || '');
                          }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: 'bold', color: Colors.primary }}>{c.name || c.customer_name}</Text>
                          <Text style={{ fontSize: 11, color: Colors.textSecondary }}>{c.phone || c.phone_number || c.customer_phone}</Text>
                        </TouchableOpacity>
                        {c.id && (
                          <TouchableOpacity 
                            style={{ padding: 8, paddingLeft: 4 }}
                            onPress={() => deleteWalkinCustomer(c.id)}
                          >
                            <X size={16} color={Colors.error} />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Party Name *</Text>
                <View style={styles.inputWrapper}>
                  <Building2 size={18} color={Colors.primary} />
                  <TextInput
                    style={styles.textInput}
                    value={newPartyName}
                    onChangeText={setNewPartyName}
                    placeholder="e.g. Ramesh Builders"
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
                    value={newPartyPhone}
                    onChangeText={setNewPartyPhone}
                    placeholder="10-digit Contact Number"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn]}
                  onPress={() => setAddPartyModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleSaveParty}>
                  <Check size={18} color={Colors.white} style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>Create Party</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Product Selector Modal */}
      <Modal
        animationType="slide"
        visible={addProductModalVisible}
        onRequestClose={() => setAddProductModalVisible(false)}
      >
        <SafeAreaView style={styles.productSelectorContainer}>
          {/* Header */}
          <View style={styles.selectorHeader}>
            <TouchableOpacity
              onPress={() => setAddProductModalVisible(false)}
              style={styles.selectorCloseBtn}
            >
              <ChevronLeft size={24} color={Colors.text} />
            </TouchableOpacity>
            <View style={styles.selectorHeaderCenter}>
              <Text style={styles.selectorTitle} numberOfLines={1}>
                Add Products
              </Text>
              <Text style={styles.selectorSubtitle} numberOfLines={1}>
                For: {selectedPartyForAdd?.name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setAddProductModalVisible(false)}
              style={styles.selectorDoneBtn}
            >
              <Text style={styles.selectorDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Search bar inside selector */}
          <View style={styles.selectorSearchContainer}>
            <View style={styles.selectorSearchBar}>
              <Search size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.selectorSearchInput}
                placeholder="Search products, brands, or categories..."
                placeholderTextColor={Colors.textSecondary}
                value={productSearchQuery}
                onChangeText={setProductSearchQuery}
                clearButtonMode="while-editing"
              />
            </View>

            {/* Premium Category Filter Tabs */}
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
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 22, paddingHorizontal: 10, alignItems: 'center' }}>
                  {['All', 'Cement', 'TMT Bars', 'Kadapa Slabs', 'Others'].map((cat) => {
                    const isActive = selectedCategory === cat;
                    let Icon = Package;
                    if (cat === 'All') Icon = LayoutGrid;
                    else if (cat === 'Cement') Icon = Box;
                    else if (cat === 'TMT Bars') Icon = AlignJustify;
                    else if (cat === 'Kadapa Slabs') Icon = LayoutGrid;

                    return (
                      <TouchableOpacity 
                        key={cat} 
                        onPress={() => setSelectedCategory(cat)}
                        style={{ alignItems: 'center', justifyContent: 'center' }}
                        activeOpacity={0.7}
                      >
                        <View style={{ 
                          backgroundColor: isActive ? Colors.primary : 'transparent', 
                          width: 42, 
                          height: 42, 
                          borderRadius: 50, overflow: 'hidden', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          marginBottom: 4
                        }}>
                          <Icon size={20} color={isActive ? Colors.white : '#4F5E7B'} />
                        </View>
                        <Text style={{ 
                          fontSize: 11, 
                          fontWeight: isActive ? '700' : '500', 
                          color: isActive ? Colors.primary : '#4F5E7B' 
                        }}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
              
              {/* Brand Filter Tabs */}
              {brandList.length > 1 && (
                <View style={{ 
                  backgroundColor: '#FFFFFF', 
                  borderRadius: 40, 
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  shadowColor: '#000', 
                  shadowOffset: { width: 0, height: 4 }, 
                  shadowOpacity: 0.06, 
                  shadowRadius: 8, 
                  elevation: 4,
                  width: '100%',
                  marginTop: 8
                }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingHorizontal: 6, alignItems: 'center' }}>
                    {brandList.map((brand: any) => {
                      const isActive = selectedBrand === brand.name;
                      return (
                        <TouchableOpacity 
                          key={brand.id || brand.name} 
                          onPress={() => setSelectedBrand(brand.name)}
                          style={{ 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            backgroundColor: isActive ? 'rgba(33, 150, 243, 0.1)' : 'transparent',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 20,
                            borderWidth: isActive ? 1 : 0,
                            borderColor: '#2196F3'
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={{ 
                            fontSize: 12, 
                            fontWeight: isActive ? '700' : '500', 
                            color: isActive ? '#2196F3' : '#4F5E7B' 
                          }}>
                            {brand.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {filteredModalProducts.length === 0 ? (
            <View style={styles.selectorEmptyState}>
              <ShoppingBag size={40} color={Colors.textSecondary} style={{ marginBottom: 12 }} />
              <Text style={styles.selectorEmptyText}>No matching products found</Text>
              <Text style={styles.selectorEmptySubtext}>
                Try adjusting your keywords or category filters.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredModalProducts}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.selectorListContent}
              renderItem={({ item }) => {
                const isTMT = (item.category || '').toLowerCase().includes('tmt');
                
                if (isTMT) {
                  const selectedSizes = selectorSizeSelections[item.id] || {};
                  const selectedEntries = Object.entries(selectedSizes);
                  
                  return (
                    <View style={[styles.selectorProductCard, { flexDirection: 'column' }]}>
                      {/* Top Row: Image & Basic Info */}
                      <View style={{ flexDirection: 'row' }}>
                        <Image
                          source={typeof item.image === 'number' ? item.image : { uri: item.image }}
                          style={styles.selectorProductImage}
                        />
                        <View style={styles.selectorProductInfo}>
                          <Text style={styles.selectorProductBrand}>{item.brand}</Text>
                          <Text style={styles.selectorProductName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={styles.selectorProductCategory}>{item.category}</Text>
                        </View>
                      </View>

                      {/* Bottom Area: Full Width TMT Selectors */}
                      <View style={{ marginTop: 12 }}>
                        <View style={styles.dropdownContainerInline}>
                          <Text style={styles.sectionLabelInline}>Select Size (MM):</Text>
                          <TouchableOpacity
                            style={styles.dropdownButtonInline}
                            onPress={() => {
                              setActiveProductIdForPicker(item.id);
                              setSizePickerModalVisible(true);
                            }}
                          >
                            <Text style={styles.dropdownButtonTextInline}>Choose MM Size</Text>
                            <ChevronDown size={16} color={Colors.textSecondary} />
                          </TouchableOpacity>
                        </View>

                        {selectedEntries.length > 0 && (
                          <View style={styles.selectionListInline}>
                            <Text style={styles.sectionLabelInline}>Selected Sizes, Pieces & Weight:</Text>
                            {selectedEntries.map(([size, selection]: [string, any]) => {
                              const qty = selection.pieces || 0;
                              const weight = selection.weight || 0;
                              return (
                              <View key={size} style={styles.selectionRowInline}>
                                <View style={styles.sizeTagInline}>
                                  <Text style={styles.sizeTagTextInline}>{size}MM</Text>
                                </View>
                                
                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 }}>
                                  {/* Pieces Input */}
                                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
                                    <TextInput
                                      style={{
                                        flex: 1,
                                        borderWidth: 1, borderColor: Colors.border, borderRadius: 6,
                                        height: 36, textAlign: 'center', color: Colors.text, backgroundColor: Colors.white,
                                        padding: 0, margin: 0,
                                      }}
                                      keyboardType="numeric"
                                      value={qty === 0 ? '' : String(qty)}
                                      onChangeText={(text) => handleSetSelectorSizeQty(item.id, size, text)}
                                      placeholder="0"
                                    />
                                    <Text style={{ marginLeft: 6, color: Colors.textSecondary, fontSize: 13, fontWeight: '500' }}>pcs</Text>
                                  </View>

                                  {/* Weight Input */}
                                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                                    <TextInput
                                      style={{
                                        flex: 1,
                                        borderWidth: 1, borderColor: Colors.border, borderRadius: 6,
                                        height: 36, textAlign: 'center', color: Colors.text, backgroundColor: Colors.white,
                                        padding: 0, margin: 0,
                                      }}
                                      keyboardType="numeric"
                                      value={weight === 0 ? '' : String(weight)}
                                      onChangeText={(text) => handleSetSelectorSizeWeight(item.id, size, text)}
                                      placeholder="0"
                                    />
                                    <Text style={{ marginLeft: 6, color: Colors.textSecondary, fontSize: 13, fontWeight: '500' }}>kg</Text>
                                  </View>
                                </View>

                                <TouchableOpacity
                                  onPress={() => handleAdjustSelectorSizeQty(item.id, size, -qty)}
                                  style={styles.removeBtnInline}
                                >
                                  <X size={14} color={Colors.error} />
                                </TouchableOpacity>
                              </View>
                            )})}

                            <TouchableOpacity
                              style={styles.bulkAddBtnInline}
                              onPress={() => handleAddTMTProductsToParty(item)}
                            >
                              <PlusCircle size={16} color={Colors.white} style={{ marginRight: 6 }} />
                              <Text style={styles.bulkAddBtnTextInline}>Add All to Cart</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                }

                const currentQty = productQuantities[item.id] || 1;
                return (
                  <View style={styles.selectorProductCard}>
                    <Image
                      source={typeof item.image === 'number' ? item.image : { uri: item.image }}
                      style={styles.selectorProductImage}
                    />
                    <View style={styles.selectorProductInfo}>
                      <Text style={styles.selectorProductBrand}>{item.brand}</Text>
                      <Text style={styles.selectorProductName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.selectorProductCategory}>{item.category}</Text>
                      <View style={[styles.selectorProductFooter, { justifyContent: 'flex-end' }]}>
                        {/* Qty and Add actions */}
                        <View style={styles.selectorActionRow}>
                          <View style={styles.selectorQtyContainer}>
                            <TouchableOpacity
                              onPress={() => handleAdjustModalProductQty(item.id, -1)}
                              style={styles.selectorQtyBtn}
                            >
                              <Minus size={12} color={Colors.text} />
                            </TouchableOpacity>
                            <Text style={styles.selectorQtyText}>{currentQty} {getProductUnit(item.category)}</Text>
                            <TouchableOpacity
                              onPress={() => handleAdjustModalProductQty(item.id, 1)}
                              style={styles.selectorQtyBtn}
                            >
                              <Plus size={12} color={Colors.text} />
                            </TouchableOpacity>
                          </View>

                          <TouchableOpacity
                            style={styles.selectorAddBtn}
                            onPress={() => handleAddProductToParty(item)}
                          >
                            <Plus size={14} color={Colors.white} />
                            <Text style={styles.selectorAddBtnText}>Add</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Size Picker Modal for TMT Bars */}
      <Modal visible={sizePickerModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSizePickerModalVisible(false)}
        >
          <View style={styles.pickerContainerInline}>
            <Text style={styles.pickerTitleInline}>Select MM Size</Text>
            <ScrollView>
              {['6', '8', '10', '12', '16', '20', '25', '30', '32'].map((size) => {
                const isSelected = activeProductIdForPicker
                  ? !!(selectorSizeSelections[activeProductIdForPicker] || {})[size]
                  : false;
                return (
                  <TouchableOpacity
                    key={size}
                    style={styles.pickerItemInline}
                    onPress={() => handleSelectSizeForProduct(size)}
                  >
                    <Text style={[
                      styles.pickerItemTextInline,
                      isSelected ? { color: Colors.primary, fontWeight: 'bold' } : null
                    ]}>
                      {size}MM {isSelected ? '(Selected)' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.closePickerBtnInline}
              onPress={() => setSizePickerModalVisible(false)}
            >
              <Text style={styles.closePickerTextInline}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 10,
    padding: 5,
  },
  headerTitle: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  badgeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeTextTop: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  topManageCard: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topManageLeft: {
    flex: 1,
    marginRight: 12,
  },
  topManageTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
  },
  topManageSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  topAddPartyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
  },
  topAddPartyBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  partyCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  partyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
  },
  partyHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  partyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  partyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(24, 119, 242, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partyMeta: {
    marginLeft: 12,
    flex: 1,
  },
  partyNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  partyPhoneText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  noPhoneText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  partyHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: 'rgba(24, 119, 242, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeEmpty: {
    backgroundColor: 'rgba(101, 103, 107, 0.08)',
  },
  badgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  badgeTextEmpty: {
    color: Colors.textSecondary,
  },
  expandedContent: {
    padding: 16,
    backgroundColor: '#FAFBFD',
  },
  emptyPartyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPartyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(101, 103, 107, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyPartyText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  emptyPartySubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  addProductsBtnEmpty: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  addProductsBtnTextEmpty: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
  productsList: {
    marginBottom: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: Colors.background,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    color: Colors.text,
    fontWeight: 'bold',
    fontSize: 14,
    flex: 1,
    marginRight: 6,
  },
  deleteBtn: {
    padding: 4,
  },
  itemBrand: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  itemPrice: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 2,
  },
  qtyBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    color: Colors.text,
    marginHorizontal: 10,
    fontWeight: 'bold',
    fontSize: 13,
  },
  partySummaryContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '700',
  },
  summaryValueBig: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  partyActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  partyBtnInline: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partyAddProductsBtnInline: {
    backgroundColor: 'rgba(24, 119, 242, 0.06)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  partyAddProductsTextInline: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  partyCheckoutBtnInline: {
    backgroundColor: Colors.primary,
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  partyCheckoutTextInline: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  deletePartyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 14,
  },
  deletePartyText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 60,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(101, 103, 107, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  startShoppingBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  startShoppingBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  phoneIcon: {
    marginRight: 4,
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
  cancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(101, 103, 107, 0.08)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    color: Colors.text,
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
  productSelectorContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  selectorHeader: {
    height: 64,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderBottomWidth: 0,
    zIndex: 10,
  },
  selectorCloseBtn: {
    padding: 6,
  },
  selectorHeaderCenter: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'center',
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  selectorSubtitle: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 1,
  },
  selectorDoneBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  selectorDoneBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  selectorSearchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    marginBottom: 8,
    zIndex: 5,
  },
  selectorSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F6F8',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
  },
  selectorSearchInput: {
    flex: 1,
    marginLeft: 8,
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  selectorEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  selectorEmptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  selectorEmptySubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  selectorListContent: {
    padding: 16,
  },
  selectorProductCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F2F5',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
  },
  selectorProductImage: {
    width: 88,
    height: 88,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
  },
  selectorProductInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  selectorProductBrand: {
    fontSize: 10,
    color: Colors.accent,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  selectorProductName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 2,
  },
  selectorProductCategory: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 1,
  },
  selectorProductFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  selectorProductPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  selectorActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectorQtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
    padding: 4,
  },
  selectorQtyBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  selectorQtyText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.text,
    marginHorizontal: 10,
  },
  selectorAddBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  selectorAddBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  categoryScroll: {
    marginTop: 12,
    flexDirection: 'row',
  },
  categoryScrollContent: {
    alignItems: 'center',
    gap: 10,
    paddingRight: 16,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  categoryTabTextActive: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  dropdownContainerInline: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sectionLabelInline: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  dropdownButtonInline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dropdownButtonTextInline: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  selectionListInline: {
    marginTop: 10,
    backgroundColor: 'rgba(24, 119, 242, 0.05)',
    padding: 10,
    borderRadius: 10,
  },
  selectionRowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(24, 119, 242, 0.1)',
  },
  sizeTagInline: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  sizeTagTextInline: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  qtyControlsInline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyActionBtnInline: {
    padding: 6,
    backgroundColor: Colors.background,
    borderRadius: 4,
  },
  qtyDisplayInline: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginHorizontal: 10,
  },
  removeBtnInline: {
    padding: 6,
  },
  bulkAddBtnInline: {
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  bulkAddBtnTextInline: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 13,
  },
  pickerContainerInline: {
    width: '90%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  pickerTitleInline: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  pickerItemInline: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerItemTextInline: {
    fontSize: 15,
    color: Colors.text,
    textAlign: 'center',
  },
  closePickerBtnInline: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closePickerTextInline: {
    fontSize: 15,
    color: Colors.error,
    fontWeight: 'bold',
  },
  // ── Party Search ──
  partySearchWrapper: {
    marginHorizontal: 16,
    marginBottom: 6,
    zIndex: 100,
  },
  partySearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  partySearchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    paddingVertical: 0,
  },
  partyDropdown: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  partyDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  partyDropdownAvatar: {
    width: 36,
    height: 36,
    borderRadius: 50, overflow: 'hidden',
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partyDropdownName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  partyDropdownPhone: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  // ── Cash Sales Styles ───────────────────────────────────────────
  cashSalesBanner: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: CASH_GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    borderWidth: 1.5,
    borderColor: CASH_GREEN_BORDER,
  },
  cashSalesBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  cashSalesBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: CASH_GREEN_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cashSalesBannerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: CASH_GREEN,
  },
  cashSalesBannerSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cashSalesBannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cashSalesNewBtn: {
    backgroundColor: CASH_GREEN,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    elevation: 1,
  },
  cashSalesNewBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  cashCardsContainer: {
    marginHorizontal: 20,
    marginBottom: 8,
    maxHeight: 420,
  },
  cashCardsScroll: {
    flexGrow: 0,
  },
  cashCardsScrollContent: {
    paddingTop: 2,
    paddingBottom: 4,
  },
  cashEmptyState: {
    paddingVertical: 24,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CASH_GREEN_BORDER,
    borderStyle: 'dashed',
  },
  cashEmptyStateText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  cashEmptyStateSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  cashCard: {
    backgroundColor: Colors.white,
    borderRadius: 50, overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: CASH_GREEN_BORDER,
    elevation: 2,
    shadowColor: CASH_GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
  },
  cashCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Colors.white,
  },
  cashCardHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: CASH_GREEN_BORDER,
    backgroundColor: CASH_GREEN_LIGHT,
  },
  cashAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CASH_GREEN_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cashNameText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
  },
  cashBadgeTag: {
    backgroundColor: CASH_GREEN,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cashBadgeTagText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cashSubtext: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cashCountBadge: {
    backgroundColor: CASH_GREEN_LIGHT,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 1,
    borderColor: CASH_GREEN_BORDER,
  },
  cashCountBadgeEmpty: {
    backgroundColor: 'rgba(101,103,107,0.06)',
    borderColor: Colors.border,
  },
  cashCountBadgeText: {
    color: CASH_GREEN,
    fontSize: 11,
    fontWeight: 'bold',
  },
  cashCountBadgeTextEmpty: {
    color: Colors.textSecondary,
  },
  cashExpandedContent: {
    padding: 14,
    backgroundColor: '#F8FDF9',
  },
  cashSummaryBox: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: CASH_GREEN_BORDER,
  },
  cashSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    gap: 8,
  },
  cashSummaryIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: CASH_GREEN_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cashSummaryLabel: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  cashSummaryValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '700',
  },
  cashPaymentLabel: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600',
  },
  cashPaymentTag: {
    backgroundColor: CASH_GREEN,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cashPaymentTagText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cashAddMoreBtn: {
    backgroundColor: CASH_GREEN_LIGHT,
    borderWidth: 1.5,
    borderColor: CASH_GREEN,
  },
  cashAddMoreBtnText: {
    color: CASH_GREEN,
    fontSize: 14,
    fontWeight: 'bold',
  },
  cashCheckoutBtn: {
    backgroundColor: CASH_GREEN,
    elevation: 2,
    shadowColor: CASH_GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cashCheckoutBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  cashAddProductsBtnEmpty: {
    backgroundColor: CASH_GREEN,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    marginTop: 4,
  },
  // ── Cash Customer Modal Styles ───────────────────────────────────
  cashModalContent: {
    width: width - 40,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    borderWidth: 1.5,
    borderColor: CASH_GREEN_BORDER,
  },
  cashModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: CASH_GREEN_BORDER,
    backgroundColor: CASH_GREEN_LIGHT,
  },
  cashModalHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CASH_GREEN_BORDER,
  },
  cashModalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: CASH_GREEN,
  },
  cashModalSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cashModalBody: {
    padding: 20,
  },
  cashModalInfoBanner: {
    backgroundColor: CASH_GREEN_LIGHT,
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: CASH_GREEN_BORDER,
  },
  cashModalInfoText: {
    fontSize: 12,
    color: CASH_GREEN,
    fontWeight: '600',
    lineHeight: 18,
  },
  cashInputWrapper: {
    borderColor: CASH_GREEN_BORDER,
    borderWidth: 1.5,
  },
  cashModalPaymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CASH_GREEN_LIGHT,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: CASH_GREEN_BORDER,
  },
  cashModalPaymentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  cashSaveBtn: {
    flex: 2,
    backgroundColor: CASH_GREEN,
  },
});

export default CartScreenView;
