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
}

const getProductUnit = (category?: string) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('cement')) return 'Bags';
  if (cat.includes('tmt')) return 'MM';
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

  // Add product state
  const [selectedPartyForAdd, setSelectedPartyForAdd] = useState<Party | null>(null);
  const [allProducts, setAllProducts] = useState<any[]>(() => cartService.getProducts());
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [productQuantities, setProductQuantities] = useState<{ [key: string]: number }>({});
  const [selectorSizeSelections, setSelectorSizeSelections] = useState<{ [prodId: string]: { [size: string]: number } }>({});
  const [activeProductIdForPicker, setActiveProductIdForPicker] = useState<string | null>(null);
  const [sizePickerModalVisible, setSizePickerModalVisible] = useState(false);

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

  // Grouped items helper
  const getItemsForParty = useCallback((partyName: string, partyPhone: string): CartItem[] => {
    return items.filter(
      (item) =>
        (item.partyName || 'Unknown Party') === partyName &&
        (item.partyPhone || '') === partyPhone
    );
  }, [items]);

  // Auto-expand if exactly one party exists
  useEffect(() => {
    if (parties.length === 1 && expandedPartyKey === null) {
      const key = `${parties[0].name}-${parties[0].phone}`;
      setExpandedPartyKey(key);
    }
  }, [parties, expandedPartyKey]);

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
          onPress: () => {
            cartService.clearCartForParty(partyName, partyPhone);
            const key = `${partyName}-${partyPhone}`;
            if (expandedPartyKey === key) {
              setExpandedPartyKey(null);
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
            [size]: 1
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
      const currentQty = currentProdSelections[size] || 0;
      const nextQty = Math.max(0, currentQty + delta);
      
      const newProdSelections = { ...currentProdSelections };
      if (nextQty === 0) {
        delete newProdSelections[size];
      } else {
        newProdSelections[size] = nextQty;
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

  const handleAddTMTProductsToParty = async (product: any) => {
    if (!selectedPartyForAdd) return;
    const selections = selectorSizeSelections[product.id];
    if (!selections || Object.keys(selections).length === 0) return;

    for (const [size, qty] of Object.entries(selections)) {
      const itemWithSize = {
        ...product,
        id: `${product.id}-${size}`,
        name: `${product.name} (${size}MM)`,
        category: 'TMT Bars'
      };
      await cartService.addItemForParty(
        itemWithSize,
        qty,
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

  const renderPartyCard = ({ item }: { item: Party }) => {
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

  // Filter products catalog inside modal
  const filteredModalProducts = allProducts.filter(
    (p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(productSearchQuery.toLowerCase());
      const matchesCat = matchesCategory(p.category, selectedCategory);
      return matchesSearch && matchesCat;
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
          const matched = parties.filter(
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

      {parties.length === 0 ? (
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
          data={[...parties].sort((a, b) => {
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
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryScrollContent}
            >
              {['All', 'Cement', 'TMT Bars', 'Kadapa Slabs', 'Others'].map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    activeOpacity={0.8}
                    style={[styles.categoryTab, isActive && styles.categoryTabActive]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
                            <Text style={styles.sectionLabelInline}>Selected Sizes & Quantities:</Text>
                            {selectedEntries.map(([size, qty]) => (
                              <View key={size} style={styles.selectionRowInline}>
                                <View style={styles.sizeTagInline}>
                                  <Text style={styles.sizeTagTextInline}>{size}MM</Text>
                                </View>
                                <View style={styles.qtyControlsInline}>
                                  <TouchableOpacity
                                    onPress={() => handleAdjustSelectorSizeQty(item.id, size, -1)}
                                    style={styles.qtyActionBtnInline}
                                  >
                                    <Minus size={10} color={Colors.text} />
                                  </TouchableOpacity>
                                  <Text style={styles.qtyDisplayInline}>{qty}</Text>
                                  <TouchableOpacity
                                    onPress={() => handleAdjustSelectorSizeQty(item.id, size, 1)}
                                    style={styles.qtyActionBtnInline}
                                  >
                                    <Plus size={10} color={Colors.text} />
                                  </TouchableOpacity>
                                </View>
                                <TouchableOpacity
                                  onPress={() => handleAdjustSelectorSizeQty(item.id, size, -qty)}
                                  style={styles.removeBtnInline}
                                >
                                  <X size={14} color={Colors.error} />
                                </TouchableOpacity>
                              </View>
                            ))}

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
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
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
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: Colors.surface,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
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
    borderBottomColor: Colors.border,
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
    backgroundColor: Colors.background,
  },
  selectorHeader: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
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
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectorSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
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
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  selectorProductImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: Colors.background,
  },
  selectorProductInfo: {
    flex: 1,
    marginLeft: 12,
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
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 2,
  },
  selectorQtyBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorQtyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.text,
    marginHorizontal: 8,
  },
  selectorAddBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
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
    borderRadius: 18,
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
});

export default CartScreenView;
