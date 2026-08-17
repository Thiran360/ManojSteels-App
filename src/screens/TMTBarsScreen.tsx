import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
  Modal,
  RefreshControl,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { ChevronLeft, Search, Filter, ShoppingCart, Plus, Minus, ChevronDown, X, Trash2 } from 'lucide-react-native';
import { cartService } from '../services/CartService';
 
const { width } = Dimensions.get('window');

const tmtProducts: any[] = [];

const TMTBarsScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(cartService.getCartItems().length);
  const [dynamicProducts, setDynamicProducts] = useState(cartService.getProducts());

  const [refreshing, setRefreshing] = useState(false);
 
  useEffect(() => {
    const update = () => {
      setCartCount(cartService.getCartItems().length);
      setDynamicProducts([...cartService.getProducts()]);
    };
    cartService.on('change', update);
    return () => cartService.off('change', update);
  }, []);
 
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await cartService.globalRefresh();
    setRefreshing(false);
  }, []);

  const ProductCard = ({ item }: { item: any }) => {
    const [sizeSelections, setSizeSelections] = useState<{[key: string]: { weight: string, qty: string }}>({});
    const [showPicker, setShowPicker] = useState(false);
    
    const sizes = ['6', '8', '10', '12', '16', '20', '25', '30', '32'];

    const updateSizeWeight = (size: string, text: string) => {
      setSizeSelections(prev => ({
        ...prev,
        [size]: { ...prev[size], weight: text }
      }));
    };

    const updateSizeQty = (size: string, text: string) => {
      setSizeSelections(prev => ({
        ...prev,
        [size]: { ...prev[size], qty: text }
      }));
    };

    const removeSize = (size: string) => {
      setSizeSelections(prev => {
        const { [size]: _, ...rest } = prev;
        return rest;
      });
    };

    const addSize = (size: string) => {
      if (!sizeSelections[size]) {
        setSizeSelections(prev => ({ ...prev, [size]: { weight: '', qty: '1' } }));
      }
      setShowPicker(false);
    };

    const selectedEntries = Object.entries(sizeSelections);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Image 
            source={typeof item.image === 'number' ? item.image : { uri: item.image }} 
            style={styles.productImage} 
          />
          <View style={styles.productInfo}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.bodySmall, styles.brand]}>{item.brand}</Text>
                <Text style={[Typography.bodyMedium, styles.name]}>{item.name}</Text>
              </View>
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
        </View>

        <View style={styles.dropdownContainer}>
          <Text style={styles.sectionLabel}>Select Size (MM):</Text>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.dropdownButtonText}>Choose MM Size</Text>
            <ChevronDown size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {selectedEntries.length > 0 && (
          <View style={styles.selectionList}>
            <Text style={styles.sectionLabel}>Selected Sizes & Quantities:</Text>
            {selectedEntries.map(([size, data]) => (
              <View key={size} style={styles.selectionRow}>
                <View style={styles.sizeTag}>
                  <Text style={styles.sizeTagText}>{size}MM</Text>
                </View>
                <View style={styles.qtyControls}>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.weightInput}
                      value={data.qty}
                      onChangeText={(text) => updateSizeQty(size, text)}
                      keyboardType="numeric"
                      placeholder="Qty"
                      placeholderTextColor={Colors.textSecondary}
                    />
                    <Text style={styles.kgText}>Qty</Text>
                  </View>
                  
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.weightInput}
                      value={data.weight}
                      onChangeText={(text) => updateSizeWeight(size, text)}
                      keyboardType="numeric"
                      placeholder="Weight"
                      placeholderTextColor={Colors.textSecondary}
                    />
                    <Text style={styles.kgText}>KG</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => removeSize(size)} style={styles.removeBtn}>
                   <X size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}

              <TouchableOpacity 
              style={styles.bulkAddBtn} 
              onPress={() => {
                const itemsToAdd = selectedEntries.map(([size, data]) => {
                  const weight = parseFloat(data.weight) || 0;
                  const qty = parseInt(data.qty, 10) || 0;
                  if (weight <= 0 || qty <= 0) return null;
                  const itemWithSize = { 
                    ...item, 
                    id: `${item.id}-${size}`, 
                    name: `${item.name} (${size}MM - ${weight}kg)`,
                    weight: weight,
                    size: size
                  };
                  return { item: itemWithSize, qty: qty };
                }).filter(Boolean);
                
                if (itemsToAdd.length === 0) {
                  Alert.alert('Error', 'Please enter valid weights and quantities for selected sizes');
                  return;
                }
                
                setSizeSelections({});
                navigation.navigate('PartySelection', { items: itemsToAdd });
              }}
            >
              <ShoppingCart size={18} color={Colors.white} />
              <Text style={styles.bulkAddBtnText}>Add All to Cart</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Size Picker Modal */}
        <Modal visible={showPicker} transparent animationType="fade">
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setShowPicker(false)}
          >
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerTitle}>Select MM Size</Text>
              <ScrollView>
                {sizes.map((size) => (
                  <TouchableOpacity 
                    key={size} 
                    style={styles.pickerItem}
                    onPress={() => addSize(size)}
                  >
                    <Text style={[styles.pickerItemText, sizeSelections[size] ? { color: Colors.primary, fontWeight: 'bold' } : null]}>
                      {size}MM {sizeSelections[size] ? '(Selected)' : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity 
                style={styles.closePickerBtn}
                onPress={() => setShowPicker(false)}
              >
                <Text style={styles.closePickerText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  };

  const allProducts = [...tmtProducts, ...dynamicProducts.filter(p => p.category === 'TMT Bars')];
  const filtered = allProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={[Typography.h3, styles.headerTitle]}>TMT Bars</Text>
        <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
          <ShoppingCart size={24} color={Colors.white} />
          {cartCount > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{cartCount}</Text></View>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search TMT bars..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Filter size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={filtered}
        renderItem={({ item }) => <ProductCard item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 45, paddingHorizontal: 20, paddingBottom: 12,
    backgroundColor: Colors.primary, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  backBtn: { padding: 5 },
  headerTitle: { color: Colors.white },
  cartBtn: { padding: 5, position: 'relative' },
  badge: {
    position: 'absolute', top: -5, right: -5,
    backgroundColor: Colors.accent, borderRadius: 10,
    width: 20, height: 20, justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { color: Colors.white, fontSize: 10, fontWeight: 'bold' },
  searchContainer: {
    flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center',
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 12,
    paddingHorizontal: 15, height: 45, marginRight: 15,
  },
  searchInput: { flex: 1, marginLeft: 10, color: Colors.text, ...Typography.bodySmall },
  filterBtn: {
    backgroundColor: Colors.accent, width: 45, height: 45,
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  listContent: { padding: 20 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    marginBottom: 20,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: Colors.background,
    resizeMode: 'contain',
  },
  productInfo: {
    flex: 1,
    marginLeft: 15,
  },
  brand: { color: Colors.accent, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  name: { color: Colors.text, marginBottom: 8 },
  price: { color: Colors.primary, marginBottom: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtySelector: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.border, borderRadius: 8, padding: 4,
  },
  qtyBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  qtyText: { color: Colors.text, marginHorizontal: 10, fontWeight: 'bold' },
  addBtn: {
    backgroundColor: Colors.accent, flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
  },
  addBtnText: { color: Colors.white, fontWeight: 'bold', marginLeft: 6, fontSize: 12 },
  dropdownContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  selectionList: {
    marginTop: 15,
    backgroundColor: 'rgba(24, 119, 242, 0.05)',
    padding: 12,
    borderRadius: 12,
  },
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(24, 119, 242, 0.1)',
  },
  sizeTag: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sizeTagText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  qtyControls: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  weightInput: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    color: Colors.text,
    backgroundColor: Colors.background,
    fontSize: 13,
  },
  kgText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.textSecondary,
  },
  removeBtn: {
    padding: 8,
  },
  bulkAddBtn: {
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  bulkAddBtnText: {
    color: Colors.white,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerContainer: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  pickerItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerItemText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
  },
  closePickerBtn: {
    marginTop: 15,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closePickerText: {
    fontSize: 16,
    color: Colors.error,
    fontWeight: 'bold',
  },
  deleteBtn: {
    padding: 8,
    marginLeft: 10,
  },
});

export default TMTBarsScreen;
